import { createContext, PropsWithChildren, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { api, restoreSession, saveSession } from './api';
import { currentLocation } from './location';
import type { Snapshot } from '../types';

type State = {
  data: Snapshot | null;
  ready: boolean;
  error: string;
  refresh: () => Promise<void>;
  enter: (name: string) => Promise<void>;
  setEmergency: (emergency: Snapshot['emergency']) => void;
  logout: () => Promise<void>;
  sharing: boolean;
  share: (on: boolean) => Promise<void>;
};

const Context = createContext<State | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const active = useRef(AppState.currentState === 'active');
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    if (!data) return;
    try {
      const next = await api<Snapshot>('/snapshot');
      setData(next);
      setError('');
    } catch (e: any) {
      if (e.message?.includes('sign in')) {
        setData(null);
        await saveSession('');
      } else {
        setError(e.message);
      }
    }
  }, [data]);

  const enter = useCallback(async (name: string) => {
    const displayName = name.trim();
    if (!displayName) throw new Error('Please enter your name.');
    const result = await api<{ token: string }>('/auth/guest', { name: displayName });
    await saveSession(result.token);
    const snapshot = await api<Snapshot>('/snapshot');
    setData(snapshot);
    setError('');
  }, []);

  useEffect(() => {
    let live = true;
    restoreSession()
      .then(async hasSession => {
        if (hasSession && live) setData(await api<Snapshot>('/snapshot'));
      })
      .catch(async () => {
        await saveSession('');
        if (live) setData(null);
      })
      .finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      active.current = state === 'active';
    });
    return () => subscription.remove();
  }, []);

  // Poll snapshot every 5 seconds when logged in and app is active
  useEffect(() => {
    if (!data) return;
    let busy = false;
    const interval = setInterval(async () => {
      if (busy || !active.current) return;
      busy = true;
      try {
        await refresh();
      } catch (e: any) {
        setError(e.message);
      } finally {
        busy = false;
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [!data, refresh]);

  const share = useCallback(async (on: boolean) => {
    const version = ++generation.current;
    setSharing(false);
    if (on) {
      const location = await currentLocation();
      if (version !== generation.current) return;
      await api('/location', { isSharing: true, location });
      setSharing(true);
    } else {
      await api('/location', { isSharing: false });
    }
    await refresh();
  }, [data, refresh]);

  useEffect(() => {
    if (!sharing) return;
    let busy = false;
    const interval = setInterval(async () => {
      if (busy || !active.current) return;
      busy = true;
      const version = generation.current;
      try {
        const location = await currentLocation();
        if (version === generation.current) {
          await api('/location', { isSharing: true, location });
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        busy = false;
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [sharing]);

  const setEmergency = useCallback((emergency: Snapshot['emergency']) => {
    setData(previous => previous ? { ...previous, emergency } : previous);
  }, []);

  const logout = async () => {
    ++generation.current;
    setSharing(false);
    try {
      await api('/auth/logout', {});
    } catch {
      // Clean local session even if offline
    }
    await saveSession('');
    setData(null);
  };

  return (
    <Context.Provider value={{ data, ready, error, refresh, enter, setEmergency, logout, sharing, share }}>
      {children}
    </Context.Provider>
  );
}

export function useSession() {
  const state = useContext(Context);
  if (!state) throw new Error('Session provider missing.');
  return state;
}
