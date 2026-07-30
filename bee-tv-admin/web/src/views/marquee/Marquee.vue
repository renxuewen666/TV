<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>跑马灯管理</span>
        <div>
          <el-button type="primary" @click="openDialog()">新增跑马灯</el-button>
          <el-button type="danger" :disabled="!selectedIds.length" @click="handleBatchDelete">批量删除</el-button>
        </div>
      </div>
    </template>

    <el-table :data="list" border @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="content" label="内容预览" min-width="200" show-overflow-tooltip />
      <el-table-column prop="color" label="文字颜色" width="100">
        <template #default="{ row }">
          <div style="display:flex;align-items:center;gap:6px">
            <div :style="{ width: '24px', height: '24px', backgroundColor: row.color, border: '1px solid #dcdfe6', borderRadius: '4px' }" />
            <span style="font-size:12px">{{ row.color }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="bgColor" label="背景颜色" width="100">
        <template #default="{ row }">
          <div style="display:flex;align-items:center;gap:6px">
            <div :style="{ width: '24px', height: '24px', backgroundColor: row.bgColor, border: '1px solid #dcdfe6', borderRadius: '4px' }" />
            <span style="font-size:12px">{{ row.bgColor }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="speed" label="速度" width="180">
        <template #default="{ row }">
          <el-slider v-model="row.speed" :min="1" :max="100" :disabled="true" />
        </template>
      </el-table-column>
      <el-table-column prop="position" label="位置" width="100">
        <template #default="{ row }">
          <el-tag>{{ row.position === 'top' ? '顶部' : '底部' }}</el-tag>
        </template>
      </el-table-column>
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

    <el-dialog :title="editing.id ? '编辑跑马灯' : '新增跑马灯'" v-model="visible" width="650px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="文字内容">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入跑马灯文字内容" />
        </el-form-item>
        <el-form-item label="文字颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
        <el-form-item label="背景颜色">
          <el-color-picker v-model="form.bgColor" />
        </el-form-item>
        <el-form-item label="滚动速度">
          <el-slider v-model="form.speed" :min="1" :max="100" show-input />
        </el-form-item>
        <el-form-item label="显示位置">
          <el-select v-model="form.position" placeholder="请选择位置" style="width:100%">
            <el-option label="顶部" value="top" />
            <el-option label="底部" value="bottom" />
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
import { marqueeApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface MarqueeForm {
  id?: number
  content: string
  color: string
  bgColor: string
  speed: number
  position: string
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

const form = ref<MarqueeForm>({
  content: '',
  color: '#FFFFFF',
  bgColor: '#000000',
  speed: 50,
  position: 'top',
  appIds: '',
  sort: 0,
  status: 1
})

onMounted(() => loadData())

const loadData = async (page = 1) => {
  currentPage.value = page
  const params: any = { page, size: pageSize }
  const res: any = await marqueeApi.list(params)
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
      content: '',
      color: '#FFFFFF',
      bgColor: '#000000',
      speed: 50,
      position: 'top',
      appIds: '',
      sort: 0,
      status: 1
    }
  }
  visible.value = true
}

const handleSave = async () => {
  if (editing.value.id) {
    await marqueeApi.update(editing.value.id, form.value)
  } else {
    await marqueeApi.create(form.value)
  }
  ElMessage.success('保存成功')
  visible.value = false
  loadData(currentPage.value)
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除该跑马灯？', '提示', { type: 'warning' })
  await marqueeApi.remove(id)
  ElMessage.success('删除成功')
  loadData(currentPage.value)
}

const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确认删除选中的 ${selectedIds.value.length} 条跑马灯？`, '提示', { type: 'warning' })
  await marqueeApi.batchDelete(selectedIds.value)
  ElMessage.success('批量删除成功')
  selectedIds.value = []
  loadData(currentPage.value)
}

const handleStatusChange = async (row: any) => {
  try {
    await marqueeApi.update(row.id, { status: row.status })
    ElMessage.success('状态更新成功')
  } catch (e) {
    row.status = row.status === 1 ? 0 : 1
    ElMessage.error('状态更新失败')
  }
}
</script>
