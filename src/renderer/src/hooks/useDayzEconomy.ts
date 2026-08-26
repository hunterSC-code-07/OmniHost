import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

export function useDayzEconomy() {
  const { activeServerId } = useServerStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Economy State
  const [pristineLoot, setPristineLoot] = useState(false);
  
  // Default multipliers are 1
  const [multipliers, setMultipliers] = useState<Record<string, number>>({
    food: 1.0,
    weapons: 1.0,
    clothes: 1.0,
    tools: 1.0,
    vehiclesparts: 1.0,
  });

  useEffect(() => {
    loadEconomy();
  }, [activeServerId]);

  const loadEconomy = async () => {
    if (!activeServerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await (window.api as any).getDayzEconomy(activeServerId);
      if (data) {
        setPristineLoot(data.pristineLoot);
      } else {
        setError('Could not read economy files. Make sure the server has been started at least once so the mission files exist.');
      }
    } catch (e) {
      console.error("Failed to load DayZ economy", e);
      setError('An error occurred while reading economy files.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiplierChange = (category: string, value: number) => {
    setMultipliers(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settings = {
        pristineLoot,
        multipliers
      };
      
      const success = await (window.api as any).updateDayzEconomy(activeServerId, settings);
      if (success) {
        alert('Economy settings updated successfully! Original XML files were backed up.');
      } else {
        alert('Failed to update economy settings. Mission files might be missing.');
      }
    } catch (e) {
      console.error("Failed to save DayZ economy", e);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    error,
    pristineLoot, setPristineLoot,
    multipliers,
    loadEconomy,
    handleMultiplierChange,
    handleSave
  };
}
