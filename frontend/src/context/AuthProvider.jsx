import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AuthContext from './authContext.js';
import api from '../services/api.js';

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    const controller = new AbortController();
    let current = true;
    if (!sessionStorage.getItem('swd.session')) {
      Promise.resolve().then(() => {
        if (current && version === requestVersion.current) setLoading(false);
      });
    } else {
      api
        .get('/auth/me', { signal: controller.signal })
        .then((currentUser) => {
          if (current && version === requestVersion.current)
            setUser(currentUser);
        })
        .catch((error) => {
          if (
            current &&
            !controller.signal.aborted &&
            version === requestVersion.current
          ) {
            sessionStorage.removeItem('swd.session');
            setSessionError(error.message);
          }
        })
        .finally(() => {
          if (current && version === requestVersion.current) setLoading(false);
        });
    }
    function expire() {
      ++requestVersion.current;
      sessionStorage.removeItem('swd.session');
      setUser(null);
      setLoading(false);
      setSessionError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    window.addEventListener('swd-session-expired', expire);
    return () => {
      current = false;
      controller.abort();
      window.removeEventListener('swd-session-expired', expire);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const result = await api.post('/auth/login', credentials);
    ++requestVersion.current;
    sessionStorage.setItem('swd.session', result.token);
    setUser(result.user);
    setSessionError('');
    setLoading(false);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    ++requestVersion.current;
    sessionStorage.removeItem('swd.session');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, sessionError }),
    [user, loading, login, logout, sessionError],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
