package com.beetv.android.tv.player.exo;

import androidx.media3.database.StandaloneDatabaseProvider;
import androidx.media3.datasource.cache.Cache;
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor;
import androidx.media3.datasource.cache.SimpleCache;

import com.beetv.android.tv.App;
import com.beetv.android.tv.Setting;
import com.github.catvod.utils.Path;

public class CacheManager {

    private SimpleCache cache;

    private static class Loader {
        static volatile CacheManager INSTANCE = new CacheManager();
    }

    public static CacheManager get() {
        return Loader.INSTANCE;
    }

    public Cache getCache() {
        if (cache == null) create();
        return cache;
    }

    private void create() {
        long maxBytes = Setting.getPlayerCacheMaxMb() * 1024L * 1024L;
        cache = new SimpleCache(Path.exo(), new LeastRecentlyUsedCacheEvictor(maxBytes), new StandaloneDatabaseProvider(App.get()));
    }

    public void release() {
        if (cache == null) return;
        cache.release();
        cache = null;
    }
}

