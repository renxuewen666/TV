<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>公告管理</span>
        <el-button type="primary" @click="openDialog()">添加公告</el-button>
      </div>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="type" label="类型" width="80">
        <template #default="{ row }"><el-tag>{{ row.type === 1 ? '文本' : row.type === 2 ? '链接' : '弹窗' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="appIds" label="指定应用" />
      <el-table-column prop="createdAt" label="创建时间" width="170" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination style="margin-top:12px" background layout="prev,pager,next" :total="total" :page-size="20" @current-change="loadData" />

    <el-dialog :title="editing.id ? '编辑公告' : '添加公告'" v-model="visible" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" :model-value="1">
            <el-option :value="1" label="文本" />
            <el-option :value="2" label="链接" />
            <el-option :value="3" label="弹窗" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="应用ID"><el-input v-model="form.appIds" placeholder="留空表示全部" /></el-form-item>
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
import { noticeApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const total = ref(0)
const visible = ref(false)
const editing = ref<any>({})
const form = ref({ title: '', content: '', type: 1, appIds: '', status: 1 })

onMounted(() => loadData())

const loadData = async (page = 1) => {
  const res: any = await noticeApi.list({ page, size: 20 })
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

const openDialog = (row?: any) => {
  if (row) { editing.value = row; form.value = { ...row } }
  else { editing.value = {}; form.value = { title: '', content: '', type: 1, appIds: '', status: 1 } }
  visible.value = true
}
const handleSave = async () => {
  if (editing.value.id) await noticeApi.update(editing.value.id, form.value)
  else await noticeApi.create(form.value)
  ElMessage.success('保存成功')
  visible.value = false
  loadData()
}
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await noticeApi.remove(id)
  ElMessage.success('删除成功')
  loadData()
}
</script>
