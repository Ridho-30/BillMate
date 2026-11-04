import React from 'react';
import { SPLIT_BILL_MOCK } from '../data/landingData';

export const SplitBillMock: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-line p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line/60">
        <h3 className="font-extrabold text-ink text-base tracking-tight">
          {SPLIT_BILL_MOCK.title}
        </h3>
        <span className="text-xs font-medium text-ink-muted bg-gray-50 px-2 py-0.5 rounded-full border border-line/50">
          {SPLIT_BILL_MOCK.memberCount}
        </span>
      </div>

      {/* Items list */}
      <div className="py-3 space-y-2 text-xs sm:text-sm">
        {SPLIT_BILL_MOCK.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-ink-muted">
            <span className={item.name.includes('Pajak') ? 'font-medium text-ink' : ''}>
              {item.name}
            </span>
            <span className={`font-semibold tabular-nums ${item.name.includes('Pajak') ? 'text-ink' : 'text-ink'}`}>
              {item.price}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-line/80 my-2"></div>

      {/* Breakdown per person */}
      <div className="py-2 space-y-2.5 text-xs sm:text-sm">
        {SPLIT_BILL_MOCK.results.map((person, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="font-semibold text-ink">{person.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink tabular-nums">{person.amount}</span>
              {person.paid ? (
                <span className="bg-lime text-ink text-[11px] font-bold px-2 py-0.5 rounded-md">
                  {person.statusText}
                </span>
              ) : (
                <span className="bg-gray-100 text-ink-muted border border-line text-[11px] font-medium px-2 py-0.5 rounded-md">
                  {person.statusText}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action button */}
      <div className="mt-4 pt-1">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="w-full min-h-[44px] bg-lime hover:bg-lime-hover text-ink font-bold text-sm py-3 px-4 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm cursor-default"
        >
          {SPLIT_BILL_MOCK.ctaText}
        </button>
      </div>
    </div>
  );
};

