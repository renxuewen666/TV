<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>APP编译任务</span>
        <el-button type="primary" @click="openDialog()">新建编译任务</el-button>
      </div>
    </template>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
      使用 release 分支的 GitHub Actions 构建。TV 更新通道为 10000，手机更新通道为 10001；令牌建议仅配置在服务器环境变量中。
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
      <el-table-column label="操作" width="360" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status==='pending'" size="small" type="success" @click="handleTrigger(row.id)">触发构建</el-button>
          <el-button v-if="row.status==='running'" size="small" @click="handleCheck(row.id)">刷新状态</el-button>
          <template v-if="row.status==='success' && row.artifacts">
            <el-popover placement="bottom" :width="260" trigger="click">
              <template #reference>
                <el-button size="small" type="primary">下载产物</el-button>
              </template>
              <div v-for="a in parseArtifacts(row.artifacts)" :key="a.id" style="padding:4px 0">
                <el-link type="primary" :underline="false" @click="downloadArtifact(row.id, a)">
                  {{ a.name }} ({{ formatSize(a.size) }})
                </el-link>
              </div>
            </el-popover>
          </template>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新建编译任务" v-model="visible" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务名"><el-input v-model="form.name" placeholder="可选" /></el-form-item>
        <el-form-item label="GitHub仓库">
          <el-input v-model="form.githubRepo" placeholder="renxuewen666/TV 或 https://github.com/renxuewen666/TV" />
          <div style="font-size:12px;color:#909399;margin-top:4px">支持 owner/repo、GitHub HTTPS 地址或 SSH 地址，保存时会自动转换。</div>
        </el-form-item>
        <el-form-item label="GitHub Token">
          <el-input v-model="form.githubToken" type="password" show-password placeholder="服务端已配置时可留空" />
        </el-form-item>
        <el-form-item label="工作流文件"><el-input v-model="form.workflowFile" placeholder="build.yml" /></el-form-item>
        <el-form-item label="分支"><el-input v-model="form.branch" placeholder="release" /></el-form-item>
        <el-form-item label="版本号"><el-input v-model="form.version" placeholder="4.9.10" /></el-form-item>
        <el-form-item label="版本码"><el-input-number v-model="form.versionCode" :min="1" :step="1" placeholder="留空自动生成" /></el-form-item>
        <el-form-item label="构建目标"><el-select v-model="form.channel"><el-option label="TV + 手机" value="all" /><el-option label="TV（10000）" value="10000" /><el-option label="手机（10001）" value="10001" /></el-select></el-form-item>
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
const form = ref({ name: '', githubRepo: 'renxuewen666/TV', githubToken: '', workflowFile: 'build.yml', branch: 'release', version: '', versionCode: undefined as number | undefined, channel: 'all' })
const statusLabel: Record<string, string> = { pending: '待触发', running: '构建中', success: '成功', failed: '失败' }
const statusType: Record<string, string> = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }

onMounted(() => loadData())

const loadData = async () => {
  const res: any = await compileApi.list()
  list.value = res.data?.list || []
}

const openDialog = () => {
  form.value = { name: '', githubRepo: 'renxuewen666/TV', githubToken: '', workflowFile: 'build.yml', branch: 'release', version: '', versionCode: undefined, channel: 'all' }
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

const parseArtifacts = (artifacts: string) => {
  try { return JSON.parse(artifacts) } catch { return [] }
}

const downloadArtifact = async (taskId: number, artifact: any) => {
  const blob = await compileApi.download(taskId, artifact.id)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${artifact.name}.zip`
  link.click()
  URL.revokeObjectURL(url)
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return size.toFixed(1) + ' ' + units[i]
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await compileApi.remove(id)
  ElMessage.success('删除成功')
  loadData()
}
</script>
