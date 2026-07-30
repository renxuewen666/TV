<template>
  <div class="payment-page">
    <el-card v-if="tab === 'config'">
      <template #header>
        <div class="header-row">
          <div>
            <span>支付订单</span>
            <div class="desc">支付商户、接口地址与回调地址统一在“支付配置（易支付）”中维护。</div>
          </div>
          <el-button @click="loadOrders(1)">刷新</el-button>
        </div>
      </template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:16px">
        若使用易支付，请优先在“易支付”页面配置具体商户；这里保留接口地址、默认回调/返回地址等全局支付参数。
      </el-alert>
      <el-form label-width="170px" class="config-form">
        <el-form-item v-for="item in configs" :key="item.key" :label="item.remark || item.key">
          <el-input v-model="item.value" :type="item.key.includes('key') ? 'password' : 'text'" show-password class="config-input" />
          <el-button type="primary" size="small" style="margin-left:8px" @click="saveOne(item)">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-else>
      <template #header>
        <div class="header-row">
          <span>支付订单</span>
          <el-button @click="loadOrders(1)">刷新</el-button>
        </div>
      </template>
      <el-table :data="orders" border v-loading="loadingOrders">
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column prop="tradeNo" label="交易号" min-width="180" />
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="levelId" label="等级" width="90" />
        <el-table-column prop="amount" label="金额" width="90" />
        <el-table-column prop="channel" label="渠道" width="100" />
        <el-table-column prop="payType" label="支付方式" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'">{{ orderStatusLabel(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="paidAt" label="支付时间" width="180" />
      </el-table>
      <el-pagination style="margin-top:12px" background layout="total,prev,pager,next" :total="orderTotal" :page-size="20" @current-change="loadOrders" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { paymentApi, systemApi } from '@/api'
import { ElMessage } from 'element-plus'

interface ConfigItem { key: string; value: string; group: string; remark: string }

const route = useRoute()
const tab = computed(() => String(route.params.tab || 'orders'))
const configs = ref<ConfigItem[]>([])
const orders = ref<any[]>([])
const orderTotal = ref(0)
const loadingOrders = ref(false)

const orderStatusLabel = (status: number) => ({ 0: '待支付', 1: '已支付', 2: '已取消' } as Record<number, string>)[Number(status)] || '未知'

const loadConfigs = async () => {
  const res: any = await systemApi.getByGroup('payment')
  configs.value = res.data || []
}
const loadOrders = async (page = 1) => {
  loadingOrders.value = true
  try {
    const res: any = await paymentApi.getOrders({ page, size: 20 })
    orders.value = res.data?.list || []
    orderTotal.value = res.data?.total || 0
  } finally {
    loadingOrders.value = false
  }
}
const saveOne = async (item: ConfigItem) => {
  await systemApi.update(item.key, { value: item.value, remark: item.remark, group: 'payment' })
  ElMessage.success('保存成功')
}
const saveAll = async () => {
  await systemApi.batchUpdate(configs.value.map(i => ({ key: i.key, value: i.value, remark: i.remark, group: 'payment' })))
  ElMessage.success('支付配置已保存')
}
const initDefaults = async () => {
  await systemApi.initDefaults()
  await loadConfigs()
  ElMessage.success('默认配置已初始化')
}
const loadCurrent = () => {
  if (tab.value === 'config') loadConfigs()
  else loadOrders(1)
}

watch(tab, loadCurrent)
onMounted(loadCurrent)
</script>

<style scoped>
.payment-page { display: block; }
.header-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.desc { color: #909399; font-size: 12px; margin-top: 4px; }
.config-form { max-width: 900px; }
.config-input { width: 520px; }
</style>
