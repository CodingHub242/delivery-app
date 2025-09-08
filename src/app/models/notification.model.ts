export interface Notification {
  id: number;
  title: string;
  message: string;
  image_url?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSeenResponse {
  success: boolean;
  message: string;
}
