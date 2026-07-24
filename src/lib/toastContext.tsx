import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toasts: Toast[]; // Kept for backward compatibility if any component reads it, though unused by hot-toast
    addToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
    success: (message: string) => void;
    error: (message: string, err?: any) => void; // Added optional err param for dual logging
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const addToast = (type: ToastType, message: string) => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'info':
            case 'warning':
            default:
                toast(message); // Default toast for info/warning
                break;
        }
    };

    const removeToast = (id: string) => {
        toast.dismiss(id);
    };

    const success = (message: string) => toast.success(message);
    
    // Dual error logging: Toast for user, console.error for developer
    const errorMsg = (message: string, err?: any) => {
        toast.error(message);
        if (err) {
            console.error(message, err);
        } else {
            console.error(message);
        }
    };

    return (
        <ToastContext.Provider value={{ toasts: [], addToast, removeToast, success, error: errorMsg }}>
            {children}
            <Toaster position="top-right" />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
