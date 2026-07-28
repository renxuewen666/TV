<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">蜜蜂影视管理后台</div>
      <el-menu :default-active="activeMenu" router background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item index="/dashboard"><el-icon><Monitor /></el-icon><span>仪表盘</span></el-menu-item>
        <el-sub-menu index="config">
          <template #title><el-icon><Setting /></el-icon><span>系统配置</span></template>
          <el-menu-item index="/system">系统设置</el-menu-item>
          <el-menu-item index="/api-manage">接口管理</el-menu-item>
          <el-menu-item index="/repo">仓库配置</el-menu-item>
          <el-menu-item index="/home-layout">首页配置</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="biz">
          <template #title><el-icon><Coin /></el-icon><span>业务管理</span></template>
          <el-menu-item index="/member">会员配置</el-menu-item>
          <el-menu-item index="/payment">支付设置</el-menu-item>
          <el-menu-item index="/epay">易支付</el-menu-item>
          <el-menu-item index="/notice">公告管理</el-menu-item>
          <el-menu-item index="/hotsearch">热搜管理</el-menu-item>
          <el-menu-item index="/signin">签到积分</el-menu-item>
          <el-menu-item index="/score-products">积分商品</el-menu-item>
          <el-menu-item index="/score-exchanges">兑换记录</el-menu-item>
          <el-menu-item index="/database">数据库管理</el-menu-item>
          <el-menu-item index="/compile">APP编译</el-menu-item>
          <el-menu-item index="/app-manage">应用管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/users"><el-icon><User /></el-icon><span>管理员</span></el-menu-item>
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
const activeMenu = computed(() => route.path)

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
.header { background: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; }
.header-right { display: flex; align-items: center; gap: 16px; }
.user-name { cursor: pointer; color: #333; }
.main { background: #f0f2f5; padding: 20px; }
</style>
