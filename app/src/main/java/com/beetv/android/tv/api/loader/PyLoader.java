package com.beetv.android.tv.api.loader;

import com.beetv.android.tv.App;
import com.github.catvod.crawler.Spider;
import com.github.catvod.crawler.SpiderNull;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Python 爬虫加载器 - 临时桩实现
 * 注：Chaquo 模块因 Python 3.10 依赖暂时被排除
 */
public class PyLoader {

    private final ConcurrentHashMap<String, Spider> spiders;
    private String recent;

    public PyLoader() {
        spiders = new ConcurrentHashMap<>();
    }

    public void clear() {
        spiders.values().forEach(Spider::destroy);
        spiders.clear();
    }

    public void setRecent(String recent) {
        this.recent = recent;
    }

    public Spider getSpider(String key, String api, String ext) {
        // Chaquo 不可用，返回空 Spider
        return new SpiderNull();
    }

    public Object[] proxy(Map<String, String> params) throws Exception {
        return null;
    }
}
