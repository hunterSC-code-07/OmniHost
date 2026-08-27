import React from 'react';
import { GameBackgrounds } from './GameBackgrounds';
import { TopNavbar } from './TopNavbar';
import { useToastStore } from '../../store/useToastStore';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { toasts } = useToastStore();

  return (
    <div className="bg-gradient-to-b from-[#121212] to-[#050505] font-body-md text-on-background w-full h-screen flex flex-col overflow-hidden relative">
      <GameBackgrounds />
      <TopNavbar />
      
      <main className="relative pt-20 bg-transparent flex-1 w-full flex flex-col min-h-0 overflow-hidden outline-none">
        {children}
      </main>

      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="relative overflow-hidden group bg-[#050505]/80 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-5 py-3 rounded-xl flex items-center gap-3 pointer-events-auto">
            <span className="relative z-10 font-bold text-sm text-white">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
