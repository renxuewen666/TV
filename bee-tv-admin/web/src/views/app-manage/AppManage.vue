<template>
  <div class="app-manage-page">
    <el-card shadow="never" class="page-header">
      <div>
        <h3>{{ tab === 'versions' ? '版本管理' : '应用管理' }}</h3>
        <p>{{ tab === 'versions' ? '为 TV、手机等客户端发布版本更新。版本渠道应与应用 AppId 保持一致。' : '按 UI6/FongMi 兼容模型管理客户端身份、AppKey、设备登录限制和运营策略。' }}</p>
      </div>
      <el-tag>{{ tab === 'versions' ? 'Version' : 'FongMi App' }}</el-tag>
    </el-card>

    <el-card v-if="tab === 'apps'">
      <template #header><div class="toolbar"><span>客户端应用</span><el-button type="primary" @click="openAppDialog()">添加应用</el-button></div></template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
        AppId 与 AppKey 用于 FongMi/TVBox 初始化配置识别；TV 与手机端可分别创建应用，并设置独立登录设备数和运营策略。
      </el-alert>
      <el-table :data="apps" border>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="应用名称" min-width="140" />
        <el-table-column prop="appId" label="AppId" min-width="130" />
        <el-table-column prop="appKey" label="AppKey" min-width="180" show-overflow-tooltip />
        <el-table-column prop="packageId" label="包名" min-width="170" />
        <el-table-column prop="platform" label="平台" width="90"><template #default="{ row }"><el-tag>{{ platformLabel(row.platform) }}</el-tag></template></el-table-column>
        <el-table-column prop="loginLimit" label="设备数" width="80" />
        <el-table-column prop="operationMode" label="运营模式" width="110"><template #default="{ row }">{{ operationLabel(row.operationMode) }}</template></el-table-column>
        <el-table-column prop="status" label="状态" width="80"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="190" fixed="right"><template #default="{row}"><el-button size="small" @click="openAppDialog(row)">编辑</el-button><el-button size="small" type="danger" @click="removeApp(row.id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="tab === 'versions'">
      <template #header><div class="toolbar"><span>版本发布</span><el-button type="primary" @click="openVersionDialog()">添加版本</el-button></div></template>
      <el-table :data="versions" border>
        <el-table-column prop="versionName" label="版本号" width="110" />
        <el-table-column prop="versionCode" label="版本代码" width="100" />
        <el-table-column prop="channel" label="AppId/渠道" min-width="130" />
        <el-table-column prop="forceUpdate" label="强制更新" width="90"><template #default="{row}">{{ row.forceUpdate ? '是' : '否' }}</template></el-table-column>
        <el-table-column prop="downloadUrl" label="下载地址" show-overflow-tooltip />
        <el-table-column prop="changelog" label="更新日志" show-overflow-tooltip />
        <el-table-column label="操作" width="170"><template #default="{row}"><el-button size="small" @click="openVersionDialog(row)">编辑</el-button><el-button size="small" type="danger" @click="removeVersion(row.id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="appVisible" :title="appForm.id ? '编辑应用' : '添加应用'" width="640px">
      <el-form :model="appForm" label-width="110px">
        <el-form-item label="应用名称"><el-input v-model="appForm.name" placeholder="如 蜜蜂影视TV端" /></el-form-item>
        <el-form-item label="AppId"><el-input v-model="appForm.appId" placeholder="如 bee-tv" /></el-form-item>
        <el-form-item label="AppKey"><el-input v-model="appForm.appKey" placeholder="留空自动生成，建议保存后写入客户端" /></el-form-item>
        <el-form-item label="QQ群"><el-input v-model="appForm.qqGroup" placeholder="客服或用户QQ群（可选）" /></el-form-item>
        <el-form-item label="Android包名"><el-input v-model="appForm.packageId" placeholder="com.mifeng.video.tv" /></el-form-item>
        <el-form-item label="客户端平台"><el-radio-group v-model="appForm.platform"><el-radio value="tv">TV端</el-radio><el-radio value="mobile">手机端</el-radio><el-radio value="h5">H5</el-radio></el-radio-group></el-form-item>
        <el-form-item label="运营模式"><el-select v-model="appForm.operationMode"><el-option label="全免费" value="all_free" /><el-option label="全收费" value="all_paid" /><el-option label="仅直播" value="live_only" /><el-option label="仅点播" value="vod_only" /></el-select></el-form-item>
        <el-form-item label="状态"><el-switch v-model="appForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
        <el-form-item label="Logo">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'logo')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.logo" placeholder="图片URL（可选）" />
            <el-image v-if="appForm.logo" :src="appForm.logo" class="img-thumb" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="启动图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'splash')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.splash" placeholder="图片URL（可选）" />
            <el-image v-if="appForm.splash" :src="appForm.splash" class="img-thumb" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="背景图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'backdrop')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.backdrop" placeholder="个人中心或启动背景图片URL" />
            <el-image v-if="appForm.backdrop" :src="appForm.backdrop" class="img-thumb" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="播放页图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'playerImage')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.playerImage" placeholder="播放器扩展图片URL（可选）" />
            <el-image v-if="appForm.playerImage" :src="appForm.playerImage" class="img-thumb" fit="contain" />
            <el-input v-model="appForm.playerImageLink" placeholder="播放页图片链接（可选）" />
          </div>
        </el-form-item>
        <el-form-item label="播放器背景图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'playerBgImage')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.playerBgImage" placeholder="播放器背景图URL（可选）" />
            <el-image v-if="appForm.playerBgImage" :src="appForm.playerBgImage" class="img-thumb" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="客服图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'serviceImage')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.serviceImage" placeholder="客服二维码或联系图片URL（可选）" />
            <el-image v-if="appForm.serviceImage" :src="appForm.serviceImage" class="img-thumb" fit="contain" />
          </div>
        </el-form-item>
        <el-form-item label="个人中心图">
          <div class="img-upload-block">
            <el-upload :show-file-list="false" :before-upload="(file: File) => handleImageUpload(file, 'profileImage')" action="#"><el-button size="small">上传图片</el-button></el-upload>
            <el-input v-model="appForm.profileImage" placeholder="个人中心图片URL（可选）" />
            <el-image v-if="appForm.profileImage" :src="appForm.profileImage" class="img-thumb" fit="contain" />
            <el-input v-model="appForm.profileImageLink" placeholder="个人中心图片链接（可选）" />
          </div>
        </el-form-item>
        <el-divider content-position="left">注册策略（继承表示使用全局会员配置）</el-divider>
        <el-form-item label="用户注册"><el-radio-group v-model="appForm.registerPolicy"><el-radio :value="-1">继承</el-radio><el-radio :value="1">开启</el-radio><el-radio :value="0">关闭</el-radio></el-radio-group></el-form-item>
        <el-form-item label="自动注册"><el-radio-group v-model="appForm.autoRegisterPolicy"><el-radio :value="-1">继承</el-radio><el-radio :value="1">开启</el-radio><el-radio :value="0">关闭</el-radio></el-radio-group></el-form-item>
        <el-form-item label="邮箱必填"><el-radio-group v-model="appForm.emailPolicy"><el-radio :value="-1">继承</el-radio><el-radio :value="1">必填</el-radio><el-radio :value="0">不需要</el-radio></el-radio-group></el-form-item>
        <el-form-item label="关于信息"><el-input v-model="appForm.about" type="textarea" :rows="2" placeholder="应用说明（可选）" /></el-form-item>
        <el-form-item label="扩展配置"><el-input v-model="appForm.runtimeConfig" type="textarea" :rows="5" placeholder='JSON，例如：{"home_ui":"classic","mine_features":["signin","tv_scan_login"]}' /></el-form-item>
      </el-form>
      <template #footer><el-button @click="appVisible = false">取消</el-button><el-button type="primary" @click="saveApp">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="versionVisible" title="版本发布" width="560px">
      <el-form :model="versionForm" label-width="100px">
        <el-form-item label="版本号"><el-input v-model="versionForm.versionName" placeholder="1.0.0" /></el-form-item>
        <el-form-item label="版本代码"><el-input-number v-model="versionForm.versionCode" :min="1" /></el-form-item>
        <el-form-item label="AppId/渠道"><el-select v-model="versionForm.channel" filterable allow-create default-first-option><el-option v-for="app in apps" :key="app.appId" :label="`${app.name} (${app.appId})`" :value="app.appId" /></el-select></el-form-item>
        <el-form-item label="下载地址"><el-input v-model="versionForm.downloadUrl" /></el-form-item>
        <el-form-item label="更新日志"><el-input v-model="versionForm.changelog" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="强制更新"><el-switch v-model="versionForm.forceUpdate" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="versionVisible = false">取消</el-button><el-button type="primary" @click="saveVersion">确定</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { appManageApi, clientAppApi, uploadApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const tab = computed(() => String(route.params.tab || 'apps'))
const versions = ref<any[]>([])
const apps = ref<any[]>([])
const versionVisible = ref(false)
const appVisible = ref(false)
const versionForm = ref<any>({})
const appForm = ref<any>({})

onMounted(loadData)
watch(tab, loadData)

async function loadData() {
  const [versionRes, appRes]: any[] = await Promise.all([appManageApi.getVersions(), clientAppApi.list()])
  versions.value = versionRes.data || []
  apps.value = appRes.data || []
}

const platformLabel = (platform: string) => ({ tv: 'TV端', mobile: '手机端', h5: 'H5' }[platform] || platform)
const operationLabel = (mode: string) => ({ all_free: '全免费', all_paid: '全收费', live_only: '仅直播', vod_only: '仅点播' }[mode] || mode)

const handleImageUpload = async (file: File, field: string) => {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await uploadApi.image(formData)
  appForm.value[field] = res.data.url
  return false
}

const openAppDialog = (row?: any) => {
  appForm.value = row ? { ...row, runtimeConfig: row.runtimeConfig || '', registerPolicy: row.registerPolicy ?? -1, autoRegisterPolicy: row.autoRegisterPolicy ?? -1, emailPolicy: row.emailPolicy ?? -1 } : { name: '', appId: '', appKey: '', qqGroup: '', packageId: '', platform: 'tv', operationMode: 'all_free', status: 1, logo: '', splash: '', backdrop: '', playerImage: '', playerImageLink: '', playerBgImage: '', serviceImage: '', profileImage: '', profileImageLink: '', about: '', runtimeConfig: '', registerPolicy: -1, autoRegisterPolicy: -1, emailPolicy: -1 }
  appVisible.value = true
}
const saveApp = async () => {
  if (!appForm.value.name || !appForm.value.appId) return ElMessage.warning('请填写应用名称和AppId')
  if (appForm.value.id) await clientAppApi.update(appForm.value.id, appForm.value)
  else await clientAppApi.create(appForm.value)
  appVisible.value = false
  ElMessage.success('保存成功')
  loadData()
}
const removeApp = async (id: number) => {
  await ElMessageBox.confirm('删除应用不会删除已发布版本，但客户端将无法继续获取该应用的初始化配置。确定删除？', '确认删除', { type: 'warning' })
  await clientAppApi.remove(id)
  ElMessage.success('删除成功')
  loadData()
}

const openVersionDialog = (row?: any) => { versionForm.value = row ? { ...row } : { versionName: '', versionCode: 1, channel: apps.value[0]?.appId || 'default', downloadUrl: '', changelog: '', forceUpdate: 0 }; versionVisible.value = true }
const saveVersion = async () => { if (versionForm.value.id) await appManageApi.updateVersion(versionForm.value.id, versionForm.value); else await appManageApi.createVersion(versionForm.value); versionVisible.value = false; ElMessage.success('保存成功'); loadData() }
const removeVersion = async (id: number) => { await ElMessageBox.confirm('确定删除版本？', '提示', { type: 'warning' }); await appManageApi.deleteVersion(id); ElMessage.success('删除成功'); loadData() }
</script>

<style scoped>
.app-manage-page { display: flex; flex-direction: column; gap: 16px; }
.page-header :deep(.el-card__body) { display: flex; justify-content: space-between; align-items: center; }
.page-header h3 { margin: 0; font-size: 18px; }
.page-header p { margin: 6px 0 0; color: #909399; font-size: 13px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.img-upload-block { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.img-thumb { width: 120px; height: 120px; border: 1px solid #e4e7ed; border-radius: 4px; background: #f5f7fa; }
</style>
