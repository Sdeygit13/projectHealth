import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';

const CHANNEL_ID = 'smaran-reminders';

export async function prepareNotifications() {
  try {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Smaran Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    const settings = await notifee.requestPermission();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.log('Notification setup error:', error);
    return false;
  }
}

function nextReminderTimestamp(time) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

export async function scheduleReminder(reminder, patientName) {
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings?.authorizationStatus !== AuthorizationStatus.AUTHORIZED && settings?.authorizationStatus !== AuthorizationStatus.PROVISIONAL) {
      return false;
    }
    if (settings?.android?.alarm === 'DISABLED') return false;

    const timestamp = nextReminderTimestamp(reminder.time);
    if (!timestamp) return false;

    const firstName = String(patientName || 'Patient').trim().split(/\s+/)[0];

    await notifee.cancelNotification(String(reminder.id));

    await notifee.createTriggerNotification(
      {
        id: String(reminder.id),
        title: `Dear ${firstName}, your reminder`,
        body: `${reminder.title} is at ${reminder.time}${reminder.detail ? ` — ${reminder.detail.toLowerCase()}` : ''}.`,
        android: {
          channelId: CHANNEL_ID,
          pressAction: {id: 'default'},
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp,
        repeatFrequency: RepeatFrequency.DAILY,
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
    await notifee.cancelNotification(String(reminderId));
  } catch (error) {
    console.log('Cancel reminder error:', error);
  }
}

export async function syncReminderNotifications(reminders, patientName) {
  try {
    const settings = await notifee.getNotificationSettings();
    if (settings?.authorizationStatus !== AuthorizationStatus.AUTHORIZED && settings?.authorizationStatus !== AuthorizationStatus.PROVISIONAL) {
      return false;
    }
    if (settings?.android?.alarm === 'DISABLED') return false;
    const ids = await notifee.getTriggerNotificationIds();
    await Promise.all(ids.map(id => notifee.cancelNotification(id)));

    const active = reminders.filter(reminder => !reminder.done);
    await Promise.all(active.map(reminder => scheduleReminder(reminder, patientName)));
  } catch (error) {
    console.log('Sync reminder notifications error:', error);
  }
}


export async function openReminderAlarmSettings() {
  try {
    if (notifee.openAlarmPermissionSettings) {
      await notifee.openAlarmPermissionSettings();
    }
  } catch (error) {
    console.log('Open alarm settings error:', error);
  }
}

export default {
  prepareNotifications,
  scheduleReminder,
  cancelReminder,
  syncReminderNotifications,
  openReminderAlarmSettings,
};
