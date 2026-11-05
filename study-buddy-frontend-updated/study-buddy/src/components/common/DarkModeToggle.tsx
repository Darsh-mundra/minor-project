import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Mode, applyMode, getMode } from '../../utils/theme';

export const DarkModeToggle: React.FC = () => {
  const [mode, setMode] = useState<Mode>(getMode());

  const toggle = () => {
    const next: Mode = mode === 'dark' ? 'light' : 'dark';
    applyMode(next);
    setMode(next);
  };

  return (
    <button
      onClick={toggle}
      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
