import { supabase } from './supabase';

export interface OrderItem {
    id: string;
    product_id: string;
    name: string;
    name_bg?: string;
    slug?: string;
    variant: string;
    selectedSize?: string;
    material?: string;
    price: number;
    quantity: number;
    image: string;
}

export interface ShippingDetails {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    deliveryType: 'econt' | 'speedy';
    officeName: string;
    notes?: string;
}

export interface Order {
    id: string;
    user_id: string;
    items: OrderItem[];
    total_amount: number;
    shipping_details: ShippingDetails;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_method: string;
    created_at: string;
    updated_at: string;
    order_number?: string; // We'll derive this or add to DB soon
}

export const getOrderById = async (orderId: string): Promise<Order> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) throw error;
    
    // Simple order number derivation if missing: #CD + last 6 chars of ID
    if (!data.order_number) {
        data.order_number = `CD-${orderId.substring(orderId.length - 6).toUpperCase()}`;
    }
    
    return data as Order;
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(order => ({
        ...order,
        order_number: order.order_number || `CD-${order.id.substring(order.id.length - 6).toUpperCase()}`
    })) as Order[];
};
