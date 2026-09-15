package com.timophey.MyBookTrackerFamilyRecovered

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.work.Data
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import java.util.concurrent.TimeUnit

private const val CHANNEL_ID = "reading-reminders-v3"
private const val ALL_TAG = "mbtf-reading-reminders"
private const val DAY_TAG_PREFIX = "mbtf-reading-day-"

internal fun createReadingChannel(context: Context) {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    val channel = NotificationChannel(CHANNEL_ID, "My Book Tracker Family", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Reading reminders and family updates"
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 250, 180, 250)
      setShowBadge(true)
    }
    context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}

internal fun showReadingNotification(context: Context, title: String, body: String, notificationId: Int) {
  if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return
  createReadingChannel(context)
  val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
  val pendingIntent = launchIntent?.let {
    PendingIntent.getActivity(context, notificationId, it.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }
  val notification = NotificationCompat.Builder(context, CHANNEL_ID)
    .setSmallIcon(context.applicationInfo.icon)
    .setContentTitle(title)
    .setContentText(body)
    .setStyle(NotificationCompat.BigTextStyle().bigText(body))
    .setPriority(NotificationCompat.PRIORITY_HIGH)
    .setAutoCancel(true)
    .setDefaults(NotificationCompat.DEFAULT_ALL)
    .setContentIntent(pendingIntent)
    .build()
  ContextCompat.getSystemService(context, NotificationManager::class.java)?.notify(notificationId, notification)
}

class ReadingNotificationsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ReadingNotifications"

  @ReactMethod
  fun schedule(entries: ReadableArray, promise: Promise) {
    try {
      createReadingChannel(context)
      val manager = WorkManager.getInstance(context)
      manager.cancelAllWorkByTag(ALL_TAG)
      val now = System.currentTimeMillis()
      for (index in 0 until entries.size()) {
        val entry = entries.getMap(index) ?: continue
        val time = entry.getDouble("time").toLong()
        if (time <= now) continue
        val day = entry.getString("day") ?: "unknown"
        val data = Data.Builder()
          .putString("title", entry.getString("title") ?: "My Book Tracker")
          .putString("body", entry.getString("body") ?: "Time to read")
          .putInt("notificationId", (time xor (time ushr 32)).toInt())
          .build()
        val request = OneTimeWorkRequestBuilder<ReadingNotificationWorker>()
          .setInitialDelay(time - now, TimeUnit.MILLISECONDS)
          .setInputData(data)
          .addTag(ALL_TAG)
          .addTag(DAY_TAG_PREFIX + day)
          .build()
        manager.enqueueUniqueWork("mbtf-reading-$time-$index", ExistingWorkPolicy.REPLACE, request)
      }
      promise.resolve(entries.size())
    } catch (error: Exception) {
      promise.reject("SCHEDULE_FAILED", error)
    }
  }

  @ReactMethod
  fun cancelAll(promise: Promise) {
    WorkManager.getInstance(context).cancelAllWorkByTag(ALL_TAG)
    promise.resolve(true)
  }

  @ReactMethod
  fun cancelDay(day: String, promise: Promise) {
    WorkManager.getInstance(context).cancelAllWorkByTag(DAY_TAG_PREFIX + day)
    promise.resolve(true)
  }

  @ReactMethod
  fun showNow(title: String, body: String, promise: Promise) {
    showReadingNotification(context, title, body, (System.currentTimeMillis() and 0x7fffffff).toInt())
    promise.resolve(true)
  }
}
