package com.blackonedevs.levelesportmatchmaking.anticheat;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.List;

public class AnticheatModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AnticheatModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "AnticheatModule";
    }

    private boolean shouldSkipMatch(String packageId, String appLabel, String keyword) {
        return "xit".equals(keyword)
            && (packageId.contains("perplexity") || appLabel.contains("perplexity"));
    }

    private String[] parseKeywords(ReadableArray keywordsArray) {
        if (keywordsArray == null || keywordsArray.size() == 0) {
            return new String[0];
        }

        String[] cheatKeywords = new String[keywordsArray.size()];
        int validCount = 0;

        for (int i = 0; i < keywordsArray.size(); i++) {
            String keyword = keywordsArray.getString(i);
            if (keyword == null) {
                continue;
            }

            String normalized = keyword.trim().toLowerCase();
            if (normalized.isEmpty()) {
                continue;
            }

            cheatKeywords[validCount++] = normalized;
        }

        if (validCount == cheatKeywords.length) {
            return cheatKeywords;
        }

        String[] trimmedKeywords = new String[validCount];
        System.arraycopy(cheatKeywords, 0, trimmedKeywords, 0, validCount);
        return trimmedKeywords;
    }

    @ReactMethod
    public void scanDeviceForPanels(ReadableArray keywordsArray, Promise promise) {
        Context context = reactContext.getApplicationContext();
        PackageManager pm = context.getPackageManager();
        WritableArray flaggedApps = Arguments.createArray();

        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> launchableApps = pm.queryIntentActivities(intent, 0);

        String[] cheatKeywords = parseKeywords(keywordsArray);

        for (ResolveInfo info : launchableApps) {
            if ((info.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                String packageId = info.activityInfo.packageName.toLowerCase();
                String appLabel = info.loadLabel(pm).toString().toLowerCase();

                for (String keyword : cheatKeywords) {
                    if (packageId.contains(keyword) || appLabel.contains(keyword)) {
                        if (shouldSkipMatch(packageId, appLabel, keyword)) {
                            continue;
                        }

                        WritableMap match = Arguments.createMap();
                        match.putString("appName", info.loadLabel(pm).toString());
                        match.putString("packageName", info.activityInfo.packageName);
                        match.putString("keyword", keyword);
                        flaggedApps.pushMap(match);
                        break;
                    }
                }
            }
        }

        promise.resolve(flaggedApps);
    }
}
