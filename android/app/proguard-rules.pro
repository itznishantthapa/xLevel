# --- React Native Core ---
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# Hermes (if enabled)
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**

# JSC (if using instead of Hermes)
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.jni.**

# React Native bridge & UI manager
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# --- Expo ---
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**

# --- Firebase ---
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Messaging & Analytics
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# --- Reanimated (already in your file, keep it) ---
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# --- AndroidX ---
-dontwarn androidx.**
