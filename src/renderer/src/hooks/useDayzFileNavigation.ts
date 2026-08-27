import { useEffect, useCallback } from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzFileStore } from '../store/useDayzFileStore';

export function useDayzFileNavigation() {
  const { activeServerId } = useServerStore();
  const { currentPath, setCurrentPath, setFiles, setLoading } = useDayzFileStore();

  const fetchDir = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await window.api.fs.listDir(activeServerId, path);
      setFiles(res);
      setCurrentPath(path);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeServerId, setFiles, setCurrentPath, setLoading]);

  useEffect(() => {
    fetchDir('');
  }, [fetchDir]);

  const handleNavigate = (path: string) => {
    fetchDir(path);
  };

  const handleNavigateUp = () => {
    const parts = currentPath.split(/\\|\//).filter(Boolean);
    parts.pop();
    fetchDir(parts.join('/'));
  };

  return {
    fetchDir,
    handleNavigate,
    handleNavigateUp,
  };
}
