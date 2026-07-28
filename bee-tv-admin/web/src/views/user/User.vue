<template>
  <el-card>
    <template #header>
      <span>管理员管理</span>
      <el-button type="primary" size="small" style="float:right" @click="openDialog()">添加管理员</el-button>
    </template>
    <el-table :data="list" border>
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="nickname" label="昵称" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="status" label="状态"><template #default="{row}">{{ row.status ? '正常' : '禁用' }}</template></el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="管理员" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名"><el-input v-model="form.username" :disabled="!!form.id" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="form.password" type="password" :placeholder="form.id ? '留空不修改' : '请输入密码'" /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="form.nickname" /></el-form-item>
        <el-form-item label="角色"><el-select v-model="form.role"><el-option label="管理员" value="admin" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const form = ref<any>({})

onMounted(async () => {
  const res: any = await userApi.list()
  list.value = res.data || []
})

const openDialog = (row?: any) => {
  form.value = row ? { ...row, password: '' } : { username: '', password: '', nickname: '', role: 'admin' }
  visible.value = true
}

const save = async () => {
  if (form.value.id) {
    await userApi.update(form.value.id, form.value)
  } else {
    await userApi.create(form.value)
  }
  visible.value = false
  ElMessage.success('保存成功')
  const res: any = await userApi.list()
  list.value = res.data || []
}

const remove = async (id: number) => {
  if (id === 1) { ElMessage.warning('不能删除超级管理员'); return }
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await userApi.remove(id)
  ElMessage.success('删除成功')
  const res: any = await userApi.list()
  list.value = res.data || []
}
</script>
