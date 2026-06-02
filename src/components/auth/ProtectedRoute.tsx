import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { Role } from '../../lib/types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // Or a spinner component
        return <div className="min-h-screen flex items-center justify-center bg-cream">Loading...</div>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User is signed in but doesn't have the right role
        // Redirect to home or a dedicated "Unauthorized" page
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
