export type CategoryType = 'Material' | 'EPP' | 'Herramienta';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
}

export interface UoM {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string;
  uom_id: string;
  stock_actual: number;
  min_stock: number;
  is_serialized: boolean;
  category?: Category;
  uom?: UoM;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size_label: string;
  stock_actual: number;
}

export interface EquipmentDetail {
  id: string;
  product_id: string;
  serial_number: string;
  certification_date: string;
  expiry_date: string;
  status: 'Operativo' | 'Mantención' | 'Vencido' | 'De Baja';
}

export interface Supervisor {
  id: string;
  name: string;
  email: string;
  notify_expirations: boolean;
  notify_stock: boolean;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  cost_center_id: string;
  code: string;
  name: string;
  status: 'Activo' | 'Inactivo' | 'Cerrado';
  created_at?: string;
  cost_center?: CostCenter;
}

export type RoleType = 'SUPER_ADMIN' | 'BODEGUERO' | 'SUPERVISOR' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: RoleType;
  assigned_cost_center_id?: string;
  assigned_cost_center?: CostCenter;
}

export interface OrderRequest {
  id: string;
  folio: number;
  requester_id: string;
  project_id: string;
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'REJECTED';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  
  requester?: UserProfile;
  project?: Project;
}

export interface OrderRequestItem {
  id: string;
  request_id: string;
  product_id: string;
  variant_id?: string;
  requested_qty: number;
  approved_qty: number;
  status: 'PENDING' | 'APPROVED' | 'PARTIAL' | 'REJECTED';
  notes?: string;
  
  product?: Product;
  variant?: ProductVariant;
}
