package com.beetv.android.tv.api.config;

import com.beetv.android.tv.Constant;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.impl.Callback;
import com.github.catvod.net.OkHttp;
import com.github.catvod.utils.Json;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.Request;
import okhttp3.Response;

public class BeeApi {

    private static volatile BeeApi instance;

    public static BeeApi get() {
        if (instance == null) {
            synchronized (BeeApi.class) {
                if (instance == null) instance = new BeeApi();
            }
        }
        return instance;
    }

    public String get(String url) throws IOException {
        Request request = new Request.Builder().url(url).get().build();
        Response response = OkHttp.client(Constant.TIMEOUT_XML).newCall(request).execute();
        if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
        String body = response.body() != null ? response.body().string() : "";
        response.close();
        return body;
    }

    public JsonObject getJson(String url) throws IOException {
        String body = get(url);
        JsonObject obj = Json.parse(body).getAsJsonObject();
        int code = Json.safeInt(obj, "code");
        if (code != 200) throw new IOException("API error: " + Json.safeString(obj, "message"));
        return obj.getAsJsonObject("data");
    }

    public List<Config> fetchApiEndpoints() {
        List<Config> configs = new ArrayList<>();
        try {
            String base = Setting.getAdminUrl();
            JsonObject data = getJson(base + "/api-manage/app-config");
            loadEndpoints(data, "vod", 0, configs);
            loadEndpoints(data, "live", 1, configs);
            loadEndpoints(data, "wall", 2, configs);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return configs;
    }

    private void loadEndpoints(JsonObject data, String key, int type, List<Config> configs) {
        if (!data.has(key)) return;
        JsonArray arr = data.getAsJsonArray(key);
        for (JsonElement e : arr) {
            JsonObject obj = e.getAsJsonObject();
            String url = Json.safeString(obj, "url");
            String name = Json.safeString(obj, "name");
            if (!url.isEmpty()) {
                configs.add(Config.find(url, name, type));
            }
        }
    }

    public String fetchHomeLayout(String type) {
        try {
            String base = Setting.getAdminUrl();
            String url = base + "/home-layout/active?type=" + type;
            return get(url);
        } catch (Exception e) {
            e.printStackTrace();
            return "{}";
        }
    }

    public JsonObject checkUpdate(int versionCode, String channel) {
        try {
            String base = Setting.getAdminUrl();
            String url = base + "/app-manage/version/check?versionCode=" + versionCode + "&channel=" + channel;
            return getJson(url);
        } catch (Exception e) {
            return null;
        }
    }

    public List<String> fetchActiveRepos() {
        List<String> repos = new ArrayList<>();
        try {
            String base = Setting.getAdminUrl();
            JsonObject data = getJson(base + "/repo/active");
            if (!data.has("data")) return repos;
            JsonArray arr = data.getAsJsonArray("data");
            for (JsonElement e : arr) {
                JsonObject obj = e.getAsJsonObject();
                String url = Json.safeString(obj, "url");
                if (!url.isEmpty()) repos.add(url);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return repos;
    }

    public boolean activateCode(String userId, String code) {
        try {
            String base = Setting.getAdminUrl();
            String url = base + "/member/activate";
            JsonObject body = new JsonObject();
            body.addProperty("userId", userId);
            body.addProperty("code", code);
            Request request = new Request.Builder()
                .url(url)
                .post(okhttp3.RequestBody.create(body.toString(), okhttp3.MediaType.parse("application/json")))
                .build();
            Response response = OkHttp.client(TimeUnit.SECONDS.toMillis(15)).newCall(request).execute();
            response.close();
            return response.isSuccessful();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
