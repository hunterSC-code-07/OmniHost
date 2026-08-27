import React from 'react';
import { useModalStore } from '../../store/useModalStore';

// Note: Replace this placeholder with an actual modal component implementation 
// (e.g., using your UI library's Dialog or Modal components)
const SevenDaysConfigModal: React.FC<{ serverId: number; onClose: () => void }> = ({ serverId, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-white">7 Days to Die Configuration</h2>
        <p className="text-gray-300 mb-6">Editing configuration for server: {serverId}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const SevenDaysModals: React.FC = () => {
  const {
    isSevenDaysConfigModalOpen,
    sevenDaysConfigServerId,
    closeSevenDaysConfigModal
  } = useModalStore();

  return (
    <>
      {isSevenDaysConfigModalOpen && sevenDaysConfigServerId !== null && (
        <SevenDaysConfigModal 
          serverId={sevenDaysConfigServerId}
          onClose={closeSevenDaysConfigModal}
        />
      )}
    </>
  );
};
