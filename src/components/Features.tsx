import React from 'react';
import { FEATURES_DATA } from '../data/landingData';

export const Features: React.FC = () => {
  return (
    <section id="fitur" className="py-16 sm:py-20 lg:py-28 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-8 sm:mb-12">
          Satu platform, empat fitur
        </h2>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {FEATURES_DATA.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-2xl border border-line p-6 sm:p-7 hover:border-ink/20 hover:shadow-sm transition-all duration-200 flex flex-col justify-start"
            >
              <h3 className="font-extrabold text-ink text-lg sm:text-xl tracking-tight mb-3">
                {feature.title}
              </h3>
              <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

