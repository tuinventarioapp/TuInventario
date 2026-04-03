package com.tuinventario.mobile

import android.net.Uri

object WebUrlResolver {
    fun resolve(preferences: MobilePreferences): String? {
        val saved = preferences.getWebUrl()
        if (!saved.isNullOrBlank() && isValid(saved)) return saved

        val configured = BuildConfig.DEFAULT_WEB_URL.trim()
        if (configured.isNotBlank() && isValid(configured)) return configured

        return null
    }

    fun isValid(value: String): Boolean {
        val uri = Uri.parse(value.trim())
        val scheme = uri.scheme?.lowercase()
        return (scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank()
    }
}
