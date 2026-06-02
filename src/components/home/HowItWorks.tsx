import { motion } from 'framer-motion';
import { SearchIcon, ShieldCheckIcon, TruckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function HowItWorks() {
  const { t } = useTranslation();

  const steps = [
  {
    number: '01',
    title: t('home.howItWorks.step1Title'),
    description: t('home.howItWorks.step1Desc'),
    icon: SearchIcon
  },
  {
    number: '02',
    title: t('home.howItWorks.step2Title'),
    description: t('home.howItWorks.step2Desc'),
    icon: ShieldCheckIcon
  },
  {
    number: '03',
    title: t('home.howItWorks.step3Title'),
    description: t('home.howItWorks.step3Desc'),
    icon: TruckIcon
  }];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="border-t-2 border-tactical pt-4 mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-tactical">
            {t('home.howItWorks.sectionTitle')}
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) =>
          <motion.div
            key={step.number}
            initial={{
              opacity: 0,
              y: 20
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true
            }}
            transition={{
              duration: 0.4,
              delay: index * 0.15
            }}
            className="relative">

              {/* Connector Line */}
              {index < steps.length - 1 &&
            <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-border" />
            }

              <div className="text-center">
                {/* Number */}
                <span className="inline-block font-mono text-4xl font-bold text-tactical mb-4">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 border-2 border-slate rounded-sm flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-slate" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}