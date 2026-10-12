import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export default function useUnsavedChanges(dirty) {
  const blocker = useBlocker(Boolean(dirty));
  useEffect(() => {
    if (!dirty) return;
    function warn(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return blocker;
}
