import { Link } from 'react-router-dom';
import { PackageIcon } from 'lucide-react';
import { Product } from '../../lib/types';
import { getSellerById } from '../../lib/mockData';
import { fixImageUrl } from '../../lib/imageUtils';
import { Button } from '../ui/Button';
import { StampBadge } from '../ui/StampBadge';
import { useCart } from '../../lib/cartContext';
import { useAuth } from '../../lib/authContext';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../lib/productUtils';

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const seller = getSellerById(product.sellerId);
  const { addItem } = useCart();
  const { user } = useAuth();
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  const isRestricted = product.clearanceLevel === 'RESTRICTED';
  const canPurchaseRestricted = user?.role === 'MILITARY_UNIT' || user?.role === 'ADMIN';
  const isButtonDisabled = !product.inStock || (isRestricted && !canPurchaseRestricted);

  return (
    <div className={`h-full ${!product.inStock ? 'opacity-60' : ''}`}>

      <Link to={`/products/${product.id}`} className="block group">
        <article className="bg-white border border-border rounded-sm overflow-hidden transition-colors duration-150 group-hover:border-slate">
          {/* Header with Item Number */}
          <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-cream/50">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-tactical">
              {product.category}
            </span>
            <div className="flex items-center gap-2">
              {product.isNew && <StampBadge type="NEW" />}
              {product.onClearance && <StampBadge type="CLEARANCE" />}
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={fixImageUrl(product.imageUrl)}
                alt={product.name}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!product.inStock ? 'grayscale' : ''}`}
              />
            ) : (
              <PackageIcon className="w-16 h-16 text-gray-300" />
            )}

            {/* Stamps Overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              {!product.inStock && (
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-gray-800 text-white rounded-sm">
                  SOLD OUT
                </span>
              )}
              {product.clearanceLevel === 'RESTRICTED' &&
                <StampBadge type="RESTRICTED" />
              }
              {seller?.verified && <StampBadge type="VERIFIED" />}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-tactical mb-1">
              {product.category}
            </p>

            {/* Name */}
            <h3 className="font-bold text-sm uppercase tracking-tight text-slate mb-2 line-clamp-2">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              <div className="flex text-amber-500 text-xs">
                {'★'.repeat(Math.round(product.rating || 0))}
                <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.rating || 0))}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                ({product.reviewCount || 0})
              </span>
            </div>

            {/* Specs Preview */}
            <div className="space-y-1 mb-4">
              {/* Specs Preview */}
              <div className="space-y-1 mb-4">
                {(() => {
                  if (!product.specs) {
                    console.warn('Product specs missing:', product);
                    return null;
                  }
                  return product.specs.slice(0, 3).map((spec, i) => (
                    <p key={i} className="text-xs text-gray-500">
                      <span className="font-medium">{spec.label}:</span>{' '}
                      {spec.value}
                    </p>
                  ));
                })()}
              </div>
            </div>

            {/* Price & Stock */}
            <div className="flex items-end justify-between mb-4">
              <span className="font-mono text-lg font-bold text-slate">
                {formatPrice(product.price)}
              </span>
              <span
                className={`text-xs font-semibold uppercase ${product.inStock ? 'text-tactical' : 'text-restricted'}`}>

                {product.inStock ?
                  `${product.stockCount} ${t('product.inStock')}` :
                  t('product.outOfStock')}
              </span>
            </div>

            {/* Add to Cart Button */}
            <Button
              fullWidth
              size="sm"
              disabled={isButtonDisabled}
              variant={(isRestricted && !canPurchaseRestricted) ? "secondary" : "primary"}
              onClick={handleAddToCart}>
              {isRestricted && !canPurchaseRestricted ? t('product.restrictedMilitary') : t('product.addToRequisition')}
            </Button>
          </div>
        </article>
      </Link>
    </div>);

}