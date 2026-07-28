<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>热搜管理</span>
        <el-button type="primary" @click="openDialog()">添加热搜</el-button>
      </div>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="url" label="链接" />
      <el-table-column prop="sort" label="排序" width="80" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="appIds" label="指定应用" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="editing.id ? '编辑热搜' : '添加热搜'" v-model="visible" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
        <el-form-item label="链接"><el-input v-model="form.url" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
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
import { hotsearchApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const editing = ref<any>({})
const form = ref({ title: '', url: '', sort: 0, appIds: '', status: 1 })

onMounted(() => loadData())

const loadData = async () => {
  const res: any = await hotsearchApi.list()
  list.value = res.data || []
}

const openDialog = (row?: any) => {
  if (row) { editing.value = row; form.value = { ...row } }
  else { editing.value = {}; form.value = { title: '', url: '', sort: 0, appIds: '', status: 1 } }
  visible.value = true
}
const handleSave = async () => {
  if (editing.value.id) await hotsearchApi.update(editing.value.id, form.value)
  else await hotsearchApi.create(form.value)
  ElMessage.success('保存成功')
  visible.value = false
  loadData()
}
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await hotsearchApi.remove(id)
  ElMessage.success('删除成功')
  loadData()
}
</script>
