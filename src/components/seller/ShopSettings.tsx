import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { StoreIcon, UploadIcon, SaveIcon, EditIcon, XIcon, PlusCircleIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/authContext';
import { useToast } from '../../lib/toastContext';
import { fixImageUrl } from '../../lib/imageUtils';

type ShopMode = 'view' | 'edit' | 'create';

export function ShopSettings() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    const [mode, setMode] = useState<ShopMode>('view');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [companyName, setCompanyName] = useState('');
    const [description, setDescription] = useState('');
    const [taxId, setTaxId] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    // Stats for View Mode
    const [stats, setStats] = useState({ rating: 0, reviewCount: 0 });

    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Note: Using the avatar upload endpoint for shop logos
            const { data } = await api.post('/users/uploads/avatar', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (data.url) {
                // Use fixImageUrl to ensure it displays correctly in dev
                const fixedUrl = fixImageUrl(data.url);
                setLogoUrl(fixedUrl);
                success('Logo uploaded successfully');
            }
        } catch (err) {
            console.error("Logo upload failed", err);
            showError("Failed to upload logo");
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Try to fetch existing profile
                const { data } = await api.get(`/sellers/${user.id}`);
                setCompanyName(data.companyName || '');
                setDescription(data.description || '');
                setLogoUrl(data.logoUrl || null);
                setStats({
                    rating: data.rating || 0,
                    reviewCount: data.reviewCount || 0
                });
                setMode('view');
            } catch (error: any) {
                if (error.response?.status === 404) {
                    setMode('create');
                } else {
                    console.error('Failed to fetch shop profile', error);
                    showError('Failed to load shop profile.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (mode === 'create') {
                await api.post('/users/me/seller-profile', {
                    companyName,
                    description,
                    taxId,
                    logoUrl
                });
                success('Shop profile created successfully!');
                setMode('view');
            } else {
                await api.put('/sellers/seller-profile', {
                    companyName,
                    description,
                    logoUrl,
                    taxId: null // Tax ID usually cannot be changed without re-verification
                });
                success('Shop profile updated successfully.');
                setMode('view');
            }
        } catch (error: any) {
            console.error('Failed to save shop profile', error);
            showError(error.response?.data?.message || 'Failed to save changes.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading shop profile...</div>;
    }

    if (mode === 'view') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white border text-slate border-border p-8 rounded-sm shadow-sm relative">
                    <div className="absolute top-6 right-6">
                        <Button variant="outline" size="sm" onClick={() => setMode('edit')} className="flex items-center gap-2">
                            <EditIcon className="w-4 h-4" /> Edit Profile
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                                {logoUrl ? (
                                    <img src={fixImageUrl(logoUrl)} alt="Shop Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <StoreIcon className="w-12 h-12 text-gray-400" />
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate uppercase tracking-tight">{companyName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex text-amber-500 text-sm">
                                        {'★'.repeat(Math.round(stats.rating))}
                                        <span className="text-gray-300">{'★'.repeat(5 - Math.round(stats.rating))}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">({stats.reviewCount} reviews)</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">About</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description || 'No description provided.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border text-slate border-border p-6 rounded-sm shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate flex items-center gap-2">
                        {mode === 'create' ? <PlusCircleIcon className="w-5 h-5" /> : <EditIcon className="w-5 h-5" />}
                        {mode === 'create' ? 'Create Shop Profile' : 'Edit Shop Profile'}
                    </h2>
                    {mode === 'edit' && (
                        <button onClick={() => setMode('view')} className="text-gray-400 hover:text-gray-600">
                            <XIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Logo Input (Simplified for now) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo URL</label>
                        <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                {logoUrl ? (
                                    <img src={fixImageUrl(logoUrl)} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <StoreIcon className="w-6 h-6 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <Input
                                        label="Logo URL"
                                        placeholder="https://example.com/logo.png"
                                        value={logoUrl || ''}
                                        onChange={(e) => setLogoUrl(e.target.value)}
                                        className="flex-1"
                                    />
                                    <div className="mt-6">
                                        <input
                                            type="file"
                                            id="logo-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={uploading}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => document.getElementById('logo-upload')?.click()}
                                            disabled={uploading}
                                            className="flex items-center gap-2"
                                        >
                                            <UploadIcon className="w-4 h-4" />
                                            {uploading ? 'Uploading...' : 'Upload'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Upload a square image for best results.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Company / Shop Name"
                        required
                        placeholder="e.g. Tactical Supply Co."
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                    />

                    {mode === 'create' && (
                        <Input
                            label="Tax ID / EDRPOU"
                            required
                            placeholder="e.g. 12345678"
                            value={taxId}
                            onChange={(e) => setTaxId(e.target.value)}
                            helperText="Required for verification. Cannot be changed later."
                        />
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About the Shop</label>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-border rounded-sm focus:ring-2 focus:ring-tactical focus:border-tactical transition-all"
                            placeholder="Tell customers about your brand..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        {mode === 'edit' && (
                            <Button type="button" variant="outline" onClick={() => setMode('view')}>
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" isLoading={submitting} className="flex items-center gap-2">
                            <SaveIcon className="w-4 h-4" />
                            {mode === 'create' ? 'Create Profile' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
