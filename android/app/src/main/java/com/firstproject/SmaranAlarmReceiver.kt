package com.firstproject

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class SmaranAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val id = intent.getStringExtra(SmaranAlarmManager.EXTRA_ID) ?: return
        val title = intent.getStringExtra(SmaranAlarmManager.EXTRA_TITLE) ?: "Smaran Reminder"
        val detail = intent.getStringExtra(SmaranAlarmManager.EXTRA_DETAIL)
            ?: "It is time for your scheduled task."
        val triggerAt = intent.getLongExtra(
            SmaranAlarmManager.EXTRA_TRIGGER_AT,
            System.currentTimeMillis(),
        )
        val daily = intent.getBooleanExtra(SmaranAlarmManager.EXTRA_DAILY, false)

        SmaranAlarmManager.onAlarmFired(
            context,
            id,
            title,
            detail,
            triggerAt,
            daily,
        )
    }
}
