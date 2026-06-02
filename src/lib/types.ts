export type Role = 'BUYER' | 'SELLER' | 'ADMIN' | 'MILITARY_UNIT';
export type DocumentType = 'PASSPORT' | 'MILITARY_ID' | 'DRIVER_LICENSE';

export interface SavedAddress {
  id: string;
  title: string;
  provider: DeliveryProvider;
  deliveryType: DeliveryType;
  cityRef?: string;
  cityName?: string;
  region?: string;
  branchRef?: string;
  branchName?: string;
  streetName?: string;
  building?: string;
  apartment?: string;
  zipCode?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: Role;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Frontend specific or expanded fields
  documentType?: DocumentType | null;
  militaryProfile?: {
    id: string;
    unitNumber: string;
    edrpou: string;
    commanderName: string;
    officialAddress: string;
  };
  sellerProfile?: {
    id: string;
    companyName: string;
    description: string;
    logoUrl?: string;
    taxId: string;
    rating?: number;
    reviewCount?: number;
  };
}

export type LoginCredentials = {
  email: string;
  password?: string;
};

export type RegisterCredentials = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: Role;
};

export type ClearanceLevel = 'PUBLIC' | 'RESTRICTED' | 'CLASSIFIED';

export type Category =
  'Optics' |
  'Tactical Gear' |
  'Communications' |
  'Field Equipment';

export type BadgeType = 'VERIFIED' | 'RESTRICTED' | 'NEW' | 'CLEARANCE';

export type Seller = {
  id: string;
  name: string;
  code: string;
  verified: boolean;
  rating: number;
  totalSales: number;
  location: string;
  logoUrl?: string;
  companyName?: string; // Mapped from backend SellerInfoDTO
  reviewCount?: number;
  pickupPoints?: SellerPoint[];
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  itemNumber: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  clearanceLevel: ClearanceLevel;
  sellerId: string;
  sellerName?: string;
  sellerLogoUrl?: string;
  specs: ProductSpec[];
  inStock: boolean;
  stockCount: number;
  isNew: boolean;
  onClearance: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type FilterState = {
  categories: Category[];
  priceRange: [number, number];
  clearanceLevels: ClearanceLevel[];
  inStockOnly: boolean;
  verifiedSellersOnly: boolean;
};

export type CheckoutFormData = {
  // Shipping
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Payment
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
};

export type VerificationStatus =
  'PENDING' |
  'VERIFIED' |
  'REJECTED';

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  date: string;
  replies?: Review[];
  parentId?: string;
};

// --- Delivery & Payment Types ---

export type DeliveryProvider = 'NOVA_POSHTA' | 'UKRPOSHTA' | 'SELLER';
export type DeliveryType = 'BRANCH' | 'COURIER' | 'SELF_PICKUP';
export type PaymentMethod = 'CARD' | 'COD';

export interface SellerPoint {
  id: string;
  name: string;
  cityRef: string;
  cityName: string;
  region: string;
  streetName: string;
  building: string;
  apartment?: string;
  zipCode?: string;
  phone?: string;
  instructions?: string;
}

export interface Branch {
  id: string;
  locationId: string;
  externalId: string;
  branchNumber: string;
  name: string;
}

export interface City {
  id: string;
  provider: DeliveryProvider;
  externalId: string;
  name: string;
  region: string;
}

export interface DeliveryDetails {
  provider: DeliveryProvider;
  type: DeliveryType;
  cityRef?: string;
  cityName?: string;
  region?: string;
  branchRef?: string;
  branchName?: string;
  street?: string;
  building?: string;
  apartment?: string;
  zipCode?: string;
  sellerPointId?: string;
  pickupAddress?: string;
  pickupInstructions?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  deliveryDetails: DeliveryDetails;
  paymentMethod: PaymentMethod;
}

export type OrderStatus =
  'CREATED' | 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' |
  'PAID' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' |
  'SHIPPED' | 'DELIVERED' |
  'PAYMENT_FAILED' | 'CANCELLED' | 'REFUNDING' | 'REFUNDED' |
  'RETURN_REQUESTED' | 'RETURN_APPROVED' | 'RETURN_REJECTED';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  pricePerUnit: number;
}

export interface Order {
  id: string;
  userId: string;
  sellerId: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  deliveryInfo: DeliveryDetails;
  paymentMethod: PaymentMethod;
  createdAt: string;
}