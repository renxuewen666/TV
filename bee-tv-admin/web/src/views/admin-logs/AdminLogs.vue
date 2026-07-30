<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span>管理员日志</span>
        <div>
          <el-input v-model="filters.admin" placeholder="管理员" clearable style="width:140px;margin-right:8px" @keyup.enter="loadData(1)" />
          <el-input v-model="filters.module" placeholder="模块" clearable style="width:140px;margin-right:8px" @keyup.enter="loadData(1)" />
          <el-button @click="loadData(1)">查询</el-button>
          <el-button type="danger" plain @click="handleClear">清空日志</el-button>
        </div>
      </div>
    </template>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
      日志自动记录后台新增、编辑、删除、备份、还原、清空等写操作；只读查询不会写入日志，避免日志膨胀。
    </el-alert>
    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="admin" label="管理员" width="120" />
      <el-table-column prop="action" label="操作" width="120" />
      <el-table-column prop="module" label="模块" width="130" />
      <el-table-column prop="method" label="方法" width="80" />
      <el-table-column prop="ip" label="IP" width="150" />
      <el-table-column prop="path" label="接口路径" min-width="220" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" width="180" />
    </el-table>
    <el-pagination
      style="margin-top:12px"
      background
      layout="total,prev,pager,next"
      :total="total"
      :page-size="pageSize"
      @current-change="loadData"
    />
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { adminLogApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const loading = ref(false)
const filters = ref({ admin: '', module: '' })

const loadData = async (page = 1) => {
  loading.value = true
  try {
    const res: any = await adminLogApi.list({ page, size: pageSize, ...filters.value })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } finally {
    loading.value = false
  }
}

const handleClear = async () => {
  await ElMessageBox.confirm('确认清空全部管理员日志？此操作不可恢复。', '危险操作', { type: 'warning', confirmButtonText: '确认清空' })
  await adminLogApi.clear()
  ElMessage.success('日志已清空')
  loadData(1)
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
</style>
