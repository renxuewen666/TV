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

    private Request.Builder authBuilder(Request.Builder builder) {
        String token = Setting.getAuthToken();
        if (!token.isEmpty()) {
            builder.addHeader("Authorization", "Bearer " + token);
        }
        return builder;
    }

    private JsonObject parseResponse(String body) throws IOException {
        JsonObject obj = Json.parse(body).getAsJsonObject();
        int code = obj.has("code") ? obj.get("code").getAsInt() : 0;
        if (code != 200) throw new IOException(obj.has("message") ? obj.get("message").getAsString() : "API error");
        return obj;
    }

    private JsonObject getData(String body) throws IOException {
        return parseResponse(body).getAsJsonObject("data");
    }

    public String get(String url) throws IOException {
        Request request = authBuilder(new Request.Builder().url(url).get()).build();
        Response response = OkHttp.client(Constant.TIMEOUT_XML).newCall(request).execute();
        if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
        String body = response.body() != null ? response.body().string() : "";
        response.close();
        return body;
    }

    public JsonObject getJson(String url) throws IOException {
        return getData(get(url));
    }

    private String postJson(String url, JsonObject body) throws IOException {
        Request request = authBuilder(new Request.Builder().url(url))
            .post(okhttp3.RequestBody.create(body.toString(), okhttp3.MediaType.parse("application/json")))
            .build();
        Response response = OkHttp.client(TimeUnit.SECONDS.toMillis(15)).newCall(request).execute();
        String respBody = response.body() != null ? response.body().string() : "";
        response.close();
        if (!response.isSuccessful()) throw new IOException("HTTP " + response.code());
        return respBody;
    }

    private JsonObject postJsonGetData(String url, JsonObject body) throws IOException {
        return getData(postJson(url, body));
    }

    public JsonObject login(String account, String password) throws IOException {
        String base = Setting.getAdminUrl();
        JsonObject body = new JsonObject();
        body.addProperty("account", account);
        body.addProperty("password", password);
        return postJsonGetData(base + "/member-auth/login", body);
    }

    public JsonObject register(String email, String nickname, String password) throws IOException {
        String base = Setting.getAdminUrl();
        JsonObject body = new JsonObject();
        body.addProperty("email", email);
        body.addProperty("nickname", nickname);
        body.addProperty("password", password);
        return postJsonGetData(base + "/member-auth/register", body);
    }

    public JsonObject getProfile() throws IOException {
        String base = Setting.getAdminUrl();
        return getJson(base + "/member-auth/me");
    }

    public JsonObject signIn() throws IOException {
        String base = Setting.getAdminUrl();
        return postJsonGetData(base + "/user/signin", new JsonObject());
    }

    public JsonObject getSignStatus() throws IOException {
        String base = Setting.getAdminUrl();
        return getJson(base + "/user/signin/status");
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
            Request request = authBuilder(new Request.Builder().url(url)
                .post(okhttp3.RequestBody.create(body.toString(), okhttp3.MediaType.parse("application/json"))))
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
