<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card shadow="hover" class="stat-card">
          <div class="stat">
            <div class="stat-icon" :style="{ background: card.color }"><el-icon :size="24"><component :is="card.icon" /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-title">{{ card.title }}</div>
              <div v-if="card.sub" class="stat-sub">{{ card.sub }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="12">
        <el-card>
          <template #header>新增会员趋势 (近7天)</template>
          <v-chart :option="memberTrendOption" style="height:280px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>签到活跃度 (近7天)</template>
          <v-chart :option="signinTrendOption" style="height:280px" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top:20px">
      <el-col :span="16">
        <el-card>
          <template #header>积分概况</template>
          <v-chart :option="pointsOption" style="height:260px" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>资源概况</template>
          <v-chart :option="resourcesOption" style="height:260px" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Present, Coin, ShoppingCart } from '@element-plus/icons-vue'
import { dashboardApi } from '@/api'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const stats = ref<any>({})

const statCards = computed(() => {
  const s = stats.value
  return [
    { title: '会员总数', value: s.members?.total ?? '-', sub: `今日新增 ${s.members?.todayNew ?? 0}`, icon: User, color: '#409eff' },
    { title: '今日签到', value: s.signin?.today ?? '-', sub: `本周 ${s.signin?.thisWeek ?? 0} 次`, icon: Present, color: '#67c23a' },
    { title: '积分发放', value: s.points?.totalDistributed ?? '-', sub: `已消费 ${s.points?.totalSpent ?? 0}`, icon: Coin, color: '#e6a23c' },
    { title: '订单总数', value: s.orders?.total ?? '-', sub: `待处理 ${s.orders?.pending ?? 0} 笔`, icon: ShoppingCart, color: '#f56c6c' },
  ]
})

const makeDateAxis = (data: { date: string; count: number }[]) => ({
  xAxis: { type: 'category', data: data.map(d => d.date.slice(5)) },
  yAxis: { type: 'value', minInterval: 1 },
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 10, bottom: 20 },
})

const memberTrendOption = computed(() => {
  const data = stats.value.trends?.newMembers || []
  return {
    ...makeDateAxis(data),
    series: [{ data: data.map((d: any) => d.count), type: 'line', smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#409eff' }, lineStyle: { color: '#409eff' } }],
  }
})

const signinTrendOption = computed(() => {
  const data = stats.value.trends?.signins || []
  return {
    ...makeDateAxis(data),
    series: [{ data: data.map((d: any) => d.count), type: 'bar', itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }],
  }
})

const pointsOption = computed(() => {
  const d = stats.value.points || {}
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['发放积分', '消费积分'], bottom: 0 },
    grid: { left: 50, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: ['积分'] },
    yAxis: { type: 'value' },
    series: [
      { name: '发放积分', data: [d.totalDistributed || 0], type: 'bar', itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] }, barGap: '20%', barWidth: '30%' },
      { name: '消费积分', data: [d.totalSpent || 0], type: 'bar', itemStyle: { color: '#f56c6c', borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
    ],
  }
})

const resourcesOption = computed(() => {
  const r = stats.value.resources || {}
  return {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: r.activeCodes || 0, name: '可用激活码' },
        { value: r.activeNotices || 0, name: '公告' },
        { value: r.activeSources || 0, name: '爬虫源' },
      ],
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
    }],
  }
})

onMounted(async () => {
  try {
    const res: any = await dashboardApi.getStats()
    stats.value = res.data || res || {}
  } catch {}
})
</script>

<style scoped>
.stat { display: flex; align-items: center; gap: 14px; }
.stat-icon { width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; }
.stat-value { font-size: 22px; font-weight: 700; }
.stat-title { font-size: 13px; color: #909399; margin-top: 2px; }
.stat-sub { font-size: 11px; color: #b0b0b0; margin-top: 2px; }
</style>
