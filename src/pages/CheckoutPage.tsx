import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DeliverySelector } from '../components/checkout/DeliverySelector';
import { DeliveryDetails, PaymentMethod, SellerPoint, CartItem, SavedAddress } from '../lib/types';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/productUtils';

type FormSection = 'shipping' | 'payment' | 'review';

export function CheckoutPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSection, setCurrentSection] = useState<FormSection>('shipping');

  // Retrieve selected items from router state. If not present, redirect to cart.
  const checkoutItems: CartItem[] = location.state?.selectedItems || [];

  useEffect(() => {
    if (checkoutItems.length === 0) {
      navigate('/cart');
    }
  }, [checkoutItems, navigate]);

  // Delivery State
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    provider: 'NOVA_POSHTA',
    type: 'BRANCH'
  });
  const [sellerPickupPoints, setSellerPickupPoints] = useState<SellerPoint[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Seller Points if needed
  useEffect(() => {
    const fetchSellerPoints = async () => {
      if (checkoutItems.length === 0) return;
      const sellerId = checkoutItems[0].product.sellerId;
      // Check if all items are from same seller
      const isSingleSeller = checkoutItems.every(i => i.product.sellerId === sellerId);

      if (isSingleSeller && deliveryDetails.provider === 'SELLER') {
        try {
          const { data } = await api.get(`/sellers/${sellerId}`); // Fixed endpoint
          if (data.pickupPoints) {
            setSellerPickupPoints(data.pickupPoints);
          }
        } catch (e) {
        }
      }
    };
    fetchSellerPoints();
  }, [checkoutItems, deliveryDetails.provider]);

  // Fetch Saved Addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await api.get('/users/me/addresses');
        setSavedAddresses(data);
      } catch (e) {
      }
    };
    fetchAddresses();
  }, []);

  const total = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = total > 500 ? 0 : 29.99;
  const grandTotal = total + shipping;

  const sections: {
    id: FormSection;
    number: string;
    title: string;
  }[] = [
      { id: 'shipping', number: '01', title: t('checkout.shippingInfo') },
      { id: 'payment', number: '02', title: t('checkout.paymentDetails') },
      { id: 'review', number: '03', title: t('checkout.orderReview') }
    ];

  const getSectionStatus = (sectionId: FormSection) => {
    const order: FormSection[] = ['shipping', 'payment', 'review'];
    const currentIndex = order.indexOf(currentSection);
    const sectionIndex = order.indexOf(sectionId);
    if (sectionIndex < currentIndex) return 'complete';
    if (sectionIndex === currentIndex) return 'current';
    return 'pending';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (deliveryDetails.type === 'BRANCH') {
      if (!deliveryDetails.cityRef || !deliveryDetails.branchRef) {
        alert(t('checkout.alertCityBranch'));
        return;
      }
    }
    if (deliveryDetails.type === 'COURIER' && deliveryDetails.provider !== 'SELLER') {
      if (!deliveryDetails.cityRef) {
        alert(t('checkout.alertCityList'));
        return;
      }
      if (!deliveryDetails.street || !deliveryDetails.building) {
        alert(t('checkout.alertStreetBuilding'));
        return;
      }
    }
    if (deliveryDetails.type === 'SELF_PICKUP' && !deliveryDetails.pickupAddress) {
      alert(t('checkout.alertPickupPoint'));
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        items: checkoutItems.map(i => ({
          productId: i.product.id,
          quantity: i.quantity
        })),
        deliveryDetails: {
          ...deliveryDetails,
          recipientName: `${formData.firstName} ${formData.lastName}`,
          recipientPhone: formData.phoneNumber
        },
        paymentMethod: paymentMethod
      };

      console.log("Submitting Order Payload:", orderPayload); // Log payload for debug

      const { data } = await api.post('/orders', orderPayload);

      // Backend should clear cart items that were purchased. 
      // Instead of clearing entire cart from context, we might trigger a fetchCart to sync.
      // But for now clearCart handles frontend state cleanup. Ideally, call a remove endpoint per checked out item if not done automatically by backend.
      // E.g.
      for (const item of checkoutItems) {
        await api.delete(`/cart/items/${item.product.id}`).catch(() => { });
      }

      // Clear all items if a user checkout from UI with everything selected, or reload
      // But clearing all items forcefully might delete unselected items on frontend. Let's just navigate to confirmation, context fetch will reload clean cart.

      navigate('/confirmation', {
        state: {
          orderId: data.transactionId || 'ORD-NEW',
          paymentUrl: data.paymentUrl,
          amount: grandTotal,
          transactionId: data.transactionId,
          isCod: paymentMethod === 'COD' // Pass COD flag
        }
      });
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        alert(`${t('checkout.orderFailed')} ${error.response.data.message}`);
      } else {
        alert(t('checkout.orderSubmissionFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) {
    return null; // Will redirect in useEffect
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="page-wrapper">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs mb-8">
          <Link to="/" className="text-gray-500 hover:text-slate transition-colors">{t('nav.home')}</Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <Link to="/cart" className="text-gray-500 hover:text-slate transition-colors">{t('cart.requisition')}</Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-slate">{t('checkout.checkout')}</span>
        </nav>

        <div className="border-t-2 border-tactical pt-4 mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate">{t('checkout.requisitionForm')}</h1>
          <p className="text-xs font-mono text-gray-500 mt-1">FORM REF: REQ-{Date.now().toString().slice(-6)}</p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4">
          {sections.map((section, index) => {
            const status = getSectionStatus(section.id);
            return (
              <div key={section.id} className="flex items-center">
                <button
                  onClick={() => status !== 'pending' && setCurrentSection(section.id)}
                  disabled={status === 'pending'}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-sm transition-colors ${status === 'current' ? 'border-tactical bg-tactical/5' : status === 'complete' ? 'border-tactical bg-tactical text-white' : 'border-border text-gray-400'}`}>
                  {status === 'complete' ? <CheckIcon className="w-4 h-4" /> : <span className="font-mono text-sm font-bold">{section.number}</span>}
                  <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">{section.title}</span>
                </button>
                {index < sections.length - 1 && <div className={`w-8 h-0.5 mx-2 ${status === 'complete' ? 'bg-tactical' : 'bg-border'}`} />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentSection === 'shipping' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border rounded-sm">
                <div className="px-6 py-4 border-b border-border bg-cream/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-tactical">01 — {t('checkout.shippingInfo')}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('checkout.firstName')} value={formData.firstName} onChange={(e: any) => handleInputChange('firstName', e.target.value)} placeholder={t('checkout.firstNamePlaceholder')} />
                    <Input label={t('checkout.lastName')} value={formData.lastName} onChange={(e: any) => handleInputChange('lastName', e.target.value)} placeholder={t('checkout.lastNamePlaceholder')} />
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <DeliverySelector value={deliveryDetails} onChange={setDeliveryDetails} sellerPickupPoints={sellerPickupPoints} savedAddresses={savedAddresses} />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => setCurrentSection('payment')}>{t('checkout.continueToPayment')}</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentSection === 'payment' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border rounded-sm">
                <div className="px-6 py-4 border-b border-border bg-cream/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-tactical">02 — {t('checkout.paymentDetails')}</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('checkout.paymentMethod')}</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setPaymentMethod('CARD')} className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === 'CARD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="font-bold">{t('checkout.cardPayment')}</span>
                        <span className="text-xs text-gray-500">{t('checkout.cardPaymentDesc')}</span>
                      </button>
                      <button onClick={() => setPaymentMethod('COD')} className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === 'COD' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="font-bold">{t('checkout.cod')}</span>
                        <span className="text-xs text-gray-500">{t('checkout.codDesc')}</span>
                      </button>
                    </div>
                  </div>
                  {paymentMethod === 'CARD' && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <Input label={t('checkout.cardholderName')} value={formData.cardholderName} onChange={(e: any) => handleInputChange('cardholderName', e.target.value)} placeholder={t('checkout.cardholderNamePlaceholder')} />
                      <Input label={t('checkout.cardNumber')} value={formData.cardNumber} onChange={(e: any) => handleInputChange('cardNumber', e.target.value)} placeholder="0000 0000 0000 0000" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label={t('checkout.expiryDate')} value={formData.expiryDate} onChange={(e: any) => handleInputChange('expiryDate', e.target.value)} placeholder="MM/YY" />
                        <Input label={t('checkout.cvv')} value={formData.cvv} onChange={(e: any) => handleInputChange('cvv', e.target.value)} placeholder="123" type="password" />
                      </div>
                    </div>
                  )}
                  <div className="pt-4 flex justify-between">
                    <Button variant="secondary" onClick={() => setCurrentSection('shipping')}>{t('checkout.back')}</Button>
                    <Button onClick={() => setCurrentSection('review')}>{t('checkout.continueToReview')}</Button>
                  </div>
                </div>
              </motion.div>
            )}

            {currentSection === 'review' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-border rounded-sm">
                <div className="px-6 py-4 border-b border-border bg-cream/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-tactical">03 — {t('checkout.orderReview')}</p>
                </div>
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{t('checkout.items', { count: checkoutItems.length })}</p>
                    <div className="space-y-2">
                      {checkoutItems.map((item) => (
                        <div key={item.product.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.product.name} × {item.quantity}</span>
                          <span className="font-mono font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6 pb-6 border-b border-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{t('checkout.shippingTo')}</p>
                    <p className="text-sm text-slate">
                      {formData.firstName} {formData.lastName}<br />
                      <span className="font-semibold">{deliveryDetails.provider} - {deliveryDetails.type}</span><br />
                      {deliveryDetails.type === 'BRANCH' && <>{deliveryDetails.cityName}, {deliveryDetails.branchName || deliveryDetails.branchRef}</>}
                      {deliveryDetails.type === 'COURIER' && <>{deliveryDetails.cityName}, {deliveryDetails.street} {deliveryDetails.building} {deliveryDetails.apartment && `, ${t('address.apt')} ${deliveryDetails.apartment}`}</>}
                      {deliveryDetails.type === 'SELF_PICKUP' && <>Pickup Point: {deliveryDetails.pickupAddress}</>}
                      {deliveryDetails.zipCode && <><br />{deliveryDetails.zipCode}</>}
                    </p>
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <Button variant="secondary" onClick={() => setCurrentSection('payment')} disabled={isSubmitting}>{t('checkout.back')}</Button>
                    <Button onClick={handleSubmitOrder} isLoading={isSubmitting} disabled={isSubmitting}>
                      {isSubmitting ? t('checkout.processing', 'Processing...') : t('checkout.submitRequisition')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-sm sticky top-24">
              <div className="px-4 py-3 border-b border-border bg-cream/50">
                <p className="text-xs font-bold uppercase tracking-wider text-tactical">{t('cart.orderSummary')}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('checkout.subtotal')}</span>
                  <span className="font-mono font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cart.shipping')}</span>
                  <span className="font-mono font-semibold">{shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold uppercase text-sm">{t('cart.total')}</span>
                  <span className="font-mono text-xl font-bold text-slate">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}