import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  PackageIcon,
  MinusIcon,
  PlusIcon,
  StarIcon
} from
  'lucide-react';
import { Button } from '../components/ui/Button';
import { StampBadge } from '../components/ui/StampBadge';
import { ProductCard } from '../components/products/ProductCard';
import { ProductReviews } from '../components/products/ProductReviews';
import { useCart } from '../lib/cartContext';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { Product, Seller } from '../lib/types';
import { fixImageUrl } from '../lib/imageUtils';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/productUtils';

export function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductAndSeller = async () => {
      if (!id) return;
      try {
        const { data: rawData } = await api.get<any>(`/products/${id}`);

        // Map API response to UI Product type
        const mappedProduct: Product = {
          id: rawData.id,
          name: rawData.name,
          description: rawData.description,
          price: rawData.price,
          category: rawData.categoryName || 'General',
          clearanceLevel: rawData.accessLevel || 'UNRESTRICTED',
          sellerId: rawData.sellerId,
          // Generate specs from dimensions/weight if available
          specs: [
            { label: 'Weight', value: rawData.weight ? `${rawData.weight} kg` : 'N/A' },
            {
              label: 'Dimensions', value: (rawData.length && rawData.width && rawData.height)
                ? `${rawData.length} x ${rawData.width} x ${rawData.height} cm`
                : 'N/A'
            }
          ].filter(s => s.value !== 'N/A'),
          inStock: (rawData.quantity || 0) > 0,
          stockCount: rawData.quantity || 0,
          isNew: false,
          onClearance: rawData.oldPrice != null,
          itemNumber: rawData.id.substring(0, 8).toUpperCase(),
          imageUrl: rawData.previewImageUrl,
          imageUrls: rawData.imageUrls || [],
          rating: rawData.averageRating != null ? rawData.averageRating : (rawData.rating != null ? rawData.rating : 0),
          reviewCount: rawData.reviewCount != null ? rawData.reviewCount : 0
        };

        setProduct(mappedProduct);

        if (mappedProduct.sellerId) {
          try {
            const { data: d } = await api.get<any>(`/users/${mappedProduct.sellerId}/seller-info`);
            const mappedSeller: Seller = {
              id: d.userId,
              name: d.companyName || 'Unknown Seller',
              companyName: d.companyName,
              code: 'SELLER',
              verified: d.isVerified || false,
              rating: d.rating || 0,
              totalSales: d.totalSales || 0,
              location: 'Ukraine',
              logoUrl: d.logoUrl,
              reviewCount: d.reviewCount || 0
            };
            setSeller(mappedSeller);
          } catch (err) {
            console.error('Failed to fetch seller info', err);
          }
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndSeller();
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-slate mb-4">{t('product.itemNotFound')}</p>
          <Link to="/products" className="text-tactical hover:underline">
            {t('product.returnToCatalog')}
          </Link>
        </div>
      </div>);
  }

  // Related products logic (mock or simple fetch)
  // For now, we can omit related products or fetch random recent ones. 
  // Leaving mock logic out.
  const relatedProducts: Product[] = [];
  /* 
  const relatedProducts = products.
    filter((p) => p.category === product.category && p.id !== product.id).
    slice(0, 3);
  */
  const handleAddToCart = () => {
    addItem(product, quantity);
    navigate('/cart');
  };

  const isRestricted = product.clearanceLevel === 'RESTRICTED';
  const canPurchaseRestricted = user?.role === 'MILITARY_UNIT' || user?.role === 'ADMIN';
  const isButtonDisabled = !product.inStock || (isRestricted && !canPurchaseRestricted);

  return (
    <motion.div
      initial={{
        opacity: 0
      }}
      animate={{
        opacity: 1
      }}
      exit={{
        opacity: 0
      }}
      transition={{
        duration: 0.3
      }}
      className="page-wrapper">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-8 flex-wrap">
          <Link
            to="/"
            className="text-gray-500 hover:text-slate transition-colors">
            {t('nav.home')}
          </Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <Link
            to="/products"
            className="text-gray-500 hover:text-slate transition-colors">
            {t('nav.catalog')}
          </Link>
          <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-slate">{product.name}</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden rounded-sm border border-border relative">
              {product.imageUrl ? (
                <img
                  src={fixImageUrl(activeImage || product.imageUrl)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PackageIcon className="w-32 h-32 text-gray-300" />
              )}
            </div>

            {/* Thumbnails */}
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.imageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(url)}
                    className={`aspect-square rounded-sm overflow-hidden border-2 transition-all ${activeImage === url ? 'border-tactical opacity-100 ring-1 ring-tactical' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={fixImageUrl(url)} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            {/* Category */}
            <p className="text-xs font-semibold uppercase tracking-wider text-tactical mb-2">
              {product.category}
            </p>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-slate mb-2">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-500 text-sm">
                {'★'.repeat(Math.round(product.rating || 0))}
                <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
              </div>
              <span className="text-sm font-bold text-slate">{Number(product.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-gray-400 font-mono">({product.reviewCount || 0} reviews)</span>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.isNew && <StampBadge type="NEW" />}
              {product.onClearance && <StampBadge type="CLEARANCE" />}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Price & Stock */}
            <div className="flex items-end justify-between mb-8 pb-6 border-b border-border">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  {t('product.unitPrice')}
                </p>
                <span className="font-mono text-3xl font-bold text-slate">
                  {formatPrice(product.price)}
                </span>
              </div>
              <span
                className={`text-sm font-semibold uppercase ${product.inStock ? 'text-tactical' : 'text-restricted'}`}>

                {product.inStock ? 
                  t('product.unitsInStock', { count: product.stockCount }) : 
                  t('product.outOfStock')}
              </span>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center border border-border rounded-sm">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  disabled={isButtonDisabled}>
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 font-mono font-semibold border-x border-border min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  disabled={isButtonDisabled}>
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1"
                disabled={isButtonDisabled}
                variant={(isRestricted && !canPurchaseRestricted) ? "secondary" : "primary"}
                onClick={handleAddToCart}>
                {isRestricted && !canPurchaseRestricted ? t('product.restrictedMilitaryOnly') : t('product.addToRequisition')}
              </Button>
            </div>

            {/* Characteristics Table */}
            <div className="border-t-2 border-tactical pt-4 mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-tactical mb-4">
                {t('product.characteristics')}
              </h2>
              <table className="w-full spec-table">
                <tbody>
                  {(product.specs || []).map((spec, index) =>
                    <tr key={index} className="border-b border-border">
                      <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 w-1/3">
                        {spec.label}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate">
                        {spec.value}
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {t('product.clearanceLevel')}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate">
                      {product.clearanceLevel}
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Product UUID
                    </td>
                    <td className="py-3 px-4 text-sm text-slate font-mono text-xs">
                      {product.id}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Seller Information */}
            {seller &&
              <div className="border-t-2 border-tactical pt-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-tactical mb-4">
                  {t('seller.sellerInfo')}
                </h2>
                <div className="bg-white border border-border rounded-sm p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                        {seller.logoUrl ? (
                          <img
                            src={fixImageUrl(seller.logoUrl)}
                            alt={seller.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PackageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <Link to={`/shop/${product.sellerId}`} className="hover:underline">
                          <p className="font-bold text-sm uppercase tracking-tight text-slate">
                            {seller.companyName || seller.name}
                          </p>
                        </Link>
                        <p className="text-xs text-gray-500 font-mono">
                          {t('seller.code')} {seller.code}
                        </p>
                      </div>
                    </div>
                    {seller.verified && <StampBadge type="VERIFIED" />}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{t('seller.sellerRating')}</p>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-amber-500" fill="currentColor" />
                        <p className="font-semibold">{Number(seller.rating || 0).toFixed(1)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        {t('seller.productRating')}
                      </p>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-amber-500" fill="currentColor" />
                        <span className="font-semibold">{Number(product.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        {t('seller.totalSales')}
                      </p>
                      <p className="font-semibold">
                        {Number(seller.totalSales || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">
                        {t('seller.storeReviews')}
                      </p>
                      <p className="font-semibold">{seller.reviewCount || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        {/* Product Reviews */}
        <ProductReviews productId={product.id} onReviewsUpdated={fetchProductAndSeller} />

        {/* Related Products */}
        {relatedProducts.length > 0 &&
          <section className="mt-16">
            <div className="border-t-2 border-tactical pt-4 mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-tactical">
                {t('product.relatedEquipment')}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((product, index) =>
                <ProductCard key={product.id} product={product} index={index} />
              )}
            </div>
          </section>
        }
      </div>
    </motion.div>);

}