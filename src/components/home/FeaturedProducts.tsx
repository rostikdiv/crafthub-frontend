import { useState, useEffect } from 'react';
import { Product } from '../../lib/types';
import { api } from '../../lib/api';
import { mapApiProduct } from '../../lib/productUtils';
import { ProductCard } from '../products/ProductCard';
import { useTranslation } from 'react-i18next';

export function FeaturedProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Only show in-stock products on the home page
        const { data } = await api.get('/products?page=0&size=4&isAvailable=true');
        setProducts((data.content || []).map(mapApiProduct));
      } catch (error) {
        console.error('Failed to fetch featured products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="border-t-2 border-tactical pt-4 mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-tactical">
            {t('home.featured.sectionTitle')}
          </h2>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}