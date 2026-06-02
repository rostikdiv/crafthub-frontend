import { Link } from 'react-router-dom';
import {
  PackageIcon,
  PencilIcon,
  TrashIcon,
} from 'lucide-react';
import { SellerProduct } from '../../pages/SellerStudioPage';
import { fixImageUrl } from '../../lib/imageUtils';

const accessLevelStyles: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-800 border-green-200',
  RESTRICTED: 'bg-amber-100 text-amber-800 border-amber-200',
  CLASSIFIED: 'bg-red-100 text-red-800 border-red-200'
};

interface ProductTableProps {
  products: SellerProduct[];
  loading: boolean;
  onEdit: (product: SellerProduct) => void;
  onDelete: (product: SellerProduct) => void;
}

export function ProductTable({ products, loading, onEdit, onDelete }: ProductTableProps) {

  return (
    <div className="bg-white border border-border rounded-sm overflow-hidden min-h-[300px] overflow-x-auto">
      <div className="min-w-[800px]">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-cream/50 border-b border-border text-xs font-bold uppercase tracking-wider text-gray-500">
        <div className="col-span-5">Product Details</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-center">Stock</div>
        <div className="col-span-2 text-center">Access Level</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tactical" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <PackageIcon className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No inventory found.</p>
        </div>
      ) : (
        /* Table Body */
        <div className="divide-y divide-border">
          {products.map((product) =>
            <div
              key={product.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors group">

              {/* Product Details */}
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-sm flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={fixImageUrl(product.imageUrl)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PackageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <Link to={`/products/${product.id}`} className="font-bold text-sm uppercase tracking-tight text-slate line-clamp-1 hover:text-tactical hover:underline">
                    {product.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{product.itemNumber}</span>
                    <span>•</span>
                    <span>{product.category}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-2 text-right font-mono font-semibold text-slate">
                $
                {product.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2
                })}
              </div>

              {/* Stock */}
              <div className="col-span-2 text-center">
                <span
                  className={`font-mono font-semibold ${product.stock === 0 ? 'text-restricted' : 'text-slate'}`}>

                  {product.stock}
                </span>
              </div>

              {/* Access Level (Status) */}
              <div className="col-span-2 text-center">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-sm ${accessLevelStyles[product.accessLevel] || 'bg-gray-100'}`}>
                  {product.accessLevel}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end gap-2 transition-opacity">
                <button
                  onClick={() => onEdit(product)}
                  className="p-1.5 text-gray-500 hover:text-tactical hover:bg-green-50 rounded-sm transition-colors"
                  title="Edit Product"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(product)}
                  className="p-1.5 text-gray-500 hover:text-restricted hover:bg-red-50 rounded-sm transition-colors"
                  title="Delete Product"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && products.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <span>Showing {products.length} products</span>
          <div className="flex gap-2">
            <button className="hover:text-slate disabled:opacity-50" disabled>
              PREVIOUS
            </button>
            <span>|</span>
            <button className="hover:text-slate" disabled>NEXT</button>
          </div>
        </div>
      )}
      </div>
    </div>);
}