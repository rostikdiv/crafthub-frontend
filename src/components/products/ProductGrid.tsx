import { Product } from '../../lib/types';
import { ProductCard } from './ProductCard';
import { useTranslation } from 'react-i18next';

type ProductGridProps = {
  products: Product[];
  totalCount: number;
  loading?: boolean;
};

export function ProductGrid({ products, totalCount, loading = false }: ProductGridProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Results Header */}
      <div className="border-b border-border pb-4 mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {t('filter.showing')}{' '}
          <span className="font-semibold text-slate">{products.length}</span>{' '}
          {t('filter.of')}{' '}
          <span className="font-semibold text-slate">{totalCount}</span>{' '}
          {t('filter.items')}
        </p>
        <p className="text-xs font-mono text-gray-500">REF: CATALOG-2026</p>
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) =>
            <ProductCard key={product.id} product={product} />
          )}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-border">
          <p className="text-gray-500 uppercase tracking-wider text-sm">
            {t('filter.noResults')}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t('filter.adjustFilters')}
          </p>
        </div>
      )}
    </div>
  );
}