import { Worker } from './worker.model';

export interface Order {
  id: number;
  user_id: number;
  worker_id?: number;
  service_id?: number;
  pickup_location: string;
  delivery_location: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  items?: OrderItem[];
  service?: Service;
  worker?: Worker;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id?: number;
  service_id?: number;
  quantity: number;
  price: number;
  name: string;
  description?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  base_price: number;
  per_km_price: number;
  category: string;
  is_available: boolean;
}
