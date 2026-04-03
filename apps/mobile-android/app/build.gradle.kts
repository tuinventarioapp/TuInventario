import java.util.Properties

plugins {
  id("com.android.application")
  id("org.jetbrains.kotlin.android")
}

val localProperties = Properties().apply {
  val file = rootProject.file("local.properties")
  if (file.exists()) {
    file.inputStream().use { load(it) }
  }
}

val configuredWebUrl = providers.environmentVariable("TUINVENTARIO_MOBILE_WEB_URL")
  .orElse(localProperties.getProperty("tuinventario.web.url") ?: "")
  .get()

android {
  namespace = "com.tuinventario.mobile"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.tuinventario.mobile"
    minSdk = 26
    targetSdk = 35
    versionCode = 1
    versionName = "1.0.0-beta"
    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    buildConfigField("String", "DEFAULT_WEB_URL", "\"${configuredWebUrl}\"")
    resValue("string", "default_web_url", configuredWebUrl)
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro",
      )
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }

  kotlinOptions {
    jvmTarget = "17"
  }

  buildFeatures {
    buildConfig = true
    viewBinding = true
  }
}

dependencies {
  implementation("androidx.core:core-ktx:1.16.0")
  implementation("androidx.appcompat:appcompat:1.7.1")
  implementation("com.google.android.material:material:1.12.0")
  implementation("androidx.activity:activity-ktx:1.10.1")
  implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
  implementation("androidx.webkit:webkit:1.14.0")
}
