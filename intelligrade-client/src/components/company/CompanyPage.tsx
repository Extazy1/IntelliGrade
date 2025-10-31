"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ParallaxSection } from './ParallaxSection';
import { TeamMember } from './TeamMember';
import Navbar from '@/components/landing-page/Navbar';

// 团队成员数据
const teamMembers = [
  {
    name: "Qiu Yang",
    role: "Project Manager",
    bio: "Experienced in project coordination and team management, ensuring smooth progress, effective communication, and timely delivery.",
    imageSrc: "/images/company/qy.jpg"
  },
  {
    name: "Li Hongze",
    role: "FrontEnd Developer",
    bio: "Specializes in building intuitive and responsive user interfaces for an enhanced user experience.",
    imageSrc: "/images/company/lhz.jpg"
  },
  {
    name: "Tang Shaorou",
    role: "Backend Developer",
    bio: "Focused on developing robust and scalable backend systems to support seamless functionality.",
    imageSrc: "/images/company/tsr.jpg"
  },
  {
    name: "Zhang Yiqi",
    role: "UI/UX Designer & Frontend Support",
    bio: "Combines creative design with frontend development to deliver visually appealing and user-friendly interfaces.",
    imageSrc: "/images/company/zyq.jpg"
  },
  {
    name: "Dai Shuqi",
    role: "Database Engineer & Backend Support",
    bio: "Expert in database design and optimization, ensuring efficient data management and backend support.",
    imageSrc: "/images/company/dsq.png"
  },
  {
    name: "Liu Xinran",
    role: "Testing Engineer",
    bio: "Dedicated to ensuring software quality through rigorous testing and performance optimization.",
    imageSrc: "/images/company/lxr.jpg"
  }
];

export function CompanyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <ParallaxSection
        className="h-[80vh] text-white"
        bgImage="/images/company/company_bg.png"
        speed={0.2}
      >
        <div className="container px-4 mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Meet Our Team
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            The passionate minds behind IntelliGrade&apos;s mission to transform the grading experience for educators.
          </motion.p>
        </div>
      </ParallaxSection>

      {/* Our Mission */}
      <ParallaxSection className="py-24 bg-background" speed={0.3}>
        <div className="container px-4 mx-auto">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Our Mission</h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">
              At IntelliGrade, we&apos;re on a mission to give educators back their time by simplifying the marking process. We believe that with the right tools, teachers can focus more on what matters most: inspiring and educating the next generation.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground">
              Our AI-powered platform helps educators provide more consistent, thorough, and timely feedback to students, making the assessment process more efficient and effective.
            </p>
          </motion.div>
        </div>
      </ParallaxSection>

      {/* Team Section */}
      <section className="py-24 bg-muted/30 dark:bg-muted/10">
        <div className="container px-4 mx-auto">
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            The People Behind IntelliGrade
          </motion.h2>

          <div className="grid grid-cols-1 gap-12 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <TeamMember
                key={member.name}
                index={index}
                name={member.name}
                role={member.role}
                bio={member.bio}
                imageSrc={member.imageSrc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <ParallaxSection className="py-24 bg-black text-white dark:bg-slate-900" speed={0.4}>
        <div className="container px-4 mx-auto">
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { title: "Innovation", desc: "We constantly push the boundaries of what's possible in EdTech." },
              { title: "Integrity", desc: "We're committed to ethical practices and transparent relationships with our users." },
              { title: "Impact", desc: "We measure our success by the positive difference we make in educators' lives." }
            ].map((value, i) => (
              <motion.div
                key={value.title}
                className="p-8 rounded-xl bg-white/10 dark:bg-white/5 backdrop-blur-sm"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-300">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </ParallaxSection>

      {/* Join Us Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Join Our Journey</h2>
            <p className="text-xl mb-8">
              We&apos;re always looking for talented individuals who share our passion for education and innovation.
            </p>
            <motion.button
              className="px-8 py-3 rounded-md bg-white dark:bg-white text-primary font-medium hover:bg-white/90 dark:hover:bg-white/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Opportunities
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 