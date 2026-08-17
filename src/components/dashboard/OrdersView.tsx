import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PackageIcon, ClockIcon, MapPinIcon, CreditCardIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { OrderDetailsModal } from './OrderDetailsModal';
import { formatPrice } from '../../lib/productUtils';
import { fixImageUrl } from '../../lib/imageUtils';

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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [productDetailsMap, setProductDetailsMap] = useState<Record<string, { name?: string; imageUrl?: string }>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/orders/my', { params: { page, size: 10 } });
        const content = data.content ? data.content : data;
        setTotalPages(data.totalPages || 1);

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

        // Fetch product information (image & name) for each unique productId in parallel
        const productIds = Array.from(
          new Set(
            mappedOrders.flatMap((o: Order) => o.items.map((i) => i.productId)).filter(Boolean)
          )
        ) as string[];

        if (productIds.length > 0) {
          const productResults = await Promise.allSettled(
            productIds.map(async (id) => {
              const res = await api.get(`/products/${id}`);
              const p = res.data;
              return {
                id,
                name: p.name,
                imageUrl: p.previewImageUrl || p.imageUrl || (p.imageUrls && p.imageUrls[0]) || ''
              };
            })
          );

          const newMap: Record<string, { name?: string; imageUrl?: string }> = {};
          productResults.forEach((entry) => {
            if (entry.status === 'fulfilled' && entry.value) {
              newMap[entry.value.id] = {
                name: entry.value.name,
                imageUrl: entry.value.imageUrl
              };
            }
          });
          setProductDetailsMap(newMap);
        }
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

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
                    {formatPrice(order.totalPrice)}
                  </p>
                </div>
              </div>

              {/* Inner Cells for Items */}
              <div className="p-4 bg-white space-y-3">
                {order.items.map((item, i) => {
                  const details = productDetailsMap[item.productId];
                  const imgUrl = (item as any).imageUrl || details?.imageUrl;
                  const displayName = item.name || details?.name || `Product #${item.productId.substring(0, 8)}`;

                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-sm bg-gray-50/50 hover:bg-gray-50 transition-colors gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Product Image Thumbnail */}
                        <div className="w-14 h-14 bg-gray-100 border border-gray-200 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {imgUrl ? (
                            <img
                              src={fixImageUrl(imgUrl)}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <PackageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            to={`/products/${item.productId}`}
                            className="font-bold text-sm uppercase tracking-tight text-slate hover:text-tactical transition-colors flex items-center gap-1.5 line-clamp-1"
                          >
                            {displayName}
                            <ExternalLinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          </Link>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">ID: {item.productId.substring(0, 8)}...</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-200">
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Qty</p>
                          <p className="font-mono font-bold text-slate">× {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Unit Price</p>
                          <p className="font-mono text-xs text-gray-600">
                            {formatPrice(item.pricePerUnit)}
                          </p>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <p className="text-[10px] text-gray-400 uppercase font-bold">Subtotal</p>
                          <p className="font-mono font-bold text-tactical text-sm">
                            {formatPrice(item.pricePerUnit * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
          <span className="text-sm font-medium text-slate-600">Page {page + 1} of {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next</Button>
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