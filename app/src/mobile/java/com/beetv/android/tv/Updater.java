package com.beetv.android.tv;

import android.app.Activity;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;

import androidx.appcompat.app.AlertDialog;

import com.beetv.android.tv.api.config.BeeApi;
import com.beetv.android.tv.databinding.DialogUpdateBinding;
import com.beetv.android.tv.utils.Download;
import com.beetv.android.tv.utils.FileUtil;
import com.beetv.android.tv.utils.Github;
import com.beetv.android.tv.utils.Notify;
import com.beetv.android.tv.utils.ResUtil;
import com.github.catvod.net.OkHttp;
import com.github.catvod.utils.Path;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.gson.JsonObject;

import org.json.JSONObject;

import java.io.File;
import java.util.Locale;

public class Updater implements Download.Callback {

    private DialogUpdateBinding binding;
    private final Download download;
    private AlertDialog dialog;

    private File getFile() {
        return Path.cache("update.apk");
    }

    private String getJson() {
        return Github.getJson(BuildConfig.FLAVOR_mode);
    }

    private String getApk() {
        return Github.getApk(BuildConfig.FLAVOR_mode + "-" + BuildConfig.FLAVOR_abi);
    }

    public static Updater create() {
        return new Updater();
    }

    public Updater() {
        this.download = Download.create(getApk(), getFile());
    }

    public Updater force() {
        Notify.show(R.string.update_check);
        Setting.putUpdate(true);
        return this;
    }

    private Updater check() {
        dismiss();
        return this;
    }

    public void start(Activity activity) {
        if (!Setting.getUpdate()) return;
        App.execute(() -> doInBackground(activity));
    }

    private void doInBackground(Activity activity) {
        try {
            JsonObject update = BeeApi.get().checkUpdate(BuildConfig.VERSION_CODE, BuildConfig.UI6_APP_ID);
            if (update != null) {
                String dlUrl = update.has("downloadUrl") ? update.get("downloadUrl").getAsString() : "";
                if (!dlUrl.isEmpty()) {
                    int code = update.has("versionCode") ? update.get("versionCode").getAsInt() : 0;
                    String name = update.has("versionName") ? update.get("versionName").getAsString() : "";
                    String desc = update.has("changelog") ? update.get("changelog").getAsString() : "";
                    App.post(() -> show(activity, name, desc, dlUrl));
                    return;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        fallbackCheck(activity);
    }

    private void fallbackCheck(Activity activity) {
        try {
            JSONObject object = new JSONObject(OkHttp.string(getJson()));
            String name = object.optString("name");
            String desc = object.optString("desc");
            int code = object.optInt("code");
            if (code > BuildConfig.VERSION_CODE) App.post(() -> show(activity, name, desc, null));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void show(Activity activity, String version, String desc, String directUrl) {
        binding = DialogUpdateBinding.inflate(LayoutInflater.from(activity));
        check().create(activity, ResUtil.getString(R.string.update_version, version)).show();
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setOnClickListener(v -> {
            if (directUrl != null && !directUrl.isEmpty()) {
                download.url(directUrl);
            }
            confirm(v);
        });
        dialog.getButton(DialogInterface.BUTTON_NEGATIVE).setOnClickListener(this::cancel);
        binding.desc.setText(desc);
    }

    private void show(Activity activity, String version, String desc) {
        show(activity, version, desc, null);
    }

    private AlertDialog create(Activity activity, String title) {
        return dialog = new MaterialAlertDialogBuilder(activity).setTitle(title).setView(binding.getRoot()).setPositiveButton(R.string.update_confirm, null).setNegativeButton(R.string.dialog_negative, null).setCancelable(false).create();
    }

    private void cancel(View view) {
        Setting.putUpdate(false);
        download.cancel();
        dismiss();
    }

    private void confirm(View view) {
        view.setEnabled(false);
        download.start(this);
    }

    private void dismiss() {
        try {
            if (dialog != null) dialog.dismiss();
        } catch (Exception ignored) {
        }
    }

    @Override
    public void progress(int progress) {
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setText(String.format(Locale.getDefault(), "%1$d%%", progress));
    }

    @Override
    public void error(String msg) {
        Notify.show(msg);
        dismiss();
    }

    @Override
    public void success(File file) {
        FileUtil.openFile(file);
        dismiss();
    }
}
