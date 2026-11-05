import React, { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES, ThemeId, applyTheme, getTheme } from '../../utils/theme';

export const ThemePicker: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>(getTheme());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (id: ThemeId) => {
    applyTheme(id);
    setCurrent(id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
        aria-label="Change theme"
        title="Change theme"
      >
        <Palette className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Theme</p>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => choose(t.id)}
              className="w-full flex items-center gap-3 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
            >
              <span className="w-4 h-4 rounded-full border border-slate-200" style={{ background: t.color }} />
              <span className="flex-1 text-left font-medium">{t.name}</span>
              {current === t.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
