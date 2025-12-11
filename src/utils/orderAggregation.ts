import { type Order } from '../services/orderService';

export interface AggregatedOrder {
    customer: string;
    normalizedName: string;
    items: Record<string, number>;
    orderIds: string[];
    createdAt: string; // Timestamp of the FIRST order (or last, depending on sorting preference)
    latestActivity: string; // Timestamp of the MOST RECENT order
    status: 'pending' | 'completed' | 'delivered' | 'mixed';
}

// Simple Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Check if two names are similar enough
function areNamesSimilar(name1: string, name2: string, threshold = 2): boolean {
    const n1 = name1.toLowerCase().trim();
    const n2 = name2.toLowerCase().trim();
    
    if (n1 === n2) return true;
    
    // Safety check for very short names to avoid false positives (e.g. "To" vs "Jo")
    if (n1.length < 4 || n2.length < 4) return n1 === n2;

    const dist = levenshteinDistance(n1, n2);
    // Dynamic threshold? For now fixed at 2 chars diff.
    return dist <= threshold;
}

export function aggregateOrdersByCustomer(orders: Order[]): AggregatedOrder[] {
    const groups: AggregatedOrder[] = [];

    // Sort orders by date (newest first) to prioritize processing
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    sortedOrders.forEach(order => {
        // Try to find an existing group that matches this customer
        let group = groups.find(g => areNamesSimilar(g.customer, order.customer));

        if (group) {
            // Update existing group
            group.items[order.product] = (group.items[order.product] || 0) + order.quantity;
            group.orderIds.push(order.id);
            
            // Update timestamps
            if (new Date(order.created_at) > new Date(group.latestActivity)) {
                group.latestActivity = order.created_at;
            }
             // Keep the primary customer name as the first one found (or maybe the most frequent?)
             // For now, keep the first one to avoid UI jumping.
        } else {
            // Create new group
            groups.push({
                customer: order.customer,
                normalizedName: order.customer.toLowerCase().trim(),
                items: { [order.product]: order.quantity },
                orderIds: [order.id],
                createdAt: order.created_at,
                latestActivity: order.created_at,
                status: order.status as any // Simplified status handling
            });
        }
    });

    // Final Sort: Most recent activity at top
    return groups.sort((a, b) => 
        new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime()
    );
}
