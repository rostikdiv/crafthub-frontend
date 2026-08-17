
import React, { useState } from 'react';
import { useAuth } from '../../lib/authContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../../lib/toastContext';
import { api } from '../../lib/api';
import {
    User as UserIcon,
    Mail,
    Shield,
    CheckCircle,
    Edit2,
    LayoutDashboard,
    Store,
    Lock,
    X,
    Save
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ProfileView() {
    const { t } = useTranslation();
    const { user } = useAuth(); // Assuming refreshUser exists, if not we'll just update local state or reload
    const { success, error: showError } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Form state for Profile
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });

    // Military Profile State
    const [milData, setMilData] = useState({
        unitNumber: user?.militaryProfile?.unitNumber || '',
        edrpou: user?.militaryProfile?.edrpou || '',
        commanderName: user?.militaryProfile?.commanderName || '',
        officialAddress: user?.militaryProfile?.officialAddress || ''
    });
    const [milLoading, setMilLoading] = useState(false);
    const [isEditMilitaryWarningOpen, setIsEditMilitaryWarningOpen] = useState(false);
    const [isEditMilitaryModalOpen, setIsEditMilitaryModalOpen] = useState(false);

    // Form state for Password
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field: string, value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.put('/users/me', {
                firstName: formData.firstName,
                lastName: formData.lastName,
            });

            success(t('profile.updateSuccess'));
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            console.error('Profile update failed', error);
            showError(t('profile.updateFailed'));
        }
    };

    const handleMilitarySubmit = async () => {
        setMilLoading(true);
        try {
            await api.post('/military/profile', milData);
            success(t('military.saveSuccess'));
            window.location.reload();
        } catch (err) {
            console.error('Failed to save unit profile', err);
            showError(t('military.saveFailed'));
        } finally {
            setMilLoading(false);
        }
    };

    const handleUpdateMilitaryProfile = async () => {
        setMilLoading(true);
        try {
            await api.put('/users/me/military-profile', milData);
            success(t('military.updateSuccess', 'Military profile updated successfully. Please wait for re-verification.'));
            setIsEditMilitaryModalOpen(false);
            window.location.reload();
        } catch (err) {
            console.error('Failed to update unit profile', err);
            showError(t('military.updateFailed', 'Failed to update military profile'));
        } finally {
            setMilLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError(t('password.noMatch'));
            return;
        }

        setPasswordLoading(true);
        try {
            await api.post('/users/me/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
                confirmationPassword: passwordData.confirmPassword
            });
            success(t('password.success'));
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error('Password change failed', error);
            showError(error.response?.data?.message || t('password.failed'));
        } finally {
            setPasswordLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="bg-white border border-border rounded-sm p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-slate uppercase tracking-tight flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-tactical" /> {t('profile.personalInfo')}
                    </h2>
                    <div className="flex gap-2">
                        {/* Role-based Actions */}
                        {user.role === 'ADMIN' && (
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = '/admin'}
                                className="text-xs bg-slate-800 hover:bg-slate-900"
                            >
                                <LayoutDashboard className="w-3 h-3 mr-2" /> {t('profile.adminPanel')}
                            </Button>
                        )}
                        {user.role === 'SELLER' && (
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = '/seller'}
                                className="text-xs bg-tactical hover:bg-tactical-dark"
                            >
                                <Store className="w-3 h-3 mr-2" /> {t('profile.myShop')}
                            </Button>
                        )}

                        {!isEditing && (
                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(true)}
                                className="text-xs"
                            >
                                <Edit2 className="w-3 h-3 mr-2" /> {t('profile.editProfile')}
                            </Button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    // --- EDIT FORM ---
                    <form onSubmit={handleProfileSubmit} className="space-y-4 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('profile.firstName')}
                                value={formData.firstName}
                                onChange={(e: any) => handleChange('firstName', e.target.value)}
                                placeholder="John"
                            />
                            <Input
                                label={t('profile.lastName')}
                                value={formData.lastName}
                                onChange={(e: any) => handleChange('lastName', e.target.value)}
                                placeholder="Doe"
                            />
                        </div>
                        <Input
                            label={t('profile.emailAddress')}
                            type="email"
                            value={user.email}
                            disabled
                            className="bg-gray-50 text-gray-500"
                        />

                        <div className="flex justify-between items-center pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsChangingPassword(true)}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                                <Lock className="w-3 h-3 mr-2" /> {t('profile.changePassword')}
                            </Button>

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditing(false)}
                                >
                                    {t('profile.cancel')}
                                </Button>
                                <Button type="submit">
                                    {t('profile.saveChanges')}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : (
                    // --- READ ONLY VIEW ---
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                            {/* Full Name */}
                            <div className="group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{t('profile.fullName')}</label>
                                <div className="text-base font-medium text-slate flex items-center gap-2">
                                    {user.firstName} {user.lastName}
                                </div>
                            </div>

                            {/* Email */}
                            <div className="group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{t('profile.emailAddress')}</label>
                                <div className="text-base font-medium text-slate flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    {user.email}
                                </div>
                            </div>

                            {/* Role */}
                            <div className="group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{t('profile.accountRole')}</label>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate text-white">
                                        {user.role}
                                    </span>
                                </div>
                            </div>

                            {/* Verification Status - Only shown for Military and Seller */}
                            {(user.role === 'SELLER' || user.role === 'MILITARY_UNIT') && (
                                <div className="group">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{t('profile.verificationStatus')}</label>
                                    <div className="flex items-center gap-2">
                                        {user.isVerified ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle className="w-4 h-4" /> {t('profile.verifiedIdentity')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-sm font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                                <Shield className="w-4 h-4 text-gray-400" /> {t('profile.unverified')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Member Since */}
                            <div className="group">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">{t('profile.userId')}</label>
                                <div className="text-sm font-mono text-gray-500">
                                    {user.id}
                                </div>
                            </div>
                        </div>

                        {/* --- MILITARY PROFILE SECTION --- */}
                        {(user.role === 'MILITARY_UNIT' || user.militaryProfile) && (
                            <div className="mt-8 pt-8 border-t border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-bold text-slate uppercase tracking-tight flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-tactical" /> {t('military.unitProfile')}
                                    </h3>
                                    <div className="flex gap-2">
                                        {!user.militaryProfile && (
                                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-sm border border-amber-200">
                                                {t('military.incomplete')}
                                            </span>
                                        )}
                                        {user.militaryProfile && (
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsEditMilitaryWarningOpen(true)}
                                                className="text-xs py-1 h-auto"
                                            >
                                                <Edit2 className="w-3 h-3 mr-1" /> {t('profile.edit', 'Edit')}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {user.militaryProfile ? (
                                    <div className="bg-slate/5 p-4 rounded-sm border border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('military.unitNumber')}</label>
                                            <p className="font-bold text-slate">{user.militaryProfile.unitNumber}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('military.edrpou')}</label>
                                            <p className="font-mono text-slate">{user.militaryProfile.edrpou || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('military.commander')}</label>
                                            <p className="font-medium text-slate">{user.militaryProfile.commanderName}</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('military.address')}</label>
                                            <p className="text-sm text-slate">{user.militaryProfile.officialAddress}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 p-6 rounded-sm border border-amber-200">
                                        <p className="text-sm text-amber-800 mb-4 font-semibold">
                                            {t('military.completeDetailsMsg')}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label={t('military.unitNumber')}
                                                placeholder="A1234"
                                                value={milData.unitNumber}
                                                onChange={(e: any) => setMilData({ ...milData, unitNumber: e.target.value })}
                                            />
                                            <Input
                                                label={t('military.edrpouCode')}
                                                placeholder="12345678"
                                                value={milData.edrpou}
                                                onChange={(e: any) => setMilData({ ...milData, edrpou: e.target.value })}
                                            />
                                            <Input
                                                label={t('military.commanderName')}
                                                placeholder="Rank & Name"
                                                value={milData.commanderName}
                                                onChange={(e: any) => setMilData({ ...milData, commanderName: e.target.value })}
                                            />
                                            <Input
                                                label={t('military.officialAddress')}
                                                placeholder="Postal Address"
                                                value={milData.officialAddress}
                                                onChange={(e: any) => setMilData({ ...milData, officialAddress: e.target.value })}
                                            />
                                            <div className="md:col-span-2 pt-2">
                                                <Button
                                                    onClick={handleMilitarySubmit}
                                                    isLoading={milLoading}
                                                    className="w-full md:w-auto"
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {t('military.saveUnitDetails')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Separate specific button for Password Change if not in edit mode (optional, but requested separately) */}
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsChangingPassword(true)}
                                className="text-xs"
                            >
                                <Lock className="w-3 h-3 mr-2" /> {t('profile.changePassword')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Change Modal */}
            {isChangingPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsChangingPassword(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-slate mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-tactical" /> {t('profile.changePassword')}
                        </h3>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <Input
                                label={t('password.currentPassword')}
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e: any) => handlePasswordChange('currentPassword', e.target.value)}
                                placeholder="Enter current password"
                                required
                            />
                            <Input
                                label={t('password.newPassword')}
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e: any) => handlePasswordChange('newPassword', e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                            <Input
                                label={t('password.confirmNewPassword')}
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e: any) => handlePasswordChange('confirmPassword', e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsChangingPassword(false)}
                                >
                                    {t('profile.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="bg-tactical hover:bg-tactical-dark text-white"
                                >
                                    {passwordLoading ? t('password.updating') : t('password.updatePassword')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Military Warning Modal */}
            {isEditMilitaryWarningOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md shadow-lg w-full max-w-md p-6 relative">
                        <button
                            onClick={() => setIsEditMilitaryWarningOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" /> {t('militaryDashboard.warningTitle')}
                        </h3>
                        <p className="text-sm text-slate mb-6 leading-relaxed">
                            {t('militaryDashboard.editWarningMsg')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditMilitaryWarningOpen(false)}
                            >
                                {t('militaryDashboard.cancel')}
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    setIsEditMilitaryWarningOpen(false);
                                    setIsEditMilitaryModalOpen(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {t('militaryDashboard.continue')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Military Form Modal */}
            {isEditMilitaryModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-md shadow-lg w-full max-w-lg p-6 relative">
                        <button
                            onClick={() => setIsEditMilitaryModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-slate mb-6">
                            {t('militaryDashboard.editProfileTitle')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('military.unitNumber')}
                                placeholder="A1234"
                                value={milData.unitNumber}
                                onChange={(e: any) => setMilData({ ...milData, unitNumber: e.target.value })}
                            />
                            <Input
                                label={t('military.edrpouCode')}
                                placeholder="12345678"
                                value={milData.edrpou}
                                onChange={(e: any) => setMilData({ ...milData, edrpou: e.target.value })}
                            />
                            <Input
                                label={t('military.commanderName')}
                                placeholder="Rank & Name"
                                value={milData.commanderName}
                                onChange={(e: any) => setMilData({ ...milData, commanderName: e.target.value })}
                            />
                            <Input
                                label={t('military.officialAddress')}
                                placeholder="Postal Address"
                                value={milData.officialAddress}
                                onChange={(e: any) => setMilData({ ...milData, officialAddress: e.target.value })}
                            />
                            <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditMilitaryModalOpen(false)}
                                >
                                    {t('profile.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    onClick={handleUpdateMilitaryProfile}
                                    isLoading={milLoading}
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    {t('profile.saveChanges', 'Save Changes')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
