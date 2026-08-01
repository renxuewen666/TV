package com.beetv.android.tv;


import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import com.github.catvod.utils.Prefers;

public class Setting {

    public static String getDoh() {
        return Prefers.getString("doh");
    }

    public static void putDoh(String doh) {
        Prefers.put("doh", doh);
    }

    public static String getKeyword() {
        return Prefers.getString("keyword");
    }

    public static void putKeyword(String keyword) {
        Prefers.put("keyword", keyword);
    }

    public static String getHot() {
        return Prefers.getString("hot");
    }

    public static void putHot(String hot) {
        Prefers.put("hot", hot);
    }

    public static String getUa() {
        return Prefers.getString("ua");
    }

    public static void putUa(String ua) {
        Prefers.put("ua", ua);
    }

    public static int getWall() {
        return Prefers.getInt("wall", 1);
    }

    public static void putWall(int wall) {
        Prefers.put("wall", wall);
    }

    public static int getWallType() {
        return Prefers.getInt("wall_type", 0);
    }

    public static void putWallType(int type) {
        Prefers.put("wall_type", type);
    }

    public static int getReset() {
        return Prefers.getInt("reset", 0);
    }

    public static void putReset(int reset) {
        Prefers.put("reset", reset);
    }

    public static int getRender() {
        return Prefers.getInt("render", 0);
    }

    public static void putRender(int render) {
        Prefers.put("render", render);
    }

    public static int getSize() {
        return Prefers.getInt("size", 2);
    }

    public static void putSize(int size) {
        Prefers.put("size", size);
    }

    public static int getScale() {
        return Prefers.getInt("scale");
    }

    public static void putScale(int scale) {
        Prefers.put("scale", scale);
    }

    public static int getLiveScale() {
        return Prefers.getInt("scale_live", getScale());
    }

    public static void putLiveScale(int scale) {
        Prefers.put("scale_live", scale);
    }

    public static int getBuffer() {
        return Math.min(Math.max(Prefers.getInt("buffer"), 1), 10);
    }

    public static void putBuffer(int buffer) {
        Prefers.put("buffer", buffer);
    }

    public static int getPlayerMinBufferMs() {
        return Prefers.getInt("player_min_buffer_ms", 32000);
    }

    public static void putPlayerMinBufferMs(int value) {
        Prefers.put("player_min_buffer_ms", value);
    }

    public static int getPlayerMaxBufferMs() {
        return Prefers.getInt("player_max_buffer_ms", 64000);
    }

    public static void putPlayerMaxBufferMs(int value) {
        Prefers.put("player_max_buffer_ms", value);
    }

    public static int getPlayerPlaybackBufferMs() {
        return Prefers.getInt("player_playback_buffer_ms", 2500);
    }

    public static void putPlayerPlaybackBufferMs(int value) {
        Prefers.put("player_playback_buffer_ms", value);
    }

    public static int getPlayerRebufferMs() {
        return Prefers.getInt("player_rebuffer_ms", 5000);
    }

    public static void putPlayerRebufferMs(int value) {
        Prefers.put("player_rebuffer_ms", value);
    }

    public static int getPlayerBackBufferMs() {
        return Prefers.getInt("player_back_buffer_ms", 50000);
    }

    public static void putPlayerBackBufferMs(int value) {
        Prefers.put("player_back_buffer_ms", value);
    }

    public static boolean isPlayerCacheEnabled() {
        return Prefers.getBoolean("player_cache_enabled", true);
    }

    public static void putPlayerCacheEnabled(boolean enabled) {
        Prefers.put("player_cache_enabled", enabled);
    }

    public static int getPlayerCacheMaxMb() {
        return Math.max(Prefers.getInt("player_cache_max_mb", 1024), 128);
    }

    public static void putPlayerCacheMaxMb(int value) {
        Prefers.put("player_cache_max_mb", value);
    }

    public static int getBackground() {
        return Prefers.getInt("background", 2);
    }

    public static void putBackground(int background) {
        Prefers.put("background", background);
    }

    public static int getSiteMode() {
        return Prefers.getInt("site_mode");
    }

    public static void putSiteMode(int mode) {
        Prefers.put("site_mode", mode);
    }

    public static int getSyncMode() {
        return Prefers.getInt("sync_mode");
    }

    public static void putSyncMode(int mode) {
        Prefers.put("sync_mode", mode);
    }

    public static boolean isIncognito() {
        return Prefers.getBoolean("incognito");
    }

    public static void putIncognito(boolean incognito) {
        Prefers.put("incognito", incognito);
    }

    public static boolean isBootLive() {
        return Prefers.getBoolean("boot_live");
    }

    public static void putBootLive(boolean boot) {
        Prefers.put("boot_live", boot);
    }

    public static boolean isInvert() {
        return Prefers.getBoolean("invert");
    }

    public static void putInvert(boolean invert) {
        Prefers.put("invert", invert);
    }

    public static boolean isAcross() {
        return Prefers.getBoolean("across", true);
    }

    public static void putAcross(boolean across) {
        Prefers.put("across", across);
    }

    public static boolean isChange() {
        return Prefers.getBoolean("change", true);
    }

    public static void putChange(boolean change) {
        Prefers.put("change", change);
    }

    public static boolean getUpdate() {
        return Prefers.getBoolean("update", true);
    }

    public static void putUpdate(boolean update) {
        Prefers.put("update", update);
    }

    public static boolean isCaption() {
        return Prefers.getBoolean("caption");
    }

    public static void putCaption(boolean caption) {
        Prefers.put("caption", caption);
    }

