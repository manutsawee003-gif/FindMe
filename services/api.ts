import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API = process.env.EXPO_PUBLIC_API_BASE_URL || (Platform.OS === 'web' ? 'http://localhost:8787' : 'http://localhost:8787');
let session = '';

export const storage = {
  get: (key: string) => Platform.OS === 'web' ? Promise.resolve(sessionStorage.getItem(key)) : SecureStore.getItemAsync(key),
  set: (key: string, value: string) => Platform.OS === 'web' ? Promise.resolve(sessionStorage.setItem(key, value)) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => Platform.OS === 'web' ? Promise.resolve(sessionStorage.removeItem(key)) : SecureStore.deleteItemAsync(key),
};

export async function restoreSession() {
  session = await storage.get('findme-session') || '';
  return !!session;
}

export async function saveSession(value: string) {
  session = value;
  if (value) await storage.set('findme-session', value);
  else await storage.remove('findme-session');
}

export async function checkServerHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return { ok: true, message: data.service || 'FindMe API' };
    }
    return { ok: false, message: `Server error (${res.status})` };
  } catch (err) {
    return { ok: false, message: 'Cannot connect to backend server at ' + API };
  }
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  if (!API) throw new Error('Backend URL (EXPO_PUBLIC_API_BASE_URL) is not configured.');
  try {
    const response = await fetch(`${API}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session}` } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
    
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server returned invalid response (${response.status})`);
    }

    if (!response.ok) {
      throw new Error(data?.error || `Unable to complete request (${response.status})`);
    }
    return data;
  } catch (error: any) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Connection timed out. Please try again.');
    }
    if (error.message && !error.message.includes('fetch') && !error.message.includes('Network request failed')) {
      throw error;
    }
    throw new Error('Cannot connect to backend server. Make sure the server is running on ' + API);
  }
}

export async function publicApi<T>(path: string): Promise<T> {
  if (!API) throw new Error('Set backend URL first.');
  try {
    const response = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(10000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load public map data.');
    return data;
  } catch (err: any) {
    return [] as unknown as T;
  }
}

export const pendingInvite = {
  get: () => AsyncStorage.getItem('findme-invite'),
  set: (value: string) => AsyncStorage.setItem('findme-invite', value),
  clear: () => AsyncStorage.removeItem('findme-invite')
};

