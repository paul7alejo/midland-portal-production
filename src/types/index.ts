// Auth
export interface DemoPatient {
  id: string;
  msid: string;
  name: string;
  email: string;
  password: string;
  dob: string;
  phone?: string;
  funding_stream: "ACC" | "HEALTH_NZ";
  nhi_masked: string;
  nhi_full?: string;
}

// Equipment
export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  setup_date: string;
  image_url?: string;
}

export interface Mask {
  id: string;
  name: string;
  brand: string;
  type: "full_face" | "nasal" | "nasal_pillows";
  size: string;
  fitted_date: string;
  image_url?: string;
}

// Entitlement
export type EntitlementStatus = "ELIGIBLE" | "NOT_YET" | "EXHAUSTED";

export interface EntitlementItem {
  item_type: string;
  status: EntitlementStatus;
  next_eligible_date?: string;
  quantity_remaining: number;
  quantity_cap: number;
}

// Maintenance
export type AlertSeverity = "OK" | "DUE" | "OVERDUE";

export interface MaintenanceCheck {
  check_type: string;
  label: string;
  status: AlertSeverity;
  due_date: string;
  last_completed?: string;
}

// Orders
export type OrderChannel = "portal" | "phone" | "clinic" | "other";
export type OrderType = "ENTITLEMENT" | "MIXED" | "PURCHASE";
export type OrderStatus = "PENDING" | "APPROVED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";

export interface OrderLine {
  product_name: string;
  quantity: number;
  is_entitled: boolean;
  unit_price?: number;
}

export interface Order {
  id: string;
  patient_id: string;
  channel: OrderChannel;
  order_type: OrderType;
  status: OrderStatus;
  items: OrderLine[];
  created_at: string;
}

// Shop (Phase 1A demo only)
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "supplies" | "accessories" | "machines";
  rrp: number;
  patient_price: number;
  description: string;
  features?: string[];
  image_url?: string;
  entitlement_eligible: boolean;
  requires_prescription?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  is_entitled: boolean;
}
