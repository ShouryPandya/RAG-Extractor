import React from 'react';

const MastekLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="145" height="30" viewBox="0 0 145 30" xmlns="http://www.w3.org/2000/svg" {...props} aria-label="Mastek Logo">
        {/* A more robust and readable text-based logo */}
        <text
            x="0"
            y="22"
            fontFamily='-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            fontSize="24"
            fontWeight="500"
            letterSpacing="-0.5"
            fill="currentColor"
        >
            Mastek
            <tspan
                baselineShift="super"
                fontSize="11"
                dx="0.1em"
            >
                ™
            </tspan>
        </text>
        
        {/* Three Blocks - as user said these were correct */}
        <rect x="117.5" y="6" width="7" height="7" rx="1" fill="#00A99D" transform="rotate(-15 121 9.5)" />
        <rect x="122" y="13" width="9" height="9" rx="1.5" fill="currentColor" transform="rotate(20 126.5 17.5)" />
        <rect x="119" y="20" width="6" height="6" rx="1" fill="#9CA3AF" transform="rotate(10 122 23)" />
    </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center">
        <div className="flex items-center gap-2">
            <MastekLogo className="text-slate-100 h-6 w-auto" />
            <h1 className="text-xl md:text-2xl font-semibold text-slate-100 tracking-tight hidden sm:block">
            RAG Extractor
            </h1>
        </div>
      </div>
    </header>
  );
};