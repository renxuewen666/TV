package com.beetv.android.tv.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.beetv.android.tv.R;
import com.beetv.android.tv.Setting;
import com.beetv.android.tv.api.config.BeeApi;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.List;

public class RepoListActivity extends AppCompatActivity implements SwipeRefreshLayout.OnRefreshListener {

    private RecyclerView recyclerView;
    private SwipeRefreshLayout refreshLayout;
    private RepoAdapter adapter;
    private List<JsonObject> repoList;

    public static void start(AppCompatActivity activity) {
        activity.startActivity(new Intent(activity, RepoListActivity.class));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_repo_list);

        recyclerView = findViewById(R.id.recyclerView);
        refreshLayout = findViewById(R.id.refreshLayout);

        repoList = new ArrayList<>();
        adapter = new RepoAdapter(this, repoList);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        recyclerView.setAdapter(adapter);

        refreshLayout.setOnRefreshListener(this);
        refreshLayout.setColorSchemeResources(R.color.primary);

        loadRepos();
    }

    @Override
    public void onRefresh() {
        loadRepos();
    }

    private void loadRepos() {
        new Thread(() -> {
            try {
                String base = Setting.getAdminUrl();
                String body = BeeApi.get().get(base + "/repo/active");
                JsonObject resp = com.github.catvod.utils.Json.parse(body).getAsJsonObject();
                int code = resp.has("code") ? resp.get("code").getAsInt() : 0;
                if (code != 200) {
                    runOnUiThread(() -> {
                        Toast.makeText(this, "获取仓库失败：" + resp.get("message").getAsString(), Toast.LENGTH_SHORT).show();
                        refreshLayout.setRefreshing(false);
                    });
                    return;
                }

                JsonArray repos = resp.has("data") ? resp.getAsJsonObject("data").getAsJsonArray("repos") : new JsonArray();
                
                repoList.clear();
                for (JsonElement e : repos) {
                    JsonObject repo = e.getAsJsonObject();
                    String url = repo.has("url") ? repo.get("url").getAsString() : "";
                    String name = repo.has("name") ? repo.get("name").getAsString() : url;
                    int status = repo.has("status") ? repo.get("status").getAsInt() : 1;
                    
                    if (status == 1 && !url.isEmpty()) {
                        repoList.add(repo);
                    }
                }

                runOnUiThread(() -> {
                    adapter.notifyDataSetChanged();
                    refreshLayout.setRefreshing(false);
                });
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(this, "加载失败：" + e.getMessage(), Toast.LENGTH_SHORT).show();
                    refreshLayout.setRefreshing(false);
                });
            }
        }).start();
    }
}
