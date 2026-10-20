-- Customer photos on personalized cards.
-- Photos are uploaded by the server (service_role) into a private bucket and
-- referenced from order_items.personalization as { photo, layout }.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('card-photos', 'card-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "card-photos: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'card-photos' and (select public.is_admin()));

-- Same as before, except personalization also accepts:
--   photo:  a path the server generated, "YYYY-MM/<uuid>.<ext>"
--   layout: "portrait" or "background"
create or replace function public.place_order(
  p_order jsonb,
  p_user_id uuid,
  p_order_number text,
  p_proof_path text
)
returns table (order_id uuid, order_number text, total numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_settings public.store_settings;
  v_fee numeric(10, 2);
  v_item jsonb;
  v_product public.products;
  v_option jsonb;
  v_choice jsonb;
  v_selected text;
  v_options jsonb;
  v_personal jsonb;
  v_key text;
  v_unit numeric(10, 2);
  v_qty int;
  v_subtotal numeric(10, 2) := 0;
  v_method public.payment_method;
  v_order_id uuid;
  v_lines jsonb := '[]';
begin
  select * into v_settings from public.store_settings where id;
  if not found or not v_settings.accepting_orders then
    raise exception 'ORDERS_CLOSED';
  end if;

  select (z ->> 'fee')::numeric into v_fee
  from jsonb_array_elements(v_settings.shipping_zones) z
  where z ->> 'name' = p_order ->> 'area';
  if v_fee is null then
    raise exception 'INVALID_AREA';
  end if;

  v_method := (p_order ->> 'payment_method')::public.payment_method;
  if v_method <> 'cash_on_delivery' and p_proof_path is null then
    raise exception 'PROOF_REQUIRED';
  end if;

  if jsonb_typeof(p_order -> 'items') <> 'array'
     or jsonb_array_length(p_order -> 'items') not between 1 and 30 then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select * from jsonb_array_elements(p_order -> 'items') loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::bigint and is_active;
    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;

    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty not between 1 and 99 then
      raise exception 'INVALID_QUANTITY';
    end if;

    v_unit := v_product.price;
    v_options := '{}';

    for v_key in select jsonb_object_keys(coalesce(v_item -> 'options', '{}')) loop
      if not exists (
        select 1 from jsonb_array_elements(v_product.options) o where o ->> 'name' = v_key
      ) then
        raise exception 'INVALID_OPTION';
      end if;
    end loop;

    for v_option in select * from jsonb_array_elements(v_product.options) loop
      v_selected := v_item -> 'options' ->> (v_option ->> 'name');
      select c into v_choice
      from jsonb_array_elements(v_option -> 'choices') c
      where c ->> 'label' = v_selected;
      if v_choice is null then
        raise exception 'INVALID_OPTION';
      end if;
      v_unit := v_unit + coalesce((v_choice ->> 'price')::numeric, 0);
      v_options := v_options || jsonb_build_object(v_option ->> 'name', v_selected);
      v_choice := null;
    end loop;

    v_personal := '{}';
    if v_product.is_customizable and jsonb_typeof(v_item -> 'personalization') = 'object' then
      for v_key in select jsonb_object_keys(v_item -> 'personalization') loop
        if v_key not in ('name', 'title', 'phone', 'color', 'photo', 'layout')
           or jsonb_typeof(v_item -> 'personalization' -> v_key) <> 'string'
           or char_length(v_item -> 'personalization' ->> v_key) > 60 then
          raise exception 'INVALID_PERSONALIZATION';
        end if;
      end loop;
      v_personal := v_item -> 'personalization';
      if char_length(coalesce(v_personal ->> 'name', '')) < 2 then
        raise exception 'INVALID_PERSONALIZATION';
      end if;
      if v_personal ? 'photo'
         and v_personal ->> 'photo' !~ '^[0-9]{4}-[0-9]{2}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
        raise exception 'INVALID_PERSONALIZATION';
      end if;
      if v_personal ? 'layout' and v_personal ->> 'layout' not in ('portrait', 'background') then
        raise exception 'INVALID_PERSONALIZATION';
      end if;
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit_price', v_unit,
      'quantity', v_qty,
      'options', v_options,
      'personalization', v_personal
    ));
  end loop;

  insert into public.orders (
    order_number, user_id, customer_name, customer_phone, customer_email,
    area, district, address, notes, subtotal, shipping_fee, total,
    payment_method, payment_status, payment_proof_path
  ) values (
    p_order_number,
    p_user_id,
    p_order ->> 'name',
    p_order ->> 'phone',
    nullif(p_order ->> 'email', ''),
    p_order ->> 'area',
    p_order ->> 'district',
    p_order ->> 'address',
    nullif(p_order ->> 'notes', ''),
    v_subtotal,
    v_fee,
    v_subtotal + v_fee,
    v_method,
    case when v_method = 'cash_on_delivery' then 'pending' else 'awaiting_review' end::public.payment_status,
    p_proof_path
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name, unit_price, quantity, line_total, options, personalization
  )
  select
    v_order_id,
    (l ->> 'product_id')::bigint,
    l ->> 'product_name',
    (l ->> 'unit_price')::numeric,
    (l ->> 'quantity')::int,
    (l ->> 'unit_price')::numeric * (l ->> 'quantity')::int,
    l -> 'options',
    l -> 'personalization'
  from jsonb_array_elements(v_lines) l;

  return query select v_order_id, p_order_number, v_subtotal + v_fee;
end;
$$;

-- create or replace keeps existing grants, but restate them to be explicit.
revoke all on function public.place_order(jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, uuid, text, text) to service_role;
