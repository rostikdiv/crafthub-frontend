import { api } from './api';
import { City, Branch, DeliveryProvider } from './types';

export const deliveryService = {
    getRegions: async (provider: DeliveryProvider): Promise<string[]> => {
        const response = await api.get<string[]>('/delivery/locations/regions', {
            params: { provider },
        });
        return response.data;
    },

    searchCities: async (provider: DeliveryProvider, query: string, region?: string): Promise<City[]> => {
        const response = await api.get<City[]>('/delivery/locations/cities', {
            params: { provider, query, region },
        });
        return response.data;
    },

    getBranches: async (cityId: string): Promise<Branch[]> => {
        const response = await api.get<Branch[]>('/delivery/locations/branches', {
            params: { cityId },
        });
        return response.data;
    },
};
