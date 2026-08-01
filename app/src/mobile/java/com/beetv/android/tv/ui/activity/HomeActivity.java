package com.beetv.android.tv.ui.activity;

import android.app.PendingIntent;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.MenuItem;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;
import androidx.core.splashscreen.SplashScreen;
import androidx.fragment.app.Fragment;
import androidx.viewbinding.ViewBinding;

import com.beetv.android.tv.App;
import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.Updater;
import com.beetv.android.tv.api.config.LiveConfig;
import com.beetv.android.tv.api.config.VodConfig;
import com.beetv.android.tv.api.config.WallConfig;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.databinding.ActivityHomeBinding;
import com.beetv.android.tv.db.AppDatabase;
import com.beetv.android.tv.event.RefreshEvent;
import com.beetv.android.tv.event.ServerEvent;
import com.beetv.android.tv.event.StateEvent;
import com.beetv.android.tv.impl.Callback;
import com.beetv.android.tv.player.Source;
import com.beetv.android.tv.player.exo.CacheManager;
import com.beetv.android.tv.receiver.ShortcutReceiver;
import com.beetv.android.tv.server.Server;
import com.beetv.android.tv.service.PlaybackService;
import com.beetv.android.tv.ui.base.BaseActivity;
import com.beetv.android.tv.ui.custom.FragmentStateManager;
import com.beetv.android.tv.ui.dialog.LoginDialog;
import com.beetv.android.tv.ui.fragment.FongmiSettingFragment;
import com.beetv.android.tv.ui.fragment.SettingFragment;
import com.beetv.android.tv.ui.fragment.SettingPlayerFragment;
import com.beetv.android.tv.ui.fragment.VodFragment;
import com.beetv.android.tv.utils.FileChooser;
import com.beetv.android.tv.utils.Notify;
import com.beetv.android.tv.utils.PermissionUtil;
import com.beetv.android.tv.utils.UrlUtil;
import com.github.catvod.net.OkHttp;
import com.google.android.material.navigation.NavigationBarView;

import org.greenrobot.eventbus.Subscribe;
import org.greenrobot.eventbus.ThreadMode;

import java.util.concurrent.TimeUnit;

public class HomeActivity extends BaseActivity implements NavigationBarView.OnItemSelectedListener, LoginDialog.LoginCallback {

    private static final long TRIAL_DURATION_MS = TimeUnit.MINUTES.toMillis(5);

    private FragmentStateManager mManager;
    private ActivityHomeBinding mBinding;
    private int orientation;
    private Handler mTrialHandler;
    private Runnable mTrialRunnable;
    private long mTrialStart;

    @Override
    protected ViewBinding getBinding() {
        return mBinding = ActivityHomeBinding.inflate(getLayoutInflater());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        checkAction(intent);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void initView(Bundle savedInstanceState) {
        orientation = getResources().getConfiguration().orientation;
        initFragment(savedInstanceState);
        Updater.create().start(this);
        initConfig();
        initTrial();
    }

    @Override
    protected void initEvent() {
        mBinding.navigation.setOnItemSelectedListener(this);
        mBinding.navigation.findViewById(R.id.live).setOnLongClickListener(this::addShortcut);
        mBinding.trialLoginBtn.setOnClickListener(v -> showLogin());
    }

    private void checkAction(Intent intent) {
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            VideoActivity.push(this, intent.getStringExtra(Intent.EXTRA_TEXT));
        } else if (Intent.ACTION_VIEW.equals(intent.getAction()) && intent.getData() != null) {
            PermissionUtil.requestFile(this, allGranted -> checkType(intent));
        }
    }

    private void checkType(Intent intent) {
        if ("text/plain".equals(intent.getType()) || UrlUtil.path(intent.getData()).endsWith(".m3u")) {
            loadLive("file:/" + FileChooser.getPathFromUri(intent.getData()));
        } else {
            VideoActivity.push(this, intent.getData().toString());
        }
    }

    private void initFragment(Bundle savedInstanceState) {
        mManager = new FragmentStateManager(mBinding.container, getSupportFragmentManager()) {
            @Override
            public Fragment getItem(int position) {
                if (position == 0) return VodFragment.newInstance();
                if (position == 1) return SettingFragment.newInstance();
                if (position == 2) return SettingPlayerFragment.newInstance();
                if (position == 3) return FongmiSettingFragment.newInstance();
                return null;
            }
        };
        if (savedInstanceState == null) mManager.change(0);
    }

    private void initConfig() {
        VodConfig.get().init().load(getCallback());
        LiveConfig.get().init().load();
        WallConfig.get().init();
    }

    private Callback getCallback() {
        return new Callback() {
            @Override
            public void success(String result) {
                Notify.show(result);
            }

            @Override
            public void success() {
                checkAction(getIntent());
                RefreshEvent.config();
                RefreshEvent.video();
            }

            @Override
            public void error(String msg) {
                checkAction(getIntent());
                RefreshEvent.config();
                StateEvent.empty();
                Notify.show(msg);
            }
        };
    }

    private void loadLive(String url) {
        LiveConfig.load(Config.find(url, 1), new Callback() {
            @Override
            public void success() {
                openLive();
            }
        });
    }

