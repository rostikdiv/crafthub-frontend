
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, PackageIcon, TruckIcon, MapPinIcon, CreditCardIcon, CheckCircleIcon, AlertTriangleIcon, ExternalLinkIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { api, orderActionsApi } from '../../lib/api';
import { Order } from '../../lib/types';
import { useToast } from '../../lib/toastContext';
import { formatPrice } from '../../lib/productUtils';
import { fixImageUrl } from '../../lib/imageUtils';
import { formatDateTime } from '../../lib/dateUtils';

type OrderDetailsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
};

interface OrderDetail extends Order {
    paymentStatus?: string;
}

export function OrderDetailsModal({ isOpen, onClose, orderId }: OrderDetailsModalProps) {
    const { success, error: showError } = useToast();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [processingAction, setProcessingAction] = useState(false);
    const [productDetailsMap, setProductDetailsMap] = useState<Record<string, { name?: string; imageUrl?: string }>>({});

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails(orderId);
        } else {
            setOrder(null);
            setProductDetailsMap({});
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async (id: string) => {
        setLoading(true);
        try {
            const [orderRes, paymentRes] = await Promise.allSettled([
                api.get(`/orders/${id}`),
                api.get(`/payments/order/${id}`)
            ]);

            if (orderRes.status === 'fulfilled') {
                const orderData = orderRes.value.data;
                let paymentStatus = 'UNKNOWN';
                if (paymentRes.status === 'fulfilled') {
                    paymentStatus = paymentRes.value.data.status;
                }

                setOrder({
                    ...orderData,
                    paymentStatus
                });

                // Fetch product information (image & name) for items in parallel
                if (orderData.items && Array.isArray(orderData.items) && orderData.items.length > 0) {
                    const productIds = Array.from(
                        new Set(orderData.items.map((i: any) => i.productId).filter(Boolean))
                    ) as string[];

                    const productResults = await Promise.allSettled(
                        productIds.map(async (pId) => {
                            const res = await api.get(`/products/${pId}`);
                            const p = res.data;
                            return {
                                id: pId,
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
            } else {
                console.error('Failed to fetch order details:', orderRes.reason);
                setOrder(null);
            }
        } catch (error) {
            console.error('Failed to fetch order details or payment details', error);
        } finally {
            setLoading(false);
        }
    };

    const [isReturnMode, setIsReturnMode] = useState(false);
    const [returnReason, setReturnReason] = useState('');

    const handleCancelOrder = async () => {
        if (!order) return;
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        setProcessingAction(true);
        try {
            await orderActionsApi.cancelOrder(order.id, 'User requested cancellation');
            success('Order cancelled successfully');
            fetchOrderDetails(order.id);
        } catch (error) {
            console.error('Failed to cancel order', error);
            showError('Failed to cancel order. It may be too late to cancel.');
        } finally {
            setProcessingAction(false);
        }
    };

    const submitReturnRequest = async () => {
        if (!order || !returnReason.trim()) return;

        setProcessingAction(true);
        try {
            await orderActionsApi.requestReturn(order.id, returnReason);
            success('Return requested successfully');
            fetchOrderDetails(order.id);
            setIsReturnMode(false);
        } catch (error) {
            console.error('Failed to request return', error);
            showError('Failed to request return');
        } finally {
            setProcessingAction(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-cream w-full max-w-2xl rounded-sm border border-border shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white shrink-0">
                        {/* ... Header content ... */}
                        <div>
                            <h2 className="font-bold text-lg uppercase tracking-tight text-slate flex items-center gap-2">
                                <PackageIcon className="w-5 h-5 text-tactical" />
                                Requisition Details
                            </h2>
                            <p className="text-xs font-mono text-gray-500">
                                ID: {orderId}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-sm transition-colors"
                        >
                            <XIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto grow bg-gray-50/50">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
                            </div>
                        ) : order ? (
                            <div className="space-y-6">
                                {/* Status Bar */}
                                <div className="bg-white p-4 border border-border rounded-sm flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${order.status === 'PAID' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.status === 'DELIVERED' ? <CheckCircleIcon className="w-5 h-5" /> :
                                                order.status === 'CANCELLED' ? <AlertTriangleIcon className="w-5 h-5" /> :
                                                    <TruckIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold">Current Status</p>
                                            <p className="text-sm font-bold text-slate uppercase">{order.status}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 uppercase font-bold">Placed On</p>
                                        <p className="text-sm font-mono text-slate">
                                            {formatDateTime(order.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="bg-white border border-border rounded-sm overflow-hidden">
                                    {/* ... Items content ... */}
                                    <div className="bg-slate/5 px-4 py-2 border-b border-border">
                                        <p className="text-xs font-bold uppercase text-gray-500">Manifest</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {order.items?.map((item, idx) => {
                                            const details = productDetailsMap[item.productId];
                                            const imgUrl = (item as any).imageUrl || details?.imageUrl;
                                            const displayName = item.name || details?.name || `Product #${item.productId.substring(0, 8)}`;

                                            return (
                                                <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0">
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
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-bold text-slate text-sm uppercase tracking-tight hover:text-tactical transition-colors flex items-center gap-1.5 line-clamp-1"
                                                            >
                                                                {displayName}
                                                                <ExternalLinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            </Link>
                                                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">ID: {item.productId.substring(0, 8)}... • Unit: {formatPrice(item.pricePerUnit)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                                                        <p className="text-xs font-mono font-bold text-slate">× {item.quantity}</p>
                                                        <p className="text-sm font-bold text-tactical font-mono">
                                                            {formatPrice(item.pricePerUnit * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="bg-slate/5 px-4 py-3 border-t border-border flex justify-between items-center">
                                        <span className="font-bold text-sm uppercase text-slate">Total</span>
                                        <span className="font-mono text-lg font-black text-slate">
                                            {formatPrice(order.totalPrice || 0)}
                                        </span>
                                    </div>
                                </div>

                                {/* Logistics Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white border border-border rounded-sm p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <MapPinIcon className="w-4 h-4 text-tactical" />
                                            <h3 className="text-xs font-bold uppercase text-slate">Shipping To</h3>
                                        </div>
                                        {order.deliveryInfo?.type === 'COURIER' ? (
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{order.deliveryInfo.cityName}, {order.deliveryInfo.street} {order.deliveryInfo.building}</p>
                                                {order.deliveryInfo.apartment && <p>Apt: {order.deliveryInfo.apartment}</p>}
                                                <p className="text-xs text-gray-400 uppercase">Courier Delivery</p>
                                            </div>
                                        ) : order.deliveryInfo?.type === 'BRANCH' ? (
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{order.deliveryInfo.cityName}</p>
                                                <p>{order.deliveryInfo.branchName || order.deliveryInfo.branchRef}</p>
                                                <p className="text-xs text-gray-400 uppercase">{order.deliveryInfo.provider} Branch</p>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{order.deliveryInfo?.pickupAddress || 'Branch Delivery'}</p>
                                                <p className="text-xs text-gray-400 uppercase">{order.deliveryInfo?.provider} - {order.deliveryInfo?.type}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white border border-border rounded-sm p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <CreditCardIcon className="w-4 h-4 text-tactical" />
                                            <h3 className="text-xs font-bold uppercase text-slate">Payment</h3>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <p className="uppercase font-bold text-slate">
                                                {order.paymentStatus || (order.status === 'PAID' ? 'PAID' : 'PENDING')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">Method: {order.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Return Form */}
                                {isReturnMode && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4 mt-4">
                                        <h3 className="text-sm font-bold text-yellow-800 mb-2">Request Return</h3>
                                        <textarea
                                            className="w-full p-2 border border-yellow-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                            rows={3}
                                            placeholder="Please describe why you want to return this item..."
                                            value={returnReason}
                                            onChange={(e) => setReturnReason(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => setIsReturnMode(false)}
                                                disabled={processingAction}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                                onClick={submitReturnRequest}
                                                disabled={processingAction || !returnReason.trim()}
                                            >
                                                Submit Request
                                            </Button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                Failed to load details.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border bg-white flex justify-end gap-3 shrink-0">
                        <Button variant="secondary" onClick={onClose} disabled={processingAction}>
                            CLOSE
                        </Button>

                        {order && ['CREATED', 'PENDING_PAYMENT', 'PENDING_CONFIRMATION', 'CONFIRMED'].includes(order.status) && (
                            <Button
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={handleCancelOrder}
                                disabled={processingAction}
                            >
                                CANCEL ORDER
                            </Button>
                        )}

                        {order?.status === 'DELIVERED' && !isReturnMode && (
                            <Button
                                variant="outline"
                                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                onClick={() => setIsReturnMode(true)}
                                disabled={processingAction}
                            >
                                REQUEST RETURN
                            </Button>
                        )}

                        {order?.status === 'PENDING_PAYMENT' && (
                            <Button disabled={processingAction}>PROCEED TO PAYMENT</Button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
