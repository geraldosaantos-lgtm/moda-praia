import React from 'react';

interface BarcodeBadgeProps {
  sku: string;
  className?: string;
  showText?: boolean;
}

export const BarcodeBadge: React.FC<BarcodeBadgeProps> = ({ sku, className = '', showText = true }) => {
  // Generate pseudo barcode bars deterministically from SKU string
  const bars = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < sku.length; i++) {
      hash = (hash << 5) - hash + sku.charCodeAt(i);
      hash |= 0;
    }

    const pattern: number[] = [2, 1, 3, 1]; // start pattern
    for (let i = 0; i < sku.length; i++) {
      const code = sku.charCodeAt(i);
      pattern.push((code % 3) + 1);
      pattern.push(((code >> 2) % 3) + 1);
      pattern.push(((code >> 4) % 2) + 1);
    }
    pattern.push(2, 1, 2); // end pattern
    return pattern;
  }, [sku]);

  return (
    <div className={`inline-flex flex-col items-center bg-white px-2 py-1 border border-slate-200 rounded ${className}`}>
      <svg
        className="h-7 w-32"
        viewBox={`0 0 ${bars.reduce((a, b) => a + b, 0)} 30`}
        preserveAspectRatio="none"
      >
        {bars.map((width, idx) => {
          const isBlack = idx % 2 === 0;
          const xOffset = bars.slice(0, idx).reduce((a, b) => a + b, 0);
          return (
            <rect
              key={idx}
              x={xOffset}
              y={0}
              width={width}
              height={30}
              fill={isBlack ? '#0f172a' : 'transparent'}
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-wider text-slate-600 mt-0.5 select-all">
          {sku}
        </span>
      )}
    </div>
  );
};
