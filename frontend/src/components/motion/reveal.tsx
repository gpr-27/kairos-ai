import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { staggerContainer } from './variants';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in seconds before the entrance plays. */
  delay?: number;
  /** Play immediately on mount vs once scrolled into view (default). */
  immediate?: boolean;
}

/**
 * Drop-in wrapper that fades + rises content into view.
 * Honors prefers-reduced-motion by rendering statically.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  immediate = false,
}: RevealProps): JSX.Element {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      {...(immediate
        ? { animate: 'show' }
        : { whileInView: 'show', viewport: { once: true, margin: '-60px' } })}
      variants={{
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** Container whose direct `motion` children (variant "fadeUp") stagger in. */
export function Stagger({ children, className }: StaggerProps): JSX.Element {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}
