<template>
  <el-container class="layout">
    <el-aside width="240px" class="aside">
      <div class="logo">蜜蜂影视管理后台</div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        class="menu"
      >
        <el-menu-item index="/dashboard"><el-icon><Monitor /></el-icon><span>控制台</span></el-menu-item>

        <el-sub-menu index="system-setting">
          <template #title><el-icon><Setting /></el-icon><span>系统设置</span></template>
          <el-menu-item index="/system/basic">基础配置</el-menu-item>
          <el-menu-item index="/system/email">邮件配置</el-menu-item>
          <el-menu-item index="/system/member">会员配置</el-menu-item>
          <el-menu-item index="/system/general">通用配置</el-menu-item>
          <el-menu-item index="/system/player">播放器配置</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="permission">
          <template #title><el-icon><User /></el-icon><span>权限管理</span></template>
          <el-menu-item index="/users">管理员管理</el-menu-item>
          <el-menu-item index="/admin-logs">管理员日志</el-menu-item>
          <el-menu-item index="/database">数据库管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="ad-notice">
          <template #title><el-icon><Setting /></el-icon><span>广告管理</span></template>
          <el-menu-item index="/advertisement">综合广告管理</el-menu-item>
          <el-menu-item index="/notice">公告动态</el-menu-item>
          <el-menu-item index="/marquee">跑马灯公告</el-menu-item>
          <el-menu-item index="/notice-tv-home">TV首页公告</el-menu-item>
          <el-menu-item index="/hotsearch">搜索内容推荐</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="danmaku-menu">
          <template #title><el-icon><Monitor /></el-icon><span>弹幕管理</span></template>
          <el-menu-item index="/danmaku">弹幕API配置</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="member-menu">
          <template #title><el-icon><Coin /></el-icon><span>会员管理</span></template>
          <el-menu-item index="/member/users">会员管理</el-menu-item>
          <el-menu-item index="/member/groups">会员分组</el-menu-item>
          <el-menu-item index="/member/rules">会员规则</el-menu-item>
          <el-menu-item index="/member/balance-logs">会员余额日志</el-menu-item>
          <el-menu-item index="/member/score-logs">会员积分日志</el-menu-item>
          <el-menu-item index="/member/codes">卡密列表管理</el-menu-item>
          <el-menu-item index="/member/recharge">充值管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="payment-menu">
          <template #title><el-icon><Coin /></el-icon><span>支付管理</span></template>
          <el-menu-item index="/epay">支付配置（易支付）</el-menu-item>
          <el-menu-item index="/payment/orders">支付订单</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="client-menu">
          <template #title><el-icon><Monitor /></el-icon><span>客户端管理</span></template>
          <el-menu-item index="/app-manage/apps">应用管理</el-menu-item>
          <el-menu-item index="/home-layout">首页配置管理</el-menu-item>
          <el-menu-item index="/repo">仓库配置管理</el-menu-item>
          <el-menu-item index="/api-manage">视频接口管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="version-menu">
          <template #title><el-icon><Setting /></el-icon><span>版本管理</span></template>
          <el-menu-item index="/app-manage/versions">版本管理</el-menu-item>
          <el-menu-item index="/compile">APP编译</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-name">{{ userStore.userInfo?.nickname || '管理员' }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main"><router-view /></el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Monitor, Setting, Coin, User, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const activeMenu = computed(() => (route.meta.activeMenu as string) || route.path)

const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.layout { height: 100vh; }
.aside { background: #304156; overflow-y: auto; }
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-size: 18px; font-weight: bold; border-bottom: 1px solid #434a50; }
.menu { border-right: none; }
.header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-name { cursor: pointer; color: #333; display: inline-flex; align-items: center; gap: 4px; }
.main { background: #f0f2f5; padding: 20px; overflow: auto; }
</style>