    public static boolean isTunnel() {
        return Prefers.getBoolean("tunnel");
    }

    public static void putTunnel(boolean tunnel) {
        Prefers.put("tunnel", tunnel);
    }

    public static boolean isAudioPrefer() {
        return Prefers.getBoolean("audio_prefer");
    }

    public static void putAudioPrefer(boolean audioPrefer) {
        Prefers.put("audio_prefer", audioPrefer);
    }

    public static boolean isVideoPrefer() {
        return Prefers.getBoolean("video_prefer");
    }

    public static void putVideoPrefer(boolean videoPrefer) {
        Prefers.put("video_prefer", videoPrefer);
    }

    public static boolean isPreferAAC() {
        return Prefers.getBoolean("prefer_aac");
    }

    public static void putPreferAAC(boolean preferAAC) {
        Prefers.put("prefer_aac", preferAAC);
    }

    public static boolean isDanmakuLoad() {
        return Prefers.getBoolean("danmaku_load");
    }

    public static void putDanmakuLoad(boolean danmakuLoad) {
        Prefers.put("danmaku_load", danmakuLoad);
    }

    public static boolean isAdblock() {
        return Prefers.getBoolean("adblock", true);
    }

    public static void putAdblock(boolean adblock) {
        Prefers.put("adblock", adblock);
    }

    public static boolean isDanmakuShow() {
        return Prefers.getBoolean("danmaku_show");
    }

    public static void putDanmakuShow(boolean danmakuShow) {
        Prefers.put("danmaku_show", danmakuShow);
    }

    public static boolean isZhuyin() {
        return Prefers.getBoolean("zhuyin");
    }

    public static void putZhuyin(boolean zhuyin) {
        Prefers.put("zhuyin", zhuyin);
    }

    public static float getSpeed() {
        return Math.min(Math.max(Prefers.getFloat("speed", 3), 2), 5);
    }

    public static void putSpeed(float speed) {
        Prefers.put("speed", speed);
    }

    public static float getSubtitleTextSize() {
        return Prefers.getFloat("subtitle_text_size");
    }

    public static void putSubtitleTextSize(float value) {
        Prefers.put("subtitle_text_size", value);
    }

    public static float getSubtitlePosition() {
        return Prefers.getFloat("subtitle_position");
    }

    public static void putSubtitlePosition(float value) {
        Prefers.put("subtitle_position", value);
    }

    public static boolean isBackgroundOff() {
        return getBackground() == 0;
    }

    public static boolean isBackgroundOn() {
        return getBackground() == 1 || getBackground() == 2;
    }

    public static boolean isBackgroundPiP() {
        return getBackground() == 2;
    }

    public static boolean hasCaption() {
        return new Intent(Settings.ACTION_CAPTIONING_SETTINGS).resolveActivity(App.get().getPackageManager()) != null;
    }

    public static boolean hasFileManager() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && (new Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, Uri.parse("package:" + App.get().getPackageName())).resolveActivity(App.get().getPackageManager()) != null || new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION).resolveActivity(App.get().getPackageManager()) != null);
    }

    public static String getAdminUrl() {
        return Prefers.getString("admin_url", Constant.ADMIN_API_URL);
    }

    public static void putAdminUrl(String url) {
        Prefers.put("admin_url", url);
    }

    public static String getConfigUrl() {
        return Prefers.getString("config_url", "");
    }

    public static void putConfigUrl(String url) {
        Prefers.put("config_url", url);
    }

    public static String getAuthToken() {
        return Prefers.getString("auth_token", "");
    }

    public static void putAuthToken(String token) {
        Prefers.put("auth_token", token);
    }

    public static String getUserEmail() {
        return Prefers.getString("user_email", "");
    }

    public static void putUserEmail(String email) {
        Prefers.put("user_email", email);
    }

    public static String getUserNickname() {
        return Prefers.getString("user_nickname", "");
    }

    public static void putUserNickname(String nickname) {
        Prefers.put("user_nickname", nickname);
    }

    public static int getUserScore() {
        return Prefers.getInt("user_score", 0);
    }

    public static void putUserScore(int score) {
        Prefers.put("user_score", Math.max(0, score));
    }

    public static String getUserAvatar() {
        return Prefers.getString("user_avatar", "");
    }

    public static void putUserAvatar(String avatar) {
        Prefers.put("user_avatar", avatar == null ? "" : avatar);
    }

    public static int getUserMemberLevel() {
        return Prefers.getInt("user_member_level", 0);
    }

    public static void putUserMemberLevel(int level) {
        Prefers.put("user_member_level", Math.max(0, level));
    }

    public static String getUserMemberExpireAt() {
        return Prefers.getString("user_member_expire_at", "");
    }

    public static void putUserMemberExpireAt(String expireAt) {
        Prefers.put("user_member_expire_at", expireAt == null ? "" : expireAt);
    }

    public static String getUserBalance() {
        return Prefers.getString("user_balance", "0");
    }

    public static void putUserBalance(String balance) {
        Prefers.put("user_balance", balance == null || balance.isEmpty() ? "0" : balance);
    }

    public static boolean isLoggedIn() {
        return !getAuthToken().isEmpty();
    }

    public static void logout() {
        Prefers.put("auth_token", "");
        Prefers.put("user_email", "");
        Prefers.put("user_nickname", "");
        Prefers.put("user_score", 0);
        Prefers.put("user_avatar", "");
        Prefers.put("user_member_level", 0);
        Prefers.put("user_member_expire_at", "");
        Prefers.put("user_balance", "0");
    }
}
