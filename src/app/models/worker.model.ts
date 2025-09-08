export interface Worker {
  id: number;
  service_id: number;
  name: string;
  phone_number: string;
  worker_type: string;
  service_type?: string;
  vehicle_type?: string;
  vehicle_registration?: string;
  profile_picture: string;
  is_available: boolean;
  current_latitude: number;
  current_longitude: number;
  created_at: string;
  updated_at: string;
  // Rating fields
  average_rating?: number;
  total_ratings?: number;
  rating_count?: number;
}

export interface WorkerRating {
  id: number;
  worker_id: number;
  user_id: number;
  order_id?: number;
  service_request_id?: number;
  rating: number; // 1-5 stars
  review?: string;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: number;
    name: string;
    profile_picture?: string;
  };
}
