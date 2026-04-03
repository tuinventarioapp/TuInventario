package com.tuinventario.mobile

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.view.updatePadding
import com.tuinventario.mobile.databinding.ActivitySetupBinding

class SetupActivity : AppCompatActivity() {
    private lateinit var binding: ActivitySetupBinding
    private lateinit var preferences: MobilePreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        preferences = MobilePreferences(this)
        WebUrlResolver.resolve(preferences)?.let {
            openMain()
            return
        }

        binding = ActivitySetupBinding.inflate(layoutInflater)
        setContentView(binding.root)
        WindowInsetsControllerCompat(window, binding.root).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, windowInsets ->
            val systemBars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.updatePadding(
                top = systemBars.top,
                bottom = systemBars.bottom,
            )
            windowInsets
        }

        binding.urlInput.setText(getString(R.string.default_web_url))
        binding.saveButton.setOnClickListener {
            val url = binding.urlInput.text?.toString()?.trim().orEmpty()
            if (!WebUrlResolver.isValid(url)) {
                binding.urlLayout.error = getString(R.string.invalid_url)
                return@setOnClickListener
            }

            binding.urlLayout.error = null
            preferences.saveWebUrl(url)
            openMain()
        }
    }

    private fun openMain() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
