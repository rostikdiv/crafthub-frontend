import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, RefreshCwIcon, Edit2Icon, TrashIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { deliveryApi } from '../../lib/api';
import { useToast } from '../../lib/toastContext';

// Types matching API response for Branches
interface Branch {
    id: string;
    externalId: string;
    branchNumber: string;
    name: string; // "City, Branch Address..."
}

type Provider = 'NOVA_POSHTA' | 'UKRPOSHTA';

export function DeliveryManagement() {
    const { success, error: showError } = useToast();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [activeProvider, setActiveProvider] = useState<Provider>('NOVA_POSHTA');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [editForm, setEditForm] = useState({ branchNumber: '', name: '' });

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const { data } = await deliveryApi.getAllBranches(activeProvider, page, 20);
            setBranches(data.content || []);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Failed to fetch branches', error);
            showError('Failed to load branches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(0); // Reset page on provider change
        fetchBranches();
    }, [activeProvider]);

    useEffect(() => {
        fetchBranches();
    }, [page]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this branch?')) return;
        try {
            await deliveryApi.deleteBranch(id);
            success('Branch deleted successfully');
            fetchBranches();
        } catch (error) {
            console.error('Delete failed', error);
            showError('Failed to delete branch');
        }
    };

    const openEditModal = (branch: Branch) => {
        setSelectedBranch(branch);
        setEditForm({
            branchNumber: branch.branchNumber,
            name: branch.name
        });
        setIsEditing(true);
    };

    const handleUpdate = async () => {
        if (!selectedBranch) return;
        try {
            await deliveryApi.updateBranch(selectedBranch.id, editForm);
            success('Branch updated successfully');
            setIsEditing(false);
            fetchBranches();
        } catch (error) {
            console.error('Update failed', error);
            showError('Failed to update branch');
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(0, page - 2);
        let end = Math.min(totalPages - 1, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(0, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate">Delivery Network</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchBranches}>
                        <RefreshCwIcon className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate">Edit Branch</h3>
                                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch Number</label>
                                    <input
                                        type="text"
                                        value={editForm.branchNumber}
                                        onChange={e => setEditForm({ ...editForm, branchNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-tactical focus:border-tactical"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Address)</label>
                                    <textarea
                                        rows={3}
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-1 focus:ring-tactical focus:border-tactical"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={handleUpdate}>Save Changes</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Provider Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                {(['NOVA_POSHTA', 'UKRPOSHTA'] as Provider[]).map((provider) => (
                    <button
                        key={provider}
                        onClick={() => setActiveProvider(provider)}
                        className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeProvider === provider
                            ? 'border-tactical text-tactical'
                            : 'border-transparent text-gray-500 hover:text-slate'
                            }`}
                    >
                        {provider === 'NOVA_POSHTA' ? 'Nova Poshta' : 'Ukrposhta'}
                    </button>
                ))}
            </div>

            {/* Branches Table */}
            <div className="bg-white border border-border rounded-sm overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref ID</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading delivery points...</td></tr>
                        )}
                        {!loading && branches.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">No branches found for this provider.</td></tr>
                        )}
                        {branches.map((branch) => (
                            <tr key={branch.id} className="hover:bg-slate/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-start">
                                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-1 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-bold text-slate mb-1">
                                                Branch #{branch.branchNumber}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {branch.name}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                    {branch.externalId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openEditModal(branch)}
                                        className="text-tactical hover:text-slate mr-4"
                                    >
                                        <Edit2Icon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Numbered Pagination */}
                {totalPages > 1 && (
                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-sm">
                        <div className="text-gray-500">
                            Page {page + 1} of {totalPages}
                        </div>
                        <div className="flex gap-1 items-center">
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                className="mr-2"
                            >
                                <ChevronLeftIcon className="w-4 h-4" />
                            </Button>

                            {getPageNumbers().map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-sm text-xs font-medium transition-colors ${page === p
                                            ? 'bg-tactical text-white'
                                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {p + 1}
                                </button>
                            ))}

                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage(p => p + 1)}
                                className="ml-2"
                            >
                                <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
                * Branch data is synchronized from external delivery provider APIs.
            </p>
        </div>
    );
}
