import { useCallback, useEffect, useState } from 'react';

// Pass a memoized loader accepting AbortSignal. A filter change or route exit
// aborts the previous load so a late response cannot replace the current data.
export default function useAsyncResource(loader, enabled = true) {
  const [resource, setResource] = useState({
    data: null,
    loading: enabled,
    error: null,
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const setData = useCallback(
    (data) => setResource({ data, loading: false, error: null }),
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let current = true;
    Promise.resolve()
      .then(() => {
        if (current)
          setResource((previous) => ({
            ...previous,
            loading: true,
            error: null,
          }));
        return loader(controller.signal);
      })
      .then((data) => {
        if (current) setResource({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (current && !controller.signal.aborted) {
          setResource((previous) => ({ ...previous, loading: false, error }));
        }
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [loader, enabled, revision]);

  return { ...resource, loading: enabled && resource.loading, reload, setData };
}
