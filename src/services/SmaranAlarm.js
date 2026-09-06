import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

const {SmaranAlarm} = NativeModules;

const requireModule = () => {
  if (!SmaranAlarm) {
    throw new Error('SmaranAlarm native module is unavailable. Rebuild the Android app.');
  }
  return SmaranAlarm;
};

const requestPermissions = async () => {
  if (Platform.OS !== 'android') return false;
  const module = requireModule();

  if (Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      {
        title: 'Smaran Reminder Notifications',
        message: 'Smaran needs notification permission so medication and task alarms can appear while the app is in the background.',
        buttonPositive: 'Allow',
        buttonNegative: 'Not now',
      },
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }

  await module.requestNotificationPermission?.();
  return true;
};

const openExactAlarmSettings = () => requireModule().openExactAlarmSettings();
const openFullScreenIntentSettings = () => requireModule().openFullScreenIntentSettings();
const canScheduleExactAlarms = () => requireModule().canScheduleExactAlarms();
const canUseFullScreenIntent = () => requireModule().canUseFullScreenIntent();

const parseTime = value => {
  const text = String(value || '').trim().toUpperCase();
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3];

  if (meridiem === 'AM' && hour === 12) hour = 0;
  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (hour > 23 || minute > 59) return null;

  return {hour, minute};
};

const getTriggerAt = reminder => {
  const explicit = reminder?.dateTime || reminder?.scheduledAt || reminder?.timestamp;
  if (explicit) {
    const parsed = typeof explicit === 'number' ? explicit : Date.parse(String(explicit));
    if (Number.isFinite(parsed) && parsed > Date.now() + 1000) {
      return {triggerAt: parsed, daily: false};
    }
  }

  const parsed = parseTime(reminder?.time || reminder?.startTime || reminder?.scheduledTime);
  if (!parsed) return null;

  const date = new Date();
  date.setHours(parsed.hour, parsed.minute, 0, 0);
  if (date.getTime() <= Date.now() + 1000) date.setDate(date.getDate() + 1);

  return {triggerAt: date.getTime(), daily: true};
};

const scheduleReminder = async reminder => {
  if (!reminder?.id || reminder?.done || reminder?.completed) return false;
  const schedule = getTriggerAt(reminder);
  if (!schedule) return false;

  await requestPermissions();

  return requireModule().scheduleReminder(
    String(reminder.id),
    String(reminder.title || reminder.name || reminder.task || 'Smaran Reminder'),
    String(reminder.detail || reminder.description || reminder.notes || 'It is time for your scheduled task.'),
    schedule.triggerAt,
    schedule.daily,
  );
};

const cancelReminder = id => {
  if (!id || !SmaranAlarm) return Promise.resolve(false);
  return SmaranAlarm.cancelReminder(String(id));
};

const syncReminders = async reminders => {
  if (Platform.OS !== 'android' || !SmaranAlarm) return;

  await requestPermissions();

  const exact = await canScheduleExactAlarms().catch(() => true);
  if (!exact) {
    console.log('Smaran: exact alarm access is not enabled; using Android inexact fallback.');
  }

  const safe = Array.isArray(reminders) ? reminders : [];
  await SmaranAlarm.cancelAllReminders();

  for (const reminder of safe) {
    if (reminder?.done || reminder?.completed) continue;
    try {
      await scheduleReminder(reminder);
    } catch (error) {
      console.log('Smaran native alarm schedule error:', error);
    }
  }
};

const stopActiveAlarm = () => SmaranAlarm?.stopActiveAlarm?.();

export default {
  requestPermissions,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  canScheduleExactAlarms,
  canUseFullScreenIntent,
  scheduleReminder,
  cancelReminder,
  syncReminders,
  stopActiveAlarm,
};
