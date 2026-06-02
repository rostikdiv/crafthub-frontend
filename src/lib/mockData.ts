import { Product, Seller, Category, Review } from './types';

export const categories: Category[] = [
  'Optics',
  'Tactical Gear',
  'Communications',
  'Field Equipment'];


export const sellers: Seller[] = [
  {
    id: 'seller-001',
    name: 'TACTICAL SOLUTIONS INC.',
    code: 'TSI',
    verified: true,
    rating: 4.9,
    totalSales: 12847,
    location: 'Fort Worth, TX'
  },
  {
    id: 'seller-002',
    name: 'NIGHTHAWK OPTICS',
    code: 'NHO',
    verified: true,
    rating: 4.8,
    totalSales: 8234,
    location: 'Colorado Springs, CO'
  },
  {
    id: 'seller-003',
    name: 'FIELD COMMAND SUPPLY',
    code: 'FCS',
    verified: false,
    rating: 4.5,
    totalSales: 3421,
    location: 'San Diego, CA'
  }];

export const mockReviews: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-001',
    userId: 'user-001',
    userName: 'Sgt. Miller',
    rating: 5,
    comment: 'Excellent clarity. Holds zero perfectly after 500 rounds. Highly recommend for designated marksman roles.',
    isVerifiedPurchase: true,
    date: '2025-11-15'
  },
  {
    id: 'rev-002',
    productId: 'prod-001',
    userId: 'user-002',
    userName: 'Rangemaster',
    rating: 4,
    comment: 'Good glass for the price. Turrets are a bit mushy but track true.',
    isVerifiedPurchase: true,
    date: '2025-12-02'
  }
];


