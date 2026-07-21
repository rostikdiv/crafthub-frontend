import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircleIcon, PackageIcon, PrinterIcon, ArrowRightIcon, CreditCardIcon, XIcon, ShieldCheckIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api'; // Or use axios if url is absolute and external
import { formatPrice } from '../lib/productUtils';

export function OrderConfirmationPage() {
    const location = useLocation();
    // Default values strictly for fallback/demo if accessed directly
    const orderId = location.state?.orderId || 'ORD-' + Math.floor(Math.random() * 1000000);
    const paymentUrl = location.state?.paymentUrl;
    const amount = location.state?.amount || 0;
    const transactionId = location.state?.transactionId;

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');

    const handlePayment = async () => {
        if (!paymentUrl) {
            alert('Payment URL missing');
            return;
        }
        setIsProcessingPayment(true);
        try {
            // If paymentUrl is a full URL (http...), we might need axios directly if 'api' instance prefixes base URL.
            // Assuming paymentUrl from backend is relative or compatible with our proxy/CORS setup.
            // If it's an absolute URL to a different port/service, 'api' helper might double-prefix if not careful.
            // Best bet: use raw fetch or check if url starts with http.

            // Fix: Redirect internal service port (8086) to API Gateway (8080) to avoid CORS
            // And ensure we go through Gateway validation which might require auth headers
            const fixedUrl = paymentUrl.replace(':8086', ':8080');

            // Use 'api' instance to ensure Authorization header is attached, 
            // as the Gateway AuthenticationFilter requires it.
            await api.post(fixedUrl);

            setPaymentStatus('SUCCESS');
            setIsPaymentModalOpen(false);
        } catch (error) {
            console.error('Payment failed', error);
            alert('Payment simulation failed. Check console.');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-wrapper flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        >
            <div className="max-w-2xl w-full text-center space-y-8">

                {/* Success Icon or Payment Status Icon */}
                <div className={`mx-auto h-24 w-24 rounded-full flex items-center justify-center mb-6 ${paymentStatus === 'SUCCESS' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    {paymentStatus === 'SUCCESS' ? (
                        <CheckCircleIcon className="h-12 w-12 text-tactical" />
                    ) : (
                        <PackageIcon className="h-12 w-12 text-yellow-700" />
                    )}
                </div>

                {/* Heading */}
                <h1 className="text-4xl font-black uppercase tracking-tight text-slate">
                    {paymentStatus === 'SUCCESS' ? 'Order Paid & Confirmed' : 'Requisition Created'}
                </h1>
                <p className="text-lg text-gray-600">
                    {paymentStatus === 'SUCCESS'
                        ? 'Your transaction has been verified. Logistics are now engaged.'
                        : 'Your order has been placed. Please complete payment to authorize dispatch.'}
                </p>

                {/* Order Details Card */}
                <div className="bg-white border-2 border-border p-8 shadow-sm relative text-left mt-8">
                    {/* Decorative corner markers */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tactical -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tactical -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tactical -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tactical -mb-1 -mr-1" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Transaction ID
                            </h3>
                            <p className="text-xl font-mono font-bold text-slate">
                                {String(transactionId || orderId).substring(0, 18)}...
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                                Payment Status
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide ${paymentStatus === 'SUCCESS'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {paymentStatus}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-6 pt-6">
                        <div className="flex items-start gap-4 p-4 bg-slate/5 rounded-sm">
                            <CreditCardIcon className="w-6 h-6 text-gray-400 mt-1" />
                            <div>
                                <p className="font-bold text-sm text-slate uppercase">Total Amount</p>
                                <p className="text-xl font-mono font-bold text-tactical">
                                    {formatPrice(amount)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                        {paymentStatus !== 'SUCCESS' && paymentUrl && (
                            <Button onClick={() => setIsPaymentModalOpen(true)} className="w-full sm:w-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                <CreditCardIcon className="w-4 h-4" />
                                PAY NOW
                            </Button>
                        )}

                        <Link to="/products">
                            <Button variant="outline" className="w-full sm:w-auto flex items-center gap-2">
                                {paymentStatus === 'SUCCESS' ? 'Continue Procurement' : 'Browse Catalog'}
                                <ArrowRightIcon className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Simulated Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-lg shadow-xl overflow-hidden"
                        >
                            <div className="bg-slate px-6 py-4 flex justify-between items-center">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5" />
                                    SECURE PAYMENT GATEWAY
                                </h3>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="text-white/70 hover:text-white">
                                    <XIcon className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Total to Pay</p>
                                    <div className="text-4xl font-mono font-black text-slate">
                                        {formatPrice(amount)}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Simulated Card Details</p>
                                    <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm text-gray-600">
                                        **** **** **** 4242
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm text-gray-600 flex-1">
                                            12/28
                                        </div>
                                        <div className="bg-gray-100 p-3 rounded border border-gray-300 font-mono text-sm text-gray-600 w-20">
                                            ***
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessingPayment}
                                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                                >
                                    {isProcessingPayment ? 'PROCESSING...' : `PAY ${formatPrice(amount)}`}
                                </Button>
                            </div>

                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
                                <p className="text-[10px] text-gray-400 uppercase">
                                    Encrypted Connection • 256-bit SSL • Mock Gateway
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
