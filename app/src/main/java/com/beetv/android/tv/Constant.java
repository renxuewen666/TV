package com.beetv.android.tv;

import java.util.concurrent.TimeUnit;

public class Constant {

    public static final String ADMIN_API_URL = "http://mf.xuewen.plus:7443/api";
    public static final String APP_VERSION_CHECK = ADMIN_API_URL + "/app-manage/version/check";
    public static final String APP_CONFIG_URL = ADMIN_API_URL + "/api-manage/app-config";
    public static final String HOME_LAYOUT_URL = ADMIN_API_URL + "/home-layout/active";
    public static final String REPO_URL = ADMIN_API_URL + "/repo/active";

    public static final long INTERVAL_SEEK = TimeUnit.SECONDS.toMillis(10);
    public static final long INTERVAL_HIDE = TimeUnit.SECONDS.toMillis(5);
    public static final long TIMEOUT_VOD = TimeUnit.SECONDS.toMillis(30);
    public static final long TIMEOUT_LIVE = TimeUnit.SECONDS.toMillis(30);
    public static final long TIMEOUT_EPG = TimeUnit.SECONDS.toMillis(5);
    public static final long TIMEOUT_XML = TimeUnit.SECONDS.toMillis(15);
    public static final long TIMEOUT_PLAY = TimeUnit.SECONDS.toMillis(15);
    public static final long TIMEOUT_SYNC = TimeUnit.SECONDS.toMillis(2);
    public static final long TIMEOUT_DANMAKU = TimeUnit.SECONDS.toMillis(30);
    public static final long TIMEOUT_PARSE_DEF = TimeUnit.SECONDS.toMillis(15);
    public static final long TIMEOUT_PARSE_WEB = TimeUnit.SECONDS.toMillis(15);
    public static final long TIMEOUT_PARSE_LIVE = TimeUnit.SECONDS.toMillis(10);
    public static final long HISTORY_TIME = TimeUnit.DAYS.toMillis(60);

    public static long getOpEdLimit(long duration) {
        if (duration < TimeUnit.MINUTES.toMillis(15)) return TimeUnit.MINUTES.toMillis(3);
        if (duration < TimeUnit.MINUTES.toMillis(30)) return TimeUnit.MINUTES.toMillis(6);
        return TimeUnit.MINUTES.toMillis(10);
    }
}
