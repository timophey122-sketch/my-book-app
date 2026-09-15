package com.timophey.MyBookTrackerFamilyRecovered

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

class ReadingNotificationWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    val title = inputData.getString("title") ?: "My Book Tracker"
    val body = inputData.getString("body") ?: "Time to read"
    val notificationId = inputData.getInt("notificationId", id.hashCode())
    showReadingNotification(applicationContext, title, body, notificationId)
    return Result.success()
  }
}
