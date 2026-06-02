import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCartIcon,
  StoreIcon,
  ShieldIcon,
  CheckIcon
} from
  'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/authContext';
import { useToast } from '../lib/toastContext';
import { useTranslation } from 'react-i18next';
type UserRole = 'BUYER' | 'SELLER' | 'MILITARY_UNIT';
export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [role, setRole] = useState<UserRole>('BUYER');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showError(t('auth.passwordsNoMatch'));
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        role: role as any
      });
      showSuccess(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || t('auth.registerFailed');
      showError(message);
    }
  };
  const roles = [
    {
      id: 'BUYER',
      label: t('auth.roleBuyer'),
      icon: ShoppingCartIcon,
      description: t('auth.descBuyer')
    },
    {
      id: 'SELLER',
      label: t('auth.roleSeller'),
      icon: StoreIcon,
      description: t('auth.descSeller')
    },
    {
      id: 'MILITARY_UNIT',
      label: t('auth.roleMilitary'),
      icon: ShieldIcon,
      description: t('auth.descMilitary')
    }] as
    const;
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -20
      }}
      transition={{
        duration: 0.3
      }}
      className="page-wrapper flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate">
            {t('auth.newAccountReg')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.completeForm')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-border p-8 shadow-sm relative">
          {/* Decorative corner markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tactical -mt-1 -ml-1" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tactical -mt-1 -mr-1" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tactical -mb-1 -ml-1" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tactical -mb-1 -mr-1" />

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                {t('auth.selectAccountType')}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const isSelected = role === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setRole(item.id)}
                      className={`
                        relative cursor-pointer p-4 border-2 transition-all duration-200
                        flex flex-col items-center text-center gap-3
                        ${isSelected ? 'border-tactical bg-green-50/50' : 'border-border hover:border-gray-400 bg-white'}
                      `}>

                      {isSelected &&
                        <div className="absolute top-2 right-2 text-tactical">
                          <CheckIcon className="w-4 h-4" />
                        </div>
                      }
                      <div
                        className={`p-2 rounded-full ${isSelected ? 'bg-tactical text-white' : 'bg-gray-100 text-gray-500'}`}>

                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm uppercase tracking-wide text-slate">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                          {item.description}
                        </div>
                      </div>
                    </div>);

                })}
              </div>
            </div>

            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('auth.firstName')}
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John" />

                <Input
                  label={t('auth.lastName')}
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe" />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('auth.emailAddress')}
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com" />

                <Input
                  label={t('auth.phoneNumber')}
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000" />

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('auth.password')}
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" />

                <Input
                  label={t('auth.confirmPassword')}
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••" />

              </div>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={isLoading}>
              {isLoading ? t('auth.processing') : t('auth.createAccount')}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {t('auth.alreadyHaveClearance')}
            </p>
            <Link
              to="/login"
              className="mt-2 inline-block text-sm font-bold text-slate hover:text-tactical transition-colors uppercase tracking-wide border-b-2 border-transparent hover:border-tactical">

              {t('auth.signInToDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </motion.div>);

}