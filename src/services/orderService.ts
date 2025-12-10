import { supabase } from '../lib/supabase';
import type { ParsedOrder } from '../utils/orderParser';

export interface Order extends ParsedOrder {
    id: string;
    created_at: string;
    status: 'pending' | 'completed';
}

export const orderService = {
    // Add a new order to Supabase
    async addOrder(order: ParsedOrder) {
        const { data, error } = await supabase
            .from('orders')
            .insert([
                {
                    product: order.product,
                    quantity: order.quantity,
                    customer: order.customer,
                    status: 'pending'
                }
            ])
            .select();

        if (error) {
            console.error('Error adding order:', error);
            throw error;
        }
        return data;
    },

    // Get recent orders (last 50)
    async getRecentOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching orders:', error);
            return [];
        }
        return data as Order[];
    },

    // Subscribe to real-time updates
    subscribeToOrders(onUpdate: (payload: any) => void) {
        return supabase
            .channel('orders_channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload) => {
                    onUpdate(payload);
                }
            )
            .subscribe();
    }
};
