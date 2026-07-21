import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, PackageIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { sellerApi, orderActionsApi } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { Order } from '../../lib/types';
import { formatPrice } from '../../lib/productUtils';

export function SellerOrderConfirmation() {
    const { success, error: showError } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [returnRequests, setReturnRequests] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [processing, setProcessing] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const [pendingRes, returnsRes] = await Promise.all([
                sellerApi.getOrders(0, 100, 'PENDING_CONFIRMATION'),
                sellerApi.getOrders(0, 100, 'RETURN_REQUESTED')
            ]);
            setOrders(pendingRes.data.content || []);
            setReturnRequests(returnsRes.data.content || []);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleAction = async (action: 'CONFIRM' | 'REJECT' | 'APPROVE_RETURN' | 'REJECT_RETURN', orderId: string) => {
        setProcessing(true);
        try {
            if (action === 'CONFIRM') {
                await sellerApi.updateOrderStatus(orderId, 'CONFIRMED');
                success('Order confirmed successfully');
            } else if (action === 'REJECT') {
                await sellerApi.updateOrderStatus(orderId, 'CANCELLED');
                success('Order rejected');
            } else if (action === 'APPROVE_RETURN') {
                await orderActionsApi.processReturn(orderId, true);
                success('Return approved');
            } else if (action === 'REJECT_RETURN') {
                await orderActionsApi.processReturn(orderId, false);
                success('Return rejected');
            }
            setSelectedOrder(null);
            fetchOrders();
        } catch (error) {
            console.error('Action failed', error);
            showError('Failed to update order');
        } finally {
            setProcessing(false);
        }
    };

    const OrderTable = ({ title, icon: Icon, data, emptyMessage }: any) => (
        <div className="bg-white p-6 rounded-sm border border-border mb-6">
            <h2 className="text-xl font-bold mb-6 font-mono uppercase tracking-tight text-slate flex items-center gap-2">
                <Icon className="w-5 h-5 text-tactical" />
                {title}
            </h2>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                    <Icon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">{emptyMessage}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                <th className="p-4 font-bold">Order ID</th>
                                <th className="p-4 font-bold">Date</th>
                                <th className="p-4 font-bold">Total</th>
                                <th className="p-4 font-bold">Payment</th>
                                <th className="p-4 font-bold">Items</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {data.map((order: Order) => (
                                <tr key={order.id} className="hover:bg-slate/5 transition-colors">
                                    <td className="p-4 font-mono font-bold text-slate">#{order.id.substring(0, 8)}</td>
                                    <td className="p-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="w-3 h-3" />
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-tactical">{formatPrice(order.totalPrice)}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${order.paymentMethod === 'COD'
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                            {order.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <PackageIcon className="w-3 h-3" />
                                            {order.items.length} items
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            Review
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div>
            <OrderTable
                title="Pending Confirmation"
                icon={CheckCircleIcon}
                data={orders}
                emptyMessage="No pending orders to confirm."
            />

            <OrderTable
                title="Return Requests"
                icon={RefreshCwIcon}
                data={returnRequests}
                emptyMessage="No return requests."
            />

            {/* Verification Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-sm shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-slate px-6 py-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        Review Order #{selectedOrder.id.substring(0, 8)}
                                    </h3>
                                    <p className="text-white/70 text-xs uppercase tracking-wider">
                                        Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-white/70 hover:text-white">
                                    <XCircleIcon className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                                {/* Return Reason if applicable */}
                                {(selectedOrder.status === 'RETURN_REQUESTED' || (selectedOrder as any).returnReason) && (
                                    <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                        <h4 className="font-bold text-xs uppercase text-yellow-800 mb-2">Return Reason</h4>
                                        <p className="text-sm text-gray-800 italic">"{(selectedOrder as any).returnReason || 'No reason provided'}"</p>
                                    </div>
                                )}

                                {/* Customer & Delivery */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-3">Delivery Details</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-semibold">Type:</span> {selectedOrder.deliveryInfo.type}</p>
                                            <p><span className="font-semibold">Provider:</span> {selectedOrder.deliveryInfo.provider}</p>
                                            {selectedOrder.deliveryInfo.type === 'COURIER' ? (
                                                <>
                                                    <p>{selectedOrder.deliveryInfo.street} {selectedOrder.deliveryInfo.building}</p>
                                                    <p>{selectedOrder.deliveryInfo.cityName || selectedOrder.deliveryInfo.cityRef}</p>
                                                </>
                                            ) : selectedOrder.deliveryInfo.type === 'BRANCH' ? (
                                                <>
                                                    <p>City: {selectedOrder.deliveryInfo.cityName || selectedOrder.deliveryInfo.cityRef}</p>
                                                    <p>Branch: {selectedOrder.deliveryInfo.branchName || selectedOrder.deliveryInfo.branchRef || selectedOrder.deliveryInfo.pickupAddress}</p>
                                                </>
                                            ) : (
                                                <p className="text-amber-600 font-bold">Self Pickup from: {selectedOrder.deliveryInfo.pickupAddress}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <h4 className="font-bold text-xs uppercase text-gray-500 mb-3">Payment Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-semibold">Method:</span> {selectedOrder.paymentMethod}</p>
                                            <p><span className="font-semibold">Total:</span> {formatPrice(selectedOrder.totalPrice)}</p>
                                            <p><span className="font-semibold">Status:</span> <span className="text-yellow-600 font-bold">{selectedOrder.status}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div>
                                    <h4 className="font-bold text-xs uppercase text-gray-500 mb-3">Order Items</h4>
                                    <div className="border border-gray-200 rounded overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                                                <tr>
                                                    <th className="p-3 text-left">Product</th>
                                                    <th className="p-3 text-center">Qty</th>
                                                    <th className="p-3 text-right">Price</th>
                                                    <th className="p-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {selectedOrder.items.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-3">{item.name}</td>
                                                        <td className="p-3 text-center">{item.quantity}</td>
                                                        <td className="p-3 text-right">{formatPrice(item.pricePerUnit)}</td>
                                                        <td className="p-3 text-right font-bold">{formatPrice(item.quantity * item.pricePerUnit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Risk Warning (Mock) */}
                                {selectedOrder.totalPrice > 1000 && (
                                    <div className="bg-amber-50 text-amber-800 p-3 rounded text-sm flex items-start gap-2">
                                        <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                                        <p>High value order. Please verify stock availability before confirming.</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer Actions */}
                            <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
                                {selectedOrder.status === 'PENDING_CONFIRMATION' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => handleAction('REJECT', selectedOrder.id)}
                                            disabled={processing}
                                        >
                                            Reject Order
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleAction('CONFIRM', selectedOrder.id)}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Confirm Order'}
                                        </Button>
                                    </>
                                ) : selectedOrder.status === 'RETURN_REQUESTED' ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => handleAction('REJECT_RETURN', selectedOrder.id)}
                                            disabled={processing}
                                        >
                                            Reject Return
                                        </Button>
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                            onClick={() => handleAction('APPROVE_RETURN', selectedOrder.id)}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Approve Return'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="secondary" onClick={() => setSelectedOrder(null)}>Close</Button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
