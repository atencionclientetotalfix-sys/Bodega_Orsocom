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
