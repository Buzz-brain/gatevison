import type { Variants, Transition } from "framer-motion";

// Spring transitions for premium feel
const spring = { type: "spring" as const, stiffness: 200, damping: 20, mass: 0.8 };
const springGentle = { type: "spring" as const, stiffness: 150, damping: 22, mass: 1 };
const springBouncy = { type: "spring" as const, stiffness: 300, damping: 15, mass: 0.6 };

export const defaultTransition: Transition = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1],
};

export const fastTransition: Transition = {
  duration: 0.15,
  ease: [0.25, 0.1, 0.25, 1],
};

export const slowTransition: Transition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

// Base animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: defaultTransition },
  exit: { opacity: 0, transition: fastTransition },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: springGentle },
  exit: { opacity: 0, y: 8, transition: fastTransition },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: defaultTransition },
  exit: { opacity: 0, y: -4, transition: fastTransition },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: springGentle },
  exit: { opacity: 0, x: -8, transition: fastTransition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.95, transition: fastTransition },
};

// Interactive variants
export const cardHoverVariants = {
  rest: { scale: 1, y: 0, boxShadow: "var(--shadow-card)" },
  hover: { scale: 1.01, y: -1, boxShadow: "var(--shadow-card-hover)" },
  tap: { scale: 0.99, boxShadow: "var(--shadow-card)" },
};

export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
};

// List/Grid entrance animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springGentle,
  },
};

export const staggerItemFast: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
};

// Page transitions
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(1px)",
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Modal animations
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Count-up animation
export const countUp = (target: number, duration = 0.8): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration },
  },
});

// Icon animation
export const iconPop: Variants = {
  hidden: { scale: 0 },
  visible: { scale: 1, transition: springBouncy },
};

// Badge pulse
export const badgePulse: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.15, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};
