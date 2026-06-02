import { useState, useEffect } from 'react';
import {
    DeliveryDetails,
    DeliveryProvider,
    DeliveryType,
    SellerPoint,
    City,
    Branch,
    SavedAddress
} from '../../lib/types';
import { deliveryService } from '../../lib/delivery';
import { Truck, Store, User } from 'lucide-react';

interface DeliverySelectorProps {
    value: DeliveryDetails;
    onChange: (value: DeliveryDetails) => void;
    sellerPickupPoints?: SellerPoint[];
    savedAddresses?: SavedAddress[];
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
    value,
    onChange,
    sellerPickupPoints = [],
    savedAddresses = []
}) => {
    const [regions, setRegions] = useState<string[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [citySearch, setCitySearch] = useState(value.cityName || '');
    const [loadingRegions, setLoadingRegions] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);

    // Load Regions when Provider changes
    useEffect(() => {
        if (value.provider === 'SELLER') return;

        const loadRegions = async () => {
            setLoadingRegions(true);
            try {
                const results = await deliveryService.getRegions(value.provider);
                setRegions(results);
            } catch (e) {
                console.error("Failed to load regions", e);
            } finally {
                setLoadingRegions(false);
            }
        };
        loadRegions();
    }, [value.provider]);

    // Handlers for Provider
    const handleProviderChange = (provider: DeliveryProvider) => {
        let type: DeliveryType;
        if (provider === 'SELLER') {
            type = 'COURIER';
        } else {
            type = 'BRANCH';
        }

        onChange({
            ...value,
            provider,
            type,
            region: undefined,
            cityRef: undefined,
            cityName: undefined,
            branchRef: undefined,
            branchName: undefined,
            sellerPointId: undefined,
            pickupAddress: undefined
        });
        setCitySearch('');
        setRegions([]);
        setCities([]);
        setBranches([]);
    };

    // Handlers for Type
    const handleTypeChange = (type: DeliveryType) => {
        onChange({ ...value, type });
    };

    // City Search
    useEffect(() => {
        const search = async () => {
            if (value.provider === 'SELLER') return;
            // Allow search if region is selected OR if we just want to search globally (optional design choice).
            // User requested Region -> City -> Branch. So we should probably respect region.
            if (!value.region) {
                setCities([]);
                return;
            }

            setLoadingCities(true);
            try {
                const results = await deliveryService.searchCities(value.provider, citySearch, value.region);
                setCities(results);
            } catch (e) {
                console.error("Failed to search cities", e);
            } finally {
                setLoadingCities(false);
            }
        };

        const debounce = setTimeout(search, 500);
        return () => clearTimeout(debounce);
    }, [citySearch, value.provider, value.region]);

    // Branch Loading
    useEffect(() => {
        const loadBranches = async () => {
            const selectedCity = cities.find(c => c.externalId === value.cityRef);
            if (selectedCity) {
                try {
                    const results = await deliveryService.getBranches(selectedCity.id);
                    setBranches(results);
                } catch (e) {
                    console.error("Failed to load branches", e);
                }
            }
        };

        if (value.type === 'BRANCH' && value.cityRef) {
            loadBranches();
        }
    }, [value.type, value.cityRef, cities]);


    return (
        <div className="space-y-6">
            {/* 1. Provider Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider</label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'NOVA_POSHTA', name: 'Nova Poshta', icon: Truck },
                        { id: 'UKRPOSHTA', name: 'UkrPoshta', icon: Truck },
                        { id: 'SELLER', name: 'Seller', icon: User }
                    ].map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => handleProviderChange(p.id as DeliveryProvider)}
                            className={`flex flex-col items-center p-4 border rounded-lg ${value.provider === p.id
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 hover:border-indigo-200'
                                }`}
                        >
                            <p.icon className="w-6 h-6 mb-2" />
                            <span className="text-sm font-medium">{p.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                <div className="flex space-x-4">
                    {value.provider !== 'SELLER' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('BRANCH')}
                                className={`px-4 py-2 rounded-md ${value.type === 'BRANCH' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                            >
                                To Branch
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('COURIER')}
                                className={`px-4 py-2 rounded-md ${value.type === 'COURIER' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                            >
                                Courier
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('COURIER')} // Seller Courier
                                className={`px-4 py-2 rounded-md ${value.type === 'COURIER' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                            >
                                Delivery by Seller
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('SELF_PICKUP')}
                                className={`px-4 py-2 rounded-md ${value.type === 'SELF_PICKUP' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                            >
                                Self Pickup
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 3. Details Form */}
            <div className="bg-gray-50 p-4 rounded-lg">
                {/* Saved Addresses (Only for COURIER) */}
                {value.type === 'COURIER' && savedAddresses.length > 0 && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Saved Addresses</label>
                        <div className="space-y-2">
                            {savedAddresses.map(addr => (
                                <div
                                    key={addr.id}
                                    onClick={() => {
                                        onChange({
                                            ...value,
                                            cityName: addr.cityName,
                                            cityRef: addr.cityRef,
                                            region: addr.region,
                                            street: addr.streetName,
                                            building: addr.building,
                                            apartment: addr.apartment,
                                            zipCode: addr.zipCode,
                                        });
                                        setCitySearch(addr.cityName || '');
                                    }}
                                    className={`p-3 border rounded-md cursor-pointer flex items-start space-x-3 ${value.street === addr.streetName && value.building === addr.building ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900">{addr.cityName}, {addr.region}</p>
                                        <p className="text-sm text-gray-500">{addr.streetName} {addr.building} {addr.apartment ? `Apt ${addr.apartment}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                            <div
                                onClick={() => {
                                    onChange({
                                        ...value,
                                        cityName: '', cityRef: undefined, region: '', street: '', building: '', apartment: '', zipCode: ''
                                    });
                                    setCitySearch('');
                                }}
                                className={`p-3 border rounded-md cursor-pointer text-sm text-center font-medium ${!value.street && !value.building ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                + Use a different address
                            </div>
                        </div>
                    </div>
                )}

                {(value.type === 'BRANCH' || (value.type === 'COURIER' && value.provider !== 'SELLER')) && (
                    <div className="space-y-4 mb-6">
                        {/* Region Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Region</label>
                            <select
                                value={value.region || ''}
                                onChange={(e) => {
                                    onChange({
                                        ...value,
                                        region: e.target.value,
                                        cityRef: undefined,
                                        cityName: undefined,
                                        branchRef: undefined,
                                        branchName: undefined
                                    });
                                    setCitySearch('');
                                }}
                                disabled={loadingRegions}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100"
                            >
                                <option value="">{loadingRegions ? 'Loading regions...' : 'Select Region'}</option>
                                {regions.map((region) => (
                                    <option key={region} value={region}>
                                        {region}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* City Selection (Filtered by Region) */}
                        {value.region && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    value={citySearch}
                                    onChange={(e) => {
                                        setCitySearch(e.target.value);
                                        setShowCityDropdown(true);
                                        if (value.cityRef) {
                                            onChange({
                                                ...value,
                                                cityRef: undefined,
                                                cityName: undefined,
                                                branchRef: undefined,
                                                branchName: undefined
                                            });
                                        }
                                    }}
                                    onFocus={() => {
                                        setShowCityDropdown(true);
                                        if (value.cityRef) {
                                            onChange({
                                                ...value,
                                                cityRef: undefined,
                                                cityName: undefined,
                                                branchRef: undefined,
                                                branchName: undefined
                                            });
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => setShowCityDropdown(false), 200);
                                    }}
                                    placeholder="Start typing city name..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                                {loadingCities && <p className="text-xs text-gray-500 mt-1">Loading...</p>}
                                {cities.length > 0 && !value.cityRef && showCityDropdown && (
                                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {cities.map(city => (
                                            <li
                                                key={city.id}
                                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-900"
                                                onClick={() => {
                                                    onChange({ ...value, cityRef: city.externalId, cityName: city.name });
                                                    setCitySearch(city.name);
                                                    setCities([]);
                                                    setShowCityDropdown(false);
                                                }}
                                            >
                                                {city.name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        {/* Branch Selection (Only for BRANCH type) */}
                        {value.type === 'BRANCH' && value.cityRef && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Branch</label>
                                <select
                                    value={value.branchRef || ''}
                                    onChange={(e) => {
                                        const branch = branches.find(b => b.externalId === e.target.value);
                                        if (branch) {
                                            onChange({ ...value, branchRef: branch.externalId, branchName: branch.name });
                                        }
                                    }}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.externalId}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {value.type === 'COURIER' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            {/* Manual City Input (Only for SELLER) */}
                            {value.provider === 'SELLER' && (
                                <div className="sm:col-span-6">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        id="city"
                                        value={value.cityName || ''}
                                        onChange={(e) => onChange({ ...value, cityName: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            )}

                            <div className="sm:col-span-4">
                                <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street</label>
                                <input
                                    type="text"
                                    name="street"
                                    id="street"
                                    value={value.street || ''}
                                    onChange={(e) => onChange({ ...value, street: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="building" className="block text-sm font-medium text-gray-700">Building</label>
                                <input
                                    type="text"
                                    name="building"
                                    id="building"
                                    value={value.building || ''}
                                    onChange={(e) => onChange({ ...value, building: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="apartment" className="block text-sm font-medium text-gray-700">Apartment</label>
                                <input
                                    type="text"
                                    name="apartment"
                                    id="apartment"
                                    value={value.apartment || ''}
                                    onChange={(e) => onChange({ ...value, apartment: e.target.value })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {value.type === 'SELF_PICKUP' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Pickup Point</label>
                        {sellerPickupPoints.length === 0 ? (
                            <p className="text-sm text-red-500">This seller has no pickup points.</p>
                        ) : (
                            <div className="space-y-2">
                                {sellerPickupPoints.map(point => (
                                    <div
                                        key={point.id}
                                        onClick={() => onChange({
                                            ...value,
                                            sellerPointId: point.id,
                                            pickupAddress: `${point.cityName}, ${point.streetName} ${point.building}`,
                                            pickupInstructions: point.instructions
                                        })}
                                        className={`p-3 border rounded-md cursor-pointer flex items-start space-x-3 ${value.sellerPointId === point.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <Store className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{point.name}</p>
                                            <p className="text-sm text-gray-500">{point.cityName}, {point.streetName} {point.building}</p>
                                            {point.phone && <p className="text-xs text-gray-400 mt-1">{point.phone}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
