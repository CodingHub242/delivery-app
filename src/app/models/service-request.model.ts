import { Service } from "./service.model";

export interface ServiceRequest {
  id: number;
  user_id: number;
  service_id?: number;
  service_name?: string;
  service_description?: string;
  pickup_location: string;
  delivery_location: string;
  status: string;
  estimated_price?: number;
  final_price?: number;
  created_at: string;
  updated_at: string;
  scheduled_date?: string;
  priority?: string;
  notes?: string;
  assigned_worker_id?: number;
  assigned_worker_name?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;

  service: Service;
  name: string;
}

export interface ServiceRequestStatus {
  pending: string;
  accepted: string;
  in_progress: string;
  completed: string;
  cancelled: string;
  rejected: string;
}

export const SERVICE_REQUEST_STATUS: ServiceRequestStatus = {
  pending: 'pending',
  accepted: 'accepted',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected'
};
