package com.beetv.android.tv.ui.fragment;

import android.app.Activity;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.viewbinding.ViewBinding;

import com.beetv.android.tv.BuildConfig;
import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.Updater;
import com.beetv.android.tv.api.config.BeeApi;
import com.beetv.android.tv.api.config.LiveConfig;
import com.beetv.android.tv.api.config.VodConfig;
import com.beetv.android.tv.api.config.WallConfig;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.bean.Live;
import com.beetv.android.tv.bean.Site;
import com.beetv.android.tv.databinding.FragmentFongmiSettingBinding;
import com.beetv.android.tv.db.AppDatabase;
import com.beetv.android.tv.event.RefreshEvent;
import com.beetv.android.tv.impl.AdminUrlCallback;
import com.beetv.android.tv.impl.Callback;
import com.beetv.android.tv.impl.ConfigCallback;
import com.beetv.android.tv.impl.LiveCallback;
import com.beetv.android.tv.impl.SiteCallback;
import com.beetv.android.tv.ui.activity.HomeActivity;
import com.beetv.android.tv.ui.base.BaseFragment;
import com.beetv.android.tv.ui.dialog.AdminUrlDialog;
import com.beetv.android.tv.ui.dialog.ConfigDialog;
import com.beetv.android.tv.ui.dialog.HistoryDialog;
import com.beetv.android.tv.ui.dialog.LiveDialog;
import com.beetv.android.tv.ui.dialog.LoginDialog;
import com.beetv.android.tv.ui.dialog.RestoreDialog;
import com.beetv.android.tv.ui.dialog.SiteDialog;
import com.beetv.android.tv.utils.FileChooser;
import com.beetv.android.tv.utils.FileUtil;
import com.beetv.android.tv.utils.Notify;
import com.beetv.android.tv.utils.PermissionUtil;
import com.beetv.android.tv.utils.ResUtil;
import com.github.catvod.bean.Doh;
import com.github.catvod.net.OkHttp;
import com.github.catvod.utils.Path;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.gson.JsonObject;

import org.greenrobot.eventbus.EventBus;
import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import java.util.ArrayList;
import java.util.List;

public class FongmiSettingFragment extends BaseFragment implements ConfigCallback, SiteCallback, LiveCallback, AdminUrlCallback, LoginDialog.LoginCallback {

    private FragmentFongmiSettingBinding mBinding;
    private String[] size;
    private int type;

    public static FongmiSettingFragment newInstance() {
        return new FongmiSettingFragment();
    }

    private String getSwitch(boolean value) {
        return getString(value ? R.string.setting_on : R.string.setting_off);
    }

    private int getDohIndex() {
        return Math.max(0, VodConfig.get().getDoh().indexOf(Doh.objectFrom(Setting.getDoh())));
    }

    private String[] getDohList() {
        List<String> list = new ArrayList<>();
        for (Doh item : VodConfig.get().getDoh()) list.add(item.getName());
        return list.toArray(new String[0]);
    }

    private HomeActivity getRoot() {
        return (HomeActivity) requireActivity();
    }

