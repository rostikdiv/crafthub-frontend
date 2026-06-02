import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { FilterSidebar, CategoryData, ClearanceLevel } from '../components/products/FilterSidebar';
import { ProductGrid } from '../components/products/ProductGrid';
import { Product } from '../lib/types';
import { api } from '../lib/api';
import { mapApiProduct } from '../lib/productUtils';
import { useTranslation } from 'react-i18next';

type SortOption = { label: string; params: string[] };

const SORT_OPTIONS: SortOption[] = [
  { label: 'sort.newest', params: ['quantity,DESC', 'createdAt,DESC'] },
  { label: 'sort.priceLow', params: ['price,ASC'] },
  { label: 'sort.priceHigh', params: ['price,DESC'] },
  { label: 'sort.topRated', params: ['averageRating,DESC'] },
];

const PAGE_SIZE = 20;

export function ProductListingPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);

  // All filters — sent to backend as query params
  const [selectedCategories, setSelectedCategories] = useState<CategoryData[]>([]);
  const [selectedClearance, setSelectedClearance] = useState<ClearanceLevel | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [sortIndex, setSortIndex] = useState(0);

  // Reset page on filter/sort change
  useEffect(() => { setPage(0); }, [
    selectedCategories, selectedClearance, priceRange, inStockOnly,
    minRating, selectedSellerId, sortIndex, initialSearch
  ]);

  // Fetch products — 100% server-side filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const sortParams = SORT_OPTIONS[sortIndex].params;
        const qs = new URLSearchParams();
        qs.set('page', String(page));
        qs.set('size', String(PAGE_SIZE));
        sortParams.forEach(s => qs.append('sort', s));
        if (initialSearch) qs.set('search', initialSearch);
        if (selectedCategories.length > 0) qs.set('categoryId', String(selectedCategories[0].id));
        if (priceRange[0] > 0) qs.set('minPrice', String(priceRange[0]));
        if (priceRange[1] > 0) qs.set('maxPrice', String(priceRange[1]));
        if (inStockOnly) qs.set('isAvailable', 'true');
        if (minRating !== null) qs.set('minRating', String(minRating));
        if (selectedClearance) qs.set('accessLevel', selectedClearance);
        if (selectedSellerId) qs.set('sellerId', selectedSellerId);

        const { data } = await api.get(`/products?${qs.toString()}`);
        setProducts((data.content || []).map(mapApiProduct));
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, sortIndex, initialSearch, selectedCategories, selectedClearance,
      priceRange, inStockOnly, minRating, selectedSellerId]);

  // Numbered pagination with ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages: (number | '...')[] = [];
    if (page <= 3) {
      pages.push(0, 1, 2, 3, 4, '...', totalPages - 1);
    } else if (page >= totalPages - 4) {
      pages.push(0, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      pages.push(0, '...', page - 1, page, page + 1, '...', totalPages - 1);
    }
    return pages;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-wrapper">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-400 mb-8">
          <Link to="/" className="hover:text-tactical transition-colors">{t('catalog.home')}</Link>
          <ChevronRightIcon className="w-4 h-4 mx-2" />
          <span className="text-slate font-bold">{t('catalog.catalog')}</span>
          {initialSearch && (
            <>
              <ChevronRightIcon className="w-4 h-4 mx-2" />
              <span className="text-tactical">{t('catalog.searchFor', { query: initialSearch })}</span>
            </>
          )}
        </div>

        {/* Header + Sort */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate uppercase tracking-stencil mb-2">
              {t('catalog.title')}
            </h1>
            <p className="text-gray-500 max-w-2xl">{t('catalog.description')}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
              {t('sort.label')}:
            </label>
            <select
              value={sortIndex}
              onChange={e => setSortIndex(Number(e.target.value))}
              className="text-sm border border-border rounded-sm px-3 py-1.5 bg-white text-slate font-medium focus:outline-none focus:border-tactical"
            >
              {SORT_OPTIONS.map((opt, i) => (
                <option key={i} value={i}>{t(opt.label)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          <FilterSidebar
            selectedCategories={selectedCategories}
            onCategoryChange={c => { setSelectedCategories(c); setPage(0); }}
            selectedClearance={selectedClearance}
            onClearanceChange={l => { setSelectedClearance(l); setPage(0); }}
            inStockOnly={inStockOnly}
            onInStockChange={v => { setInStockOnly(v); setPage(0); }}
            verifiedOnly={verifiedOnly}
            onVerifiedChange={setVerifiedOnly}
            priceRange={priceRange}
            onPriceChange={r => { setPriceRange(r); setPage(0); }}
            minRating={minRating}
            onRatingChange={r => { setMinRating(r); setPage(0); }}
            selectedSellerId={selectedSellerId}
            onSellerChange={id => { setSelectedSellerId(id); setPage(0); }}
          />

          <div className="flex-1 min-w-0">
            <ProductGrid
              products={products}
              totalCount={totalElements}
              loading={loading}
            />

            {/* Numbered Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center items-center flex-wrap gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-sm disabled:opacity-40 hover:bg-gray-50 text-sm font-bold uppercase text-slate"
                >
                  {t('catalog.previous')}
                </button>

                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-2 text-gray-400 select-none">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[36px] h-[36px] rounded-sm border text-sm font-bold transition-colors
                        ${page === p ? 'bg-slate text-white border-slate' : 'border-gray-300 text-slate hover:bg-gray-50'}`}
                    >
                      {(p as number) + 1}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-sm disabled:opacity-40 hover:bg-gray-50 text-sm font-bold uppercase text-slate"
                >
                  {t('catalog.next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}