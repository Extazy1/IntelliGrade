"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";

export interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
  index: number;
}

export function TeamMember({ name, role, bio, imageSrc, index }: TeamMemberProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="w-full"
    >
      <Card className="overflow-hidden bg-card/50 dark:bg-card/30 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-2 dark:border-border/50 cursor-pointer group">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-2 group-hover:scale-[1.02] transition-all duration-500">
            <div className="relative h-60 md:h-80 overflow-hidden">
              <Image
                src={imageSrc}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center group-hover:scale-110 transition-all duration-500"
              />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-1">{name}</h3>
              <p className="text-primary font-medium mb-4">{role}</p>
              <p className="text-muted-foreground">{bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 