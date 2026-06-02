import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronRightIcon, PlusIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ProductTable } from '../components/seller/ProductTable';
import { AddProductModal } from '../components/seller/AddProductModal';
import { ShopSettings } from '../components/seller/ShopSettings';
import { SellerOrders } from '../components/seller/SellerOrders';
import { SellerOrderConfirmation } from '../components/seller/SellerOrderConfirmation';
import { SellerPickupPoints } from '../components/seller/SellerPickupPoints';
import { useAuth } from '../lib/authContext';
import { useToast } from '../lib/toastContext';
import { api } from '../lib/api';

type SellerTab = 'inventory' | 'settings' | 'orders' | 'confirmation' | 'locations';



export type SellerProduct = {
  id: string;
  name: string;
  itemNumber: string;
  price: number;
  stock: number;
  accessLevel: string;
  category: string;
  imageUrl?: string;
};

export function SellerStudioPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  // Determine initial tab based on profile existence
  const [activeTab, setActiveTab] = useState<SellerTab>(() => {
    // If user has no seller profile, force settings tab to create one
    if (user?.role === 'SELLER' && !user.sellerProfile) {
      return 'settings';
    }
    return 'inventory';
  });

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<SellerProduct | null>(null);

  // Delete States
  const [productToDelete, setProductToDelete] = useState<SellerProduct | null>(null);

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSellerProducts = async () => {
    if (!user) return;

    // Don't fetch products if no profile exists yet
    if (user.role === 'SELLER' && !user.sellerProfile) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { size: 100 } });
      const content = data.content ? data.content : data;

      const sellerProducts = content.filter((p: any) => p.sellerId === user.id || p.authorId === user.id);

      const mapped: SellerProduct[] = sellerProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        itemNumber: p.sku || p.id.substring(0, 8).toUpperCase(),
        price: p.price,
        stock: p.quantity || 0,
        accessLevel: p.accessLevel || 'PUBLIC',
        category: p.categoryName || 'Uncategorized',
        imageUrl: p.previewImageUrl
      }));
      setProducts(mapped);
    } catch (error) {
      console.error('Failed to fetch seller products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerProducts();
  }, [user]);

  // Handlers
  const handleEditProduct = (product: SellerProduct) => {
    setProductToEdit(product);
    setIsProductModalOpen(true);
  };

  const handleCreateProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = (product: SellerProduct) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      success(t('sellerStudio.deleteSuccess'));
      setProductToDelete(null);
      fetchSellerProducts(); // Refresh list
    } catch (error) {
      console.error('Failed to delete product', error);
      showError(t('sellerStudio.deleteFailed'));
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  // Access Level Stats
  const publicListings = products.filter(p => p.accessLevel === 'PUBLIC').length;
  const restrictedListings = products.filter(p => p.accessLevel === 'RESTRICTED' || p.accessLevel === 'CLASSIFIED').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="page-wrapper"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8">
          <Link to="/" className="text-gray-500 hover:text-slate transition-colors">{t('sellerStudio.home')}</Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-slate">{t('sellerStudio.title')}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-tactical pb-4 mb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate">
              {t('sellerStudio.header')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('sellerStudio.subtitle')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'settings' ? 'primary' : 'outline'}
              onClick={() => setActiveTab('settings')}
            >
              {t('sellerStudio.shopSettings')}
            </Button>
            <Button
              onClick={handleCreateProduct}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              {t('sellerStudio.addNewProduct')}
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-tactical text-tactical' : 'border-transparent text-gray-500'}`}
          >
            {t('sellerStudio.tabInventory')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-tactical text-tactical' : 'border-transparent text-gray-500'}`}
          >
            {t('sellerStudio.tabOrders')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-tactical text-tactical' : 'border-transparent text-gray-500'}`}
          >
            {t('sellerStudio.tabShopProfile')}
          </button>
          <button
            onClick={() => setActiveTab('confirmation')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'confirmation' ? 'border-tactical text-tactical' : 'border-transparent text-gray-500'}`}
          >
            {t('sellerStudio.tabConfirmations')}
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'locations' ? 'border-tactical text-tactical' : 'border-transparent text-gray-500'}`}
          >
            {t('sellerStudio.tabLocations')}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'inventory' ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-border p-4 rounded-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('sellerStudio.totalProducts')}</p>
                <p className="text-2xl font-mono font-bold text-slate">{loading ? '-' : totalProducts}</p>
              </div>
              <div className="bg-white border border-border p-4 rounded-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('sellerStudio.publicListings')}</p>
                <p className="text-2xl font-mono font-bold text-green-700">{loading ? '-' : publicListings}</p>
              </div>
              <div className="bg-white border border-border p-4 rounded-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{t('sellerStudio.restrictedItems')}</p>
                <p className="text-2xl font-mono font-bold text-amber-600">{loading ? '-' : restrictedListings}</p>
              </div>
            </div>
            <ProductTable
              products={products}
              loading={loading}
              onEdit={handleEditProduct}
              onDelete={handleDeleteClick}
            />
          </>
        ) : activeTab === 'orders' ? (
          <SellerOrders />
        ) : activeTab === 'confirmation' ? (
          <SellerOrderConfirmation />
        ) : activeTab === 'locations' ? (
          <SellerPickupPoints />
        ) : (
          <ShopSettings />
        )}

        {/* Add/Edit Product Modal */}
        <AddProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          productToEdit={productToEdit}
          onRefresh={fetchSellerProducts}
        />

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {productToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setProductToDelete(null)}
                className="absolute inset-0 bg-slate/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white p-6 rounded-sm shadow-xl max-w-sm w-full border-t-4 border-red-500"
              >
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertTriangleIcon className="w-6 h-6" />
                  <h3 className="font-bold text-lg">{t('sellerStudio.deleteConfirmTitle')}</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  {t('sellerStudio.deleteConfirmMsg')} <strong>{productToDelete.name}</strong>? {t('sellerStudio.cannotUndo')}
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setProductToDelete(null)}>{t('sellerStudio.cancel')}</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmDelete}>{t('sellerStudio.deleteAndConfirm')}</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
}