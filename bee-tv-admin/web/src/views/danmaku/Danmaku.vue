<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>弹幕API管理</span>
        <div>
          <el-button type="primary" @click="openDialog()">新增弹幕API</el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </div>
    </template>

    <el-table :data="list" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="apiUrl" label="API地址" min-width="250" show-overflow-tooltip />
      <el-table-column prop="method" label="请求方法" width="100">
        <template #default="{ row }">
          <el-tag :type="row.method === 'POST' ? 'warning' : 'primary'">{{ row.method }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="urlKeywords" label="播放地址关键词" min-width="160" show-overflow-tooltip />
      <el-table-column prop="appIds" label="绑定应用" width="150" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="handleTest(row.id)">测试</el-button>
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:12px"
      background
      layout="prev,pager,next,total"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @current-change="handlePageChange"
    />

    <el-dialog :title="editing.id ? '编辑弹幕API' : '新增弹幕API'" v-model="visible" width="700px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="API名称">
          <el-input v-model="form.name" placeholder="请输入弹幕API名称" />
        </el-form-item>
        <el-form-item label="API地址">
          <el-input v-model="form.apiUrl" placeholder="请输入弹幕API地址" />
        </el-form-item>
        <el-form-item label="请求方法">
          <el-select v-model="form.method" placeholder="请选择请求方法" style="width:100%">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求头">
          <el-input
            v-model="form.headers"
            type="textarea"
            :rows="4"
            placeholder='请输入JSON格式的请求头，例如：{"Authorization": "Bearer token"}'
          />
          <div style="font-size:12px;color:#909399;margin-top:4px">
            JSON格式，留空表示使用默认请求头
          </div>
        </el-form-item>
        <el-form-item label="请求参数">
          <el-input
            v-model="form.params"
            type="textarea"
            :rows="4"
            placeholder='请输入JSON格式的请求参数，例如：{"key": "value"}'
          />
          <div style="font-size:12px;color:#909399;margin-top:4px">
            JSON格式，留空表示无参数
          </div>
        </el-form-item>
        <el-form-item label="播放地址关键词">
          <el-input v-model="form.urlKeywords" placeholder="多个关键词用逗号分隔，留空表示所有播放地址" />
          <div style="font-size:12px;color:#909399;margin-top:4px">客户端应根据当前播放地址匹配，命中后才启用此弹幕源。</div>
        </el-form-item>
        <el-form-item label="匹配方式">
          <el-radio-group v-model="form.keywordMode"><el-radio value="include">包含任一关键词</el-radio><el-radio value="exclude">排除包含关键词</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="绑定应用">
          <el-input v-model="form.appIds" placeholder="多个应用ID用逗号分隔，留空表示全部" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { danmakuApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface DanmakuForm {
  id?: number
  name: string
  apiUrl: string
  method: string
  headers: string
  params: string
  urlKeywords: string
  keywordMode: string
  appIds: string
  sort: number
  status: number
}

const list = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const visible = ref(false)
const editing = ref<any>({})
const selectedIds = ref<number[]>([])

const form = ref<DanmakuForm>({
  name: '',
  apiUrl: '',
  method: 'GET',
  headers: '',
  params: '',
  urlKeywords: '',
  keywordMode: 'include',
  appIds: '',
  sort: 0,
  status: 1
})

onMounted(() => loadData())

const loadData = async (page = 1) => {
  currentPage.value = page
  const params: any = { page, size: pageSize }
  const res: any = await danmakuApi.list(params)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

const handlePageChange = (page: number) => {
  loadData(page)
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const validateJson = (jsonStr: string, fieldName: string): boolean => {
  if (!jsonStr || jsonStr.trim() === '') return true
  try {
    JSON.parse(jsonStr)
    return true
  } catch (e) {
    ElMessage.error(`${fieldName}格式不正确，请输入有效的JSON`)
    return false
  }
}

const openDialog = (row?: any) => {
  if (row) {
    editing.value = row
    form.value = { ...row }
  } else {
    editing.value = {}
    form.value = {
      name: '',
      apiUrl: '',
      method: 'GET',
      headers: '',
      params: '',
      urlKeywords: '',
      keywordMode: 'include',
      appIds: '',
      sort: 0,
      status: 1
    }
  }
  visible.value = true
}

const handleSave = async () => {
  if (!validateJson(form.value.headers, '请求头')) return
  if (!validateJson(form.value.params, '请求参数')) return

  if (editing.value.id) {
    await danmakuApi.update(editing.value.id, form.value)
  } else {
    await danmakuApi.create(form.value)
  }
  ElMessage.success('保存成功')
  visible.value = false
  loadData(currentPage.value)
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除该弹幕API？', '提示', { type: 'warning' })
  await danmakuApi.remove(id)
  ElMessage.success('删除成功')
  loadData(currentPage.value)
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条弹幕API？`, '提示', { type: 'warning' })
  await danmakuApi.batchDelete(selectedIds.value)
  ElMessage.success('批量删除成功')
  selectedIds.value = []
  loadData(currentPage.value)
}

const handleStatusChange = async (row: any) => {
  try {
    await danmakuApi.update(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}

const handleTest = async (id: number) => {
  try {
    const res: any = await danmakuApi.test(id)
    ElMessageBox.alert(
      `<div style="white-space:pre-wrap;max-height:400px;overflow-y:auto">${JSON.stringify(res.data, null, 2)}</div>`,
      '测试成功',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        type: 'success'
      }
    )
  } catch (e: any) {
    ElMessageBox.alert(
      `<div style="color:#f56c6c">${e.message || '测试失败'}</div>`,
      '测试失败',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        type: 'error'
      }
    )
  }
}
</script>
