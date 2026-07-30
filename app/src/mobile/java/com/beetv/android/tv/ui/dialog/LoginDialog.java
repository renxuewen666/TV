package com.beetv.android.tv.ui.dialog;

import android.app.Dialog;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;

import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.FragmentActivity;

import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.api.config.BeeApi;
import com.beetv.android.tv.databinding.DialogLoginBinding;
import com.beetv.android.tv.utils.ResUtil;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.gson.JsonObject;

public class LoginDialog implements DialogInterface.OnDismissListener {

    private final DialogLoginBinding binding;
    private final LoginCallback callback;
    private final AlertDialog dialog;
    private boolean isRegisterMode = false;

    public interface LoginCallback {
        void onLoginResult(String email, String nickname, int score);
    }

    public static LoginDialog create(FragmentActivity activity, LoginCallback callback) {
        return new LoginDialog(activity, callback);
    }

    public LoginDialog(FragmentActivity activity, LoginCallback callback) {
        this.callback = callback;
        this.binding = DialogLoginBinding.inflate(LayoutInflater.from(activity));
        this.dialog = new MaterialAlertDialogBuilder(activity).setView(binding.getRoot()).create();
    }

    public void show() {
        initDialog();
        initEvent();
    }

    private void initDialog() {
        WindowManager.LayoutParams params = dialog.getWindow().getAttributes();
        params.width = (int) (ResUtil.getScreenWidth() * 0.8f);
        dialog.getWindow().setAttributes(params);
        dialog.getWindow().setDimAmount(0.3f);
        dialog.setOnDismissListener(this);
        dialog.setCanceledOnTouchOutside(false);
        dialog.show();
    }

    private void initEvent() {
        binding.positive.setOnClickListener(v -> {
            if (isRegisterMode) doRegister();
            else doLogin();
        });
        binding.toggle.setOnClickListener(v -> toggleMode());
        binding.skip.setOnClickListener(v -> dialog.dismiss());
        binding.password.setOnEditorActionListener((textView, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) binding.positive.performClick();
            return true;
        });
    }

    private void toggleMode() {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            binding.title.setText(R.string.login_reg_title);
            binding.nicknameLayout.setVisibility(View.VISIBLE);
            binding.positive.setText(R.string.login_reg_btn);
            binding.toggle.setText(R.string.login_toggle_login);
        } else {
            binding.title.setText(R.string.login_title);
            binding.nicknameLayout.setVisibility(View.GONE);
            binding.positive.setText(R.string.login_btn);
            binding.toggle.setText(R.string.login_toggle_register);
        }
        binding.errorText.setVisibility(View.GONE);
    }

    private void doLogin() {
        String account = binding.account.getText().toString().trim();
        String password = binding.password.getText().toString().trim();
        if (account.isEmpty() || password.isEmpty()) {
            showError("Please fill in all fields");
            return;
        }
        setLoading(true);
        new Thread(() -> {
            try {
                JsonObject data = BeeApi.get().login(account, password);
                String token = data.get("token").getAsString();
                JsonObject user = data.has("user") ? data.getAsJsonObject("user") : data;
                String email = user.has("email") ? user.get("email").getAsString() : account;
                String nickname = user.has("nickname") ? user.get("nickname").getAsString() : account;
                int score = user.has("score") ? user.get("score").getAsInt() : 0;
                Setting.putAuthToken(token);
                Setting.putUserEmail(email);
                Setting.putUserNickname(nickname);
                Setting.putUserScore(score);
                dialog.getOwnerActivity().runOnUiThread(() -> {
                    setLoading(false);
                    if (callback != null) callback.onLoginResult(email, nickname, score);
                    dialog.dismiss();
                });
            } catch (Exception e) {
                dialog.getOwnerActivity().runOnUiThread(() -> {
                    setLoading(false);
                    showError(e.getMessage());
                });
            }
        }).start();
    }

    private void doRegister() {
        String email = binding.account.getText().toString().trim();
        String nickname = binding.nickname.getText().toString().trim();
        String password = binding.password.getText().toString().trim();
        if (email.isEmpty() || password.isEmpty()) {
            showError("Please fill in all fields");
            return;
        }
        if (nickname.isEmpty()) nickname = email;
        setLoading(true);
        new Thread(() -> {
            try {
                JsonObject data = BeeApi.get().register(email, nickname, password);
                String token = data.get("token").getAsString();
                JsonObject user = data.has("user") ? data.getAsJsonObject("user") : data;
                int score = user.has("score") ? user.get("score").getAsInt() : 0;
                Setting.putAuthToken(token);
                Setting.putUserEmail(email);
                Setting.putUserNickname(nickname);
                Setting.putUserScore(score);
                dialog.getOwnerActivity().runOnUiThread(() -> {
                    setLoading(false);
                    if (callback != null) callback.onLoginResult(email, nickname, score);
                    dialog.dismiss();
                });
            } catch (Exception e) {
                dialog.getOwnerActivity().runOnUiThread(() -> {
                    setLoading(false);
                    showError(e.getMessage());
                });
            }
        }).start();
    }

    private void showError(String msg) {
        binding.errorText.setText(msg);
        binding.errorText.setVisibility(View.VISIBLE);
    }

    private void setLoading(boolean loading) {
        binding.positive.setEnabled(!loading);
        binding.positive.setText(loading ? "..." : (isRegisterMode ? R.string.login_reg_btn : R.string.login_btn));
    }

    @Override
    public void onDismiss(DialogInterface dialogInterface) {
    }
}
