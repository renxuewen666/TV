package com.beetv.android.tv.ui.fragment;

import android.content.Intent;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.viewbinding.ViewBinding;

import com.beetv.android.tv.App;
import com.beetv.android.tv.BuildConfig;
import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.Updater;
import com.beetv.android.tv.api.config.BeeApi;
import com.beetv.android.tv.api.config.LiveConfig;
import com.beetv.android.tv.api.config.Ui6Config;
import com.beetv.android.tv.api.config.VodConfig;
import com.beetv.android.tv.api.config.WallConfig;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.bean.Site;
import com.beetv.android.tv.databinding.FragmentSettingBinding;
import com.beetv.android.tv.db.AppDatabase;
import com.beetv.android.tv.event.RefreshEvent;
import com.beetv.android.tv.impl.Callback;
import com.beetv.android.tv.impl.ConfigCallback;
import com.beetv.android.tv.impl.SiteCallback;
import com.beetv.android.tv.ui.activity.HistoryActivity;
import com.beetv.android.tv.ui.activity.HomeActivity;
import com.beetv.android.tv.ui.activity.KeepActivity;
import com.beetv.android.tv.ui.activity.LiveActivity;
import com.beetv.android.tv.ui.activity.RepoListActivity;
import com.beetv.android.tv.ui.activity.ScanActivity;
import com.beetv.android.tv.ui.base.BaseFragment;
import com.beetv.android.tv.ui.dialog.HistoryDialog;
import com.beetv.android.tv.ui.dialog.LoginDialog;
import com.beetv.android.tv.ui.dialog.RestoreDialog;
import com.beetv.android.tv.ui.dialog.SiteDialog;
import com.beetv.android.tv.ui.dialog.UserCenterDialog;
import com.beetv.android.tv.utils.FileUtil;
import com.beetv.android.tv.utils.Notify;
import com.beetv.android.tv.utils.PermissionUtil;
import com.github.catvod.bean.Doh;
import com.github.catvod.net.OkHttp;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.List;

public class SettingFragment extends BaseFragment implements LoginDialog.LoginCallback, ConfigCallback, SiteCallback {

    private FragmentSettingBinding mBinding;
    private boolean signingIn;

    public static SettingFragment newInstance() {
        return new SettingFragment();
    }

    private HomeActivity getRoot() {
        return (HomeActivity) requireActivity();
    }

