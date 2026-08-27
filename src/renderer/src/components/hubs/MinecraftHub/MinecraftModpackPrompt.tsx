import React from 'react';
import { useMinecraftHubStore } from '../../../store/useMinecraftHubStore';

export const MinecraftModpackPrompt: React.FC = () => {
  const { showModpackPrompt, setShowModpackPrompt, onRedirectToCreateModpack } = useMinecraftHubStore();

  if (!showModpackPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand/20 rounded-full blur-[60px] pointer-events-none"></div>

        <div className="p-8 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center text-brand shadow-[inset_0_0_15px_rgba(76,175,80,0.2)]">
              <span className="material-symbols-outlined text-3xl">info</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Change to Modpack</h2>
              <p className="text-gray-400 text-sm">Action Recommended</p>
            </div>
          </div>
          
          <p className="text-gray-400 mb-8 leading-relaxed">
            Moving existing vanilla or lightly-modded worlds into heavy CurseForge modpacks can be complicated and cause corruption. Would you like to create a <span className="text-white font-bold">new server</span> for your modpack instead?
          </p>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowModpackPrompt(false)}
              className="px-6 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors font-bold text-gray-400"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setShowModpackPrompt(false);
                if (onRedirectToCreateModpack) onRedirectToCreateModpack();
              }}
              className="px-6 py-2.5 rounded-lg bg-brand hover:brightness-110 text-black transition-all font-bold shadow-[0_0_15px_rgba(76,175,80,0.3)]"
            >
              Create New Server
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
