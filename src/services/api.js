import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_SESSION_KEY = '@smaran/auth/session/v6';
const API_BASE_URL = 'http://10.0.2.2:8000';

async function request(path, {method = 'GET', body, token} = {}) {
  const headers = {'Content-Type': 'application/json'};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = text;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = text;
    }
  }

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      data?.error ||
      'Request failed. Please try again.';

    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }

  return data;
}

export async function saveAuthSession(session) {
  try {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.log('Save auth session error:', error);
  }
}

export async function loadAuthSession() {
  try {
    const value = await AsyncStorage.getItem(AUTH_SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.log('Load auth session error:', error);
    return null;
  }
}

export async function clearAuthSession() {
  try {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  } catch (error) {
    console.log('Clear auth session error:', error);
  }
}

export async function registerUser(payload) {
  const email = payload?.email || payload?.identifier || '';
  return request('/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password: payload.password,
    },
  });
}

export async function loginUser(payload) {
  const email = payload?.email || payload?.identifier || '';
  return request('/api/auth/login', {
    method: 'POST',
    body: {
      email,
      password: payload.password,
    },
  });
}

export async function fetchCurrentUser(token) {
  return request('/api/auth/me', {
    method: 'GET',
    token,
  });
}

export async function forgotPasswordRequest(payload) {
  const email = payload?.email || payload?.identifier || '';
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: {email},
  });
}

export function getDisplayName(user) {
  if (!user) {
    return 'Caregiver';
  }

  const candidates = [
    user.name,
    user.full_name,
    user.fullName,
    user.first_name,
    user.firstName,
    user.email,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return 'Caregiver';
}
