import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LockIcon } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useToast } from '../lib/toastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      showSuccess(t('auth.welcomeBack'));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || t('auth.loginFailed');
      showError(message);
    }
  };
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

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-slate text-cream mb-4">
            <LockIcon className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-slate">
            {t('auth.accessControl')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('auth.authPersonnelOnly')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-border p-8 shadow-sm relative">
          {/* Decorative corner markers */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-tactical -mt-1 -ml-1" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-tactical -mt-1 -mr-1" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-tactical -mb-1 -ml-1" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-tactical -mb-1 -mr-1" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label={t('auth.emailAddress')}
                type="email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder={t('auth.operatorEmail')} />

              <Input
                label={t('auth.password')}
                type="password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                placeholder="••••••••" />

            </div>

            <div className="flex items-center justify-between">
              <Checkbox
                label={t('auth.rememberDevice')}
                checked={rememberMe}
                onChange={setRememberMe} />

              <div className="text-xs">
                <a
                  href="#"
                  className="font-medium text-tactical hover:text-green-800 uppercase tracking-wider">

                  {t('auth.forgotPassword')}
                </a>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={isLoading}
              className="mt-2">

              {isLoading ? t('auth.authenticating') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              {t('auth.newToPlatform')}
            </p>
            <Link
              to="/register"
              className="mt-2 inline-block text-sm font-bold text-slate hover:text-tactical transition-colors uppercase tracking-wide border-b-2 border-transparent hover:border-tactical">

              {t('auth.requestClearance')}
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 font-mono">
          {t('auth.secureConnection')}
        </div>
      </div>
    </motion.div>);

}