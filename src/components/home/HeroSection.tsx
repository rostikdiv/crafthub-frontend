import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { StampBadge } from '../ui/StampBadge';
import { useTranslation } from 'react-i18next';

export function HeroSection() {
  const { t } = useTranslation();
  const headline = t('home.hero.headline');
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < headline.length) {
        setDisplayedText(headline.slice(0, index + 1));
        index++;
      } else {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span
          className="text-[120px] md:text-[200px] font-black text-slate opacity-[0.03] tracking-widest"
          style={{
            transform: 'rotate(-12deg)'
          }}>

          {t('home.hero.classified')}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.6
          }}
          className="border-2 border-dashed border-slate p-8 md:p-12 bg-cream/50">

          {/* Document Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono text-gray-500 mb-1">
                {t('home.hero.docRef')}
              </p>
              <p className="text-xs font-mono text-gray-500">
                {t('home.hero.issued')}
              </p>
            </div>
            <StampBadge type="VERIFIED" className="flex-shrink-0" />
          </div>

          {/* Divider */}
          <div className="border-t border-tactical mb-8" />

          {/* Headline with Typewriter Effect */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate leading-tight min-h-[2.5em] md:min-h-[1.5em]">
              <span>{displayedText}</span>
              {!isTypingComplete &&
              <span className="inline-block w-0.5 h-8 md:h-10 bg-tactical ml-1 animate-cursor-blink" />
              }
            </h1>
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-8 max-w-2xl leading-relaxed">
            {t('home.hero.description')}
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/products">
              <Button size="lg">{t('home.hero.accessCatalog')}</Button>
            </Link>
            <span className="text-xs font-mono text-gray-500">
              {t('home.hero.clearance')}
            </span>
          </div>

          {/* Bottom Divider */}
          <div className="border-t border-tactical mt-8 pt-4">
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              {t('home.hero.footer')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>);

}