<template>
  <el-card>
    <template #header>签到记录</template>
    <el-table :data="list" border>
      <el-table-column prop="userId" label="用户ID" width="150" />
      <el-table-column prop="signDate" label="签到日期" width="120" />
      <el-table-column prop="consecutiveDays" label="连续天数" width="100" />
      <el-table-column prop="reward" label="获得积分" width="100" />
      <el-table-column prop="createdAt" label="签到时间" width="170" />
    </el-table>
    <el-pagination style="margin-top:12px" background layout="prev,pager,next" :total="total" :page-size="20" @current-change="loadData" />
  </el-card>

  <el-card style="margin-top:16px">
    <template #header>积分日志</template>
    <el-table :data="scores" border>
      <el-table-column prop="userId" label="用户ID" width="150" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }"><el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="score" label="积分变动" width="100">
        <template #default="{ row }"><span :style="{ color: row.score > 0 ? '#67c23a' : '#f56c6c' }">{{ row.score > 0 ? '+' + row.score : row.score }}</span></template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="100" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="createdAt" label="时间" width="170" />
    </el-table>
    <el-pagination style="margin-top:12px" background layout="prev,pager,next" :total="scoreTotal" :page-size="20" @current-change="loadScores" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { signinApi } from '@/api'

const list = ref<any[]>([])
const total = ref(0)
const scores = ref<any[]>([])
const scoreTotal = ref(0)
const typeMap: Record<string, string> = { sign_in: '签到', invite: '邀请', admin: '管理员', consume: '消费', refund: '退款' }

onMounted(() => { loadData(); loadScores() })

const loadData = async (page = 1) => {
  const res: any = await signinApi.getLogs({ page, size: 20 })
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}
const loadScores = async (page = 1) => {
  const res: any = await signinApi.getScores({ page, size: 20 })
  scores.value = res.data?.list || []
  scoreTotal.value = res.data?.total || 0
}
</script>
