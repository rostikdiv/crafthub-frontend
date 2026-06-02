import React from 'react';
import { motion } from 'framer-motion';
import { BadgeType } from '../../lib/types';
type StampBadgeProps = {
  type: BadgeType;
  className?: string;
};
const badgeConfig: Record<
  BadgeType,
  {
    color: string;
    borderColor: string;
    rotation: number;
  }> =
{
  VERIFIED: {
    color: 'text-tactical',
    borderColor: 'border-tactical',
    rotation: -3
  },
  RESTRICTED: {
    color: 'text-restricted',
    borderColor: 'border-restricted',
    rotation: 3
  },
  NEW: {
    color: 'text-amber',
    borderColor: 'border-amber',
    rotation: -2
  },
  CLEARANCE: {
    color: 'text-amber-dark',
    borderColor: 'border-amber-dark',
    rotation: 2
  }
};
export function StampBadge({ type, className = '' }: StampBadgeProps) {
  const config = badgeConfig[type];
  return (
    <motion.span
      initial={{
        scale: 0.8,
        opacity: 0
      }}
      animate={{
        scale: 1,
        opacity: 1
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 15
      }}
      className={`
        inline-block px-2 py-1
        border-2 ${config.borderColor} ${config.color}
        font-bold text-[10px] uppercase tracking-widest
        ${className}
      `}
      style={{
        transform: `rotate(${config.rotation}deg)`
      }}>

      {type}
    </motion.span>);

}