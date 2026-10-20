
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"description": string,"id": number,"is_active": boolean,"name": string,"slug": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string,"id"?: never,"is_active"?: boolean,"name": string,"slug": string,"sort_order"?: number
                  }
                  Update: {
                    "created_at"?: string,"description"?: string,"id"?: never,"is_active"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"custom_requests": {
                  Row: {
                    "admin_note": string | null,"attachment_path": string | null,"category_id": number | null,"content": string,"created_at": string,"customer_email": string | null,"customer_name": string,"customer_phone": string,"id": string,"needed_by": string | null,"notes": string | null,"quantity": number,"quote_amount": number | null,"reference": string,"status": Database["public"]['Enums']["request_status"],"style": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "admin_note"?: string | null,"attachment_path"?: string | null,"category_id"?: number | null,"content": string,"created_at"?: string,"customer_email"?: string | null,"customer_name": string,"customer_phone": string,"id"?: string,"needed_by"?: string | null,"notes"?: string | null,"quantity": number,"quote_amount"?: number | null,"reference": string,"status"?: Database["public"]['Enums']["request_status"],"style"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "admin_note"?: string | null,"attachment_path"?: string | null,"category_id"?: number | null,"content"?: string,"created_at"?: string,"customer_email"?: string | null,"customer_name"?: string,"customer_phone"?: string,"id"?: string,"needed_by"?: string | null,"notes"?: string | null,"quantity"?: number,"quote_amount"?: number | null,"reference"?: string,"status"?: Database["public"]['Enums']["request_status"],"style"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "custom_requests_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"order_events": {
                  Row: {
                    "actor": string | null,"created_at": string,"from_value": string | null,"id": number,"kind": string,"order_id": string,"to_value": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor"?: string | null,"created_at"?: string,"from_value"?: string | null,"id"?: never,"kind": string,"order_id": string,"to_value"?: string | null
                  }
                  Update: {
                    "actor"?: string | null,"created_at"?: string,"from_value"?: string | null,"id"?: never,"kind"?: string,"order_id"?: string,"to_value"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": number,"line_total": number,"options": NonNullable<Json>,"order_id": string,"personalization": NonNullable<Json>,"product_id": number | null,"product_name": string,"quantity": number,"unit_price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: never,"line_total": number,"options"?: NonNullable<Json>,"order_id": string,"personalization"?: NonNullable<Json>,"product_id"?: number | null,"product_name": string,"quantity": number,"unit_price": number
                  }
                  Update: {
                    "id"?: never,"line_total"?: number,"options"?: NonNullable<Json>,"order_id"?: string,"personalization"?: NonNullable<Json>,"product_id"?: number | null,"product_name"?: string,"quantity"?: number,"unit_price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "address": string,"admin_note": string | null,"area": string,"created_at": string,"customer_email": string | null,"customer_name": string,"customer_phone": string,"district": string,"id": string,"notes": string | null,"order_number": string,"order_status": Database["public"]['Enums']["order_status"],"payment_method": Database["public"]['Enums']["payment_method"],"payment_proof_path": string | null,"payment_status": Database["public"]['Enums']["payment_status"],"shipping_fee": number,"subtotal": number,"total": number,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address": string,"admin_note"?: string | null,"area": string,"created_at"?: string,"customer_email"?: string | null,"customer_name": string,"customer_phone": string,"district": string,"id"?: string,"notes"?: string | null,"order_number": string,"order_status"?: Database["public"]['Enums']["order_status"],"payment_method": Database["public"]['Enums']["payment_method"],"payment_proof_path"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"shipping_fee": number,"subtotal": number,"total": number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "address"?: string,"admin_note"?: string | null,"area"?: string,"created_at"?: string,"customer_email"?: string | null,"customer_name"?: string,"customer_phone"?: string,"district"?: string,"id"?: string,"notes"?: string | null,"order_number"?: string,"order_status"?: Database["public"]['Enums']["order_status"],"payment_method"?: Database["public"]['Enums']["payment_method"],"payment_proof_path"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"shipping_fee"?: number,"subtotal"?: number,"total"?: number,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"products": {
                  Row: {
                    "category_id": number,"created_at": string,"description": string,"id": number,"images": (string)[],"is_active": boolean,"is_customizable": boolean,"is_featured": boolean,"name": string,"options": NonNullable<Json>,"price": number,"slug": string,"sort_order": number,"unit": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category_id": number,"created_at"?: string,"description"?: string,"id"?: never,"images"?: (string)[],"is_active"?: boolean,"is_customizable"?: boolean,"is_featured"?: boolean,"name": string,"options"?: NonNullable<Json>,"price": number,"slug": string,"sort_order"?: number,"unit"?: string,"updated_at"?: string
                  }
                  Update: {
                    "category_id"?: number,"created_at"?: string,"description"?: string,"id"?: never,"images"?: (string)[],"is_active"?: boolean,"is_customizable"?: boolean,"is_featured"?: boolean,"name"?: string,"options"?: NonNullable<Json>,"price"?: number,"slug"?: string,"sort_order"?: number,"unit"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"phone": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string,"id": string,"phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"store_settings": {
                  Row: {
                    "accepting_orders": boolean,"id": boolean,"instagram_url": string,"instapay_handle": string,"shipping_zones": NonNullable<Json>,"updated_at": string,"vodafone_cash_number": string,"whatsapp_number": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepting_orders"?: boolean,"id"?: boolean,"instagram_url"?: string,"instapay_handle"?: string,"shipping_zones"?: NonNullable<Json>,"updated_at"?: string,"vodafone_cash_number"?: string,"whatsapp_number"?: string
                  }
                  Update: {
                    "accepting_orders"?: boolean,"id"?: boolean,"instagram_url"?: string,"instapay_handle"?: string,"shipping_zones"?: NonNullable<Json>,"updated_at"?: string,"vodafone_cash_number"?: string,"whatsapp_number"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"place_order":
{ Args: { "p_order": Json,"p_order_number": string,"p_proof_path": string,"p_user_id": string }; Returns: {
              "order_id": string,"order_number": string,"total": number
            }[]
                           },
"rate_limit_hit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           }
          }
          Enums: {
            "order_status": "pending"|"confirmed"|"in_production"|"out_for_delivery"|"delivered"|"cancelled","payment_method": "cash_on_delivery"|"instapay"|"vodafone_cash","payment_status": "pending"|"awaiting_review"|"paid"|"rejected"|"refunded","request_status": "new"|"quoted"|"accepted"|"in_progress"|"completed"|"declined"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "order_status": ["pending", "confirmed", "in_production", "out_for_delivery", "delivered", "cancelled"],"payment_method": ["cash_on_delivery", "instapay", "vodafone_cash"],"payment_status": ["pending", "awaiting_review", "paid", "rejected", "refunded"],"request_status": ["new", "quoted", "accepted", "in_progress", "completed", "declined"]
          }
        }
} as const
