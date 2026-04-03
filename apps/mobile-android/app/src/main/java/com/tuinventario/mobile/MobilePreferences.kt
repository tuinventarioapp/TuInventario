package com.tuinventario.mobile

import android.content.Context
import android.content.SharedPreferences

class MobilePreferences(context: Context) {
    private val preferences: SharedPreferences =
        context.getSharedPreferences("tuinventario_mobile", Context.MODE_PRIVATE)

    fun getWebUrl(): String? =
        preferences.getString(KEY_WEB_URL, null)?.trim()?.takeIf { it.isNotEmpty() }

    fun saveWebUrl(url: String) {
        preferences.edit().putString(KEY_WEB_URL, url.trim()).apply()
    }

    companion object {
        private const val KEY_WEB_URL = "web_url"
    }
}
