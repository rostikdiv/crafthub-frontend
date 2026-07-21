import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
  PackageIcon,
  CheckSquare,
  Square
} from 'lucide-react';
import { useCart } from '../lib/cartContext';
import { getSellerById } from '../lib/mockData';
import { Button } from '../components/ui/Button';
import { fixImageUrl } from '../lib/imageUtils';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/productUtils';

export function CartPage() {
  const { t } = useTranslation();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  // Selected items state (array of product IDs)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Calculate totals based ONLY on selected items
  const selectedItems = useMemo(() => {
    return items.filter(item => selectedProductIds.includes(item.product.id));
  }, [items, selectedProductIds]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [selectedItems]);

  const shipping = total > 500 ? 0 : 29.99;
  const grandTotal = total > 0 ? total + shipping : 0;

  // Group all items by seller for display
  const itemsBySeller = useMemo(() => {
    return items.reduce((acc, item) => {
      const sellerId = item.product.sellerId;
      if (!acc[sellerId]) {
        acc[sellerId] = [];
      }
      acc[sellerId].push(item);
      return acc;
    }, {} as Record<string, typeof items>);
  }, [items]);

  const toggleSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isAllSelected = items.length > 0 && selectedProductIds.length === items.length;

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(items.map(item => item.product.id));
    }
  };

  const handleProceedToCheckout = () => {
    // Ensure items from multiple sellers aren't selected if backend expects single seller per order.
    // To strictly prevent multiple sellers in one order as requested by user context:
    const selectedSellerIds = new Set(selectedItems.map(item => item.product.sellerId));
    if (selectedSellerIds.size > 1) {
      alert(t('cart.multipleSellersError'));
      return;
    }

    navigate('/checkout', { state: { selectedItems } });
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        className="page-wrapper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16 border-2 border-dashed border-border">
            <PackageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-bold text-slate mb-2">{t('cart.empty')}</p>
            <p className="text-gray-500 mb-6">{t('cart.emptyDesc')}</p>
            <Link to="/products">
              <Button>{t('cart.browseCatalog')}</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="page-wrapper">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center gap-2 text-xs mb-8">
          <Link to="/" className="text-gray-500 hover:text-slate transition-colors">{t('nav.home')}</Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-slate">{t('cart.title')}</span>
        </nav>

        <div className="border-t-2 border-tactical pt-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate">{t('cart.requisitionSummary')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('cart.itemsInRequisition', { count: items.length })}</p>
          </div>
          <p className="text-xs font-mono text-gray-500">REF: REQ-{Date.now().toString().slice(-6)}</p>
        </div>

        {/* Global Select All */}
        <div className="mb-4 flex items-center gap-2">
          <button onClick={toggleAll} className="flex items-center gap-2 text-sm font-semibold text-slate hover:text-tactical transition-colors">
            {isAllSelected ? <CheckSquare className="w-5 h-5 text-tactical" /> : <Square className="w-5 h-5 text-gray-400" />}
            {isAllSelected ? t('cart.deselectAll') : t('cart.selectAll')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(itemsBySeller).map(([sellerId, sellerItems]) => {
              const seller = getSellerById(sellerId);
              const isSellerAllSelected = sellerItems.every(item => selectedProductIds.includes(item.product.id));

              const toggleSellerAll = () => {
                if (isSellerAllSelected) {
                  setSelectedProductIds(prev => prev.filter(id => !sellerItems.some(i => i.product.id === id)));
                } else {
                  const newIds = sellerItems.map(i => i.product.id).filter(id => !selectedProductIds.includes(id));
                  setSelectedProductIds(prev => [...prev, ...newIds]);
                }
              };

              return (
                <div key={sellerId} className="bg-white border border-border rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-cream/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-tactical">{t('cart.seller')} {seller?.name || t('cart.unknown')}</p>
                      <p className="text-[10px] font-mono text-gray-500">{t('cart.code')} {seller?.code || t('cart.na')}</p>
                    </div>
                    <button onClick={toggleSellerAll} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-tactical flex items-center gap-1">
                      {isSellerAllSelected ? <CheckSquare className="w-4 h-4 text-tactical" /> : <Square className="w-4 h-4" />}
                      {t('cart.selectSellerItems')}
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {sellerItems.map((item) => {
                      const isSelected = selectedProductIds.includes(item.product.id);
                      return (
                        <div key={item.product.id} className={`p-4 flex gap-4 transition-colors ${isSelected ? 'bg-tactical/5' : ''}`}>

                          {/* Checkbox */}
                          <div className="flex items-center justify-center pt-6">
                            <button onClick={() => toggleSelection(item.product.id)}>
                              {isSelected ? <CheckSquare className="w-6 h-6 text-tactical" /> : <Square className="w-6 h-6 text-gray-300" />}
                            </button>
                          </div>

                          <div className="w-20 h-20 bg-gray-100 rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.product.imageUrl ? (
                              <img src={fixImageUrl(item.product.imageUrl)} alt={item.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <PackageIcon className="w-8 h-8 text-gray-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-gray-500 mb-1">{item.product.itemNumber}</p>
                            <Link to={`/products/${item.product.id}`} className="font-bold text-sm uppercase tracking-tight text-slate hover:text-tactical transition-colors line-clamp-1">{item.product.name}</Link>
                            <p className="text-xs text-gray-500 mt-1">{item.product.category}</p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <p className="font-mono font-bold text-slate">{formatPrice(item.product.price * item.quantity)}</p>
                            <div className="flex items-center border border-border rounded-sm bg-white">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-50 transition-colors"><MinusIcon className="w-3 h-3" /></button>
                              <span className="px-3 py-1 font-mono text-sm border-x border-border">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-50 transition-colors"><PlusIcon className="w-3 h-3" /></button>
                            </div>
                            <button onClick={() => { removeItem(item.product.id); setSelectedProductIds(prev => prev.filter(id => id !== item.product.id)); }} className="text-xs text-gray-500 hover:text-restricted transition-colors flex items-center gap-1"><TrashIcon className="w-3 h-3" /> {t('cart.remove')}</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}

            <button onClick={clearCart} className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-restricted transition-colors">{t('cart.clearRequisition')}</button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-sm sticky top-24">
              <div className="px-4 py-3 border-b border-border bg-cream/50">
                <p className="text-xs font-bold uppercase tracking-wider text-tactical">{t('cart.orderSummary')}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cart.selectedItems', { count: selectedItems.length })}</span>
                  <span className="font-mono font-semibold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cart.shipping')}</span>
                  <span className="font-mono font-semibold">{total === 0 ? formatPrice(0) : shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span>
                </div>
                {shipping > 0 && total > 0 && <p className="text-[10px] text-gray-500">{t('cart.freeShippingMsg')}</p>}
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-bold uppercase text-sm">{t('cart.total')}</span>
                  <span className="font-mono text-xl font-bold text-slate">{formatPrice(grandTotal)}</span>
                </div>
                <Button fullWidth onClick={handleProceedToCheckout} disabled={selectedItems.length === 0}>
                  {t('cart.proceedToCheckout')}
                </Button>
                <Link to="/products" className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-slate transition-colors">{t('cart.continueShopping')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}