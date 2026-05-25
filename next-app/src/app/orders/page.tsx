'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { OrderStatus } from '@/lib/types';
import { PLAN_LIMITS } from '@/lib/plan-limits';

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up'];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type FilterTab = 'all' | 'active' | 'completed';

export default function OrdersPage() {
  const { data, updateOrderStatus, isFree } = useApp();
  const { orders } = data;

  const [tab, setTab] = useState<FilterTab>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (tab === 'active') return ['pending', 'confirmed', 'preparing'].includes(o.status);
    if (tab === 'completed') return o.status === 'completed' || o.status === 'picked_up';
    return true;
  });

  const nextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) return STATUS_FLOW[idx + 1];
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="section-header">
        <span className="emoji">📋</span>
        <h2>Orders</h2>
        <span className="badge">{orders.length}{isFree ? ` / ${PLAN_LIMITS.free.orders}` : ''}</span>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>Active</button>
        <button className={`tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>Completed</button>
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">📬</div>
          <h3>No orders yet</h3>
          <p>Orders will appear here when customers place them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expandedId === order.id;
            const next = nextStatus(order.status);
            return (
              <div key={order.id} className="card">
                {/* Order Header */}
                <button
                  className="w-full text-left card-body flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{order.customerName}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {order.id} · {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`status-pill status-${order.status}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <div className="font-bold text-sm">${order.total.toFixed(2)}</div>
                  <span className="text-[var(--text-light)] text-lg">{isExpanded ? '▾' : '▸'}</span>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="card-body pt-0 space-y-3">
                    <div className="border-t border-[var(--border)] pt-3">
                      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">Items</div>
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm py-1">
                          <span>{item.product.emoji} {item.product.name} × {item.quantity}{item.product.pricingType === 'per_pound' ? ' lb' : ''}</span>
                          <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="receipt-total text-sm">
                        <span>Total</span>
                        <span>${order.total.toFixed(2)}</span>
                      </div>
                    </div>

                    {order.customerPhone && (
                      <div className="text-sm text-[var(--text-muted)]">📞 {order.customerPhone}</div>
                    )}
                    {order.customerEmail && (
                      <div className="text-sm text-[var(--text-muted)]">✉️ {order.customerEmail}</div>
                    )}
                    {order.notes && (
                      <div className="text-sm text-[var(--text-muted)]">📝 {order.notes}</div>
                    )}
                    <div className="text-xs text-[var(--text-light)]">
                      {order.source === 'mobile' ? '📱 Mobile order' : '🏪 In-person'} · {order.paymentMethod === 'cash' ? '💵 Cash' : '💳 Card'}
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2">
                      {next && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => updateOrderStatus(order.id, next)}
                        >
                          Mark as {STATUS_LABELS[next]}
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
