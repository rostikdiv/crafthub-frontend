import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPinIcon, PlusIcon, EditIcon, TrashIcon, XIcon, SaveIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { sellerPointApi, deliveryApi } from '../../lib/api';
import { useToast } from '../../lib/toastContext';
import { City } from '../../lib/types';

interface SellerPoint {
    id: string;
    name: string;
    cityRef: string;
    street: string;
    building: string;
    latitude?: number;
    longitude?: number;
    contactPhone: string;
    contactName: string;
    instructions: string;
}

export function SellerPickupPoints() {
    const { success, error: showError } = useToast();
    const [points, setPoints] = useState<SellerPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPoint, setEditingPoint] = useState<SellerPoint | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [cityRef, setCityRef] = useState('');
    const [cityName, setCityName] = useState(''); // For display/search
    const [cities, setCities] = useState<City[]>([]);
    const [street, setStreet] = useState('');
    const [building, setBuilding] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactName, setContactName] = useState('');
    const [instructions, setInstructions] = useState('');

    const [searchingCity, setSearchingCity] = useState(false);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const { data } = await sellerPointApi.getPoints();
            setPoints(data);
        } catch (error) {
            console.error('Failed to fetch points', error);
            // showError('Failed to load pickup points');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    const handleSearchCity = async (query: string) => {
        setCityName(query);
        if (query.length < 3) {
            setCities([]);
            return;
        }
        setSearchingCity(true);
        try {
            const { data } = await deliveryApi.searchDeliveryCities('NOVA_POSHTA', query);
            setCities(data);
        } catch (error) {
            console.error('City search failed', error);
        } finally {
            setSearchingCity(false);
        }
    };

    const selectCity = (city: City) => {
        setCityRef(city.externalId || city.id); // Use externalId as Ref
        setCityName(city.name);
        setCities([]);
    };

    const handleEdit = (point: SellerPoint) => {
        setEditingPoint(point);
        setName(point.name);
        setCityRef(point.cityRef);
        setCityName(point.cityRef); // Ideally fetch city name or store it. For now, use Ref.
        setStreet(point.street);
        setBuilding(point.building);
        setContactPhone(point.contactPhone);
        setContactName(point.contactName);
        setInstructions(point.instructions);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingPoint(null);
        setName('');
        setCityRef('');
        setCityName('');
        setStreet('');
        setBuilding('');
        setContactPhone('');
        setContactName('');
        setInstructions('');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                cityRef,
                street,
                building,
                contactPhone,
                contactName,
                instructions
            };

            if (editingPoint) {
                await sellerPointApi.updatePoint(editingPoint.id, payload);
                success('Pickup point updated');
            } else {
                await sellerPointApi.createPoint(payload);
                success('Pickup point created');
            }
            setIsModalOpen(false);
            fetchPoints();
        } catch (error) {
            console.error('Failed to save point', error);
            showError('Failed to save pickup point');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pickup point?')) return;
        try {
            await sellerPointApi.deletePoint(id);
            success('Pickup point deleted');
            fetchPoints();
        } catch (error) {
            console.error('Failed to delete', error);
            showError('Failed to delete pickup point');
        }
    };

    return (
        <div className="bg-white p-6 rounded-sm border border-border">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-slate flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-tactical" />
                    Pickup Locations
                </h2>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Location
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading locations...</div>
            ) : points.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded border border-dashed border-gray-300">
                    <MapPinIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No pickup locations set up.</p>
                    <p className="text-sm text-gray-400 mt-1">Add locations to allow customers to pick up orders directly.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {points.map((point) => (
                        <div key={point.id} className="border border-gray-200 rounded p-4 hover:border-tactical transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate uppercase tracking-wide">{point.name}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(point)} className="text-gray-400 hover:text-blue-600">
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(point.id)} className="text-gray-400 hover:text-red-600">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold">Address:</span> {point.street} {point.building}, {point.cityRef}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-semibold">Contact:</span> {point.contactName} ({point.contactPhone})
                            </p>
                            {point.instructions && (
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                    Why: {point.instructions}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-sm shadow-xl p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg text-slate">
                                    {editingPoint ? 'Edit Location' : 'New Pickup Location'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><XIcon className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <Input
                                    label="Location Name"
                                    placeholder="e.g. Central Warehouse"
                                    value={name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                    required
                                />

                                <div className="relative">
                                    <Input
                                        label="City"
                                        placeholder="Start typing..."
                                        value={cityName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchCity(e.target.value)}
                                        required
                                    />
                                    {cities.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border border-gray-200 mt-1 max-h-40 overflow-y-auto shadow-lg rounded-sm">
                                            {cities.map((city) => (
                                                <div
                                                    key={city.id} // use key id
                                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => selectCity(city)}
                                                >
                                                    {city.name} ({city.region})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Street"
                                        value={street}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStreet(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Building"
                                        value={building}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuilding(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Contact Name"
                                        value={contactName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactName(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Phone"
                                        value={contactPhone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                                    <textarea
                                        value={instructions}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInstructions(e.target.value)}
                                        className="w-full p-2 border border-border rounded-sm text-sm"
                                        rows={3}
                                        placeholder="e.g. Enter through back door, ring bell..."
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" className="flex items-center gap-2">
                                        <SaveIcon className="w-4 h-4" />
                                        Save Location
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
