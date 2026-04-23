// ─────────────────────────────────────────────
//  Fret-DZ  |  Shared type definitions
// ─────────────────────────────────────────────

export type UserRole = "client" | "transporter" | "admin";

export type ShipmentStatus = "pending" | "accepted" | "in_transit" | "delivered" | "rejected";

export type VehicleType = "van" | "truck" | "semi" | "pickup" | "motorcycle";

// ─── Auth ────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

// ─── Transporter ─────────────────────────────

export interface Transporter {
  id: string;
  profile_id: string;
  company_name: string;
  description?: string;
  vehicle_type: VehicleType;
  capacity_kg: number;
  price_per_km: number;
  rating: number;
  rating_count: number;
  is_available: boolean;
  wilaya: string;           // Algerian province
  logo_url?: string;
  phone: string;
  created_at: string;
}

// ─── Shipment ─────────────────────────────────

export interface Shipment {
  id: string;
  client_id: string;
  transporter_id?: string;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  weight_kg: number;
  status: ShipmentStatus;
  document_url?: string;    // Supabase Storage URL
  estimated_price?: number;
  pickup_date?: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joins
  transporter?: Transporter;
  client?: Profile;
}

// ─── Form DTOs ───────────────────────────────

export interface CreateShipmentInput {
  title: string;
  description?: string;
  origin: string;
  destination: string;
  weight_kg: number;
  pickup_date?: string;
  notes?: string;
  document?: File;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  full_name: string;
  phone?: string;
  company_name?: string;
  role: UserRole;
}

// ─── API Response wrappers ────────────────────

export interface ApiSuccess<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── UI helpers ──────────────────────────────

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}
