import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

export type OrderStatus = Enums["order_status"];
export type PaymentStatus = Enums["payment_status"];
export type PaymentMethod = Enums["payment_method"];
export type RequestStatus = Enums["request_status"];

export type OptionChoice = { label: string; price: number };
export type ProductOption = { name: string; choices: OptionChoice[] };
export type ShippingZone = { name: string; fee: number };

export type Category = Tables["categories"]["Row"];

export type Product = Omit<Tables["products"]["Row"], "options" | "price"> & {
  price: number;
  options: ProductOption[];
};

export type StoreSettings = Omit<Tables["store_settings"]["Row"], "shipping_zones"> & {
  shipping_zones: ShippingZone[];
};

export type CardLayout = "portrait" | "background";

export type Personalization = {
  name?: string;
  title?: string;
  phone?: string;
  color?: string;
  /** Storage path in the private card-photos bucket, set by the server. */
  photo?: string;
  layout?: CardLayout;
  /** Small data-URL thumbnail kept in the browser cart only; never sent to the server. */
  photoPreview?: string;
};

export type CartItem = {
  key: string;
  productId: number;
  quantity: number;
  options: Record<string, string>;
  personalization?: Personalization;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Received",
  confirmed: "Confirmed",
  in_production: "Being made",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pay on delivery",
  awaiting_review: "Checking transfer",
  paid: "Paid",
  rejected: "Transfer not received",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash_on_delivery: "Cash on delivery",
  instapay: "InstaPay",
  vodafone_cash: "Vodafone Cash",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "New",
  quoted: "Quote sent",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  declined: "Declined",
};

export const ORDER_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_production",
  "out_for_delivery",
  "delivered",
];

export const CARD_COLORS = [
  { name: "Rose", bg: "#B4587A", fg: "#FFFCFB" },
  { name: "Blush", bg: "#F3D3DB", fg: "#4A2236" },
  { name: "Paper", bg: "#FBF4EE", fg: "#4A3B2E" },
  { name: "Plum", bg: "#3B2232", fg: "#F8ECEA" },
  { name: "Sage", bg: "#B8C4A8", fg: "#2C3824" },
] as const;

export function orderTone(status: OrderStatus) {
  if (status === "delivered") return "sage" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "pending") return "amber" as const;
  return "rose" as const;
}

export function paymentTone(status: PaymentStatus) {
  if (status === "paid") return "sage" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "refunded") return "neutral" as const;
  return "amber" as const;
}

// The cart keeps a small photo thumbnail for display only; drop it before
// comparing items or sending them to the server.
export function withoutPreview(p: Personalization): Personalization {
  const copy = { ...p };
  delete copy.photoPreview;
  return copy;
}
