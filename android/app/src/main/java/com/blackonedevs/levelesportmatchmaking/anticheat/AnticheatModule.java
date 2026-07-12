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

    @ReactMethod
    public void scanDeviceForPanels(Promise promise) {
        Context context = reactContext.getApplicationContext();
        PackageManager pm = context.getPackageManager();
        WritableArray flaggedApps = Arguments.createArray();

        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> launchableApps = pm.queryIntentActivities(intent, 0);

        String[] cheatKeywords = {
            "userz", "userzzz", "userzx", "fluorite", "spg4x", "jatodoshackers",
            "xpro", "painel", "panel", "xit", "ffh4x", "matrix", "flutuante",
            "senxit", "dark aura", "astute", "drip client", "m1nx", "pro panel",
            "samsung panel", "brazilian panel", "freestyle panel", "raistar",
            "white 444", "headshot", "only headshot", "vip panel", "xera panel",
            "gangster", "konan", "imoba", "mod menu", "modmenu", "regedit",
            "antenna hack", "steamer panel", "steamer x", "steamer mode", "streamer x",
            "streamproof", "stemmerx", "stemmer x", "zarchiver", "mt manager", "mtmanager",
            "ng esports", "nonstop gaming", "rig edit",
            "lody.virtual", "parallel.space", "dualspace"
        };

        for (ResolveInfo info : launchableApps) {
            if ((info.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                String packageId = info.activityInfo.packageName.toLowerCase();
                String appLabel = info.loadLabel(pm).toString().toLowerCase();

                for (String keyword : cheatKeywords) {
                    if (packageId.contains(keyword) || appLabel.contains(keyword)) {
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
