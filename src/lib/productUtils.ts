import { Product } from './types';

/**
 * Maps a raw API product object to the frontend Product type.
 * Centralises the mapping logic to avoid duplication across pages.
 */
export function mapApiProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.categoryName || 'General',
    specs: [],
    inStock: (p.quantity || 0) > 0,
    stockCount: p.quantity || 0,
    isNew: false,
    onClearance: p.oldPrice != null,
    clearanceLevel: p.accessLevel || 'PUBLIC',
    rating: p.averageRating || 0,
    reviewCount: p.reviewCount || 0,
    itemNumber: p.id.substring(0, 8).toUpperCase(),
    sellerId: p.sellerId,
    sellerName: p.sellerName,
    sellerLogoUrl: p.sellerLogoUrl,
    imageUrl: p.previewImageUrl,
    imageUrls: p.imageUrls,
  };
}

/**
 * Formats a number as a Ukrainian Hryvnia price (e.g. 1 500,00 грн).
 */
export function formatPrice(price: number): string {
  return `${Number(price || 0).toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} UAH`;
}
