import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from './types';
import { api, getUserIdFromToken } from './api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    refreshUser: () => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const savedToken = localStorage.getItem('auth_token');
            const savedUser = localStorage.getItem('auth_user');

            if (savedToken) {
                setToken(savedToken);
                // Optimistically set user from storage while fetching fresh data
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }

                // Fetch fresh user data
                try {
                    const userId = getUserIdFromToken(savedToken);
                    if (userId) {
                        const { data: userData } = await api.get<User>(`/users/${userId}`);
                        setUser(userData);
                        localStorage.setItem('auth_user', JSON.stringify(userData));
                    } else {
                        throw new Error('Invalid token');
                    }
                } catch (error) {
                    console.error('Failed to refresh user session', error);
                    // If token is invalid/expired, logout
                    logout();
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            // 1. Authenticate
            const { data: authData } = await api.post<{ token: string }>('/auth/authenticate', {
                email: credentials.email,
                password: credentials.password
            });

            const token = authData.token;
            localStorage.setItem('auth_token', token);
            setToken(token);

            // 2. Decode ID and fetch User Profile
            const userId = getUserIdFromToken();
            if (!userId) {
                throw new Error('Invalid token: No user ID found');
            }

            const { data: userData } = await api.get<User>(`/users/${userId}`);

            setUser(userData);
            localStorage.setItem('auth_user', JSON.stringify(userData));
        } catch (error) {
            console.error('Login failed', error);
            logout(); // Clean up if profile fetch fails
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (credentials: RegisterCredentials) => {
        setIsLoading(true);
        try {
            // 1. Register
            const { data: authData } = await api.post<{ token: string }>('/auth/register', {
                firstName: credentials.firstName,
                lastName: credentials.lastName,
                email: credentials.email,
                password: credentials.password,
                role: credentials.role,
                phoneNumber: credentials.phoneNumber // Sending phone
            });

            const token = authData.token;
            localStorage.setItem('auth_token', token);
            setToken(token);

            // 2. Fetch User Profile
            const userId = getUserIdFromToken();
            if (!userId) {
                throw new Error('Invalid token: No user ID found');
            }

            const { data: userData } = await api.get<User>(`/users/${userId}`);

            setUser(userData);
            localStorage.setItem('auth_user', JSON.stringify(userData));

        } catch (error) {
            console.error('Registration failed', error);
            logout();
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const refreshUser = async (): Promise<User | null> => {
        try {
            const currentToken = token || localStorage.getItem('auth_token');
            if (!currentToken) return null;
            const userId = getUserIdFromToken(currentToken);
            if (!userId) return null;
            const { data: userData } = await api.get<User>(`/users/${userId}`);
            setUser(userData);
            localStorage.setItem('auth_user', JSON.stringify(userData));
            return userData;
        } catch (err) {
            console.error('Failed to refresh user', err);
            return null;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Clear global headers if needed, though interceptor handles it
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, refreshUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
