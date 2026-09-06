package com.firstproject

import android.app.Activity
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.graphics.Color
import android.graphics.Typeface
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class ReminderActivity : Activity() {

    private var reminderId = ""
    private var reminderTitle = "Smaran Reminder"
    private var reminderDetail = "It is time for your scheduled task."
    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var downY = 0f

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            )
        }

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        readIntent(intent)
        buildUi()
        startAlarmFeedback()
    }

    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        if (intent == null) return
        readIntent(intent)
        buildUi()
    }

    private fun readIntent(intent: android.content.Intent) {
        reminderId = intent.getStringExtra(SmaranAlarmManager.EXTRA_ID) ?: ""
        reminderTitle = intent.getStringExtra(SmaranAlarmManager.EXTRA_TITLE) ?: "Smaran Reminder"
        reminderDetail = intent.getStringExtra(SmaranAlarmManager.EXTRA_DETAIL)
            ?: "It is time for your scheduled task."
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(36, 40, 36, 40)
            setBackgroundColor(Color.rgb(254, 247, 232))
        }

        val badge = TextView(this).apply {
            text = "SMARAN • REMINDER"
            textSize = 14f
            setTextColor(Color.rgb(44, 92, 78))
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
        }

        val title = TextView(this).apply {
            text = reminderTitle
            textSize = 34f
            setTextColor(Color.rgb(35, 65, 57))
            setTypeface(Typeface.DEFAULT, Typeface.BOLD)
            gravity = android.view.Gravity.CENTER
            setPadding(0, 18, 0, 12)
        }

        val detail = TextView(this).apply {
            text = reminderDetail
            textSize = 19f
            setTextColor(Color.rgb(70, 82, 75))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 28)
        }

        val hint = TextView(this).apply {
            text = "Swipe up anywhere to stop"
            textSize = 14f
            setTextColor(Color.rgb(90, 108, 96))
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 20)
        }

        val snooze = Button(this).apply {
            text = "Snooze 10 minutes"
            textSize = 17f
            setOnClickListener { snooze() }
        }

        val stop = Button(this).apply {
            text = "Stop reminder"
            textSize = 17f
            setOnClickListener { stopReminder() }
        }

        root.addView(badge, LinearLayout.LayoutParams(-1, -2))
        root.addView(title, LinearLayout.LayoutParams(-1, -2))
        root.addView(detail, LinearLayout.LayoutParams(-1, -2))
        root.addView(hint, LinearLayout.LayoutParams(-1, -2))
        root.addView(snooze, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 12 })
        root.addView(stop, LinearLayout.LayoutParams(-1, -2))

        root.setOnTouchListener { _, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    downY = event.rawY
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val deltaY = event.rawY - downY
                    if (deltaY < -120f) stopReminder()
                    true
                }
                else -> true
            }
        }

        setContentView(root)
    }

    private fun startAlarmFeedback() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build(),
                )
                setDataSource(this@ReminderActivity, uri)
                isLooping = true
                prepare()
                start()
            }
        } catch (_: Exception) {
        }

        vibrator = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
            getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(VIBRATOR_SERVICE) as Vibrator
        }

        try {
            vibrator?.vibrate(
                VibrationEffect.createWaveform(
                    longArrayOf(0, 500, 500),
                    0,
                ),
            )
        } catch (_: Exception) {
        }
    }

    private fun stopFeedback() {
        try { mediaPlayer?.stop() } catch (_: Exception) {}
        try { mediaPlayer?.release() } catch (_: Exception) {}
        mediaPlayer = null
        try { vibrator?.cancel() } catch (_: Exception) {}
    }

    private fun snooze() {
        stopFeedback()
        SmaranAlarmManager.snooze(this, reminderId, reminderTitle, reminderDetail)
        finish()
    }

    private fun stopReminder() {
        stopFeedback()
        SmaranAlarmManager.dismissNotification(this, reminderId)
        SmaranAlarmManager.cancel(this, "$reminderId__snooze")
        finish()
    }

    override fun onDestroy() {
        stopFeedback()
        super.onDestroy()
    }
}
