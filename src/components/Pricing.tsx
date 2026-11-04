import React from 'react';
import { PRICING_DATA, PricingPlan } from '../data/landingData';

interface PricingProps {
  onSelectPlan: (plan: PricingPlan) => void;
}

export const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
  return (
    <section id="harga" className="py-16 sm:py-20 lg:py-28 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-left mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight mb-2">
            Harga
          </h2>
          <p className="text-ink-muted text-sm sm:text-base">
            Mulai gratis. Upgrade kalau kebutuhan grup kamu bertambah.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_DATA.map((plan) => {
            const isPro = plan.isPro;
            // Responsive ordering:
            // Mobile: Pro (order-1), Plus (order-2), Free (order-3)
            // Desktop: Free (order-1), Plus (order-2), Pro (order-3)
            let orderClass = 'order-2 md:order-2';
            if (plan.id === 'pro') {
              orderClass = 'order-1 md:order-3';
            } else if (plan.id === 'free') {
              orderClass = 'order-3 md:order-1';
            }

            return (
              <div
                key={plan.id}
                className={`${orderClass} rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  isPro
                    ? 'bg-dark text-white border border-dark shadow-xl'
                    : 'bg-white text-ink border border-line shadow-sm hover:border-ink/20'
                }`}
              >
                <div>
                  {/* Top row: Name & Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        isPro ? 'text-white/90' : 'text-ink'
                      }`}
                    >
                      {plan.name}
                    </span>
                    {plan.badge && (
                      <span className="bg-lime text-ink text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6">
                    <span
                      className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                        isPro ? 'text-white' : 'text-ink'
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className={`text-xs sm:text-sm font-semibold ${
                          isPro ? 'text-white/70' : 'text-ink-muted'
                        }`}
                      >
                        {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8 text-xs sm:text-sm">
                    {plan.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-2 ${
                          isPro ? 'text-dark-text/90' : 'text-ink'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                            isPro ? 'bg-lime' : 'bg-ink'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full min-h-[44px] py-3.5 px-5 rounded-xl font-bold text-sm tracking-wide transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink ${
                      isPro
                        ? 'bg-lime hover:bg-lime-hover text-ink shadow-sm'
                        : 'border-2 border-ink text-ink hover:bg-ink hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

