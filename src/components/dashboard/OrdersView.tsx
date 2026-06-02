import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PackageIcon, ClockIcon, MapPinIcon, CreditCardIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { OrderDetailsModal } from './OrderDetailsModal';

import { Order, OrderStatus } from '../../lib/types';

const statusStyles: Record<OrderStatus, string> = {
  CREATED: 'bg-gray-100 text-gray-800 border-gray-200',
  PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PENDING_CONFIRMATION: 'bg-orange-100 text-orange-800 border-orange-200',
  PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200'
};

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my');
        const content = data.content ? data.content : data;

        const mappedOrders = content.map((o: any): Order => ({
          id: o.id,
          userId: o.userId,
          sellerId: o.sellerId,
          createdAt: o.createdAt,
          totalPrice: o.totalPrice || 0,
          status: o.status,
          items: o.items || [],
          deliveryInfo: o.deliveryInfo,
          paymentMethod: o.paymentMethod
        }));
        setOrders(mappedOrders);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatDate = (dateString: string | number[]) => {
    if (!dateString) return 'N/A';
    if (Array.isArray(dateString)) {
      // Handle [year, month, day, hour, minute, second]
      const [year, month, day, hour, minute] = dateString;
      return new Date(year, month - 1, day, hour, minute).toLocaleString();
    }
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-2 border-tactical pb-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-slate">
          Requisition History
        </h2>
        <span className="text-xs font-mono text-gray-500">
          TOTAL RECORDS: {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border border-dashed border-gray-300">
          <p className="text-gray-500">No requisitions found on record.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-border rounded-sm overflow-hidden"
            >
              {/* Order Header Cell */}
              <div className="bg-gray-50 p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-sm flex items-center justify-center text-slate">
                    <PackageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate">#{order.id.substring(0, 8)}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm ${statusStyles[order.status] || 'bg-gray-100'
                          }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </span>
                      {order.deliveryInfo && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3 h-3" />
                          {order.deliveryInfo.cityName || order.deliveryInfo.type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Total Price</p>
                  <p className="font-mono font-bold text-slate text-lg">
                    ${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Inner Cells for Items */}
              <div className="p-4 bg-white space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-sm bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-sm flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate rounded-full" />
                      </div>
                      <div>
                        <p className="text-xs font-mono text-gray-500 uppercase">Product ID</p>
                        <p className="text-sm font-medium text-slate font-mono">{item.productId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase">Quantity</p>
                        <p className="font-mono font-bold text-slate">x{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase">Unit Price</p>
                        <p className="font-mono font-bold text-slate">
                          ${item.pricePerUnit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer / Actions */}
              <div className="bg-gray-50 px-4 py-3 border-t border-border flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  className="group-hover:bg-slate group-hover:text-white"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  View Full Details
                </Button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
}