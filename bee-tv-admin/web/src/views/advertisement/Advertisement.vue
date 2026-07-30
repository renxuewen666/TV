<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>广告管理</span>
        <div>
          <el-button type="primary" @click="openDialog()">新增广告</el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </div>
      <div style="display:flex;gap:12px;margin-top:12px">
        <el-select v-model="filterPosition" placeholder="位置筛选" clearable style="width:150px" @change="loadData">
          <el-option label="TV首页" value="tv_home" />
          <el-option label="手机首页" value="mobile_home" />
          <el-option label="TV搜索" value="tv_search" />
          <el-option label="手机搜索" value="mobile_search" />
          <el-option label="开屏广告" value="splash" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width:120px" @change="loadData">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </div>
    </template>

    <el-table :data="list" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="image" label="图片" width="100">
        <template #default="{ row }">
          <el-image :src="row.image" style="width:60px;height:40px" fit="cover" :preview-src-list="[row.image]" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column prop="position" label="位置" width="120">
        <template #default="{ row }">
          <el-tag>{{ positionMap[row.position] || row.position }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="appIds" label="绑定应用" min-width="120" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-switch v-model="row.status" :active-value="1" :inactive-value="0" @change="handleStatusChange(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
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

    <el-dialog :title="editing.id ? '编辑广告' : '新增广告'" v-model="visible" width="650px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="广告标题">
          <el-input v-model="form.title" placeholder="请输入广告标题" />
        </el-form-item>
        <el-form-item label="图片URL">
          <el-input v-model="form.image" placeholder="请输入图片URL" />
          <el-image v-if="form.image" :src="form.image" style="width:120px;height:80px;margin-top:8px" fit="cover" />
        </el-form-item>
        <el-form-item label="点击链接">
          <el-input v-model="form.link" placeholder="请输入点击链接" />
        </el-form-item>
        <el-form-item label="广告位置">
          <el-select v-model="form.position" placeholder="请选择位置" style="width:100%">
            <el-option label="TV首页" value="tv_home" />
            <el-option label="手机首页" value="mobile_home" />
            <el-option label="TV搜索" value="tv_search" />
            <el-option label="手机搜索" value="mobile_search" />
            <el-option label="开屏广告" value="splash" />
          </el-select>
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
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startAt" type="datetime" placeholder="选择开始时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endAt" type="datetime" placeholder="选择结束时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
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
import { advertisementApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface AdForm {
  id?: number
  title: string
  image: string
  link: string
  position: string
  appIds: string
  sort: number
  status: number
  startAt: string
  endAt: string
}

const list = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20
const visible = ref(false)
const editing = ref<any>({})
const selectedIds = ref<number[]>([])
const filterPosition = ref('')
const filterStatus = ref<number | ''>('')

const positionMap: Record<string, string> = {
  tv_home: 'TV首页',
  mobile_home: '手机首页',
  tv_search: 'TV搜索',
  mobile_search: '手机搜索',
  splash: '开屏广告'
}

const form = ref<AdForm>({
  title: '',
  image: '',
  link: '',
  position: '',
  appIds: '',
  sort: 0,
  status: 1,
  startAt: '',
  endAt: ''
})

onMounted(() => loadData())

const loadData = async (page = 1) => {
  currentPage.value = page
  const params: any = { page, size: pageSize }
  if (filterPosition.value) params.position = filterPosition.value
  if (filterStatus.value !== '') params.status = filterStatus.value
  const res: any = await advertisementApi.list(params)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

const handlePageChange = (page: number) => {
  loadData(page)
}

const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map(r => r.id)
}

const openDialog = (row?: any) => {
  if (row) {
    editing.value = row
    form.value = { ...row }
  } else {
    editing.value = {}
    form.value = {
      title: '',
      image: '',
      link: '',
      position: '',
      appIds: '',
      sort: 0,
      status: 1,
      startAt: '',
      endAt: ''
    }
  }
  visible.value = true
}

const handleSave = async () => {
  if (editing.value.id) {
    await advertisementApi.update(editing.value.id, form.value)
  } else {
    await advertisementApi.create(form.value)
  }
  ElMessage.success('保存成功')
  visible.value = false
  loadData(currentPage.value)
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除该广告？', '提示', { type: 'warning' })
  await advertisementApi.remove(id)
  ElMessage.success('删除成功')
  loadData(currentPage.value)
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条广告？`, '提示', { type: 'warning' })
  await advertisementApi.batchDelete(selectedIds.value)
  ElMessage.success('批量删除成功')
  selectedIds.value = []
  loadData(currentPage.value)
}

const handleStatusChange = async (row: any) => {
  try {
    await advertisementApi.update(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}
</script>
