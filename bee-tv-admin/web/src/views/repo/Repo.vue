<template>
  <el-card>
    <template #header>
      <span>仓库配置</span>
      <el-button type="primary" size="small" style="float:right" @click="openDialog()">添加仓库</el-button>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="url" label="地址" show-overflow-tooltip />
      <el-table-column prop="type" label="类型">
        <template #default="{row}">{{ {0:'csp-jar',1:'js仓',2:'py线路'}[row.type] }}</template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" />
      <el-table-column prop="status" label="状态">
        <template #default="{row}"><el-tag :type="row.status?'success':'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button v-if="row.type===0" size="small" @click="triggerUpload(row)">上传JAR</el-button>
          <el-button size="small" type="warning" @click="openTestDialog(row)">测试</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="仓库" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.url" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="csp-jar" :value="0" /><el-option label="js仓" :value="1" /><el-option label="py线路" :value="2" /></el-select></el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="save">确定</el-button></template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="爬虫测试" width="600px">
      <el-form label-width="80px">
        <el-form-item label="仓库">{{ testRepo?.name }} <el-tag size="small">{{ {0:'csp-jar',1:'js仓',2:'py线路'}[testRepo?.type] }}</el-tag></el-form-item>
        <el-form-item label="地址"><el-input :value="testRepo?.url" disabled /></el-form-item>
        <el-form-item v-if="testRepo?.type === 0" label="JAR端口">
          <el-input-number v-model="jarPort" :min="1024" :max="65535" />
          <span style="margin-left:8px;color:#909399;font-size:12px">默认为9978，与JAR启动参数一致即可</span>
        </el-form-item>
        <el-form-item label="测试接口">
          <el-select v-model="testAction" style="width:180px">
            <el-option label="首页 (home)" value="home" />
            <el-option label="详情 (detail)" value="detail" />
            <el-option label="搜索 (search)" value="search" />
            <el-option label="播放 (player)" value="player" />
            <el-option label="分类 (category)" value="category" />
          </el-select>
          <span style="margin-left:8px;color:#909399;font-size:12px">{{ actionHint }}</span>
        </el-form-item>
        <el-form-item label="参数"><el-input v-model="testParams" :placeholder="actionHint" /></el-form-item>
      </el-form>
      <div v-if="testResult" style="margin-top:12px">
        <el-alert :type="testResult.status==='ok'?'success':'error'" :closable="false" show-icon>
          <template #title>
            {{ testResult.message }}
            <span v-if="testResult.elapsed" style="margin-left:8px;font-size:12px">({{ testResult.elapsed }}ms)</span>
          </template>
        </el-alert>
        <div v-if="testResult.targetUrl" style="margin:8px 0;color:#909399;font-size:12px">请求URL: {{ testResult.targetUrl }}</div>
        <div v-if="testResult.data" style="max-height:350px;overflow:auto">
          <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:12px;white-space:pre-wrap;word-break:break-all">{{ formatResult(testResult.data) }}</pre>
        </div>
        <div v-if="testResult.error" style="color:#f56c6c;margin-top:4px;font-size:12px">{{ testResult.error }}</div>
      </div>
      <template #footer>
        <el-button @click="testVisible=false">关闭</el-button>
        <el-button type="primary" @click="runTest" :loading="testing">执行测试</el-button>
      </template>
    </el-dialog>

    <input ref="fileInput" type="file" accept=".jar,.csp" style="display:none" @change="handleUpload" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { repoApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const testVisible = ref(false)
const testing = ref(false)
const form = ref<any>({})
const testRepo = ref<any>(null)
const testAction = ref('home')
const testParams = ref('')
const testResult = ref<any>(null)
const jarPort = ref(9978)
const fileInput = ref<HTMLInputElement>()
const currentUploadId = ref<number>(0)

const actionHint = computed(() => {
  switch (testAction.value) {
    case 'home': return '无需参数'
    case 'detail': return '影片ID'
    case 'search': return '搜索关键词'
    case 'player': return '影片ID/播放源'
    case 'category': return '分类ID'
    default: return ''
  }
})

const formatResult = (data: any) => {
  if (typeof data === 'string') {
    try { return JSON.stringify(JSON.parse(data), null, 2) } catch { return data }
  }
  return JSON.stringify(data, null, 2)
}

onMounted(async () => {
  const res: any = await repoApi.list()
  list.value = res.data || []
})

const openDialog = (row?: any) => {
  form.value = row ? { ...row } : { name: '', url: '', type: 0, priority: 0 }
  visible.value = true
}

const save = async () => {
  if (form.value.id) {
    await repoApi.update(form.value.id, form.value)
  } else {
    await repoApi.create(form.value)
  }
  visible.value = false
  ElMessage.success('保存成功')
  const res: any = await repoApi.list()
  list.value = res.data || []
}

const remove = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await repoApi.remove(id)
  ElMessage.success('删除成功')
  const res: any = await repoApi.list()
  list.value = res.data || []
}

const triggerUpload = (row: any) => {
  currentUploadId.value = row.id
  fileInput.value?.click()
}

const handleUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  await repoApi.uploadJar(currentUploadId.value, formData)
  ElMessage.success('上传成功')
  const res: any = await repoApi.list()
  list.value = res.data || []
}

const openTestDialog = (row: any) => {
  testRepo.value = row
  testResult.value = null
  testAction.value = 'home'
  testParams.value = ''
  testVisible.value = true
}

const runTest = async () => {
  testing.value = true
  try {
    const body: any = { action: testAction.value, params: testParams.value }
    if (testRepo.value?.type === 0) body.jarPort = jarPort.value
    const res: any = await repoApi.test(testRepo.value.id, body)
    testResult.value = res.data || res
  } catch (e: any) {
    testResult.value = { status: 'error', message: e?.response?.data?.message || e.message }
  } finally {
    testing.value = false
  }
}
</script>
