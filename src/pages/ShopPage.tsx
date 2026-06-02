import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ShoppingBagIcon,
    MapPinIcon,
    StarIcon,
    ShieldCheckIcon,
    PackageIcon,
    SearchIcon,
    FilterIcon
} from 'lucide-react';
import { api } from '../lib/api';
import { Product, Seller } from '../lib/types';
import { fixImageUrl } from '../lib/imageUtils';
import { mapApiProduct } from '../lib/productUtils';
import { Button } from '../components/ui/Button';
import { ProductCard } from '../components/products/ProductCard';
import { WriteReviewModal } from '../components/WriteReviewModal';
import { FilterSidebar, CategoryData, ClearanceLevel } from '../components/products/FilterSidebar';
import { useTranslation } from 'react-i18next';

type SortOption = { label: string; params: string[] };

const SORT_OPTIONS: SortOption[] = [
  { label: 'sort.newest', params: ['quantity,DESC', 'createdAt,DESC'] },
  { label: 'sort.priceLow', params: ['price,ASC'] },
  { label: 'sort.priceHigh', params: ['price,DESC'] },
  { label: 'sort.topRated', params: ['averageRating,DESC'] },
];

export function ShopPage() {
    const { t } = useTranslation();
    const { sellerId } = useParams<{ sellerId: string }>();
    const [seller, setSeller] = useState<Seller | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const PAGE_SIZE = 12;

    const [selectedCategories, setSelectedCategories] = useState<CategoryData[]>([]);
    const [selectedClearance, setSelectedClearance] = useState<ClearanceLevel | null>(null);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
    const [minRating, setMinRating] = useState<number | null>(null);
    const [sortIndex, setSortIndex] = useState(0);

    // Reset page on filter/sort change
    useEffect(() => { setPage(0); }, [
      selectedCategories, selectedClearance, priceRange, inStockOnly,
      minRating, sortIndex, searchQuery
    ]);

    const fetchData = async () => {
        if (!sellerId) return;

        setLoading(true);
        try {
            // 1. Fetch Seller Info
            const { data: d } = await api.get<any>(`/users/${sellerId}/seller-info`);
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

            // 2. Fetch Seller Products
            const sortParams = SORT_OPTIONS[sortIndex].params;
            const qs = new URLSearchParams();
            qs.set('sellerId', sellerId);
            qs.set('page', String(page));
            qs.set('size', String(PAGE_SIZE));
            sortParams.forEach(s => qs.append('sort', s));
            if (searchQuery) qs.set('search', searchQuery);
            if (selectedCategories.length > 0) qs.set('categoryId', String(selectedCategories[0].id));
            if (priceRange[0] > 0) qs.set('minPrice', String(priceRange[0]));
            if (priceRange[1] > 0) qs.set('maxPrice', String(priceRange[1]));
            if (inStockOnly) qs.set('isAvailable', 'true');
            if (minRating !== null) qs.set('minRating', String(minRating));
            if (selectedClearance) qs.set('accessLevel', selectedClearance);

            const { data: productData } = await api.get<{ content: any[], totalPages: number, totalElements: number }>(`/products?${qs.toString()}`);

            setProducts((productData.content || []).map(mapApiProduct));
            setTotalPages(productData.totalPages || 0);
            setTotalElements(productData.totalElements || 0);

            // 3. Fetch Reviews
            try {
                const { data: reviewsData } = await api.get(`/seller-reviews/seller/${sellerId}`);
                setReviews(reviewsData.content);
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            }

        } catch (error) {
            console.error('Failed to load shop data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [sellerId, page, sortIndex, selectedCategories, selectedClearance, priceRange, inStockOnly, minRating, searchQuery]);

    if (loading) {
        return (
            <div className="page-wrapper flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tactical" />
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="page-wrapper flex flex-col items-center justify-center gap-4">
                <ShoppingBagIcon className="w-16 h-16 text-gray-300" />
                <h2 className="text-xl font-bold text-slate">{t('shop.shopNotFound')}</h2>
                <Link to="/products">
                    <Button variant="outline">{t('shop.browseAllProducts')}</Button>
                </Link>
            </div>
        );
    }

    // Pagination helper
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
        <div className="page-wrapper">
            {/* Seller Header / Banner */}
            <div className="bg-slate text-white pb-12 pt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Logo */}
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-xl shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                                {seller.logoUrl ? (
                                    <img
                                        src={fixImageUrl(seller.logoUrl)}
                                        alt={seller.companyName || seller.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <PackageIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                                <h1 className="text-3xl font-black uppercase tracking-tight">{seller.companyName || seller.name}</h1>
                                {seller.verified && (
                                    <span className="bg-tactical text-white text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                                        <ShieldCheckIcon className="w-3 h-3" />
                                        {t('seller.verifiedSeller')}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-300 mb-4">
                                {seller.location && (
                                    <div className="flex items-center gap-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        <span>{seller.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <StarIcon className="w-4 h-4 text-amber-500" fill="currentColor" />
                                    <span className="text-white font-bold">{Number(seller.rating || 0).toFixed(1)}</span>
                                    <span className="opacity-60">{t('seller.avgRating')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-white font-bold">{seller.reviewCount || 0}</span>
                                    <span className="opacity-60">{t('seller.reviews')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <ShoppingBagIcon className="w-4 h-4" />
                                    <span className="text-white font-bold">{Number(seller.totalSales || 0).toLocaleString()}</span>
                                    <span className="opacity-60">{t('seller.sales')}</span>
                                </div>
                            </div>

                            <p className="max-w-2xl text-gray-300 text-sm leading-relaxed">
                                {t('shop.officialStore', { name: seller.companyName || seller.name })}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button size="sm" variant="outline" className="border-gray-500 text-gray-300 hover:text-white hover:border-white">
                                {t('shop.contactSeller')}
                            </Button>
                            <Button size="sm" onClick={() => setIsReviewModalOpen(true)}>
                                {t('shop.writeReview')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Filters */}
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
                        selectedSellerId={sellerId || null}
                        onSellerChange={() => {}} // Disabled seller change since we are on shop page
                        hideSellers={true}
                    />

                    {/* Reviews */}
                    <div className="space-y-6 pt-6 border-t border-gray-200">
                        <h3 className="font-bold text-slate uppercase tracking-wider border-b border-gray-200 pb-2">
                            {t('shop.sellerReviews', { count: reviews.length })}
                        </h3>
                        <div className="space-y-4">
                            {reviews.length > 0 ? reviews.map((review) => (
                                <div key={review.id} className="bg-white p-4 rounded-sm border border-border shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex text-amber-500 text-xs">
                                            {'★'.repeat(review.rating)}
                                            <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(review.createdAt))}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">- {review.reviewerName || 'Anonymous'}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500">{t('shop.noReviewsYet')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content - Products */}
                <div className="lg:col-span-3">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-xl font-bold text-slate uppercase tracking-wider flex items-center gap-2">
                            {t('shop.allProducts')}
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">{totalElements}</span>
                        </h2>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('shop.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-border rounded-sm text-sm focus:outline-none focus:border-tactical"
                                />
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
                    </div>

                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50 rounded-sm border-dashed border-2 border-gray-200">
                            <PackageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">{t('shop.noProductsFound')}</p>
                        </div>
                    )}

                    {/* Pagination */}
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

            {sellerId && (
                <WriteReviewModal
                    sellerId={sellerId}
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    onSuccess={() => {
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
