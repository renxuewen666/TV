<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>APP编译任务</span>
        <el-button type="primary" @click="openDialog()">新建编译任务</el-button>
      </div>
    </template>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
      通过在GitHub仓库配置Actions工作流，后台可远程触发CI构建APK。工作流示例见下方说明。
    </el-alert>
    <el-table :data="list" border>
      <el-table-column prop="name" label="任务名" width="120" />
      <el-table-column prop="githubRepo" label="仓库" width="180" />
      <el-table-column prop="branch" label="分支" width="100" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column prop="channel" label="渠道" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType[row.status]" size="small">{{ statusLabel[row.status] || row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status==='pending'" size="small" type="success" @click="handleTrigger(row.id)">触发构建</el-button>
          <el-button v-if="row.status==='running'" size="small" @click="handleCheck(row.id)">刷新状态</el-button>
          <el-button v-if="row.status==='success' && row.artifactUrl" size="small" type="primary" @click="openUrl(row.artifactUrl)">下载产物</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新建编译任务" v-model="visible" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务名"><el-input v-model="form.name" placeholder="可选" /></el-form-item>
        <el-form-item label="GitHub仓库" required><el-input v-model="form.githubRepo" placeholder="owner/repo" /></el-form-item>
        <el-form-item label="GitHub Token" required>
          <el-input v-model="form.githubToken" type="password" show-password placeholder="ghp_xxx" />
        </el-form-item>
        <el-form-item label="工作流文件"><el-input v-model="form.workflowFile" placeholder="build.yml" /></el-form-item>
        <el-form-item label="分支"><el-input v-model="form.branch" placeholder="main" /></el-form-item>
        <el-form-item label="版本号"><el-input v-model="form.version" placeholder="1.0.0" /></el-form-item>
        <el-form-item label="渠道"><el-input v-model="form.channel" placeholder="default" /></el-form-item>
      </el-form>
      <el-alert type="warning" :closable="false" show-icon style="margin-top:12px">
        Token需要 repo 和 workflow 权限。在 GitHub Settings > Developer settings > Personal access tokens 创建。
      </el-alert>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="handleCreate">创建</el-button></template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { compileApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const form = ref({ name: '', githubRepo: '', githubToken: '', workflowFile: 'build.yml', branch: 'main', version: '', channel: 'default' })
const statusLabel: Record<string, string> = { pending: '待触发', running: '构建中', success: '成功', failed: '失败' }
const statusType: Record<string, string> = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }

onMounted(() => loadData())

const loadData = async () => {
  const res: any = await compileApi.list()
  list.value = res.data?.list || []
}

const openDialog = () => {
  form.value = { name: '', githubRepo: '', githubToken: '', workflowFile: 'build.yml', branch: 'main', version: '', channel: 'default' }
  visible.value = true
}

const handleCreate = async () => {
  await compileApi.create(form.value)
  ElMessage.success('创建成功')
  visible.value = false
  loadData()
}

const handleTrigger = async (id: number) => {
  await ElMessageBox.confirm('确认触发GitHub Actions构建？', '提示', { type: 'info' })
  try {
    const res: any = await compileApi.trigger(id)
    ElMessage.success(`构建已触发: ${res.data?.workflowRunId}`)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '触发失败')
  }
  loadData()
}

const handleCheck = async (id: number) => {
  const res: any = await compileApi.checkStatus(id)
  ElMessage.info(res.data?.message || `状态: ${res.data?.status}`)
  loadData()
}

const openUrl = (url: string) => window.open(url, '_blank')

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await compileApi.remove(id)
  ElMessage.success('删除成功')
  loadData()
}
</script>
