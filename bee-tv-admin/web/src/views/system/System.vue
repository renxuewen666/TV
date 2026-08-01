<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <div>
          <span>{{ currentMeta.title }}</span>
          <div class="desc">{{ currentMeta.desc }}</div>
        </div>
        <div>
          <el-button type="success" @click="handleInitDefaults">初始化默认项</el-button>
          <el-button type="primary" @click="saveCurrentGroup">保存本页</el-button>
          <el-button type="success" plain @click="handleExport">导出配置</el-button>
          <el-upload :show-file-list="false" :before-upload="handleImport" accept=".json" style="display:inline-block;margin-left:8px">
            <el-button type="warning" plain>导入配置</el-button>
          </el-upload>
        </div>
      </div>
    </template>

    <el-alert v-if="groupKey === 'general'" type="info" :closable="false" show-icon style="margin-bottom:16px">
      点播热搜接口留空时，客户端会使用“广告管理 - 搜索内容推荐”中的后台数据。
    </el-alert>
    <el-alert v-if="groupKey === 'player'" type="info" :closable="false" show-icon style="margin-bottom:16px">
      播放源重命名请填写 JSON，例如 {"量子资源":"高清源1","非凡资源":"高清源2"}。
    </el-alert>

    <el-form label-width="180px" class="config-form">
      <el-form-item v-for="item in currentItems" :key="item.key" :label="item.remark || item.key">
        <template v-if="isTextarea(item.key)">
          <el-input v-model="item.value" type="textarea" :rows="4" class="config-input" />
        </template>
        <template v-else-if="isSelect(item.key)">
          <el-select v-model="item.value" class="config-input">
            <el-option v-for="opt in selectOptions[item.key]" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </template>
        <template v-else-if="isSwitch(item.key)">
          <el-switch v-model="item.value" active-value="true" inactive-value="false" />
        </template>
        <template v-else-if="isPassword(item.key)">
          <el-input v-model="item.value" type="password" show-password class="config-input" />
        </template>
        <template v-else-if="isImageUpload(item.key)">
          <div style="display:flex;gap:8px;align-items:flex-start;width:100%">
            <el-input v-model="item.value" placeholder="图片URL或上传" class="config-input" />
            <el-upload :show-file-list="false" :before-upload="(file: any) => handleLogoUpload(file, item)" accept="image/*">
              <el-button type="primary" size="small">上传</el-button>
            </el-upload>
          </div>
          <el-image v-if="item.value" :src="item.value" style="width:120px;height:40px;margin-top:8px" fit="contain" />
        </template>
        <template v-else>
          <el-input v-model="item.value" class="config-input" />
        </template>
        <el-button type="primary" size="small" style="margin-left:8px" @click="save(item)">保存</el-button>
      </el-form-item>
    </el-form>

    <el-divider v-if="groupKey === 'email' || groupKey === 'general' || groupKey === 'player'" />
    <div v-if="groupKey === 'email'" class="test-row">
      <el-input v-model="testEmailTo" placeholder="输入接收测试邮件的邮箱" style="width:320px" />
      <el-button type="primary" @click="handleTestEmail">发送测试邮件</el-button>
    </div>
    <div v-if="groupKey === 'general'" class="test-row">
      <el-input v-model="testCity" placeholder="输入城市名称测试天气，例如：北京" style="width:320px" />
      <el-button type="primary" @click="handleTestWeather">测试天气接口</el-button>
    </div>
    <div v-if="groupKey === 'player'" class="source-rename-box">
      <div class="source-title">播放源重命名快捷编辑</div>
      <div v-for="(row, idx) in renameRows" :key="idx" class="rename-row">
        <el-input v-model="row.source" placeholder="原播放源名称" />
        <el-input v-model="row.name" placeholder="新名称" />
        <el-button type="danger" @click="renameRows.splice(idx, 1)">删除</el-button>
      </div>
      <el-button @click="renameRows.push({ source: '', name: '' })">添加重命名</el-button>
      <el-button type="primary" @click="saveRenameRows">保存重命名</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { systemApi, uploadApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface ConfigItem { key: string; value: string; group: string; remark: string }

const route = useRoute()
const allItems = ref<ConfigItem[]>([])
const testEmailTo = ref('')
const testCity = ref('北京')
const renameRows = ref<Array<{ source: string; name: string }>>([])

const groupKey = computed(() => String(route.params.group || 'basic'))
const groupMeta: Record<string, { title: string; desc: string }> = {
  basic: { title: '基础配置', desc: '站点名称、备案号、版本号、站点 LOGO 等基础信息。' },
  email: { title: '邮件配置', desc: 'SMTP 服务器、端口、账号、密码、验证方式和发件人。' },
  member: { title: '会员配置', desc: '注册开关、自动注册、邮箱必填、注册赠送、TOKEN 有效期和登录设备超限策略。' },
  general: { title: '通用配置', desc: '直播/EPG、和风天气接口和天气开关。' },
  player: { title: '播放器配置', desc: '默认播放器、自定仓库、播放源重命名和 ExoPlayer 缓冲缓存参数。' },
}
const currentMeta = computed(() => groupMeta[groupKey.value] || groupMeta.basic)
const currentItems = computed(() => allItems.value.filter(i => (i.group || 'basic') === groupKey.value && i.key !== 'vod_hotsearch_api'))

const selectOptions: Record<string, Array<{ label: string; value: string }>> = {
  smtp_secure: [{ label: 'SSL/TLS', value: 'true' }, { label: '普通/STARTTLS', value: 'false' }],
  default_player: [{ label: '系统播放器', value: 'system' }, { label: 'LJK播放器', value: 'ljk' }, { label: 'EXO播放器', value: 'exo' }],
  custom_repo_mode: [{ label: '关闭', value: 'off' }, { label: '开启', value: 'on' }, { label: '自动', value: 'auto' }],
}

const isSelect = (key: string) => Boolean(selectOptions[key])
const isSwitch = (key: string) => ['weather_show', 'player_cache_enabled', 'app_register_enabled', 'app_auto_register_enabled', 'app_register_email_required'].includes(key)
const isPassword = (key: string) => ['smtp_pass', 'epay_key'].includes(key)
const isImageUpload = (key: string) => ['site_logo'].includes(key)
const isTextarea = (key: string) => ['source_rename_config'].includes(key)

const loadData = async () => {
  const res: any = await systemApi.list()
  allItems.value = res.data || []
  syncRenameRows()
}

const syncRenameRows = () => {
  const item = allItems.value.find(i => i.key === 'source_rename_config')
  try {
    const obj = JSON.parse(item?.value || '{}')
    renameRows.value = Object.entries(obj).map(([source, name]) => ({ source, name: String(name) }))
  } catch {
    renameRows.value = []
  }
}

onMounted(loadData)
watch(groupKey, () => syncRenameRows())

const save = async (item: ConfigItem) => {
  await systemApi.update(item.key, { value: item.value, remark: item.remark, group: item.group })
  ElMessage.success('保存成功')
}

const saveCurrentGroup = async () => {
  await systemApi.batchUpdate(currentItems.value.map(i => ({ key: i.key, value: i.value, remark: i.remark, group: i.group })))
  ElMessage.success('本页配置已保存')
}

const saveRenameRows = async () => {
  const obj: Record<string, string> = {}
  renameRows.value.forEach(row => {
    if (row.source.trim()) obj[row.source.trim()] = row.name.trim()
  })
  const item = allItems.value.find(i => i.key === 'source_rename_config')
  if (item) item.value = JSON.stringify(obj, null, 2)
  await systemApi.update('source_rename_config', { value: JSON.stringify(obj), remark: '播放源重命名配置(JSON)', group: 'player' })
  ElMessage.success('播放源重命名已保存')
}

const handleInitDefaults = async () => {
  const res: any = await systemApi.initDefaults()
  ElMessage.success(res.data?.message || '默认配置已初始化')
  await loadData()
}

const handleTestEmail = async () => {
  if (!testEmailTo.value) return ElMessage.warning('请输入接收邮箱')
  await systemApi.testEmail(testEmailTo.value)
  ElMessage.success('测试邮件发送成功')
}

const handleTestWeather = async () => {
  const res: any = await systemApi.testWeather(testCity.value)
  ElMessage.success(res.data?.message || '天气接口测试成功')
}

const handleExport = async () => {
  try {
    const blob: any = await systemApi.exportConfig()
    const url = window.URL.createObjectURL(new Blob([blob]))
    const a = document.createElement('a')
    a.href = url
    a.download = `beetv-config-${Date.now()}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const handleImport = async (file: File) => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await ElMessageBox.confirm('导入将新增或覆盖部分配置，确认继续？', '导入确认', { type: 'warning' })
    await systemApi.importConfig(data)
    ElMessage.success('导入成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('导入失败: ' + (e?.message || '数据格式错误'))
  }
  return false
}

const handleLogoUpload = async (file: File, item: ConfigItem) => {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await uploadApi.image(formData)
  item.value = res.data.url
  await systemApi.update(item.key, { value: item.value, remark: item.remark, group: item.group })
  ElMessage.success('Logo上传成功')
  return false
}
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.desc { color: #909399; font-size: 12px; margin-top: 4px; }
.config-form { max-width: 920px; }
.config-input { width: 520px; }
.test-row { display: flex; align-items: center; gap: 12px; }
.source-rename-box { max-width: 820px; }
.source-title { font-weight: 600; margin-bottom: 12px; }
.rename-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin-bottom: 8px; }
</style>
