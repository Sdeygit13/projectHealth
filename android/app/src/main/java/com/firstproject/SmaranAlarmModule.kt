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

    // ---------------------------------------------------------
    // Schedule a reminder
    // ---------------------------------------------------------

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
            promise.reject(
                "SMARAN_ALARM_SCHEDULE",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Cancel one reminder
    // ---------------------------------------------------------

    @ReactMethod
    fun cancelReminder(
        id: String,
        promise: Promise,
    ) {
        try {
            SmaranAlarmManager.cancel(
                reactContext,
                id,
            )

            // Also cancel a possible snoozed version.
            SmaranAlarmManager.cancel(
                reactContext,
                "${id}__snooze",
            )

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_ALARM_CANCEL",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Cancel all reminders
    // ---------------------------------------------------------

    @ReactMethod
    fun cancelAllReminders(
        promise: Promise,
    ) {
        try {
            SmaranAlarmManager.cancelAll(
                reactContext,
            )

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_ALARM_CANCEL_ALL",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Snooze reminder for 10 minutes
    // ---------------------------------------------------------

    @ReactMethod
    fun snoozeReminder(
        id: String,
        title: String,
        detail: String,
        promise: Promise,
    ) {
        try {
            SmaranAlarmManager.snooze(
                reactContext,
                id,
                title,
                detail,
            )

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_ALARM_SNOOZE",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Stop active alarm
    // ---------------------------------------------------------

    @ReactMethod
    fun stopActiveAlarm(
        id: String?,
        promise: Promise,
    ) {
        try {
            if (!id.isNullOrBlank()) {
                SmaranAlarmManager.dismissNotification(
                    reactContext,
                    id,
                )

                SmaranAlarmManager.cancel(
                    reactContext,
                    "${id}__snooze",
                )
            }

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_ALARM_STOP",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Android 13+ notification permission
    //
    // IMPORTANT:
    // The actual runtime permission request is handled by
    // React Native's PermissionsAndroid from JavaScript.
    //
    // This native method only checks the current permission.
    // ---------------------------------------------------------

    @ReactMethod
    fun requestNotificationPermission(
        promise: Promise,
    ) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                promise.resolve(true)
                return
            }

            val granted =
                reactContext.checkSelfPermission(
                    Manifest.permission.POST_NOTIFICATIONS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED

            promise.resolve(granted)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_NOTIFICATION_PERMISSION",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Check exact alarm permission
    // ---------------------------------------------------------

    @ReactMethod
    fun canScheduleExactAlarms(
        promise: Promise,
    ) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                promise.resolve(true)
                return
            }

            val alarmManager =
                reactContext.getSystemService(
                    AlarmManager::class.java
                )

            promise.resolve(
                alarmManager?.canScheduleExactAlarms() == true
            )
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_EXACT_ALARM_CHECK",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Open Android Exact Alarm settings
    // ---------------------------------------------------------

    @ReactMethod
    fun openExactAlarmSettings(
        promise: Promise,
    ) {
        try {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
                promise.resolve(false)
                return
            }

            val intent = Intent(
                Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse(
                    "package:${reactContext.packageName}"
                ),
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(intent)

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_EXACT_ALARM_SETTINGS",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Check Full-Screen Intent permission
    // ---------------------------------------------------------

    @ReactMethod
    fun canUseFullScreenIntent(
        promise: Promise,
    ) {
        try {
            if (Build.VERSION.SDK_INT <
                Build.VERSION_CODES.UPSIDE_DOWN_CAKE
            ) {
                promise.resolve(true)
                return
            }

            val notificationManager =
                reactContext.getSystemService(
                    android.app.NotificationManager::class.java
                )

            promise.resolve(
                notificationManager?.canUseFullScreenIntent() == true
            )
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_FULLSCREEN_CHECK",
                error.message,
                error,
            )
        }
    }

    // ---------------------------------------------------------
    // Open Android Full-Screen Intent settings
    // ---------------------------------------------------------

    @ReactMethod
    fun openFullScreenIntentSettings(
        promise: Promise,
    ) {
        try {
            if (Build.VERSION.SDK_INT <
                Build.VERSION_CODES.UPSIDE_DOWN_CAKE
            ) {
                promise.resolve(false)
                return
            }

            val intent = Intent(
                Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                Uri.parse(
                    "package:${reactContext.packageName}"
                ),
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactContext.startActivity(intent)

            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject(
                "SMARAN_FULLSCREEN_SETTINGS",
                error.message,
                error,
            )
        }
    }
}