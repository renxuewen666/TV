<template>
  <el-card>
    <template #header>
      <span>APP首页配置</span>
      <el-button type="primary" size="small" style="float:right" @click="openDialog()">添加布局</el-button>
    </template>
    <el-tabs v-model="activeType" @tab-change="load">
      <el-tab-pane label="手机端" name="mobile" />
      <el-tab-pane label="TV端" name="tv" />
    </el-tabs>
    <el-table :data="list" border style="margin-top:12px">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="template" label="模板">
        <template #default="{row}">{{ templateLabel(row.template) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{row}">
          <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用中' : '未启用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="success" @click="toggleStatus(row)">{{ row.status ? '取消启用' : '启用' }}</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="APP首页布局" width="700px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型"><el-select v-model="form.type"><el-option label="手机端" value="mobile" /><el-option label="TV端" value="tv" /></el-select></el-form-item>
        <el-form-item label="模板"><el-select v-model="form.template"><el-option label="经典模式" value="classic" /><el-option label="简洁模式" value="simple" /><el-option label="TV模式" value="tv" /></el-select></el-form-item>
        <el-form-item label="布局配置">
          <el-input v-model="form.config" type="textarea" rows="10" placeholder='JSON格式: {"sections":[{"type":"banner","data":{}},{"type":"category_grid","data":{}}]}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { homeLayoutApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const activeType = ref('mobile')
const form = ref<any>({})
const templateLabel = (template: string) => ({ classic: '经典模式', simple: '简洁模式', tv: 'TV模式' } as Record<string, string>)[template] || template

const load = async () => {
  const res: any = await homeLayoutApi.list(activeType.value)
  list.value = res.data || []
}
load()

const openDialog = (row?: any) => {
  form.value = row ? { ...row } : { name: '', type: activeType.value, template: 'classic', config: '{"sections":[]}' }
  visible.value = true
}

const save = async () => {
  if (form.value.id) {
    await homeLayoutApi.update(form.value.id, form.value)
  } else {
    await homeLayoutApi.create(form.value)
  }
  visible.value = false
  ElMessage.success('保存成功')
  load()
}

const toggleStatus = async (row: any) => {
  await homeLayoutApi.update(row.id, { status: row.status ? 0 : 1 })
  ElMessage.success('操作成功')
  load()
}

const remove = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await homeLayoutApi.remove(id)
  ElMessage.success('删除成功')
  load()
}
</script>
