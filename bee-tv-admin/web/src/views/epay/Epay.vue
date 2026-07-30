<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>支付配置（易支付商户）</span>
        <el-button type="primary" @click="openDialog()">添加配置</el-button>
      </div>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="pid" label="商户ID" />
      <el-table-column prop="apiUrl" label="接口地址" width="260" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="editing.id ? '编辑配置' : '添加配置'" v-model="visible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="商户ID(PID)"><el-input v-model="form.pid" /></el-form-item>
        <el-form-item label="商户密钥"><el-input v-model="form.key" type="password" show-password /></el-form-item>
        <el-form-item label="接口地址"><el-input v-model="form.apiUrl" /></el-form-item>
        <el-form-item label="回调地址"><el-input v-model="form.notifyUrl" /></el-form-item>
        <el-form-item label="跳转地址"><el-input v-model="form.returnUrl" /></el-form-item>
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
import { epayApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const editing = ref<any>({})
const form = ref({ name: '', pid: '', key: '', apiUrl: '', notifyUrl: '', returnUrl: '', status: 1 })

const loadConfigs = async () => {
  const res: any = await epayApi.getConfigs()
  list.value = res.data || []
}

onMounted(loadConfigs)

const openDialog = (row?: any) => {
  if (row) { editing.value = row; form.value = { ...row } }
  else { editing.value = {}; form.value = { name: '', pid: '', key: '', apiUrl: '', notifyUrl: '', returnUrl: '', status: 1 } }
  visible.value = true
}
const handleSave = async () => {
  if (editing.value.id) await epayApi.updateConfig(editing.value.id, form.value)
  else await epayApi.createConfig(form.value)
  ElMessage.success('保存成功')
  visible.value = false
  loadConfigs()
}
const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await epayApi.deleteConfig(id)
  ElMessage.success('删除成功')
  loadConfigs()
}
</script>
