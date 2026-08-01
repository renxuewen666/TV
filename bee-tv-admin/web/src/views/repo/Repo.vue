<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <span>多仓管理</span>
        <div>
          <el-button v-if="activeTab === 'repo'" type="primary" size="small" @click="openDialog()">添加仓库</el-button>
          <el-button v-else type="primary" size="small" @click="openScriptDialog()">添加脚本</el-button>
        </div>
      </div>
    </template>

    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="仓库配置" name="repo">
        <el-table :data="list" border>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="url" label="地址" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="110">
            <template #default="{row}">{{ repoTypeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="90" />
          <el-table-column prop="minMemberLevel" label="最低会员等级" width="130">
            <template #default="{row}">{{ row.minMemberLevel || 0 }}</template>
          </el-table-column>
          <el-table-column label="默认线路" width="100">
            <template #default="{row}"><el-tag :type="row.isDefault ? 'success' : 'info'">{{ row.isDefault ? '默认' : '否' }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="appIds" label="绑定应用" width="120" />
          <el-table-column prop="encrypted" label="加密" width="80"><template #default="{row}">{{ row.encrypted ? '是' : '否' }}</template></el-table-column>
          <el-table-column prop="weight" label="权重" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}"><el-tag :type="row.status?'success':'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="360">
            <template #default="{row}">
              <el-button size="small" @click="openDialog(row)">编辑</el-button>
              <el-button v-if="row.type===0" size="small" @click="triggerUpload(row)">上传JAR</el-button>
              <el-button size="small" type="warning" @click="openTestDialog(row)">测试</el-button>
              <el-button size="small" type="primary" @click="filterScriptByRepo(row)">脚本</el-button>
              <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="脚本编辑器" name="script">
        <div class="script-toolbar">
          <el-select v-model="scriptQuery.repoId" placeholder="所属仓库" clearable style="width:180px" @change="loadScripts">
            <el-option v-for="r in list" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
          <el-select v-model="scriptQuery.type" placeholder="脚本类型" clearable style="width:140px" @change="loadScripts">
            <el-option label="JS脚本" value="js" />
            <el-option label="PY线路" value="py" />
            <el-option label="CSP脚本" value="csp" />
          </el-select>
          <el-button @click="loadScripts">刷新</el-button>
        </div>
        <el-table :data="scripts" border>
          <el-table-column prop="name" label="脚本名称" min-width="160" />
          <el-table-column prop="repoId" label="所属仓库" min-width="140">
            <template #default="{row}">{{ repoName(row.repoId) }}</template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{row}"><el-tag>{{ scriptTypeLabel(row.type) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="sort" label="排序" width="80" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{row}"><el-tag :type="row.status?'success':'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="260">
            <template #default="{row}">
              <el-button size="small" @click="openScriptDialog(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="testScript(row)">测试</el-button>
              <el-button size="small" type="danger" @click="deleteScript(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="visible" title="仓库" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.url" placeholder="http接口地址，JAR仓可留空后上传" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="csp-jar" :value="0" /><el-option label="js仓" :value="1" /><el-option label="py线路" :value="2" /></el-select></el-form-item>
        <el-form-item label="绑定应用">
          <el-input v-model="form.appIds" placeholder="多个应用ID用逗号分隔，留空表示全部" />
        </el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" /></el-form-item>
        <el-form-item label="加密线路">
          <el-switch v-model="form.encrypted" />
        </el-form-item>
        <el-form-item label="最低等级"><el-input-number v-model="form.minMemberLevel" :min="0" /><span class="hint">0 表示游客可用；会员等级低于此值不会收到该线路。</span></el-form-item>
        <el-form-item label="权重">
          <el-input-number v-model="form.weight" :min="0" />
          <span class="hint">优先级权重，数值越大优先级越高</span>
        </el-form-item>
        <el-form-item label="默认线路"><el-switch v-model="form.isDefault" /><span class="hint">可见线路中优先选默认，再按优先级排序。</span></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="save">确定</el-button></template>
    </el-dialog>

    <el-dialog v-model="scriptVisible" title="仓库脚本" width="900px" class="script-dialog">
      <el-form :model="scriptForm" label-width="80px">
        <el-row :gutter="12">
          <el-col :span="8"><el-form-item label="名称"><el-input v-model="scriptForm.name" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="仓库"><el-select v-model="scriptForm.repoId" clearable><el-option label="全局脚本" :value="0" /><el-option v-for="r in list" :key="r.id" :label="r.name" :value="r.id" /></el-select></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="类型"><el-select v-model="scriptForm.type"><el-option label="JS" value="js" /><el-option label="PY" value="py" /><el-option label="CSP" value="csp" /></el-select></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="排序"><el-input-number v-model="scriptForm.sort" :min="0" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="状态"><el-switch v-model="scriptForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="脚本内容">
          <el-input v-model="scriptForm.content" type="textarea" :rows="18" resize="vertical" :placeholder="scriptPlaceholder" class="code-editor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scriptVisible=false">取消</el-button>
        <el-button type="warning" @click="testCurrentScript" :disabled="!scriptForm.id">测试</el-button>
        <el-button type="primary" @click="saveScript">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="爬虫测试" width="600px">
      <el-form label-width="80px">
        <el-form-item label="仓库">{{ testRepo?.name }} <el-tag size="small">{{ repoTypeLabel(testRepo?.type) }}</el-tag></el-form-item>
        <el-form-item label="地址"><el-input :value="testRepo?.url" disabled /></el-form-item>
        <el-form-item v-if="testRepo?.type === 0" label="JAR端口">
          <el-input-number v-model="jarPort" :min="1024" :max="65535" />
          <span class="hint">默认为9978，与JAR启动参数一致即可</span>
        </el-form-item>
        <el-form-item label="测试接口">
          <el-select v-model="testAction" style="width:180px">
            <el-option label="首页 (home)" value="home" />
            <el-option label="详情 (detail)" value="detail" />
            <el-option label="搜索 (search)" value="search" />
            <el-option label="播放 (player)" value="player" />
            <el-option label="分类 (category)" value="category" />
          </el-select>
          <span class="hint">{{ actionHint }}</span>
        </el-form-item>
        <el-form-item label="参数"><el-input v-model="testParams" :placeholder="actionHint" /></el-form-item>
      </el-form>
      <ResultPanel :result="testResult" />
      <template #footer>
        <el-button @click="testVisible=false">关闭</el-button>
        <el-button type="primary" @click="runTest" :loading="testing">执行测试</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="scriptTestVisible" title="脚本测试结果" width="700px">
      <ResultPanel :result="scriptTestResult" />
      <template #footer><el-button @click="scriptTestVisible=false">关闭</el-button></template>
    </el-dialog>

    <input ref="fileInput" type="file" accept=".jar,.csp" style="display:none" @change="handleUpload" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { repoApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const ResultPanel = defineComponent({
  props: { result: { type: Object, default: null } },
  setup(props) {
    const formatResult = (data: any) => {
      if (typeof data === 'string') {
        try { return JSON.stringify(JSON.parse(data), null, 2) } catch { return data }
      }
      return JSON.stringify(data, null, 2)
    }
    return () => props.result ? h('div', { class: 'result-panel' }, [
      h('div', { class: props.result.status === 'ok' ? 'result-ok' : 'result-error' }, props.result.message || props.result.status),
      props.result.targetUrl ? h('div', { class: 'result-url' }, `请求URL: ${props.result.targetUrl}`) : null,
      props.result.elapsed ? h('div', { class: 'result-url' }, `耗时: ${props.result.elapsed}ms`) : null,
      props.result.error ? h('div', { class: 'result-error-text' }, props.result.error) : null,
      props.result.logs?.length ? h('pre', { class: 'result-pre' }, props.result.logs.join('\n')) : null,
      props.result.data || props.result.output ? h('pre', { class: 'result-pre' }, formatResult(props.result.data || props.result.output)) : null,
    ]) : null
  },
})

const activeTab = ref('repo')
const list = ref<any[]>([])
const scripts = ref<any[]>([])
const visible = ref(false)
const scriptVisible = ref(false)
const testVisible = ref(false)
const scriptTestVisible = ref(false)
const testing = ref(false)
const form = ref<any>({})
const scriptForm = ref<any>({})
const scriptQuery = ref<any>({})
const testRepo = ref<any>(null)
const testAction = ref('home')
const testParams = ref('')
const testResult = ref<any>(null)
const scriptTestResult = ref<any>(null)
const jarPort = ref(9978)
const fileInput = ref<HTMLInputElement>()
const currentUploadId = ref<number>(0)

const repoTypeLabel = (type: number) => ({ 0: 'csp-jar', 1: 'js仓', 2: 'py线路' }[type] || '未知')
const scriptTypeLabel = (type: string) => ({ js: 'JS脚本', py: 'PY线路', csp: 'CSP脚本' }[type] || type)
const repoName = (repoId: number) => repoId ? (list.value.find(r => r.id === repoId)?.name || `仓库#${repoId}`) : '全局脚本'

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

const scriptPlaceholder = computed(() => {
  if (scriptForm.value.type === 'js') return '示例：\nconst items = [{ name: "测试影片" }]\nresult = { list: items }'
  if (scriptForm.value.type === 'py') return '# Python线路脚本内容，可用于后续下发到客户端执行'
  return '// CSP脚本或配置内容'
})

const loadRepos = async () => {
  const res: any = await repoApi.list()
  list.value = res.data || []
}

const loadScripts = async () => {
  const params = Object.fromEntries(Object.entries(scriptQuery.value).filter(([, v]) => v !== '' && v !== undefined && v !== null))
  const res: any = await repoApi.getScripts(params)
  scripts.value = res.data?.list || res.data || []
}

onMounted(async () => {
  await loadRepos()
  await loadScripts()
})

const handleTabChange = async () => {
  if (activeTab.value === 'script') await loadScripts()
}

const openDialog = (row?: any) => {
  form.value = row ? { ...row } : { name: '', url: '', type: 0, appIds: '', priority: 0, encrypted: false, minMemberLevel: 0, weight: 0, isDefault: false, status: 1 }
  visible.value = true
}

const save = async () => {
  if (form.value.id) await repoApi.update(form.value.id, form.value)
  else await repoApi.create(form.value)
  visible.value = false
  ElMessage.success('保存成功')
  await loadRepos()
}

const remove = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await repoApi.remove(id)
  ElMessage.success('删除成功')
  await loadRepos()
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
  await loadRepos()
  ;(e.target as HTMLInputElement).value = ''
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

const filterScriptByRepo = async (row: any) => {
  activeTab.value = 'script'
  scriptQuery.value.repoId = row.id
  await loadScripts()
}

const openScriptDialog = (row?: any) => {
  scriptForm.value = row ? { ...row } : { name: '', repoId: scriptQuery.value.repoId || 0, type: 'js', content: '', sort: 0, status: 1 }
  scriptVisible.value = true
}

const saveScript = async () => {
  if (!scriptForm.value.name) return ElMessage.warning('请输入脚本名称')
  if (scriptForm.value.id) await repoApi.updateScript(scriptForm.value.id, scriptForm.value)
  else await repoApi.createScript(scriptForm.value)
  scriptVisible.value = false
  ElMessage.success('脚本保存成功')
  await loadScripts()
}

const deleteScript = async (id: number) => {
  await ElMessageBox.confirm('确定删除该脚本吗？', '提示', { type: 'warning' })
  await repoApi.deleteScript(id)
  ElMessage.success('删除成功')
  await loadScripts()
}

const testScript = async (row: any) => {
  const res: any = await repoApi.testScript(row.id)
  scriptTestResult.value = res.data || res
  scriptTestVisible.value = true
}

const testCurrentScript = async () => {
  if (!scriptForm.value.id) return
  await testScript(scriptForm.value)
}
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.script-toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
.hint { margin-left: 8px; color: #909399; font-size: 12px; }
.code-editor :deep(textarea) { font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 13px; line-height: 1.5; }
.result-panel { margin-top: 12px; }
.result-ok { color: #67c23a; background: #f0f9eb; padding: 10px 12px; border-radius: 4px; }
.result-error { color: #f56c6c; background: #fef0f0; padding: 10px 12px; border-radius: 4px; }
.result-url { margin: 8px 0; color: #909399; font-size: 12px; }
.result-error-text { color: #f56c6c; margin-top: 8px; }
.result-pre { background: #f5f7fa; padding: 12px; border-radius: 4px; font-size: 12px; white-space: pre-wrap; word-break: break-all; max-height: 360px; overflow: auto; }
</style>
