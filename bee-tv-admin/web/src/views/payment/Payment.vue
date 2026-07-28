<template>
  <div>
    <el-card style="margin-bottom:16px">
      <template #header>支付渠道配置</template>
      <el-form label-width="100px">
        <el-form-item label="微信支付">
          <el-input v-model="wechatConfig" type="textarea" rows="4" placeholder="JSON配置" style="width:500px" />
          <el-button type="primary" size="small" style="margin-left:8px" @click="saveConfig('wechat')">保存</el-button>
        </el-form-item>
        <el-form-item label="支付宝">
          <el-input v-model="alipayConfig" type="textarea" rows="4" placeholder="JSON配置" style="width:500px" />
          <el-button type="primary" size="small" style="margin-left:8px" @click="saveConfig('alipay')">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card>
      <template #header>支付订单</template>
      <el-table :data="orders" border>
        <el-table-column prop="orderNo" label="订单号" />
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="levelId" label="等级" />
        <el-table-column prop="amount" label="金额" />
        <el-table-column prop="channel" label="渠道" />
        <el-table-column prop="status" label="状态">
          <template #default="{row}">{{ {0:'待支付',1:'已支付',2:'已取消'}[row.status] }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { paymentApi } from '@/api'
import { ElMessage } from 'element-plus'

const wechatConfig = ref('{}')
const alipayConfig = ref('{}')
const orders = ref<any[]>([])

onMounted(async () => {
  const [configs, ords]: any[] = await Promise.all([paymentApi.getConfigs(), paymentApi.getOrders()])
  orders.value = ords.data?.list || []
  const list = configs.data || []
  list.forEach((c: any) => {
    if (c.channel === 'wechat') wechatConfig.value = c.config
    if (c.channel === 'alipay') alipayConfig.value = c.config
  })
})

const saveConfig = async (channel: string) => {
  const config = channel === 'wechat' ? wechatConfig.value : alipayConfig.value
  await paymentApi.saveConfig(channel, { config })
  ElMessage.success('保存成功')
}
</script>