    @Override
    protected ViewBinding getBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return mBinding = FragmentSettingBinding.inflate(inflater, container, false);
    }

    @Override
    protected void initView() {
        mBinding.versionText.setText(BuildConfig.VERSION_NAME);
        updateMemberUI();
        refreshProfile(false);
    }

    @Override
    protected void initEvent() {
        mBinding.memberCard.setOnClickListener(v -> {
            if (Setting.isLoggedIn()) {
                UserCenterDialog.create(requireActivity()).show();
            } else {
                onMemberLogin();
            }
        });
        mBinding.memberLoginBtn.setOnClickListener(v -> onMemberLogin());
        mBinding.memberSigninTop.setOnClickListener(v -> onMemberSignin());
        mBinding.memberSignin.setOnClickListener(v -> onMemberSignin());
        mBinding.memberQrLogin.setOnClickListener(v -> ScanActivity.start(requireActivity()));
        mBinding.memberNotice.setOnClickListener(v -> onNotices());
        mBinding.memberService.setOnClickListener(v -> onServiceContact());
        mBinding.memberMall.setOnClickListener(v -> onPackages());
        mBinding.memberHistory.setOnClickListener(v -> HistoryActivity.start(requireActivity()));
        mBinding.memberKeep.setOnClickListener(v -> KeepActivity.start(requireActivity()));
        mBinding.memberPackages.setOnClickListener(v -> onPackages());
        mBinding.memberActivate.setOnClickListener(v -> onActivateCode());
        mBinding.memberVodRepo.setOnClickListener(v -> RepoListActivity.start(requireActivity()));
        mBinding.memberVodHome.setOnClickListener(v -> SiteDialog.create(this).all().show());
        mBinding.memberDoh.setOnClickListener(v -> setDoh());
        mBinding.memberWallDefault.setOnClickListener(v -> setWallDefault());
        mBinding.memberWallRefresh.setOnClickListener(v -> setWallRefresh());
        mBinding.memberPlayer.setOnClickListener(v -> getRoot().change(2));
        mBinding.memberSettings.setOnClickListener(v -> getRoot().change(3));
        mBinding.memberVersionUpdate.setOnClickListener(v -> Updater.create().force().start(requireActivity()));
        mBinding.memberLive.setOnClickListener(v -> LiveActivity.start(requireActivity()));
        mBinding.memberCache.setOnClickListener(v -> onCache());
        mBinding.memberBackup.setOnClickListener(v -> onBackup());
        mBinding.memberRestore.setOnClickListener(v -> onRestore());
        mBinding.memberVersion.setOnClickListener(v -> showAbout());
        mBinding.memberLogout.setOnClickListener(v -> onMemberLogout());
    }

    private void updateMemberUI() {
        boolean loggedIn = Setting.isLoggedIn();
        mBinding.memberGuest.setVisibility(loggedIn ? View.GONE : View.VISIBLE);
        mBinding.memberAccount.setVisibility(loggedIn ? View.VISIBLE : View.GONE);
        mBinding.memberLogout.setVisibility(loggedIn ? View.VISIBLE : View.GONE);
        mBinding.memberSignin.setEnabled(loggedIn && !signingIn);
        mBinding.memberSigninTop.setEnabled(loggedIn && !signingIn);
        mBinding.memberSigninTop.setText(signingIn ? R.string.mine_signing_in : R.string.mine_signin);
        if (!loggedIn) {
            mBinding.memberName.setText(R.string.mine_login_title);
            mBinding.memberEmail.setText(R.string.mine_login_tip);
            mBinding.memberLevel.setText(R.string.mine_guest_level);
            mBinding.memberExpire.setText("-");
            mBinding.memberBalance.setText("0");
            mBinding.memberScore.setText("0");
            mBinding.memberSigninText.setText(R.string.mine_signin);
            return;
        }
        String nickname = Setting.getUserNickname();
        String email = Setting.getUserEmail();
        mBinding.memberName.setText(nickname.isEmpty() ? email : nickname);
        mBinding.memberEmail.setText(email);
        mBinding.memberLevel.setText(getString(R.string.mine_member_level_value, Setting.getUserMemberLevel()));
        String expireAt = Setting.getUserMemberExpireAt();
        mBinding.memberExpire.setText(expireAt.isEmpty() ? "-" : expireAt);
        mBinding.memberBalance.setText(Setting.getUserBalance());
        mBinding.memberScore.setText(String.valueOf(Setting.getUserScore()));
        mBinding.memberSigninText.setText(signingIn ? R.string.mine_signing_in : R.string.mine_signin);
    }

    private void onMemberLogin() {
        if (Setting.isLoggedIn()) refreshProfile(true);
        else LoginDialog.create(requireActivity(), this).show();
    }

    @Override
    public void onLoginResult(String email, String nickname, int score) {
        updateMemberUI();
        getRoot().showTrialGate();
        refreshProfile(false);
        refreshVodConfig();
    }

    private void refreshProfile(boolean notifyFailure) {
        if (!Setting.isLoggedIn()) return;
        new Thread(() -> {
            try {
                JsonObject user = BeeApi.get().getProfile();
                saveProfile(user);
                if (isAdded()) requireActivity().runOnUiThread(this::updateMemberUI);
            } catch (Exception e) {
                if (notifyFailure && isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void saveProfile(JsonObject user) {
        if (user.has("email") && !user.get("email").isJsonNull()) Setting.putUserEmail(user.get("email").getAsString());
        if (user.has("nickname") && !user.get("nickname").isJsonNull()) Setting.putUserNickname(user.get("nickname").getAsString());
        if (user.has("avatar") && !user.get("avatar").isJsonNull()) Setting.putUserAvatar(user.get("avatar").getAsString());
        if (user.has("score") && !user.get("score").isJsonNull()) Setting.putUserScore(user.get("score").getAsInt());
        if (user.has("memberLevel") && !user.get("memberLevel").isJsonNull()) Setting.putUserMemberLevel(user.get("memberLevel").getAsInt());
        if (user.has("memberExpireAt") && !user.get("memberExpireAt").isJsonNull()) Setting.putUserMemberExpireAt(user.get("memberExpireAt").getAsString());
        if (user.has("balance") && !user.get("balance").isJsonNull()) Setting.putUserBalance(user.get("balance").getAsString());
    }

    private void onMemberSignin() {
        if (!Setting.isLoggedIn() || signingIn) return;
        signingIn = true;
        updateMemberUI();
        new Thread(() -> {
            try {
                JsonObject result = BeeApi.get().signIn();
                if (result.has("totalScore")) Setting.putUserScore(result.get("totalScore").getAsInt());
                if (isAdded()) requireActivity().runOnUiThread(() -> {
                    signingIn = false;
                    updateMemberUI();
                    Notify.show(R.string.mine_signin_success);
                });
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> {
                    signingIn = false;
                    updateMemberUI();
                    Notify.show(e.getMessage());
                });
            }
        }).start();
    }

    private void onPackages() {
        if (!Setting.isLoggedIn()) {
            LoginDialog.create(requireActivity(), this).show();
            return;
        }
        new Thread(() -> {
            try {
                JsonArray packages = BeeApi.get().getPackages();
                if (isAdded()) requireActivity().runOnUiThread(() -> showPackages(packages));
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void showPackages(JsonArray packages) {
        if (packages.size() == 0) {
            new MaterialAlertDialogBuilder(requireActivity())
                .setTitle(R.string.mine_member_package)
                .setMessage(R.string.mine_package_empty)
                .setPositiveButton(R.string.dialog_positive, null)
                .show();
            return;
        }
        String[] labels = new String[packages.size()];
        for (int i = 0; i < packages.size(); i++) labels[i] = packageLabel(packages.get(i).getAsJsonObject());
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.mine_member_package)
            .setSingleChoiceItems(labels, -1, (dialog, which) -> {
                dialog.dismiss();
                showPurchaseMethods(packages.get(which).getAsJsonObject());
            })
            .setNegativeButton(R.string.dialog_negative, null)
            .show();
    }

    private String packageLabel(JsonObject item) {
        String name = item.has("name") ? item.get("name").getAsString() : getString(R.string.mine_member_package);
        String duration = item.has("isPermanent") && item.get("isPermanent").getAsBoolean()
            ? "永久会员" : item.has("duration") ? item.get("duration").getAsInt() + getString(R.string.mine_day_unit) : "";
        String price = item.has("price") ? "¥" + item.get("price").getAsString() : "";
        String description = item.has("description") ? item.get("description").getAsString() : "";
        StringBuilder label = new StringBuilder(name);
        if (!duration.isEmpty()) label.append(" · ").append(duration);
        if (!price.isEmpty()) label.append(" · ").append(price);
        if (!description.isEmpty()) label.append("\n").append(description);
        return label.toString();
    }

    private void showPurchaseMethods(JsonObject item) {
        int groupId = item.get("id").getAsInt();
        String[] methods = { "余额购买", "积分购买" };
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(packageLabel(item))
            .setItems(methods, (dialog, which) -> purchasePackage(groupId, which == 0))
            .setNegativeButton(R.string.dialog_negative, null)
            .show();
    }

    private void purchasePackage(int groupId, boolean useBalance) {
        new Thread(() -> {
            try {
                if (useBalance) BeeApi.get().purchaseWithBalance(groupId);
                else BeeApi.get().purchaseWithScore(groupId);
                if (isAdded()) requireActivity().runOnUiThread(() -> {
                    Notify.show("会员开通成功");
                    refreshProfile(false);
                    refreshVodConfig();
                });
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void onNotices() {
        new Thread(() -> {
            try {
                JsonArray notices = BeeApi.get().getActiveNotices();
                if (isAdded()) requireActivity().runOnUiThread(() -> showNotices(notices));
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void showNotices(JsonArray notices) {
        if (notices.size() == 0) {
            new MaterialAlertDialogBuilder(requireActivity())
                .setTitle(R.string.mine_notice)
                .setMessage("暂无公告")
                .setPositiveButton(R.string.dialog_positive, null)
                .show();
            return;
        }
        String[] titles = new String[notices.size()];
        for (int i = 0; i < notices.size(); i++) titles[i] = notices.get(i).getAsJsonObject().has("title")
            ? notices.get(i).getAsJsonObject().get("title").getAsString() : "系统公告";
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.mine_notice)
            .setItems(titles, (dialog, which) -> {
                JsonObject notice = notices.get(which).getAsJsonObject();
                new MaterialAlertDialogBuilder(requireActivity())
                    .setTitle(titles[which])
                    .setMessage(notice.has("content") ? notice.get("content").getAsString() : "")
                    .setPositiveButton(R.string.dialog_positive, null)
                    .show();
            })
            .setPositiveButton(R.string.dialog_positive, null)
            .show();
    }

    private void onServiceContact() {
        new Thread(() -> {
            try {
                String contact = BeeApi.get().getServiceContact().trim();
                if (isAdded()) requireActivity().runOnUiThread(() -> showServiceContact(contact));
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void showServiceContact(String contact) {
        if (contact.isEmpty()) {
            Notify.show("客服暂未配置");
            return;
        }
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.mine_service)
            .setMessage(contact)
            .setNegativeButton(R.string.dialog_negative, null)
            .setPositiveButton("打开", (dialog, which) -> openServiceContact(contact))
            .show();
    }

    private void openServiceContact(String contact) {
        try {
            String target = contact.startsWith("http://") || contact.startsWith("https://") || contact.startsWith("mqq")
                ? contact : "mqqwpa://im/chat?chat_type=wpa&uin=" + contact + "&version=1";
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(target)));
        } catch (Exception e) {
            Notify.show("无法打开客服入口");
        }
    }

    private void onActivateCode() {
        if (!Setting.isLoggedIn()) {
            LoginDialog.create(requireActivity(), this).show();
            return;
        }
        EditText input = new EditText(requireActivity());
        input.setHint(R.string.mine_activate_hint);
        input.setSingleLine(true);
        int padding = (int) (20 * getResources().getDisplayMetrics().density);
        input.setPadding(padding, 0, padding, 0);
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.mine_activate_title)
            .setView(input)
            .setNegativeButton(R.string.dialog_negative, null)
            .setPositiveButton(R.string.mine_activate, (dialog, which) -> activateCode(input.getText().toString().trim()))
            .show();
    }

    private void activateCode(String code) {
        if (code.isEmpty()) {
            Notify.show(R.string.mine_activate_hint);
            return;
        }
        new Thread(() -> {
            try {
                BeeApi.get().activateCode(code);
                if (isAdded()) requireActivity().runOnUiThread(() -> {
                    Notify.show(R.string.mine_activate_success);
                    refreshProfile(false);
                    refreshVodConfig();
                });
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    private void setDoh() {
        List<Doh> items = VodConfig.get().getDoh();
        if (items.isEmpty()) {
            Notify.show(R.string.mine_doh_empty);
            return;
        }
        List<String> names = new ArrayList<>();
        for (Doh item : items) names.add(item.getName());
        int checked = Math.max(0, items.indexOf(Doh.objectFrom(Setting.getDoh())));
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.setting_doh)
            .setNegativeButton(R.string.dialog_negative, null)
            .setSingleChoiceItems(names.toArray(new String[0]), checked, (dialog, which) -> {
                Doh doh = items.get(which);
                OkHttp.dns().setDoh(doh);
                Setting.putDoh(doh.toString());
                dialog.dismiss();
            }).show();
    }

    private void setWallDefault() {
        Setting.putWall(Setting.getWall() == 4 ? 1 : Setting.getWall() + 1);
        RefreshEvent.wall();
    }

    private void setWallRefresh() {
        Setting.putWall(0);
        WallConfig.get().load(new Callback() {
            @Override
            public void success() {
                Notify.show(R.string.mine_wall_refresh_success);
            }

            @Override
            public void error(String msg) {
                Notify.show(msg);
            }
        });
    }

    private void onCache() {
        FileUtil.clearCache(new Callback() {
            @Override
            public void success() {
                Notify.show(R.string.mine_cache_cleared);
            }
        });
    }

    private void onBackup() {
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

    private void onRestore() {
        PermissionUtil.requestFile(this, allGranted -> RestoreDialog.create().show(requireActivity(), new Callback() {
            @Override
            public void success() {
                Notify.show(R.string.restore_success);
                VodConfig.get().init().load(getConfigCallback());
                LiveConfig.get().init().load();
                WallConfig.get().init().load();
            }

            @Override
            public void error() {
                Notify.show(R.string.restore_fail);
            }
        }));
    }

    private void showAbout() {
        new MaterialAlertDialogBuilder(requireActivity())
            .setTitle(R.string.mine_about)
            .setMessage(getString(R.string.mine_version_message, BuildConfig.VERSION_NAME))
            .setPositiveButton(R.string.dialog_positive, null)
            .show();
    }

    @Override
    public void setConfig(Config config) {
        VodConfig.load(config, getConfigCallback());
    }

    @Override
    public void setSite(Site item) {
        VodConfig.get().setHome(item);
        RefreshEvent.video();
    }

    private Callback getConfigCallback() {
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
                Notify.dismiss();
                RefreshEvent.config();
                RefreshEvent.video();
            }

            @Override
            public void error(String msg) {
                Notify.dismiss();
                Notify.show(msg);
            }
        };
    }

    private void onMemberLogout() {
        Setting.logout();
        updateMemberUI();
        getRoot().showTrialGate();
        refreshVodConfig();
        Notify.show(R.string.mine_logout_success);
    }

    private void refreshVodConfig() {
        new Thread(() -> {
            try {
                Ui6Config.refreshVodConfig();
                if (isAdded()) requireActivity().runOnUiThread(() -> VodConfig.load(Config.vod(), getConfigCallback()));
            } catch (Exception e) {
                if (isAdded()) requireActivity().runOnUiThread(() -> Notify.show(e.getMessage()));
            }
        }).start();
    }

    @Override
    public void onHiddenChanged(boolean hidden) {
        if (!hidden) {
            updateMemberUI();
            refreshProfile(false);
        }
    }
}
