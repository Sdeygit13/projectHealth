package com.firstproject

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import org.json.JSONObject
import java.util.Calendar
import kotlin.math.abs

object SmaranAlarmManager {

    const val CHANNEL_ID = "smaran_reminder_alarm"
    const val EXTRA_ID = "smaran_alarm_id"
    const val EXTRA_TITLE = "smaran_alarm_title"
    const val EXTRA_DETAIL = "smaran_alarm_detail"
    const val EXTRA_TRIGGER_AT = "smaran_alarm_trigger_at"
    const val EXTRA_DAILY = "smaran_alarm_daily"

    private const val PREFS = "smaran_alarm_store"
    private const val IDS_KEY = "ids"
    private const val SNOOZE_SUFFIX = "__snooze"

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Smaran medication and task alarms",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Time-sensitive Smaran reminders"
            enableVibration(true)
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
        }
        manager.createNotificationChannel(channel)
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    private fun requestCode(id: String): Int =
        abs(id.hashCode()).coerceAtLeast(1)

    private fun pendingIntent(
        context: Context,
        id: String,
        title: String,
        detail: String,
        triggerAt: Long,
        daily: Boolean,
    ): PendingIntent {
        val intent = Intent(context, SmaranAlarmReceiver::class.java).apply {
            putExtra(EXTRA_ID, id)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_DETAIL, detail)
            putExtra(EXTRA_TRIGGER_AT, triggerAt)
            putExtra(EXTRA_DAILY, daily)
            setPackage(context.packageName)
        }

        return PendingIntent.getBroadcast(
            context,
            requestCode(id),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    fun schedule(
        context: Context,
        id: String,
        title: String,
        detail: String,
        triggerAt: Long,
        daily: Boolean,
    ): Boolean {
        createChannel(context)
        cancel(context, id)

        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val safeTrigger = maxOf(triggerAt, System.currentTimeMillis() + 1_000L)
        val intent = pendingIntent(context, id, title, detail, safeTrigger, daily)

        var exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()

        if (exact) {
            try {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    safeTrigger,
                    intent,
                )
            } catch (_: SecurityException) {
                exact = false
            }
        }

        if (!exact) {
            alarmManager.setAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                safeTrigger,
                intent,
            )
        }

        val json = JSONObject().apply {
            put("id", id)
            put("title", title)
            put("detail", detail)
            put("triggerAt", safeTrigger)
            put("daily", daily)
        }

        val ids = prefs(context).getStringSet(IDS_KEY, emptySet())?.toMutableSet() ?: mutableSetOf()
        ids.add(id)

        prefs(context)
            .edit()
            .putString("alarm_$id", json.toString())
            .putStringSet(IDS_KEY, ids)
            .apply()

        return exact
    }

    fun cancel(context: Context, id: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val stored = prefs(context).getString("alarm_$id", null)

        val title = stored?.let { runCatching { JSONObject(it).optString("title") }.getOrNull() } ?: "Smaran Reminder"
        val detail = stored?.let { runCatching { JSONObject(it).optString("detail") }.getOrNull() } ?: ""
        val trigger = stored?.let { runCatching { JSONObject(it).optLong("triggerAt") }.getOrNull() } ?: 0L
        val daily = stored?.let { runCatching { JSONObject(it).optBoolean("daily") }.getOrNull() } ?: false

        val intent = pendingIntent(context, id, title, detail, trigger, daily)
        alarmManager.cancel(intent)
        intent.cancel()

        val ids = prefs(context).getStringSet(IDS_KEY, emptySet())?.toMutableSet() ?: mutableSetOf()
        ids.remove(id)
        prefs(context).edit().putStringSet(IDS_KEY, ids).remove("alarm_$id").apply()
    }

    fun cancelAll(context: Context) {
        val ids = prefs(context).getStringSet(IDS_KEY, emptySet())?.toList() ?: emptyList()
        ids.forEach { cancel(context, it) }
        prefs(context).edit().clear().apply()
    }

    fun onAlarmFired(
        context: Context,
        id: String,
        title: String,
        detail: String,
        triggerAt: Long,
        daily: Boolean,
    ) {
        createChannel(context)
        showAlarmNotification(context, id, title, detail)

        if (daily) {
            var next = triggerAt + AlarmManager.INTERVAL_DAY
            while (next <= System.currentTimeMillis()) {
                next += AlarmManager.INTERVAL_DAY
            }
            schedule(context, id, title, detail, next, true)
        } else {
            val ids = prefs(context).getStringSet(IDS_KEY, emptySet())?.toMutableSet() ?: mutableSetOf()
            ids.remove(id)
            prefs(context).edit().putStringSet(IDS_KEY, ids).remove("alarm_$id").apply()
        }
    }

    private fun showAlarmNotification(
        context: Context,
        id: String,
        title: String,
        detail: String,
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val fullScreenIntent = Intent(context, ReminderActivity::class.java).apply {
            putExtra(EXTRA_ID, id)
            putExtra(EXTRA_TITLE, title)
            putExtra(EXTRA_DETAIL, detail)
            setPackage(context.packageName)
        }

        val fullScreenPendingIntent = PendingIntent.getActivity(
            context,
            requestCode("activity_$id"),
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            Notification.Builder(context).setPriority(Notification.PRIORITY_MAX)
        }

        val notification = builder
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("Smaran Reminder")
            .setContentText(title)
            .setStyle(Notification.BigTextStyle().bigText(detail))
            .setCategory(Notification.CATEGORY_ALARM)
            .setPriority(Notification.PRIORITY_MAX)
            .setAutoCancel(false)
            .setOngoing(true)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .build()

        try {
            notificationManager.notify(requestCode("notification_$id"), notification)
        } catch (_: SecurityException) {
            // Android 13+ notification permission may be denied. The alarm itself remains scheduled.
        }
    }

    fun dismissNotification(context: Context, id: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.cancel(requestCode("notification_$id"))
    }

    fun snooze(context: Context, id: String, title: String, detail: String) {
        dismissNotification(context, id)
        schedule(
            context = context,
            id = "$id$SNOOZE_SUFFIX",
            title = title,
            detail = detail,
            triggerAt = System.currentTimeMillis() + 10L * 60L * 1000L,
            daily = false,
        )
    }

    fun stopSnooze(context: Context, id: String) {
        cancel(context, "$id$SNOOZE_SUFFIX")
        dismissNotification(context, id)
    }

    fun rescheduleStored(context: Context) {
        val ids = prefs(context).getStringSet(IDS_KEY, emptySet())?.toList() ?: emptyList()
        val now = System.currentTimeMillis()

        ids.forEach { id ->
            val raw = prefs(context).getString("alarm_$id", null) ?: return@forEach
            runCatching {
                val json = JSONObject(raw)
                val trigger = json.optLong("triggerAt", 0L)
                val daily = json.optBoolean("daily", false)
                val title = json.optString("title", "Smaran Reminder")
                val detail = json.optString("detail", "It is time for your scheduled task.")

                if (!daily && trigger <= now) {
                    cancel(context, id)
                } else {
                    var next = trigger
                    if (daily) {
                        while (next <= now) next += AlarmManager.INTERVAL_DAY
                    }
                    schedule(context, id, title, detail, next, daily)
                }
            }
        }
    }
}