export const products: Product[] = [
  {
    id: 'prod-001',
    itemNumber: 'CH-OPT-001',
    name: 'VORTEX TACTICAL SCOPE 4-16X50',
    description:
      'Precision rifle scope with illuminated reticle and zero-stop turrets. Designed for long-range engagements in varied lighting conditions.',
    price: 1249.99,
    category: 'Optics',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-002',
    specs: [
      { label: 'Magnification', value: '4-16x' },
      { label: 'Objective Lens', value: '50mm' },
      { label: 'Tube Diameter', value: '30mm' },
      { label: 'Weight', value: '23.6 oz' },
      { label: 'Length', value: '14.4 in' },
      { label: 'Eye Relief', value: '4.0 in' }],

    inStock: true,
    stockCount: 24,
    isNew: false,
    onClearance: false
  },
  {
    id: 'prod-002',
    itemNumber: 'CH-TG-002',
    name: 'PLATE CARRIER SYSTEM MK IV',
    description:
      'Modular plate carrier with MOLLE webbing. Accepts Level III and IV plates. Quick-release system for emergency doffing.',
    price: 389.0,
    category: 'Tactical Gear',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-001',
    specs: [
      { label: 'Material', value: '1000D Cordura' },
      { label: 'Plate Size', value: '10x12 in' },
      { label: 'Weight (empty)', value: '4.2 lbs' },
      { label: 'Color', value: 'Ranger Green' },
      { label: 'Size Range', value: 'S-XL' },
      { label: 'Origin', value: 'USA' }],

    inStock: true,
    stockCount: 156,
    isNew: true,
    onClearance: false
  },
  {
    id: 'prod-003',
    itemNumber: 'CH-COM-003',
    name: 'HARRIS AN/PRC-152A RADIO',
    description:
      'Multi-band handheld radio with encryption capability. SINCGARS and HAVEQUICK compatible. Requires clearance verification.',
    price: 4899.0,
    category: 'Communications',
    clearanceLevel: 'RESTRICTED',
    sellerId: 'seller-001',
    specs: [
      { label: 'Frequency Range', value: '30-512 MHz' },
      { label: 'Channels', value: '99 Programmable' },
      { label: 'Encryption', value: 'Type 1 / AES-256' },
      { label: 'Battery Life', value: '12+ hours' },
      { label: 'Weight', value: '2.6 lbs' },
      { label: 'Clearance', value: 'SECRET' }],

    inStock: true,
    stockCount: 8,
    isNew: false,
    onClearance: false
  },
  {
    id: 'prod-004',
    itemNumber: 'CH-FE-004',
    name: 'EXPEDITION BIVOUAC SYSTEM',
    description:
      'All-weather shelter system with integrated ground sheet. Rapid deployment in under 60 seconds. Rated to -20°F.',
    price: 549.0,
    category: 'Field Equipment',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-003',
    specs: [
      { label: 'Capacity', value: '1 Person' },
      { label: 'Packed Weight', value: '3.8 lbs' },
      { label: 'Dimensions', value: '84x32x18 in' },
      { label: 'Material', value: 'Ripstop Nylon' },
      { label: 'Temp Rating', value: '-20°F' },
      { label: 'Setup Time', value: '<60 sec' }],

    inStock: true,
    stockCount: 67,
    isNew: false,
    onClearance: true
  },
  {
    id: 'prod-005',
    itemNumber: 'CH-OPT-005',
    name: 'PVS-14 NIGHT VISION MONOCULAR',
    description:
      'Gen 3 image intensifier tube with auto-gating. Helmet and weapon mountable. Export controlled item.',
    price: 3299.0,
    category: 'Optics',
    clearanceLevel: 'RESTRICTED',
    sellerId: 'seller-002',
    specs: [
      { label: 'Generation', value: 'Gen 3 AG' },
      { label: 'Resolution', value: '64-72 lp/mm' },
      { label: 'Magnification', value: '1x' },
      { label: 'FOV', value: '40°' },
      { label: 'Weight', value: '0.77 lbs' },
      { label: 'Battery', value: 'AA (1x)' }],

    inStock: true,
    stockCount: 12,
    isNew: false,
    onClearance: false
  },
  {
    id: 'prod-006',
    itemNumber: 'CH-TG-006',
    name: 'TACTICAL ASSAULT GLOVES',
    description:
      'Hard knuckle protection with touchscreen-compatible fingertips. Reinforced palm for rope work.',
    price: 79.99,
    category: 'Tactical Gear',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-001',
    specs: [
      { label: 'Material', value: 'Goatskin Leather' },
      { label: 'Protection', value: 'Carbon Fiber' },
      { label: 'Touchscreen', value: 'Compatible' },
      { label: 'Sizes', value: 'S-XXL' },
      { label: 'Color', value: 'Black/Coyote' },
      { label: 'Origin', value: 'USA' }],

    inStock: true,
    stockCount: 234,
    isNew: true,
    onClearance: false
  },
  {
    id: 'prod-007',
    itemNumber: 'CH-COM-007',
    name: 'PELTOR COMTAC VII HEADSET',
    description:
      'Electronic hearing protection with active noise cancellation. PTT compatible with all major radio systems.',
    price: 899.0,
    category: 'Communications',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-002',
    specs: [
      { label: 'NRR', value: '23 dB' },
      { label: 'Battery', value: 'AAA (2x)' },
      { label: 'Battery Life', value: '600+ hours' },
      { label: 'Weight', value: '12.3 oz' },
      { label: 'Connector', value: 'NATO U-174' },
      { label: 'Color', value: 'Foliage Green' }],

    inStock: false,
    stockCount: 0,
    isNew: false,
    onClearance: false
  },
  {
    id: 'prod-008',
    itemNumber: 'CH-FE-008',
    name: 'TACTICAL HYDRATION PACK 3L',
    description:
      'Low-profile hydration carrier with insulated tube. MOLLE compatible with admin pouch.',
    price: 149.0,
    category: 'Field Equipment',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-003',
    specs: [
      { label: 'Capacity', value: '3.0 L' },
      { label: 'Material', value: '500D Cordura' },
      { label: 'Bladder', value: 'BPA-Free TPU' },
      { label: 'Weight (empty)', value: '1.2 lbs' },
      { label: 'Dimensions', value: '17x9x3 in' },
      { label: 'Color', value: 'Multicam' }],

    inStock: true,
    stockCount: 89,
    isNew: false,
    onClearance: true
  },
  {
    id: 'prod-009',
    itemNumber: 'CH-OPT-009',
    name: 'EOTECH EXPS3-0 HOLOGRAPHIC',
    description:
      'Holographic weapon sight with NV compatibility. Submersible to 33ft. Includes quick-detach mount.',
    price: 729.0,
    category: 'Optics',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-002',
    specs: [
      { label: 'Reticle', value: '68 MOA Ring / 1 MOA Dot' },
      { label: 'Battery', value: 'CR123A (1x)' },
      { label: 'Battery Life', value: '600 hours' },
      { label: 'Weight', value: '11.2 oz' },
      { label: 'Waterproof', value: '33 ft / 10m' },
      { label: 'Mount', value: 'QD Lever' }],

    inStock: true,
    stockCount: 45,
    isNew: false,
    onClearance: false
  },
  {
    id: 'prod-010',
    itemNumber: 'CH-TG-010',
    name: 'CRYE PRECISION COMBAT PANTS G4',
    description:
      'Combat uniform pants with integrated knee pad pockets. VTX ripstop construction.',
    price: 329.0,
    category: 'Tactical Gear',
    clearanceLevel: 'PUBLIC',
    sellerId: 'seller-001',
    specs: [
      { label: 'Material', value: 'VTX Ripstop' },
      { label: 'Knee Pads', value: 'Airflex (included)' },
      { label: 'Waist Sizes', value: '28-42' },
      { label: 'Inseam', value: 'S/R/L' },
      { label: 'Color', value: 'Multicam' },
      { label: 'Origin', value: 'USA' }],

    inStock: true,
    stockCount: 78,
    isNew: false,
    onClearance: false
  }];


export function getSellerById(id: string): Seller | undefined {
  return sellers.find((s) => s.id === id);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsBySeller(sellerId: string): Product[] {
  return products.filter((p) => p.sellerId === sellerId);
}

export function getProductsByCategory(category: Category): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.slice(0, 4);
}