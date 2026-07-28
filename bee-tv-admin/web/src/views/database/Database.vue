<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>数据库管理</span>
        <el-button type="primary" :loading="backing" @click="handleBackup">立即备份</el-button>
      </div>
    </template>
    <el-alert type="warning" :closable="false" show-icon style="margin-bottom:12px">
      还原操作将覆盖当前数据库，系统会自动创建还原前备份。还原后需重启服务生效。
    </el-alert>
    <el-table :data="list" border>
      <el-table-column prop="name" label="文件名" />
      <el-table-column prop="size" label="大小" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column label="操作" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="handleDownload(row.name)">下载</el-button>
          <el-button size="small" type="warning" @click="handleRestore(row.name)">还原</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.name)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { databaseApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const backing = ref(false)

onMounted(() => loadData())

const loadData = async () => {
  const res: any = await databaseApi.listBackups()
  list.value = res.data || []
}

const handleBackup = async () => {
  backing.value = true
  try {
    const res: any = await databaseApi.backup()
    ElMessage.success(`备份成功: ${res.data?.filename}`)
    loadData()
  } finally { backing.value = false }
}

const handleDownload = (filename: string) => {
  const token = localStorage.getItem('token')
  const a = document.createElement('a')
  a.href = `${databaseApi.downloadUrl(filename)}?token=${token}`
  a.click()
}

const handleRestore = async (filename: string) => {
  await ElMessageBox.confirm(`确认还原到「${filename}」？当前数据将被覆盖。`, '危险操作', { type: 'error', confirmButtonText: '确认还原' })
  await databaseApi.restore(filename)
  ElMessage.success('还原成功，请重启服务生效')
  loadData()
}

const handleDelete = async (filename: string) => {
  await ElMessageBox.confirm(`确认删除备份「${filename}」？`, '提示', { type: 'warning' })
  await databaseApi.deleteBackup(filename)
  ElMessage.success('删除成功')
  loadData()
}
</script>
