import { useState, useEffect, useRef } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`w-full bg-[#121212] border ${isOpen ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white outline-none cursor-pointer hover:border-red-500 transition-colors flex justify-between items-center`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <span className="material-symbols-outlined text-[20px] text-gray-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </div>
      {isOpen && (
        <OverlayScrollbarsComponent 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
          className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-red-500/30 rounded-lg z-50 shadow-2xl max-h-60"
        >
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`p-3 cursor-pointer transition-colors ${value === opt.value ? 'bg-red-900/40 text-red-400 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </OverlayScrollbarsComponent>
      )}
    </div>
  )
}

export const CustomNumberInput = ({ value, onChange, min, max }: { value: string, onChange: (val: string) => void, min?: number, max?: number }) => {
  return (
    <div className="flex bg-[#121212] border border-white/10 rounded-lg overflow-hidden focus-within:border-red-500 hover:border-white/20 transition-colors h-[48px]">
      <input 
        type="number"
        className="flex-1 bg-transparent px-3 text-white outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        style={{ MozAppearance: 'textfield' }}
      />
      <div className="flex flex-col border-l border-white/10 w-8 bg-[#1a1a1a]">
        <button 
          type="button"
          className="flex-1 flex items-center justify-center hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-colors"
          onClick={() => onChange(String(Math.min(max ?? Infinity, Number(value) + 1)))}
        >
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
        <button 
          type="button"
          className="flex-1 flex items-center justify-center hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-colors border-t border-white/10"
          onClick={() => onChange(String(Math.max(min ?? -Infinity, Number(value) - 1)))}
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>
    </div>
  )
}
