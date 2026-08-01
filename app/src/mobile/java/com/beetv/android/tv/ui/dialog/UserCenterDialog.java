package com.beetv.android.tv.ui.dialog;

import android.app.Dialog;
import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;

import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.FragmentActivity;

import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.api.config.BeeApi;
import com.beetv.android.tv.databinding.DialogUserCenterBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.gson.JsonObject;

public class UserCenterDialog {

    private final DialogUserCenterBinding binding;
    private final AlertDialog dialog;
    private JsonObject userProfile;

    public interface UserCenterCallback {
        void onProfileUpdated();
    }

    public static UserCenterDialog create(FragmentActivity activity) {
        return new UserCenterDialog(activity);
    }

    public UserCenterDialog(FragmentActivity activity) {
        this.binding = DialogUserCenterBinding.inflate(LayoutInflater.from(activity));
        this.dialog = new MaterialAlertDialogBuilder(activity).setView(binding.getRoot()).create();
    }

    public void show() {
        initDialog();
        loadProfile();
        initEvent();
    }

    private void initDialog() {
        WindowManager.LayoutParams params = dialog.getWindow().getAttributes();
        params.width = (int) (com.beetv.android.tv.utils.ResUtil.getScreenWidth() * 0.6f);
        params.height = WindowManager.LayoutParams.WRAP_CONTENT;
        dialog.getWindow().setAttributes(params);
        dialog.getWindow().setDimAmount(0.5f);
        dialog.setCanceledOnTouchOutside(true);
    }

    private void loadProfile() {
        new Thread(() -> {
            try {
                JsonObject data = BeeApi.get().getProfile();
                userProfile = data.has("data") ? data.getAsJsonObject("data") : data;
                
                FragmentActivity activity = dialog.getOwnerActivity();
                if (activity != null) {
                    activity.runOnUiThread(() -> {
                        binding.usernameInput.setText(userProfile.has("username") ? userProfile.get("username").getAsString() : "");
                        binding.nicknameInput.setText(userProfile.has("nickname") ? userProfile.get("nickname").getAsString() : "");
                        binding.emailInput.setText(userProfile.has("email") ? userProfile.get("email").getAsString() : "");
                        binding.phoneInput.setText(userProfile.has("phone") && !userProfile.get("phone").isJsonNull() ? userProfile.get("phone").getAsString() : "");
                        
                        int memberLevel = userProfile.has("memberLevel") ? userProfile.get("memberLevel").getAsInt() : 0;
                        String memberExpireAt = userProfile.has("memberExpireAt") && !userProfile.get("memberExpireAt").isJsonNull() 
                            ? userProfile.get("memberExpireAt").getAsString() : "";
                        
                        if (memberLevel > 0) {
                            binding.memberLevelText.setText("VIP 会员");
                            binding.memberExpireText.setText(memberExpireAt.isEmpty() ? "永久" : memberExpireAt.split("T")[0]);
                        } else {
                            binding.memberLevelText.setText("普通用户");
                            binding.memberExpireText.setText("-");
                        }
                        
                        int score = userProfile.has("score") ? userProfile.get("score").getAsInt() : 0;
                        String balance = userProfile.has("balance") && !userProfile.get("balance").isJsonNull() 
                            ? userProfile.get("balance").getAsString() : "0";
                        
                        binding.scoreText.setText(String.valueOf(score));
                        binding.balanceText.setText("¥" + balance);
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }).start();
    }

    private void initEvent() {
        binding.changeAvatarBtn.setOnClickListener(v -> {
            // TODO: 打开相册或相机更换头像
        });

        binding.cancelBtn.setOnClickListener(v -> dialog.dismiss());

        binding.saveBtn.setOnClickListener(v -> saveProfile());
    }

    private void saveProfile() {
        String username = binding.usernameInput.getText().toString().trim();
        String nickname = binding.nicknameInput.getText().toString().trim();
        String email = binding.emailInput.getText().toString().trim();
        String phone = binding.phoneInput.getText().toString().trim();
        String password = binding.passwordInput.getText().toString().trim();

        if (username.isEmpty()) {
            binding.usernameInput.setError("请输入用户名");
            return;
        }

        new Thread(() -> {
            try {
                JsonObject body = new JsonObject();
                body.addProperty("username", username);
                body.addProperty("nickname", nickname);
                body.addProperty("email", email);
                if (!phone.isEmpty()) {
                    body.addProperty("phone", phone);
                }
                if (!password.isEmpty()) {
                    body.addProperty("password", password);
                }

                int userId = userProfile.has("id") ? userProfile.get("id").getAsInt() : 0;
                if (userId == 0) {
                    throw new Exception("用户 ID 不存在");
                }

                JsonObject resp = BeeApi.get().updateProfile(userId, body);
                int code = resp.has("code") ? resp.get("code").getAsInt() : 0;
                if (code != 200) {
                    String msg = resp.has("message") ? resp.get("message").getAsString() : "保存失败";
                    throw new Exception(msg);
                }

                FragmentActivity activity = dialog.getOwnerActivity();
                if (activity != null) {
                    activity.runOnUiThread(() -> {
                        dialog.dismiss();
                        com.google.android.material.snackbar.Snackbar.make(
                            activity.findViewById(android.R.id.content),
                            "保存成功",
                            com.google.android.material.snackbar.Snackbar.LENGTH_SHORT
                        ).show();
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
                FragmentActivity activity = dialog.getOwnerActivity();
                if (activity != null) {
                    activity.runOnUiThread(() -> {
                        com.google.android.material.snackbar.Snackbar.make(
                            activity.findViewById(android.R.id.content),
                            "保存失败：" + e.getMessage(),
                            com.google.android.material.snackbar.Snackbar.LENGTH_LONG
                        ).show();
                    });
                }
            }
        }).start();
    }

    public void setOnDismissListener(DialogInterface.OnDismissListener listener) {
        dialog.setOnDismissListener(listener);
    }
}
