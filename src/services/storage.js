import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@smaran/profile/v7';
const REMINDERS_KEY = '@smaran/reminders/v7';
const PEOPLE_KEY = '@smaran/people/v1';
const MEMORIES_KEY = '@smaran/memories/v1';
const LEGACY_PROFILE_KEY = '@smaran/profile/v6';
const LEGACY_REMINDERS_KEY = '@smaran/reminders/v6';

async function setJSON(key, value, label) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.log(`${label} error:`, error);
    return false;
  }
}

async function getJSON(key, fallback, label) {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch (error) {
    console.log(`${label} error:`, error);
    return fallback;
  }
}

export async function saveProfile(profile) {
  if (!profile || typeof profile !== 'object') return false;
  return setJSON(PROFILE_KEY, profile, 'Save profile');
}

export async function loadProfile() {
  const current = await getJSON(PROFILE_KEY, null, 'Load profile');
  if (current) return current;
  const legacy = await getJSON(LEGACY_PROFILE_KEY, null, 'Load legacy profile');
  if (legacy) {
    await saveProfile(legacy);
    return legacy;
  }
  return null;
}

export async function updateProfile(updates) {
  if (!updates || typeof updates !== 'object') return false;
  const current = (await loadProfile()) || {};
  return saveProfile({...current, ...updates});
}

export async function clearProfile() {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
    return true;
  } catch (error) {
    console.log('Clear profile error:', error);
    return false;
  }
}

export async function saveReminders(reminders) {
  if (!Array.isArray(reminders)) return false;
  return setJSON(REMINDERS_KEY, reminders, 'Save reminders');
}

export async function loadReminders() {
  const value = await getJSON(REMINDERS_KEY, null, 'Load reminders');
  if (Array.isArray(value)) return value;
  const legacy = await getJSON(LEGACY_REMINDERS_KEY, [], 'Load legacy reminders');
  return Array.isArray(legacy) ? legacy : [];
}

export async function addReminder(reminder) {
  if (!reminder || typeof reminder !== 'object') return false;
  const current = await loadReminders();
  if (current.some(item => String(item.id) === String(reminder.id))) return false;
  return saveReminders([...current, reminder]);
}

export async function updateReminder(reminderId, updates) {
  if (!reminderId || !updates || typeof updates !== 'object') return false;
  const current = await loadReminders();
  const next = current.map(item =>
    String(item.id) === String(reminderId) ? {...item, ...updates} : item,
  );
  return saveReminders(next);
}

export async function deleteReminder(reminderId) {
  if (!reminderId) return false;
  const current = await loadReminders();
  return saveReminders(current.filter(item => String(item.id) !== String(reminderId)));
}

export async function clearReminders() {
  try {
    await AsyncStorage.removeItem(REMINDERS_KEY);
    return true;
  } catch (error) {
    console.log('Clear reminders error:', error);
    return false;
  }
}

export async function savePeople(people) {
  if (!Array.isArray(people)) return false;
  return setJSON(PEOPLE_KEY, people, 'Save circle people');
}

export async function loadPeople() {
  const value = await getJSON(PEOPLE_KEY, [], 'Load circle people');
  return Array.isArray(value) ? value : [];
}

export async function clearPeople() {
  try {
    await AsyncStorage.removeItem(PEOPLE_KEY);
    return true;
  } catch (error) {
    console.log('Clear circle people error:', error);
    return false;
  }
}

export async function saveMemories(memories) {
  if (!Array.isArray(memories)) return false;
  return setJSON(MEMORIES_KEY, memories, 'Save memories');
}

export async function loadMemories() {
  const value = await getJSON(MEMORIES_KEY, [], 'Load memories');
  return Array.isArray(value) ? value : [];
}

export async function clearMemories() {
  try {
    await AsyncStorage.removeItem(MEMORIES_KEY);
    return true;
  } catch (error) {
    console.log('Clear memories error:', error);
    return false;
  }
}

export async function clearAllStorage() {
  try {
    // Remove current and legacy keys so a logout starts with a truly
    // clean account. Otherwise the v6 migration fallback could restore
    // old profile/reminder data on the next launch.
    await AsyncStorage.multiRemove([
      PROFILE_KEY,
      REMINDERS_KEY,
      PEOPLE_KEY,
      MEMORIES_KEY,
      LEGACY_PROFILE_KEY,
      LEGACY_REMINDERS_KEY,
    ]);
    return true;
  } catch (error) {
    console.log('Clear all storage error:', error);
    return false;
  }
}

export async function hasProfile() {
  try {
    return !!(await AsyncStorage.getItem(PROFILE_KEY));
  } catch (error) {
    console.log('Check profile error:', error);
    return false;
  }
}

export const STORAGE_KEYS = {
  PROFILE_KEY,
  REMINDERS_KEY,
  PEOPLE_KEY,
  MEMORIES_KEY,
};

export default {
  saveProfile,
  loadProfile,
  updateProfile,
  clearProfile,
  saveReminders,
  loadReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  clearReminders,
  savePeople,
  loadPeople,
  clearPeople,
  saveMemories,
  loadMemories,
  clearMemories,
  clearAllStorage,
  hasProfile,
  STORAGE_KEYS,
};
