package com.firstproject

import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SmaranAlarmModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmaranAlarm"

    @ReactMethod
    fun scheduleReminder(
        id: String,
        title: String,
        detail: String,
        triggerAtMillis: Double,
        daily: Boolean,
        promise: Promise,
    ) {
        try {
            val exact = SmaranAlarmManager.schedule(
                reactContext,
                id,
                title,
                detail,
                triggerAtMillis.toLong(),
                daily,
            )
            promise.resolve(exact)
        } catch (error: Exception) {
            promise.reject("SMARAN_ALARM_SCHEDULE", error.message, error)
        }
    }

    @ReactMethod
    fun cancelReminder(id: String, promise: Promise) {
        try {
            SmaranAlarmManager.cancel(reactContext, id)
            SmaranAlarmManager.cancel(reactContext, "${id}__snooze")
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_ALARM_CANCEL", error.message, error)
        }
    }

    @ReactMethod
    fun cancelAllReminders(promise: Promise) {
        try {
            SmaranAlarmManager.cancelAll(reactContext)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_ALARM_CANCEL_ALL", error.message, error)
        }
    }

    @ReactMethod
    fun snoozeReminder(id: String, title: String, detail: String, promise: Promise) {
        try {
            SmaranAlarmManager.snooze(reactContext, id, title, detail)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_ALARM_SNOOZE", error.message, error)
        }
    }

    @ReactMethod
    fun stopActiveAlarm(id: String?, promise: Promise) {
        try {
            if (!id.isNullOrBlank()) {
                SmaranAlarmManager.stopSnooze(reactContext, id)
            }
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_ALARM_STOP", error.message, error)
        }
    }

    @ReactMethod
    fun requestNotificationPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            promise.resolve(true)
            return
        }

        val activity = currentActivity
        if (activity == null) {
            promise.resolve(false)
            return
        }

        if (reactContext.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) ==
            android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            promise.resolve(true)
            return
        }

        activity.requestPermissions(
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            7001,
        )
        promise.resolve(false)
    }

    @ReactMethod
    fun canScheduleExactAlarms(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(true)
            return
        }
        val alarmManager = reactContext.getSystemService(AlarmManager::class.java)
        promise.resolve(alarmManager?.canScheduleExactAlarms() == true)
    }

    @ReactMethod
    fun openExactAlarmSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                promise.resolve(false)
                return
            }
            val intent = Intent(
                Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:${reactContext.packageName}"),
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_EXACT_ALARM_SETTINGS", error.message, error)
        }
    }

    @ReactMethod
    fun canUseFullScreenIntent(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            promise.resolve(true)
            return
        }
        val manager = reactContext.getSystemService(android.app.NotificationManager::class.java)
        promise.resolve(manager?.canUseFullScreenIntent() == true)
    }

    @ReactMethod
    fun openFullScreenIntentSettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                promise.resolve(false)
                return
            }
            val intent = Intent(
                Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                Uri.parse("package:${reactContext.packageName}"),
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("SMARAN_FULLSCREEN_SETTINGS", error.message, error)
        }
    }
}
