import { createContext, PropsWithChildren, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { api, restoreSession, saveSession, storage, pendingInvite } from './api';
import { currentLocation } from './location';
import type { Snapshot } from '../types';

type State = {
  data: Snapshot | null;
  ready: boolean;
  error: string;
  refresh: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  complete: (ticket: string) => Promise<void>;
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
  }, []);

  useEffect(() => {
    let live = true;
    restoreSession()
      .then(async has => {
        if (has && live) await refresh();
      })
      .catch(e => setError(e.message))
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, [refresh]);

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
  }, [refresh]);

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

  const complete = useCallback(async (ticket: string) => {
    const verifier = await storage.get('findme-login-verifier');
    if (!verifier) throw new Error('Login session expired. Please sign in again.');
    const result = await api<{ token: string }>('/auth/exchange', { ticket, verifier });
    await saveSession(result.token);
    await storage.remove('findme-login-verifier');
    await refresh();
    const invite = await pendingInvite.get();
    router.replace(invite ? { pathname: '/join', params: { code: invite } } : '/');
  }, [refresh]);

  const login = async () => {
    const verifier = Array.from(await Crypto.getRandomBytesAsync(32)).map(b => b.toString(16).padStart(2, '0')).join('');
    const challenge = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    await storage.set('findme-login-verifier', verifier);
    
    const redirectUri = Platform.OS === 'web'
      ? `${window.location.origin}/auth/callback`
      : 'findme://auth/callback';
      
    const result = await api<{ url: string }>('/auth/line/start', { challenge, redirectUri });
    if (Platform.OS === 'web') {
      window.location.assign(result.url);
      return;
    }
    const response = await WebBrowser.openAuthSessionAsync(result.url, redirectUri);
    if (response.type === 'success') {
      const params = new URL(response.url).searchParams;
      if (params.get('error')) throw new Error(params.get('error')!);
      const ticket = params.get('ticket');
      if (ticket) await complete(ticket);
    } else {
      throw new Error('LINE Login was cancelled.');
    }
  };

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
    <Context.Provider value={{ data, ready, error, refresh, login, logout, complete, sharing, share }}>
      {children}
    </Context.Provider>
  );
}

export function useSession() {
  const state = useContext(Context);
  if (!state) throw new Error('Session provider missing.');
  return state;
}


