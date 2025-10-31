"use client";

import React, { ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  bgImage?: string;
  speed?: number;
}

export function ParallaxSection({ children, className = "", bgImage, speed = 0.5 }: ParallaxSectionProps) {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.section
      ref={ref}
      className={`relative flex min-h-[50vh] w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <motion.div
        className="relative z-10 w-full"
        style={{ y, opacity }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
} 