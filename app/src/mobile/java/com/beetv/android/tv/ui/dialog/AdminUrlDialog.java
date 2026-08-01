package com.beetv.android.tv.ui.dialog;

import android.content.DialogInterface;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;

import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.FragmentActivity;

import com.beetv.android.tv.Setting;
import com.beetv.android.tv.databinding.DialogAdminUrlBinding;
import com.beetv.android.tv.impl.AdminUrlCallback;
import com.beetv.android.tv.utils.ResUtil;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

public class AdminUrlDialog implements DialogInterface.OnDismissListener {

    private final DialogAdminUrlBinding binding;
    private final AdminUrlCallback callback;
    private final AlertDialog dialog;

    public static AdminUrlDialog create(FragmentActivity activity) {
        return new AdminUrlDialog(activity, (AdminUrlCallback) activity);
    }

    public static AdminUrlDialog create(FragmentActivity activity, AdminUrlCallback callback) {
        return new AdminUrlDialog(activity, callback);
    }

    public AdminUrlDialog(FragmentActivity activity, AdminUrlCallback callback) {
        this.callback = callback;
        this.binding = DialogAdminUrlBinding.inflate(LayoutInflater.from(activity));
        this.dialog = new MaterialAlertDialogBuilder(activity).setView(binding.getRoot()).create();
    }

    public void show() {
        initDialog();
        initView();
        initEvent();
    }

    private void initDialog() {
        WindowManager.LayoutParams params = dialog.getWindow().getAttributes();
        params.width = (int) (ResUtil.getScreenWidth() * 0.55f);
        dialog.getWindow().setAttributes(params);
        dialog.getWindow().setDimAmount(0);
        dialog.setOnDismissListener(this);
        dialog.show();
    }

    private void initView() {
        String url = Setting.getAdminUrl();
        binding.text.setText(url);
        binding.text.setSelection(url != null ? url.length() : 0);
    }

    private void initEvent() {
        binding.positive.setOnClickListener(this::onPositive);
        binding.negative.setOnClickListener(this::onNegative);
        binding.text.setOnEditorActionListener((textView, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) binding.positive.performClick();
            return true;
        });
    }

    private void onPositive(View view) {
        String url = binding.text.getText().toString().trim();
        callback.setAdminUrl(url);
        dialog.dismiss();
    }

    private void onNegative(View view) {
        dialog.dismiss();
    }

    @Override
    public void onDismiss(DialogInterface dialogInterface) {
    }
}
