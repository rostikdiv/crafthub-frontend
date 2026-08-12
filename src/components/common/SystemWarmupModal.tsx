import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, CheckCircle2, RefreshCw, Activity, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface SystemStatusResponse {
  status: string;
  services?: Record<string, string>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://milhub-api-gateway-258044247462.us-central1.run.app/api/v1';

export const SystemWarmupModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(true);
  const [gatewayStatus, setGatewayStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');
  const [servicesStatus, setServicesStatus] = useState<Record<string, string>>({});
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const serviceNamesMap: Record<string, string> = {
    'user-service': 'Сервіс Користувачів',
    'product-service': 'Каталог Товарів',
    'order-service': 'Управління Замовленнями',
    'cart-service': 'Кошик',
    'notification-service': 'Сповіщення',
    'payment-service': 'Оплати',
    'delivery-service': 'Доставка & Логістика',
  };

  useEffect(() => {
    let timerId: NodeJS.Timeout;

    const checkSystemWarmup = async () => {
      try {
        setAttemptCount((prev) => prev + 1);
        const response = await axios.get<SystemStatusResponse>(`${API_BASE_URL}/system/warmup`, {
          timeout: 10000,
        });

        if (response.data) {
          setGatewayStatus('CONNECTED');
          if (response.data.services) {
            setServicesStatus(response.data.services);
          }

          if (response.data.status === 'UP') {
            setIsWarmingUp(false);
            // Hide modal smoothly after 1.5s
            timerId = setTimeout(() => {
              setIsVisible(false);
            }, 1500);
            return;
          }
        }
      } catch (error) {
        console.warn('Backend warmup check pending...', error);
        setGatewayStatus('CONNECTING');
      }

      // Retry polling every 3 seconds if not ready yet
      timerId = setTimeout(checkSystemWarmup, 3000);
    };

    checkSystemWarmup();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  if (!isVisible) return null;

  const totalServices = Object.keys(serviceNamesMap).length;
  const readyServicesCount = Object.values(servicesStatus).filter((s) => s === 'WARMED_UP').length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full text-zinc-900 dark:text-zinc-100 relative overflow-hidden"
        >
          {/* Top Decorative Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500" />

          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              {isWarmingUp ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isWarmingUp ? 'Розігрів Платформи MilHub' : 'Система Готова!'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isWarmingUp
                  ? 'Підключення до хмарних мікросервісів...'
                  : 'Усі сервіси успішно підняті'}
              </p>
            </div>
          </div>

          {/* Progress Banner Status */}
          <div className="mb-6 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl p-3 text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Статус Шлюзу (API Gateway):
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  gatewayStatus === 'CONNECTED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}
              >
                {gatewayStatus === 'CONNECTED' ? 'АКТИВНИЙ' : `ПІДКЛЮЧЕННЯ (${attemptCount})`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: '10%' }}
                animate={{
                  width: `${
                    gatewayStatus === 'CONNECTING'
                      ? 20
                      : Math.max(30, (readyServicesCount / totalServices) * 100)
                  }%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Microservices List */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
            {Object.entries(serviceNamesMap).map(([key, label]) => {
              const isReady = servicesStatus[key] === 'WARMED_UP';
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 text-xs"
                >
                  <span className="flex items-center space-x-2">
                    <Server className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{label}</span>
                  </span>
                  {isReady ? (
                    <span className="flex items-center space-x-1 text-emerald-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Готово</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber-500 font-medium animate-pulse">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Очікування</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="text-center">
            {isWarmingUp ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Зачекайте кілька секунд. Модальне вікно закриється автоматично.
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Ласкаво просимо до MilHub!
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