    private void setNavigation() {
        mBinding.navigation.getMenu().findItem(R.id.vod).setVisible(true);
        mBinding.navigation.getMenu().findItem(R.id.setting).setVisible(true);
        mBinding.navigation.getMenu().findItem(R.id.live).setVisible(LiveConfig.hasUrl());
    }

    private boolean openLive() {
        LiveActivity.start(this);
        return false;
    }

    private boolean addShortcut(View view) {
        ShortcutInfoCompat info = new ShortcutInfoCompat.Builder(this, getString(R.string.nav_live)).setIcon(IconCompat.createWithResource(this, R.mipmap.ic_launcher)).setIntent(new Intent(Intent.ACTION_VIEW, null, this, LiveActivity.class)).setShortLabel(getString(R.string.nav_live)).build();
        PendingIntent pendingIntent = PendingIntent.getBroadcast(this, 0, new Intent(this, ShortcutReceiver.class).setAction(ShortcutReceiver.ACTION), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        ShortcutManagerCompat.requestPinShortcut(this, info, pendingIntent.getIntentSender());
        return true;
    }

    public void change(int position) {
        mManager.change(position);
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onRefreshEvent(RefreshEvent event) {
        if (event.getType().equals(RefreshEvent.Type.CONFIG)) setNavigation();
    }

    @Subscribe(threadMode = ThreadMode.MAIN)
    public void onServerEvent(ServerEvent event) {
        if (event.getType() != ServerEvent.Type.PUSH) return;
        VideoActivity.push(this, event.getText());
    }

    @Override
    public boolean onNavigationItemSelected(@NonNull MenuItem item) {
        if (mBinding.navigation.getSelectedItemId() == item.getItemId()) return false;
        if (item.getItemId() == R.id.setting) return mManager.change(1);
        if (item.getItemId() == R.id.vod) return mManager.change(0);
        if (item.getItemId() == R.id.live) return openLive();
        return false;
    }

    @Override
    public void onConfigurationChanged(@NonNull Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        App.post(() -> checkOrientation(newConfig), 100);
    }

    private void checkOrientation(Configuration newConfig) {
        if (orientation != newConfig.orientation) {
            orientation = newConfig.orientation;
            RefreshEvent.video();
        }
    }

    @Override
    protected void onBackInvoked() {
        if (!mBinding.navigation.getMenu().findItem(R.id.vod).isVisible()) {
            setNavigation();
        } else if (mManager.isVisible(2) || mManager.isVisible(3)) {
            change(1);
        } else if (mManager.isVisible(1)) {
            mBinding.navigation.setSelectedItemId(R.id.vod);
        } else if (mManager.canBack(0)) {
            if (PlaybackService.isRunning()) moveTaskToBack(true);
            else super.onBackInvoked();
        }
    }

    private void initTrial() {
        if (Setting.isLoggedIn()) return;
        mTrialHandler = new Handler(Looper.getMainLooper());
        mTrialStart = System.currentTimeMillis();
        mTrialRunnable = () -> {
            if (!Setting.isLoggedIn()) {
                mBinding.trialGate.setVisibility(View.VISIBLE);
            }
        };
        mTrialHandler.postDelayed(mTrialRunnable, TRIAL_DURATION_MS);
    }

    public void showTrialGate() {
        if (Setting.isLoggedIn()) {
            mBinding.trialGate.setVisibility(View.GONE);
            if (mTrialHandler != null && mTrialRunnable != null) {
                mTrialHandler.removeCallbacks(mTrialRunnable);
            }
            return;
        }
        long elapsed = System.currentTimeMillis() - mTrialStart;
        long remaining = TRIAL_DURATION_MS - elapsed;
        if (remaining > 0) {
            mBinding.trialGate.setVisibility(View.GONE);
            if (mTrialHandler != null && mTrialRunnable != null) {
                mTrialHandler.removeCallbacks(mTrialRunnable);
                mTrialHandler.postDelayed(mTrialRunnable, remaining);
            }
        } else {
            mBinding.trialGate.setVisibility(View.VISIBLE);
        }
    }

    private void showLogin() {
        LoginDialog.create(this, this).show();
    }

    @Override
    public void onLoginResult(String email, String nickname, int score) {
        mBinding.trialGate.setVisibility(View.GONE);
        if (mTrialHandler != null && mTrialRunnable != null) {
            mTrialHandler.removeCallbacks(mTrialRunnable);
        }
        reloadMemberVodConfig();
        Notify.show(getString(R.string.login_success, nickname.isEmpty() ? email : nickname));
    }

    private void reloadMemberVodConfig() {
        VodConfig.load(Config.vod(), new Callback() {
            @Override
            public void success() {
                RefreshEvent.config();
                RefreshEvent.video();
            }

            @Override
            public void error(String msg) {
                Notify.show(msg);
            }
        });
    }

    @Override
    protected void onDestroy() {
        if (mTrialHandler != null && mTrialRunnable != null) {
            mTrialHandler.removeCallbacks(mTrialRunnable);
            mTrialHandler = null;
        }
        CacheManager.get().release();
        LiveConfig.get().clear();
        VodConfig.get().clear();
        AppDatabase.backup();
        OkHttp.get().clear();
        Source.get().exit();
        Server.get().stop();
        super.onDestroy();
    }
}
