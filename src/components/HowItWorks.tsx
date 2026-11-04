import React from 'react';
import { HOW_IT_WORKS_DATA } from '../data/landingData';

export const HowItWorks: React.FC = () => {
  return (
    <section id="cara" className="bg-lime-tint py-16 sm:py-20 lg:py-28 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-8 sm:mb-12">
          Cara kerja
        </h2>

        {/* 3 Step cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {HOW_IT_WORKS_DATA.map((step) => (
            <div
              key={step.step}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-line shadow-sm flex flex-col"
            >
              <div 
                className="text-3xl sm:text-4xl font-extrabold text-[#4E7A0C] tracking-tight mb-3"
                aria-hidden="true"
              >
                {step.step}
              </div>
              <h3 className="font-extrabold text-ink text-lg sm:text-xl tracking-tight mb-2">
                {step.title}
              </h3>
              <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

