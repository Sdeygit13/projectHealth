import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

const CHANNEL_ID = 'smaran-reminders';
const REMINDER_PREFIX = 'smaran-reminder-';

const getNotificationId = id => `${REMINDER_PREFIX}${String(id)}`;

const getFirstName = name =>
  String(name || 'Patient').trim().split(/\s+/)[0] || 'Patient';

function getNextReminderTimestamp(time) {
  const match = String(time || '').match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.getTime();
}

const hasNotificationPermission = settings =>
  settings?.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
  settings?.authorizationStatus === AuthorizationStatus.PROVISIONAL;

function hasExactAlarmPermission(settings) {
  if (!settings?.android) return true;
  if (settings.android.alarm === AndroidNotificationSetting.NOT_SUPPORTED) return true;
  return settings.android.alarm === AndroidNotificationSetting.ENABLED;
}

export async function prepareNotifications() {
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Smaran Reminders',
      description: 'Medicine and daily reminder notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
    const settings = await notifee.requestPermission();
    return hasNotificationPermission(settings);
  } catch (error) {
    console.log('Notification setup error:', error);
    return false;
  }
}

export async function getNotificationStatus() {
  try {
    const settings = await notifee.getNotificationSettings();
    return {
      notificationPermission: hasNotificationPermission(settings),
      exactAlarmPermission: hasExactAlarmPermission(settings),
      authorizationStatus: settings?.authorizationStatus ?? null,
      androidAlarm: settings?.android?.alarm ?? null,
    };
  } catch (error) {
    console.log('Get notification status error:', error);
    return {notificationPermission: false, exactAlarmPermission: false, authorizationStatus: null, androidAlarm: null};
  }
}

export async function scheduleReminder(reminder, patientName) {
  try {
    if (!reminder?.id) return false;
    const notificationId = getNotificationId(reminder.id);

    await cancelReminder(reminder.id);
    if (reminder.done) return true;

    const settings = await notifee.getNotificationSettings();
    if (!hasNotificationPermission(settings)) return false;

    const timestamp = getNextReminderTimestamp(reminder.time);
    if (!timestamp) return false;

    const firstName = getFirstName(patientName);
    const title = `Dear ${firstName}, your reminder`;
    const detail = String(reminder.detail || '').trim();
    const body = detail
      ? `${reminder.title} is at ${reminder.time} — ${detail}.`
      : `${reminder.title} is at ${reminder.time}.`;

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title,
        body,
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: {id: 'default'},
          autoCancel: true,
        },
        ios: {sound: 'default'},
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp,
        repeatFrequency: RepeatFrequency.DAILY,
        ...(hasExactAlarmPermission(settings) ? {alarmManager: true} : {}),
      },
    );
    return true;
  } catch (error) {
    console.log('Schedule reminder error:', error);
    return false;
  }
}

export async function cancelReminder(reminderId) {
  try {
    if (!reminderId) return false;
    await notifee.cancelTriggerNotification(getNotificationId(reminderId));
    return true;
  } catch (error) {
    console.log('Cancel reminder error:', error);
    return false;
  }
}

export async function syncReminderNotifications(reminders = [], patientName) {
  try {
    const settings = await notifee.getNotificationSettings();
    if (!hasNotificationPermission(settings)) return false;

    const ids = await notifee.getTriggerNotificationIds();
    await Promise.all(
      ids.filter(id => String(id).startsWith(REMINDER_PREFIX)).map(id => notifee.cancelTriggerNotification(id)),
    );

    const active = Array.isArray(reminders) ? reminders.filter(item => item && !item.done) : [];
    const results = await Promise.all(active.map(item => scheduleReminder(item, patientName)));
    return results.every(Boolean);
  } catch (error) {
    console.log('Sync reminder notifications error:', error);
    return false;
  }
}

export async function openReminderAlarmSettings() {
  try {
    if (typeof notifee.openAlarmPermissionSettings === 'function') {
      await notifee.openAlarmPermissionSettings();
      return true;
    }
  } catch (error) {
    console.log('Open alarm settings error:', error);
  }
  return false;
}

export async function openReminderNotificationSettings() {
  try {
    if (typeof notifee.openNotificationSettings === 'function') {
      await notifee.openNotificationSettings(CHANNEL_ID);
      return true;
    }
  } catch (error) {
    console.log('Open notification settings error:', error);
  }
  return false;
}

export async function getScheduledReminders() {
  try {
    const notifications = await notifee.getTriggerNotifications();
    return notifications.filter(item => String(item?.notification?.id || '').startsWith(REMINDER_PREFIX));
  } catch (error) {
    console.log('Get scheduled reminders error:', error);
    return [];
  }
}

export default {
  prepareNotifications,
  getNotificationStatus,
  scheduleReminder,
  cancelReminder,
  syncReminderNotifications,
  openReminderAlarmSettings,
  openReminderNotificationSettings,
  getScheduledReminders,
};
