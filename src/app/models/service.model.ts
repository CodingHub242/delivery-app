export interface Service {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  distance_rate: number;
  admin_latitude: number;
  admin_longitude: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceResponse {
  data: Service[];
  message?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  stock_quantity?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductResponse {
  data: Product[];
  message?: string;
}
