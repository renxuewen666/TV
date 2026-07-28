<template>
  <div>
    <el-card style="margin-bottom:16px">
      <template #header>
        <span>版本管理</span>
        <el-button type="primary" size="small" style="float:right" @click="openVersionDialog()">添加版本</el-button>
      </template>
      <el-table :data="versions" border>
        <el-table-column prop="versionName" label="版本号" />
        <el-table-column prop="versionCode" label="版本代码" />
        <el-table-column prop="channel" label="渠道" />
        <el-table-column prop="forceUpdate" label="强制更新"><template #default="{row}">{{ row.forceUpdate ? '是' : '否' }}</template></el-table-column>
        <el-table-column prop="downloadUrl" label="下载地址" show-overflow-tooltip />
        <el-table-column prop="changelog" label="更新日志" show-overflow-tooltip />
        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <el-button size="small" type="danger" @click="removeVersion(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card>
      <template #header>
        <span>渠道管理</span>
        <el-button type="primary" size="small" style="float:right" @click="openChannelDialog()">添加渠道</el-button>
      </template>
      <el-table :data="channels" border>
        <el-table-column prop="name" label="渠道名称" />
        <el-table-column prop="packageId" label="包名" />
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" type="danger" @click="removeChannel(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="versionVisible" title="版本" width="500px">
      <el-form :model="versionForm" label-width="90px">
        <el-form-item label="版本号"><el-input v-model="versionForm.versionName" /></el-form-item>
        <el-form-item label="版本代码"><el-input-number v-model="versionForm.versionCode" :min="1" /></el-form-item>
        <el-form-item label="渠道"><el-input v-model="versionForm.channel" placeholder="default" /></el-form-item>
        <el-form-item label="下载地址"><el-input v-model="versionForm.downloadUrl" /></el-form-item>
        <el-form-item label="更新日志"><el-input v-model="versionForm.changelog" type="textarea" /></el-form-item>
        <el-form-item label="强制更新"><el-switch v-model="versionForm.forceUpdate" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="versionVisible = false">取消</el-button>
        <el-button type="primary" @click="saveVersion">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="channelVisible" title="渠道" width="400px">
      <el-form :model="channelForm" label-width="80px">
        <el-form-item label="名称"><el-input v-model="channelForm.name" /></el-form-item>
        <el-form-item label="包名"><el-input v-model="channelForm.packageId" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="channelVisible = false">取消</el-button>
        <el-button type="primary" @click="saveChannel">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { appManageApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const versions = ref<any[]>([])
const channels = ref<any[]>([])
const versionVisible = ref(false)
const channelVisible = ref(false)
const versionForm = ref<any>({})
const channelForm = ref<any>({})

onMounted(async () => {
  const [v, c]: any[] = await Promise.all([appManageApi.getVersions(), appManageApi.getChannels()])
  versions.value = v.data || []
  channels.value = c.data || []
})

const openVersionDialog = () => { versionForm.value = { versionName: '', versionCode: 1, channel: 'default', downloadUrl: '', changelog: '', forceUpdate: 0 }; versionVisible.value = true }

const saveVersion = async () => {
  await appManageApi.createVersion(versionForm.value)
  versionVisible.value = false
  ElMessage.success('添加成功')
  const res: any = await appManageApi.getVersions()
  versions.value = res.data || []
}

const removeVersion = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await appManageApi.deleteVersion(id)
  ElMessage.success('删除成功')
  const res: any = await appManageApi.getVersions()
  versions.value = res.data || []
}

const openChannelDialog = () => { channelForm.value = { name: '', packageId: '' }; channelVisible.value = true }

const saveChannel = async () => {
  await appManageApi.createChannel(channelForm.value)
  channelVisible.value = false
  ElMessage.success('添加成功')
  const res: any = await appManageApi.getChannels()
  channels.value = res.data || []
}

const removeChannel = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await appManageApi.deleteChannel(id)
  ElMessage.success('删除成功')
  const res: any = await appManageApi.getChannels()
  channels.value = res.data || []
}
</script>
