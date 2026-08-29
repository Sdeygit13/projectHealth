import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = '@smaran/profile/v6';
const REMINDERS_KEY = '@smaran/reminders/v6';

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.log('Save profile error:', error);
  }
}

export async function loadProfile() {
  try {
    const value = await AsyncStorage.getItem(PROFILE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.log('Load profile error:', error);
    return null;
  }
}

export async function clearProfile() {
  try {
    await AsyncStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.log('Clear profile error:', error);
  }
}

export async function saveReminders(reminders) {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.log('Save reminders error:', error);
  }
}

export async function loadReminders() {
  try {
    const value = await AsyncStorage.getItem(REMINDERS_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.log('Load reminders error:', error);
    return null;
  }
}

export async function clearReminders() {
  try {
    await AsyncStorage.removeItem(REMINDERS_KEY);
  } catch (error) {
    console.log('Clear reminders error:', error);
  }
}
