export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    description: string;
    base_price: number;
    image?: string;
    stock_quantity?: number; // Add stock information
    max_quantity?: number;   // Maximum allowed per order

  };
}

export interface CartResponse {
  cart_items: CartItem[];
  total?: number;
  message?: string;
}