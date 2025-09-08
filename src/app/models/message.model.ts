export interface Message {
  id: number;
  delivery_id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    name: string;
  };
  receiver?: {
    id: number;
    name: string;
  };
}

export interface SendMessageRequest {
  delivery_id: number;
  receiver_id: number;
  message: string;
}

export interface MarkAsReadRequest {
  message_ids: number[];
}
