import React from 'react';
import { PROBLEMS_DATA } from '../data/landingData';

export const Problems: React.FC = () => {
  return (
    <section className="bg-dark text-dark-text py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-8 sm:mb-12">
          Masalah yang sering terjadi
        </h2>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {PROBLEMS_DATA.map((problem) => (
            <div
              key={problem.id}
              className="bg-dark-card rounded-2xl p-6 sm:p-7 border border-white/5 hover:border-white/10 transition-colors flex flex-col justify-start"
            >
              <h3 className="font-extrabold text-white text-lg sm:text-xl tracking-tight mb-3">
                {problem.title}
              </h3>
              <p className="text-dark-text/80 text-sm sm:text-base leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

