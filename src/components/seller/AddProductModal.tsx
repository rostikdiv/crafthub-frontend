import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, UploadCloudIcon, CheckIcon, ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { SellerProduct } from '../../pages/SellerStudioPage';
import { fixImageUrl } from '../../lib/imageUtils';

type ClearanceLevel = 'PUBLIC' | 'RESTRICTED' | 'CLASSIFIED';

type AddProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: SellerProduct | null;
  onRefresh: () => void;
};

type BackendCategory = {
  id: number;
  name: string;
  description?: string;
};

const clearanceLevels: {
  id: ClearanceLevel;
  label: string;
  color: string;
}[] = [
    {
      id: 'PUBLIC',
      label: 'Public',
      color: 'bg-green-100 text-green-800 border-green-200'
    },
    {
      id: 'RESTRICTED',
      label: 'RESTRICTED',
      color: 'bg-amber-100 text-amber-800 border-amber-200'
    }
  ];

export function AddProductModal({ isOpen, onClose, productToEdit, onRefresh }: AddProductModalProps) {
  const { success, error: showError } = useToast();

  // States
  const [selectedLevel, setSelectedLevel] = useState<ClearanceLevel>('PUBLIC');
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '', // ID as string for select
    description: '',
    price: '',
    quantity: '',
    accessLevel: 'PUBLIC',
    weight: '',
    length: '',
    width: '',
    height: '',
    previewImageUrl: '',
    imageUrls: [] as string[]
  });

  const isEditMode = !!productToEdit;

  // Fetch Categories
  useEffect(() => {
    if (!isOpen) return;
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories/');
        setCategories(data);
        // Set default category if creating new
        if (!productToEdit && data.length > 0) {
          setFormData(prev => ({ ...prev, categoryId: data[0].id.toString() }));
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
        showError('Failed to load categories');
      }
    };
    fetchCategories();
  }, [isOpen]);

  // Initialize form when productToEdit changes
  useEffect(() => {
    if (productToEdit && isOpen) {
      const fetchFullDetails = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/products/${productToEdit.id}`);
          setFormData({
            name: data.name || '',
            categoryId: categories.find(c => c.name === data.categoryName)?.id?.toString() || (categories.length > 0 ? categories[0].id.toString() : ''),
            description: data.description || '',
            price: data.price?.toString() || '',
            quantity: data.quantity?.toString() || '',
            accessLevel: data.accessLevel || 'PUBLIC',
            weight: data.weight?.toString() || '',
            length: data.length?.toString() || '',
            width: data.width?.toString() || '',
            height: data.height?.toString() || '',
            previewImageUrl: data.previewImageUrl || '',
            imageUrls: data.imageUrls || []
          });
          setSelectedLevel((data.accessLevel as ClearanceLevel) || 'PUBLIC');
        } catch (err) {
          console.error("Failed to fetch full product details", err);
          // Fallback to table data
          setFormData(prev => ({
            ...prev,
            name: productToEdit.name,
            price: productToEdit.price.toString(),
            quantity: productToEdit.stock.toString(),
          }));
          setSelectedLevel((productToEdit.accessLevel as ClearanceLevel) || 'PUBLIC');
        } finally {
          setLoading(false);
        }
      }
      fetchFullDetails();
    } else if (!productToEdit && isOpen) {
      // Reset form for create mode
      setFormData({
        name: '',
        categoryId: categories.length > 0 ? categories[0].id.toString() : '',
        description: '',
        price: '',
        quantity: '',
        accessLevel: 'PUBLIC',
        weight: '',
        length: '',
        width: '',
        height: '',
        previewImageUrl: '',
        imageUrls: []
      });
      setSelectedLevel('PUBLIC');
    }
  }, [productToEdit, isOpen, categories]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => {
      const newImageUrls = prev.imageUrls.filter((_, index) => index !== indexToRemove);
      // Update preview image if we removed the current one
      let newPreview = prev.previewImageUrl;
      if (newImageUrls.length > 0) {
        if (prev.imageUrls[indexToRemove] === prev.previewImageUrl) {
          newPreview = newImageUrls[newImageUrls.length - 1] || '';
        }
      } else {
        newPreview = '';
      }

      return {
        ...prev,
        imageUrls: newImageUrls,
        previewImageUrl: newPreview
      };
    });
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const { data } = await api.post('/products/images', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.url) {
        // Fix for Docker environment
        const fixedUrl = fixImageUrl(data.url);

        setFormData(prev => ({
          ...prev,
          previewImageUrl: fixedUrl,
          imageUrls: [...prev.imageUrls, fixedUrl]
        }));
        success('Image uploaded successfully');
      }
    } catch (err) {
      console.error("Image upload failed", err);
      showError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    } else if (e.type === 'drop') {
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate inputs
      if (!formData.name || !formData.price || !formData.categoryId) {
        showError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Construct payload
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        categoryId: parseInt(formData.categoryId),
        accessLevel: selectedLevel,
        weight: parseFloat(formData.weight) || 0,
        length: parseFloat(formData.length) || 0,
        width: parseFloat(formData.width) || 0,
        height: parseFloat(formData.height) || 0,
        previewImageUrl: formData.previewImageUrl,
        imageUrls: formData.imageUrls.length > 0 ? formData.imageUrls : [formData.previewImageUrl].filter(Boolean)
      };

      if (isEditMode && productToEdit) {
        await api.put(`/products/${productToEdit.id}`, payload);
        success('Product updated successfully.');
      } else {
        await api.post('/products/', payload);
        success('Product added successfully.');
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to save product', error);
      showError(isEditMode ? 'Failed to update product.' : 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm shadow-2xl border-2 border-slate"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {isEditMode ? 'Update product details' : 'Create a new listing in your inventory'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Images */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2 mb-4">
                  Product Imagery
                </h3>

                {/* Preview Area */}
                <div className="aspect-square bg-gray-100 rounded-sm border border-border overflow-hidden flex items-center justify-center relative group">
                  {formData.previewImageUrl ? (
                    <img src={fixImageUrl(formData.previewImageUrl)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                    </div>
                  )}
                </div>

                {/* Image List (Gallery) */}
                {formData.imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square border border-border rounded-sm overflow-hidden group">
                        <img src={fixImageUrl(url)} alt={`Product ${index}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <div
                  className={`
                    border-2 border-dashed rounded-sm p-4 text-center transition-colors cursor-pointer
                    ${dragActive ? 'border-tactical bg-green-50' : 'border-gray-300 hover:border-gray-400'}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrag}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                  <UploadCloudIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate">
                    {uploading ? 'Uploading...' : 'Click or Drag to Upload'}
                  </p>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Basic Info */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2 mb-4">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Product Name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
                      placeholder="e.g. MacBook Pro 16 M3 Max"
                      required
                    />

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate">
                        Category
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => handleChange('categoryId', e.target.value)}
                        className="w-full px-3 py-2.5 bg-white border border-border rounded-sm text-sm text-slate focus:outline-none focus:border-tactical"
                        required
                      >
                        <option value="" disabled>Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-border rounded-sm text-sm text-slate placeholder:text-gray-400 focus:outline-none focus:border-tactical resize-none shadow-inner"
                      placeholder="Detailed product description..."
                    />
                  </div>
                </section>

                {/* Inventory & Pricing */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2 mb-4">
                    Inventory & Pricing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Price (UAH)"
                      type="number"
                      value={formData.price}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('price', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    <Input
                      label="Quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('quantity', e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                </section>

                {/* Specifications */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2 mb-4">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      value={formData.weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('weight', e.target.value)}
                      placeholder="0.0"
                    />
                    <Input
                      label="Length (cm)"
                      type="number"
                      value={formData.length}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('length', e.target.value)}
                      placeholder="0.0"
                    />
                    <Input
                      label="Width (cm)"
                      type="number"
                      value={formData.width}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('width', e.target.value)}
                      placeholder="0.0"
                    />
                    <Input
                      label="Height (cm)"
                      type="number"
                      value={formData.height}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('height', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                </section>

                {/* Access Level */}
                <section className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-tactical border-b border-tactical pb-2 mb-4">
                    Access Level
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {clearanceLevels.map((level) => (
                      <div
                        key={level.id}
                        onClick={() => setSelectedLevel(level.id)}
                        className={`
                          cursor-pointer p-4 border-2 rounded-sm transition-all
                          ${selectedLevel === level.id ? 'border-slate bg-gray-50' : 'border-border hover:border-gray-300'}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm border ${level.color}`}
                          >
                            {level.label}
                          </span>
                          {selectedLevel === level.id && (
                            <CheckIcon className="w-4 h-4 text-slate" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {level.id === 'PUBLIC'
                            ? 'All verified users'
                            : 'Unit verification required'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-border px-6 py-4 flex items-center justify-end gap-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={loading}>
              {isEditMode ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </motion.div >
      </div >
    </AnimatePresence >
  );
}