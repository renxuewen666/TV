<template>
  <el-card>
    <template #header>
      <span>接口管理</span>
      <el-button type="primary" size="small" style="float:right" @click="openDialog()">添加接口</el-button>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="类型">
        <template #default="{row}">{{ apiTypeLabel(row.type) }}</template>
      </el-table-column>
      <el-table-column prop="url" label="地址" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" />
      <el-table-column prop="status" label="状态"><template #default="{row}">{{ row.status ? '启用' : '禁用' }}</template></el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="warning" @click="testEndpoint(row)">测试</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="接口" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="点播" :value="0" /><el-option label="直播" :value="1" /><el-option label="壁纸" :value="2" /></el-select></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.url" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testVisible" title="接口测试" width="600px">
      <el-descriptions :column="2" border style="margin-bottom:12px">
        <el-descriptions-item label="名称">{{ testData?.endpoint }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ apiTypeLabel(testData?.type) }}</el-descriptions-item>
        <el-descriptions-item label="请求URL" :span="2">{{ testData?.targetUrl }}</el-descriptions-item>
        <el-descriptions-item label="HTTP状态">{{ testData?.httpStatus }}</el-descriptions-item>
        <el-descriptions-item label="响应耗时">{{ testData?.elapsed }}ms</el-descriptions-item>
      </el-descriptions>
      <el-alert :type="testData?.status==='ok'?'success':'error'" :closable="false" show-icon style="margin-bottom:12px">
        {{ testData?.message }}
      </el-alert>
      <div v-if="testData?.data" style="max-height:350px;overflow:auto">
        <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:12px;white-space:pre-wrap;word-break:break-all">{{ formatResult(testData.data) }}</pre>
      </div>
      <template #footer>
        <el-button @click="testVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="runTest">重新测试</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiManageApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const testVisible = ref(false)
const testing = ref(false)
const form = ref<any>({})
const testData = ref<any>(null)
const currentTestId = ref(0)
const apiTypeLabel = (type: number) => ({ 0: '点播', 1: '直播', 2: '壁纸' } as Record<number, string>)[Number(type)] || '未知'

const formatResult = (data: any) => {
  if (typeof data === 'string') {
    try { return JSON.stringify(JSON.parse(data), null, 2) } catch { return data }
  }
  return JSON.stringify(data, null, 2)
}

onMounted(async () => {
  const res: any = await apiManageApi.list()
  list.value = res.data || []
})

const openDialog = (row?: any) => {
  form.value = row ? { ...row } : { name: '', type: 0, url: '', remark: '' }
  visible.value = true
}

const save = async () => {
  if (form.value.id) {
    await apiManageApi.update(form.value.id, form.value)
  } else {
    await apiManageApi.create(form.value)
  }
  visible.value = false
  ElMessage.success('保存成功')
  const res: any = await apiManageApi.list()
  list.value = res.data || []
}

const remove = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await apiManageApi.remove(id)
  ElMessage.success('删除成功')
  const res: any = await apiManageApi.list()
  list.value = res.data || []
}

const testEndpoint = async (row: any) => {
  currentTestId.value = row.id
  testVisible.value = true
  testing.value = true
  testData.value = null
  try {
    const res: any = await apiManageApi.test(row.id)
    testData.value = res.data || res
  } catch (e: any) {
    testData.value = { status: 'error', message: e?.response?.data?.message || e.message }
  } finally {
    testing.value = false
  }
}

const runTest = async () => {
  testing.value = true
  try {
    const res: any = await apiManageApi.test(currentTestId.value)
    testData.value = res.data || res
  } catch (e: any) {
    testData.value = { status: 'error', message: e?.response?.data?.message || e.message }
  } finally {
    testing.value = false
  }
}
</script>
