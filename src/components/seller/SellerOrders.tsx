import React, { useState, useEffect } from 'react';
import { sellerApi, orderActionsApi } from '../../lib/api';
import { Order, OrderStatus } from '../../lib/types';
import { formatPrice } from '../../lib/productUtils';
import { useToast } from '../../lib/toastContext';
import { Button } from '../ui/Button';
import {
    Package, Clock, Eye, X,
    CheckCircle, XCircle, Truck, MapPin,
    Phone, User, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SellerOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const { success, error: showError } = useToast();

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await sellerApi.getOrders(page, 10);
            setOrders(data.content || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Failed to fetch orders', error);
            showError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const updateStatus = async (orderId: string, info: string, newStatus: string) => {
        try {
            if (newStatus === 'RETURN_APPROVED' || newStatus === 'RETURN_REJECTED') {
                await orderActionsApi.processReturn(orderId, newStatus === 'RETURN_APPROVED');
            } else if (newStatus === 'REFUNDED') {
                await orderActionsApi.completeReturn(orderId);
            } else {
                await sellerApi.updateOrderStatus(orderId, newStatus);
            }
            success(`Order ${info} updated to ${newStatus}`);
            fetchOrders();
            setSelectedOrder(null); // Close modal on success
        } catch (error) {
            console.error('Failed to update status', error);
            showError('Failed to update order status');
        }
    };

    const StatusBadge = ({ status }: { status: OrderStatus }) => {
        const styles: Record<OrderStatus, string> = {
            CREATED: 'bg-gray-100 text-gray-800',
            PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
            PENDING_CONFIRMATION: 'bg-purple-100 text-purple-800 border border-purple-200',
            CONFIRMED: 'bg-blue-100 text-blue-800 font-semibold',
            PAID: 'bg-green-100 text-green-800 border border-green-200',
            PREPARING: 'bg-indigo-100 text-indigo-800',
            READY_FOR_PICKUP: 'bg-teal-100 text-teal-800 font-bold',
            SHIPPED: 'bg-indigo-100 text-indigo-800',
            DELIVERED: 'bg-green-100 text-green-800 font-bold',
            CANCELLED: 'bg-red-100 text-red-800',
            PAYMENT_FAILED: 'bg-red-100 text-red-800',
            RETURN_REQUESTED: 'bg-orange-100 text-orange-800 border border-orange-200',
            RETURN_APPROVED: 'bg-orange-100 text-orange-800',
            RETURN_REJECTED: 'bg-red-100 text-red-800',
            REFUNDING: 'bg-orange-100 text-orange-800',
            REFUNDED: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {status.replace(/_/g, ' ')}
            </span>
        );
    };

    if (loading && orders.length === 0) {
        return <div className="p-8 text-center text-gray-500">Loading orders...</div>;
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No Orders Yet</h3>
                <p className="text-gray-500 mt-1">When you receive orders, they will appear here to be managed.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Ref</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order: Order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{order.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleString('uk-UA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">{order.deliveryInfo.recipientName || 'Guest User'}</div>
                                    <div className="text-xs text-gray-400">{order.deliveryInfo.recipientPhone || 'No phone'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium font-mono">
                                    {formatPrice(order.totalPrice)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={order.status} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 ml-auto"
                                    >
                                        <Eye className="w-4 h-4" /> Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button variant="secondary" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Previous</Button>
                    <span className="text-sm font-medium text-slate-600">Page {page + 1} of {totalPages}</span>
                    <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Next</Button>
                </div>
            )}

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOrder(null)}
                            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden z-10"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                        Order #{selectedOrder.id.slice(0, 8)}
                                        <StatusBadge status={selectedOrder.status} />
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Button variant="secondary" size="sm" className="hidden sm:flex items-center gap-2">
                                        <Printer className="w-4 h-4" /> Print Invoice
                                    </Button>
                                    <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Left Column: Items */}
                                    <div className="md:col-span-2 space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b pb-2">Order Items</h3>
                                            <div className="space-y-4">
                                                {selectedOrder.items.map((item: any, idx) => (
                                                    <div key={idx} className="flex gap-4 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className="w-16 h-16 bg-white rounded border flex items-center justify-center flex-shrink-0 text-gray-300">
                                                            <Package className="w-8 h-8" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                                                            <p className="text-xs text-gray-500">Item ID: {item.productId.slice(0, 8)}</p>
                                                            <div className="mt-2 flex justify-between items-center">
                                                                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                                                <span className="font-mono font-medium">{formatPrice(item.pricePerUnit)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex justify-end text-lg font-bold text-gray-900 border-t pt-4">
                                                Total: {formatPrice(selectedOrder.totalPrice)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Customer & Delivery */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b pb-2">Customer Details</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{selectedOrder.deliveryInfo.recipientName || "Guest User"}</p>
                                                        <p className="text-xs text-gray-500">Customer</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{selectedOrder.deliveryInfo.recipientPhone || "N/A"}</p>
                                                        <p className="text-xs text-gray-500">Contact Number</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 border-b pb-2">Delivery Info</h3>
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 mt-1">
                                                        <Truck className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{selectedOrder.deliveryInfo.provider}</p>
                                                        <p className="text-xs text-gray-500">{selectedOrder.deliveryInfo.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center text-gray-400 mt-1">
                                                        <MapPin className="w-4 h-4" />
                                                    </div>
                                                    <div className="text-sm text-gray-700">
                                                        {selectedOrder.deliveryInfo.type === 'BRANCH' && (
                                                            <>
                                                                <p className="font-medium">{selectedOrder.deliveryInfo.cityName}</p>
                                                                <p className="text-xs text-gray-500">{selectedOrder.deliveryInfo.branchName || selectedOrder.deliveryInfo.branchRef}</p>
                                                            </>
                                                        )}
                                                        {selectedOrder.deliveryInfo.type === 'COURIER' && (
                                                            <>
                                                                <p className="font-medium">{selectedOrder.deliveryInfo.cityName}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {selectedOrder.deliveryInfo.street} {selectedOrder.deliveryInfo.building}
                                                                    {selectedOrder.deliveryInfo.apartment && `, Apt ${selectedOrder.deliveryInfo.apartment}`}
                                                                </p>
                                                            </>
                                                        )}
                                                        {selectedOrder.deliveryInfo.type === 'SELF_PICKUP' && (
                                                            <>
                                                                <p className="font-medium">Self Pickup Point</p>
                                                                <p className="text-xs text-gray-500">{selectedOrder.deliveryInfo.pickupAddress}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedOrder.paymentMethod === 'COD' && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <p className="text-xs font-bold text-purple-700">⚠️ Collect Payment on Delivery: {formatPrice(selectedOrder.totalPrice)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer (Actions) */}
                            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-wrap">
                                {selectedOrder.status === 'PENDING_CONFIRMATION' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'CANCELLED')}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Order
                                        </Button>
                                        <Button
                                            onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'CONFIRMED')}
                                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Confirm Order
                                        </Button>
                                    </>
                                )}
                                {selectedOrder.status === 'PAID' && (
                                    <>
                                        <Button
                                            onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'CONFIRMED')}
                                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Confirm Order
                                        </Button>
                                    </>
                                )}
                                {(selectedOrder.status === 'CONFIRMED' || selectedOrder.status === 'PAID') && (
                                    <Button
                                        onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'PREPARING')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <Package className="w-4 h-4 mr-2" />
                                        Start Preparing
                                    </Button>
                                )}
                                {selectedOrder.status === 'PREPARING' && (
                                    <>
                                        {selectedOrder.deliveryInfo.type === 'SELF_PICKUP' ? (
                                            <Button
                                                onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'READY_FOR_PICKUP')}
                                                className="bg-teal-600 hover:bg-teal-700 text-white"
                                            >
                                                <Package className="w-4 h-4 mr-2" />
                                                Ready for Pickup
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'SHIPPED')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                <Truck className="w-4 h-4 mr-2" />
                                                Mark as Shipped
                                            </Button>
                                        )}
                                    </>
                                )}
                                {selectedOrder.status === 'READY_FOR_PICKUP' && (
                                    <Button
                                        onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'DELIVERED')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Picked Up (Delivered)
                                    </Button>
                                )}
                                {selectedOrder.status === 'SHIPPED' && (
                                    <Button
                                        onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'DELIVERED')}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Delivery
                                    </Button>
                                )}
                                {selectedOrder.status === 'RETURN_REQUESTED' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'RETURN_REJECTED')}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject Return
                                        </Button>
                                        <Button
                                            onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'RETURN_APPROVED')}
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve Return
                                        </Button>
                                    </>
                                )}
                                {selectedOrder.status === 'RETURN_APPROVED' && (
                                    <Button
                                        onClick={() => updateStatus(selectedOrder.id, selectedOrder.id.slice(0, 8), 'REFUNDED')}
                                        className="bg-gray-600 hover:bg-gray-700 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirm Return Received (Refund)
                                    </Button>
                                )}
                                {['DELIVERED', 'CANCELLED', 'REFUNDED', 'RETURN_REJECTED'].includes(selectedOrder.status) && (
                                    <span className="text-sm text-gray-500 italic flex items-center">
                                        No further actions available.
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
