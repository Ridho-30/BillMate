import React, { useState } from 'react';
import { FAQ_DATA } from '../data/landingData';
import { ChevronDown } from 'lucide-react';

export const Faq: React.FC = () => {
  // Store open state for each FAQ item; by default all can be open or expandable
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'apakah-gratis': true,
    'teman-punya-akun': true,
    'keamanan-data': true,
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section title */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-8 sm:mb-12">
          Pertanyaan umum
        </h2>

        {/* FAQ list - 3 columns on desktop, stack on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {FAQ_DATA.map((item) => {
            const isOpen = !!openIds[item.id];
            const answerId = `faq-answer-${item.id}`;
            const buttonId = `faq-btn-${item.id}`;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-line p-5 sm:p-6 transition-all duration-200 hover:border-ink/20 flex flex-col justify-start"
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  className="w-full min-h-[44px] flex items-center justify-between text-left gap-3 focus-visible:ring-2 focus-visible:ring-ink rounded-lg"
                >
                  <h3 className="font-extrabold text-ink text-base sm:text-lg tracking-tight">
                    {item.question}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-ink-muted transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`mt-2 text-ink-muted text-sm sm:text-base leading-relaxed overflow-hidden transition-all duration-200 ${
                    isOpen ? 'block opacity-100' : 'hidden opacity-0'
                  }`}
                >
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

