'use client';

import * as motion from 'motion/react-client';
import { useRef } from 'react';
import { useInView } from 'motion/react';
import { ProductivityCard } from '@/components/ProductivityCard';

export default function ProductivitySection() {
  const fadeInRef = useRef<HTMLDivElement>(null);
  const fadeInInView = useInView(fadeInRef as unknown as React.RefObject<Element>, { once: true });

  const fadeUpVariants = {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <section
      className="flex w-full flex-col items-center gap-10 pt-20"
      aria-labelledby="productivity-section-heading"
      itemScope
      itemType="https://schema.org/CreativeWork"
    >
   

        <ProductivityCard />
    </section>
  );
}
