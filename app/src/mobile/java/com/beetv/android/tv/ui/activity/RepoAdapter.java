package com.beetv.android.tv.ui.activity;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.bean.Config;
import com.beetv.android.tv.databinding.ItemRepoBinding;

import java.util.List;

public class RepoAdapter extends RecyclerView.Adapter<RepoAdapter.ViewHolder> {

    private final Context context;
    private final List<Config> repoList;

    public RepoAdapter(Context context, List<Config> repoList) {
        this.context = context;
        this.repoList = repoList;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(context);
        ItemRepoBinding binding = ItemRepoBinding.inflate(inflater, parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Config config = repoList.get(position);
        holder.binding.repoName.setText(config.getName());
        holder.binding.repoUrl.setText(config.getUrl());
        holder.binding.useBtn.setOnClickListener(v -> {
            Setting.setConfigUrl(config.getUrl());
            Toast.makeText(context, "已切换到：" + config.getName(), Toast.LENGTH_SHORT).show();
            if (context instanceof RepoListActivity) {
                ((RepoListActivity) context).finish();
            }
        });
    }

    @Override
    public int getItemCount() {
        return repoList.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        final ItemRepoBinding binding;

        ViewHolder(ItemRepoBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
