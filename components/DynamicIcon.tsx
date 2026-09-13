'use client';

import React from 'react';
import {
  Trophy,
  Award,
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  Heart,
  Medal,
  ThumbsUp,
  Target,
  Rocket,
  CheckCircle2,
} from 'lucide-react';

const ICON_MAP: { [key: string]: React.ElementType } = {
  Trophy,
  Award,
  Star,
  Flame,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  Heart,
  Medal,
  ThumbsUp,
  Target,
  Rocket,
  CheckCircle2,
};

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name] || Award;
  return <IconComponent className={className || 'w-5 h-5'} />;
}

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
