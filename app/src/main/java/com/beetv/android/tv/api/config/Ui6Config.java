package com.beetv.android.tv.api.config;

import com.beetv.android.tv.BuildConfig;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.api.Ui6Decoder;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.utils.Util;
import com.github.catvod.net.OkHttp;
import com.github.catvod.utils.Json;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

import okhttp3.HttpUrl;
import okhttp3.Response;

public final class Ui6Config {

    private static final String TAG = Ui6Config.class.getSimpleName();
    private static JsonArray parses = new JsonArray();

    private Ui6Config() {
    }

    public static Config getDefaultVodConfig() throws Exception {
        JsonObject data = requestInit();
        setParses(data);
        JsonArray depots = data.has("depotConfig") ? data.getAsJsonArray("depotConfig") : new JsonArray();
        return saveAndGetDefault(depots);
    }

    public static Config refreshVodConfig() throws Exception {
        JsonObject data = requestInit();
        setParses(data);
        JsonArray depots = data.has("depotConfig") ? data.getAsJsonArray("depotConfig") : new JsonArray();
        Config selected = saveAndGetDefault(depots);
        Config.vod().url(selected.getUrl()).name(selected.getName()).update();
        return selected;
    }

    public static JsonArray getParses() {
        return parses;
    }

    private static void setParses(JsonObject data) {
        parses = data.has("parsesConfig") && data.get("parsesConfig").isJsonArray()
            ? data.getAsJsonArray("parsesConfig") : new JsonArray();
    }

    private static Config saveAndGetDefault(JsonArray depots) {
        for (JsonElement item : depots) {
            JsonObject depot = item.getAsJsonObject();
            String url = Json.safeString(depot, "url");
            if (!url.isEmpty()) return Config.find(url, Json.safeString(depot, "name"), 0).save();
        }
        throw new IllegalStateException("No enabled repository is configured for this application");
    }

    private static JsonObject requestInit() throws Exception {
        String appId = BuildConfig.UI6_APP_ID;
        String apkMark = BuildConfig.UI6_APK_MARK + ":" + Util.getAndroidId();
        HttpUrl.Builder builder = HttpUrl.parse(BuildConfig.UI6_API_URL + "/main/init").newBuilder()
            .addQueryParameter("app_id", appId)
            .addQueryParameter("apk_mark", apkMark)
            .addQueryParameter("sign", sign(BuildConfig.UI6_APP_KEY, appId, apkMark));
        String token = Setting.getAuthToken();
        if (!token.isEmpty()) builder.addQueryParameter("token", token);
        HttpUrl url = builder.build();
        try (Response response = OkHttp.newCall(url.toString(), TAG).execute()) {
            if (!response.isSuccessful()) throw new IllegalStateException("UI6 init HTTP " + response.code());
            String body = response.body() == null ? "" : response.body().string();
            JsonObject envelope = Json.parse(Ui6Decoder.decrypt(body)).getAsJsonObject();
            if (!envelope.has("code") || envelope.get("code").getAsInt() != 1) throw new IllegalStateException(Json.safeString(envelope, "msg"));
            return envelope.getAsJsonObject("data");
        }
    }

    private static String sign(String appKey, String appId, String apkMark) throws Exception {
        char[] chars = (appKey + appId + apkMark).toCharArray();
        Arrays.sort(chars);
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(new String(chars).getBytes(StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder(digest.length * 2);
        for (byte value : digest) result.append(String.format("%02x", value & 0xff));
        return result.toString();
    }
}
