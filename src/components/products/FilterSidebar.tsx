import { useState, useEffect } from 'react';
import { Checkbox } from '../ui/Checkbox';
import { api } from '../../lib/api';
import { Star, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type CategoryData = { id: number; name: string; subCategories?: CategoryData[] };
export type SellerData = { id: string; companyName: string; logoUrl?: string };
export type ClearanceLevel = 'PUBLIC' | 'RESTRICTED' | 'CLASSIFIED';

type FilterSidebarProps = {
  selectedCategories: CategoryData[];
  onCategoryChange: (categories: CategoryData[]) => void;
  selectedClearance: ClearanceLevel | null;
  onClearanceChange: (level: ClearanceLevel | null) => void;
  inStockOnly: boolean;
  onInStockChange: (value: boolean) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (value: boolean) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  selectedSellerId: string | null;
  onSellerChange: (id: string | null) => void;
  hideSellers?: boolean;
};

const clearanceLevels: ClearanceLevel[] = ['PUBLIC', 'RESTRICTED'];

/** Single collapsible filter section */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate/10 pb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full py-2 text-xs font-bold uppercase tracking-wider text-tactical"
      >
        {title}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  selectedClearance,
  onClearanceChange,
  inStockOnly,
  onInStockChange,
  verifiedOnly,
  onVerifiedChange,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
  selectedSellerId,
  onSellerChange,
  hideSellers = false,
}: FilterSidebarProps) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await api.get('/categories/');
        if (Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }

      try {
        const sellerRes = await api.get('/sellers');
        if (Array.isArray(sellerRes.data)) {
          setSellers(sellerRes.data.map((s: any) => ({
            id: s.userId,
            companyName: s.companyName || 'Unknown Seller',
            logoUrl: s.logoUrl,
          })));
        }
      } catch (err) {
        console.error('Failed to load sellers', err);
      }

      setLoading(false);
    };
    load();
  }, []);

  const handleCategoryToggle = (category: CategoryData) => {
    const isSelected = selectedCategories.some(c => c.id === category.id);
    onCategoryChange(isSelected
      ? selectedCategories.filter(c => c.id !== category.id)
      : [...selectedCategories, category]);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedClearance !== null ||
    inStockOnly ||
    priceRange[0] > 0 ||
    priceRange[1] > 0 ||
    minRating !== null ||
    selectedSellerId !== null;

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate">{t('filter.filters')}</h2>
        {hasActiveFilters && (
          <button
            onClick={() => {
              onCategoryChange([]);
              onClearanceChange(null);
              onInStockChange(false);
              onVerifiedChange(false);
              onPriceChange([0, 0]);
              onRatingChange(null);
              onSellerChange(null);
            }}
            className="text-[10px] font-bold uppercase text-restricted hover:opacity-80 transition-opacity"
          >
            {t('filter.reset')}
          </button>
        )}
      </div>

      <div className="space-y-0 divide-y divide-slate/10 border border-slate/10 rounded-sm overflow-hidden bg-white">

        {/* Sellers — backend list */}
        {!hideSellers && (
          <FilterSection title={t('filter.seller')}>
            {loading ? (
              <div className="text-xs text-gray-400">{t('filter.loading')}</div>
            ) : sellers.length === 0 ? (
              <div className="text-xs text-gray-400">{t('filter.noSellers')}</div>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                {sellers.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSellerChange(selectedSellerId === s.id ? null : s.id)}
                    className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs transition-colors
                      ${selectedSellerId === s.id
                        ? 'bg-slate text-white'
                        : 'hover:bg-slate/5 text-gray-700'}`}
                  >
                    {s.logoUrl && (
                      <img src={s.logoUrl} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                    )}
                    <span className="truncate font-medium">{s.companyName}</span>
                  </button>
                ))}
              </div>
            )}
          </FilterSection>
        )}

        {/* Category */}
        <FilterSection title={t('filter.category')}>
          {loading ? (
            <div className="text-xs text-gray-400">{t('filter.loading')}</div>
          ) : categories.length === 0 ? (
            <div className="text-xs text-gray-400">{t('filter.noCategories')}</div>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {categories.map(cat => (
                <div key={cat.id} className="mb-2">
                  <div className="font-semibold text-slate mb-1">
                    <Checkbox
                      label={cat.name}
                      checked={selectedCategories.some(c => c.id === cat.id)}
                      onChange={() => handleCategoryToggle(cat)}
                    />
                  </div>
                  {cat.subCategories && cat.subCategories.length > 0 && (
                    <div className="ml-5 space-y-1 border-l border-gray-200 pl-2">
                      {cat.subCategories.map((sub: CategoryData) => (
                        <Checkbox
                          key={sub.id}
                          label={sub.name}
                          checked={selectedCategories.some(c => c.id === sub.id)}
                          onChange={() => handleCategoryToggle(sub)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </FilterSection>

        {/* Price */}
        <FilterSection title={t('filter.priceRange')} defaultOpen={false}>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" placeholder="Min"
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded-sm focus:border-tactical outline-none"
              value={priceRange[0] || ''}
              onChange={e => onPriceChange([Number(e.target.value), priceRange[1]])}
            />
            <span className="text-gray-400 flex-shrink-0">—</span>
            <input
              type="number" min="0" placeholder="Max"
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded-sm focus:border-tactical outline-none"
              value={priceRange[1] || ''}
              onChange={e => onPriceChange([priceRange[0], Number(e.target.value)])}
            />
          </div>
        </FilterSection>

        {/* Clearance Level — single-select, backend filter */}
        <FilterSection title={t('filter.clearanceLevel')} defaultOpen={false}>
          <div className="flex flex-col gap-1.5">
            {clearanceLevels.map(level => (
              <button
                key={level}
                onClick={() => onClearanceChange(selectedClearance === level ? null : level)}
                className={`w-full text-left text-xs font-semibold uppercase px-3 py-1.5 rounded-sm border transition-colors
                  ${selectedClearance === level
                    ? 'bg-slate text-white border-slate'
                    : 'border-gray-200 text-gray-600 hover:border-slate/40 hover:bg-slate/5'}`}
              >
                {level}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title={t('filter.minRating')} defaultOpen={false}>
          <div className="space-y-1">
            {[4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => onRatingChange(minRating === star ? null : star)}
                className={`flex items-center gap-2 text-sm w-full hover:bg-slate/5 py-1 px-2 rounded-sm transition-colors ${minRating === star ? 'bg-slate/10 font-bold' : 'text-gray-600'}`}
              >
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500">& Up</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Availability */}
        <FilterSection title={t('filter.availability')} defaultOpen={false}>
          <div className="space-y-2">
            <Checkbox label={t('filter.inStockOnly')} checked={inStockOnly} onChange={onInStockChange} />
            <Checkbox label={t('filter.verifiedSellers')} checked={verifiedOnly} onChange={onVerifiedChange} />
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}