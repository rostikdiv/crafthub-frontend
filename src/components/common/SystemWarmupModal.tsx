import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, RefreshCw, Activity, Server, Radio } from 'lucide-react';
import axios from 'axios';

interface SystemStatusResponse {
  status: string;
  services?: Record<string, string>;
}

const DEFAULT_GATEWAY_URL = 'https://milhub-api-gateway-258044247462.us-central1.run.app/api/v1';

const getSanitizedApiUrl = (): string => {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw !== 'string') return DEFAULT_GATEWAY_URL;

  let url = raw.trim().replace(/^["']|["']$/g, '');
  if (!url || url === 'undefined' || url === 'null') {
    return DEFAULT_GATEWAY_URL;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname === 'undefined') {
      return DEFAULT_GATEWAY_URL;
    }
    return parsed.href.endsWith('/') ? parsed.href.slice(0, -1) : parsed.href;
  } catch (e) {
    return DEFAULT_GATEWAY_URL;
  }
};

const API_BASE_URL = getSanitizedApiUrl();

export const SystemWarmupModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(true);
  const [gatewayStatus, setGatewayStatus] = useState<'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');
  const [servicesStatus, setServicesStatus] = useState<Record<string, string>>({});
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const serviceNamesMap: Record<string, string> = {
    'user-service': 'User Service & Authentication',
    'product-service': 'Tactical Catalog & Products',
    'order-service': 'Order Management System',
    'cart-service': 'Cart & Supplies Session',
    'notification-service': 'Dispatch & Notification Service',
    'payment-service': 'Payment Gateway',
    'delivery-service': 'Logistics & NovaPoshta Delivery',
  };

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    let isMounted = true;

    const checkSystemWarmup = async () => {
      if (!isMounted) return;
      setAttemptCount((prev) => prev + 1);

      try {
        // Query API Gateway Warmup Endpoint to warm up & verify all microservices
        const warmupResponse = await axios.get<SystemStatusResponse>(`${API_BASE_URL}/system/warmup`, {
          timeout: 15000,
        });

        if (warmupResponse.data) {
          setGatewayStatus('CONNECTED');
          if (warmupResponse.data.services) {
            setServicesStatus(warmupResponse.data.services);
          }

          if (warmupResponse.data.status === 'UP') {
            setIsWarmingUp(false);
            // Hide modal smoothly after 1.5s once all services are ready
            timerId = setTimeout(() => {
              if (isMounted) setIsVisible(false);
            }, 1500);
            return;
          }
        }
      } catch (error) {
        console.warn('API Gateway microservice warmup pending...', error);
        setGatewayStatus('CONNECTING');
      }

      // Retry polling every 3 seconds if not ready yet
      timerId = setTimeout(checkSystemWarmup, 3000);
    };

    checkSystemWarmup();

    return () => {
      isMounted = false;
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate/80 backdrop-blur-md p-4 font-sans"
      >
        <motion.div
          initial={{ scale: 0.92, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-cream dark:bg-slate border-2 border-tactical/30 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full text-slate dark:text-cream relative overflow-hidden"
        >
          {/* Top Tactical Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-tactical via-amber to-tactical" />

          {/* Header */}
          <div className="flex items-center space-x-3.5 mb-5">
            <div className="p-3 bg-tactical/10 border border-tactical/20 text-tactical rounded-xl flex items-center justify-center">
              {isWarmingUp ? (
                <RefreshCw className="w-6 h-6 animate-spin text-amber" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-tactical" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-stencil uppercase px-2 py-0.5 rounded bg-tactical/10 text-tactical border border-tactical/20">
                  MILHUB SYSTEM
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate dark:text-cream mt-0.5">
                {isWarmingUp ? 'Platform Initialization' : 'System Operational'}
              </h3>
              <p className="text-xs text-slate/70 dark:text-cream/70">
                {isWarmingUp
                  ? 'Establishing secure link to cloud services...'
                  : 'All tactical microservices ready'}
              </p>
            </div>
          </div>

          {/* Gateway Status Banner */}
          <div className="mb-5 bg-white dark:bg-slate/60 border border-border/80 rounded-xl p-3.5 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold flex items-center space-x-1.5 text-slate/80 dark:text-cream/80">
                <Radio className="w-3.5 h-3.5 text-tactical animate-pulse" />
                <span>API Gateway Link:</span>
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  gatewayStatus === 'CONNECTED'
                    ? 'bg-tactical/10 text-tactical border-tactical/30'
                    : 'bg-amber/10 text-amber border-amber/30 animate-pulse'
                }`}
              >
                {gatewayStatus === 'CONNECTED' ? 'ONLINE' : `CONNECTING (${attemptCount})`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate/10 dark:bg-cream/10 h-2 rounded-full overflow-hidden mt-2">
              <motion.div
                className="h-full bg-tactical"
                initial={{ width: '10%' }}
                animate={{
                  width: `${
                    gatewayStatus === 'CONNECTING'
                      ? 25
                      : Math.max(35, (readyServicesCount / totalServices) * 100)
                  }%`,
                }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Services Checklist */}
          <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-1">
            {Object.entries(serviceNamesMap).map(([key, label]) => {
              const isReady = servicesStatus[key] === 'WARMED_UP';
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/80 dark:bg-slate/40 border border-border/60 text-xs shadow-2xs"
                >
                  <span className="flex items-center space-x-2 text-slate dark:text-cream/90 font-medium">
                    <Server className="w-3.5 h-3.5 text-tactical/80" />
                    <span>{label}</span>
                  </span>
                  {isReady ? (
                    <span className="flex items-center space-x-1 text-tactical font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">READY</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-amber font-semibold animate-pulse">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="font-mono text-[11px]">WARMING</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-1 border-t border-border/40">
            {isWarmingUp ? (
              <p className="text-xs text-slate/60 dark:text-cream/60 font-mono">
                Initializing services... This modal will close automatically.
              </p>
            ) : (
              <p className="text-xs font-bold text-tactical font-mono tracking-wide uppercase">
                ✓ MilHub Platform Online
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