    @Override
    protected ViewBinding getBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return mBinding = FragmentFongmiSettingBinding.inflate(inflater, container, false);
    }

    @Override
    protected void initView() {
        EventBus.getDefault().register(this);
        mBinding.vodUrl.setText(VodConfig.getDesc());
        mBinding.liveUrl.setText(LiveConfig.getDesc());
        mBinding.wallUrl.setText(WallConfig.getDesc());
        mBinding.versionText.setText(BuildConfig.VERSION_NAME);
        setOtherText();
        setCacheText();
        updateMemberUI();
    }

    private void setOtherText() {
        mBinding.dohText.setText(getDohList()[getDohIndex()]);
        mBinding.incognitoText.setText(getSwitch(Setting.isIncognito()));
        mBinding.sizeText.setText((size = ResUtil.getStringArray(R.array.select_size))[Setting.getSize()]);
        mBinding.serverUrlText.setText(Setting.getAdminUrl());
    }

    private void setCacheText() {
        FileUtil.getCacheSize(new Callback() {
            @Override
            public void success(String result) {
                mBinding.cacheText.setText(result);
            }
        });
    }

    @Override
    protected void initEvent() {
        mBinding.vod.setOnClickListener(this::onVod);
        mBinding.doh.setOnClickListener(this::setDoh);
        mBinding.live.setOnClickListener(this::onLive);
        mBinding.wall.setOnClickListener(this::onWall);
        mBinding.size.setOnClickListener(this::setSize);
        mBinding.cache.setOnClickListener(this::onCache);
        mBinding.backup.setOnClickListener(this::onBackup);
        mBinding.player.setOnClickListener(this::onPlayer);
        mBinding.restore.setOnClickListener(this::onRestore);
        mBinding.version.setOnClickListener(this::onVersion);
        mBinding.vod.setOnLongClickListener(this::onVodEdit);
        mBinding.vodHome.setOnClickListener(this::onVodHome);
        mBinding.live.setOnLongClickListener(this::onLiveEdit);
        mBinding.liveHome.setOnClickListener(this::onLiveHome);
        mBinding.wall.setOnLongClickListener(this::onWallEdit);
        mBinding.incognito.setOnClickListener(this::setIncognito);
        mBinding.vodHistory.setOnClickListener(this::onVodHistory);
        mBinding.liveHistory.setOnClickListener(this::onLiveHistory);
        mBinding.wallDefault.setOnClickListener(this::setWallDefault);
        mBinding.wallRefresh.setOnClickListener(this::setWallRefresh);
        mBinding.wallRefresh.setOnLongClickListener(this::onWallHistory);
        mBinding.serverUrl.setOnClickListener(this::onServerUrl);
        mBinding.memberLoginBtn.setOnClickListener(v -> getRoot().change(1));
        mBinding.memberSignin.setOnClickListener(v -> getRoot().change(1));
        mBinding.memberLogout.setOnClickListener(v -> getRoot().change(1));
    }

    @Override
    public void setConfig(Config config) {
        if (config.getUrl().startsWith("file")) {
            PermissionUtil.requestFile(this, allGranted -> load(config));
        } else {
            load(config);
        }
    }

    private void load(Config config) {
        switch (config.getType()) {
            case 0:
                VodConfig.load(config, getCallback(0));
                break;
            case 1:
                LiveConfig.load(config, getCallback(1));
                break;
            case 2:
                Setting.putWall(0);
                WallConfig.load(config, getCallback(2));
                break;
        }
    }

    private Callback getCallback(int type) {
        return new Callback() {
            @Override
            public void start() {
                Notify.progress(requireActivity());
            }

            @Override
            public void success(String result) {
                Notify.show(result);
            }

            @Override
            public void success() {
                setConfig(type);
            }

            @Override
            public void error(String msg) {
                Notify.show(msg);
                setConfig(type);
            }
        };
    }

    private void setConfig(int type) {
        setCacheText();
        Notify.dismiss();
        RefreshEvent.config();
        if (type == 0) RefreshEvent.video();
    }

    @Override
    public void setSite(Site item) {
        VodConfig.get().setHome(item);
        RefreshEvent.video();
    }

    @Override
    public void setLive(Live item) {
        LiveConfig.get().setHome(item);
    }

    private void onVod(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 0).show();
    }

    private void onLive(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 1).show();
    }

    private void onWall(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 2).show();
    }

    private boolean onVodEdit(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 0).edit().show();
        return true;
    }

    private boolean onLiveEdit(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 1).edit().show();
        return true;
    }

    private boolean onWallEdit(View view) {
        ConfigDialog.create(this).launcher(launcher).type(type = 2).edit().show();
        return true;
    }

    private void onVodHome(View view) {
        SiteDialog.create(this).all().show();
    }

    private void onLiveHome(View view) {
        LiveDialog.create(this).action().show();
    }

    private void onVodHistory(View view) {
        HistoryDialog.create(this).type(type = 0).show();
    }

    private void onLiveHistory(View view) {
        HistoryDialog.create(this).type(type = 1).show();
    }

    private void onPlayer(View view) {
        getRoot().change(2);
    }

    private void onVersion(View view) {
        Updater.create().force().start(requireActivity());
    }

    private void setWallDefault(View view) {
        Setting.putWall(Setting.getWall() == 4 ? 1 : Setting.getWall() + 1);
        RefreshEvent.wall();
    }

    private void setWallRefresh(View view) {
        Setting.putWall(0);
        WallConfig.get().load(getCallback(2));
    }

    private boolean onWallHistory(View view) {
        HistoryDialog.create(this).type(type = 2).show();
        return true;
    }

    private void setIncognito(View view) {
        Setting.putIncognito(!Setting.isIncognito());
        mBinding.incognitoText.setText(getSwitch(Setting.isIncognito()));
    }

    private void setSize(View view) {
        new MaterialAlertDialogBuilder(requireActivity()).setTitle(R.string.setting_size).setNegativeButton(R.string.dialog_negative, null).setSingleChoiceItems(size, Setting.getSize(), (dialog, which) -> {
            mBinding.sizeText.setText(size[which]);
            Setting.putSize(which);
            RefreshEvent.size();
            dialog.dismiss();
        }).show();
    }

    private void setDoh(View view) {
        new MaterialAlertDialogBuilder(requireActivity()).setTitle(R.string.setting_doh).setNegativeButton(R.string.dialog_negative, null).setSingleChoiceItems(getDohList(), getDohIndex(), (dialog, which) -> {
            setDoh(VodConfig.get().getDoh().get(which));
            dialog.dismiss();
        }).show();
    }

    private void setDoh(Doh doh) {
        OkHttp.dns().setDoh(doh);
        Setting.putDoh(doh.toString());
        mBinding.dohText.setText(doh.getName());
    }

    private void onServerUrl(View view) {
        AdminUrlDialog.create(requireActivity(), this).show();
    }

    private void updateMemberUI() {
        boolean loggedIn = Setting.isLoggedIn();
        if (loggedIn) {
            String nickname = Setting.getUserNickname();
            int score = Setting.getUserScore();
            mBinding.memberStatusLabel.setText(nickname.isEmpty() ? Setting.getUserEmail() : nickname);
            mBinding.memberStatusLabel.setTextColor(0xFF_FFFFFF);
            mBinding.memberLoginBtn.setText(R.string.login_toggle_register);
            mBinding.memberLoginBtn.setTextColor(0xFF_64B5F6);
            mBinding.memberSignin.setVisibility(View.VISIBLE);
            mBinding.memberScore.setText(score + " pts");
            mBinding.memberLogout.setVisibility(View.VISIBLE);
        } else {
            mBinding.memberStatusLabel.setText(R.string.login_skip);
            mBinding.memberStatusLabel.setTextColor(0xFF_888888);
            mBinding.memberLoginBtn.setText(R.string.login_btn);
            mBinding.memberLoginBtn.setTextColor(0xFF_64B5F6);
            mBinding.memberSignin.setVisibility(View.GONE);
            mBinding.memberLogout.setVisibility(View.GONE);
        }
    }

    private void onMemberLogin(View view) {
        if (Setting.isLoggedIn()) {
            Setting.logout();
            updateMemberUI();
            return;
        }
        LoginDialog.create(requireActivity(), this).show();
    }

    @Override
    public void onLoginResult(String email, String nickname, int score) {
        updateMemberUI();
        getRoot().showTrialGate();
    }

    private void onMemberSignin(View view) {
        if (!Setting.isLoggedIn()) return;
        Notify.progress(requireActivity());
        new Thread(() -> {
            try {
                JsonObject result = BeeApi.get().signIn();
                int score = result.has("totalScore") ? result.get("totalScore").getAsInt() : 0;
                Setting.putUserScore(score);
                requireActivity().runOnUiThread(() -> {
                    Notify.dismiss();
                    Notify.show("Signed in successfully!");
                    mBinding.memberScore.setText(score + " pts");
                });
            } catch (Exception e) {
                requireActivity().runOnUiThread(() -> {
                    Notify.dismiss();
                    Notify.show("Sign in failed: " + e.getMessage());
                });
            }
        }).start();
    }

    private void onMemberLogout(View view) {
        Setting.logout();
        new Thread(() -> {
            try {
                BeeApi.get().syncVodConfig();
                requireActivity().runOnUiThread(() -> VodConfig.load(Config.vod(), getCallback(0)));
            } catch (Exception e) {
                requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
        updateMemberUI();
        getRoot().showTrialGate();
        Notify.show("Logged out");
    }

    @Override
    public void setAdminUrl(String url) {
        Setting.putAdminUrl(url);
        mBinding.serverUrlText.setText(url);
    }

    private void onCache(View view) {
        FileUtil.clearCache(new Callback() {
            @Override
            public void success() {
                setCacheText();
            }
        });
    }

    private void onBackup(View view) {
        PermissionUtil.requestFile(this, allGranted -> AppDatabase.backup(new Callback() {
            @Override
            public void success() {
                Notify.show(R.string.backup_success);
            }

            @Override
            public void error() {
                Notify.show(R.string.backup_fail);
            }
        }));
    }

    private void onRestore(View view) {
        PermissionUtil.requestFile(this, allGranted -> RestoreDialog.create().show(requireActivity(), new Callback() {
            @Override
            public void success() {
                Notify.show(R.string.restore_success);
                setOtherText();
                initConfig();
            }

            @Override
            public void error() {
                Notify.show(R.string.restore_fail);
            }
        }));
    }

    private void initConfig() {
        VodConfig.get().init().load(getCallback(0));
        LiveConfig.get().init().load();
        WallConfig.get().init().load();
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onRefreshEvent(RefreshEvent event) {
        if (event.getType() != RefreshEvent.Type.CONFIG) return;
        mBinding.vodUrl.setText(VodConfig.getDesc());
        mBinding.liveUrl.setText(LiveConfig.getDesc());
        mBinding.wallUrl.setText(WallConfig.getDesc());
    }

    @Override
    public void onHiddenChanged(boolean hidden) {
        if (hidden) return;
        setCacheText();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        EventBus.getDefault().unregister(this);
    }

    private final ActivityResultLauncher<Intent> launcher = registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result -> {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) return;
        setConfig(Config.find("file:/" + FileChooser.getPathFromUri(result.getData().getData()).replace(Path.rootPath(), ""), type));
    });
}
