<template>
  <el-card>
    <template #header>
      <span>积分商品</span>
      <el-button type="primary" size="small" style="float:right" @click="openDialog()">添加商品</el-button>
    </template>
    <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">
      用户在APP端使用积分兑换商品。VIP天数：延长会员有效期；激活码：自动生成激活码。
    </el-alert>
    <el-table :data="list" border>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="description" label="描述" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{row}"><el-tag size="small">{{ row.type===0?'VIP天数':'激活码' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="value" label="兑换价值" width="100">
        <template #default="{row}">{{ row.type===0 ? row.value+'天' : row.value }}</template>
      </el-table-column>
      <el-table-column prop="points" label="所需积分" width="100" />
      <el-table-column prop="stock" label="库存" width="80">
        <template #default="{row}">{{ row.stock===-1?'无限':row.stock }}</template>
      </el-table-column>
      <el-table-column prop="sort" label="排序" width="60" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}"><el-tag :type="row.status?'success':'info'" size="small">{{ row.status?'上架':'下架' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{row}">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="积分商品" width="520px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="2" /></el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">VIP天数</el-radio>
            <el-radio :value="1">激活码</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type===0?'天数':'等级ID'">
          <el-input-number v-if="form.type===0" v-model="form.value" :min="1" :max="3650" />
          <el-input v-else v-model="form.value" placeholder="如: 1 (免费会员=1, VIP=2)" />
        </el-form-item>
        <el-form-item label="所需积分"><el-input-number v-model="form.points" :min="1" :max="999999" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="-1" :max="999999" /> <span style="color:#909399;font-size:12px;margin-left:8px">-1=无限</span></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="handleSave">确定</el-button></template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { scoreApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])
const visible = ref(false)
const form = ref<any>({ name: '', description: '', type: 0, value: 7, points: 100, stock: -1, sort: 0, status: 1 })

onMounted(async () => {
  const res: any = await scoreApi.getProducts()
  list.value = res.data || []
})

const openDialog = (row?: any) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = { name: '', description: '', type: 0, value: 7, points: 100, stock: -1, sort: 0, status: 1 }
  }
  visible.value = true
}

const handleSave = async () => {
  if (form.value.id) {
    await scoreApi.updateProduct(form.value.id, form.value)
  } else {
    await scoreApi.createProduct(form.value)
  }
  ElMessage.success('保存成功')
  visible.value = false
  const res: any = await scoreApi.getProducts()
  list.value = res.data || []
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await scoreApi.deleteProduct(id)
  ElMessage.success('删除成功')
  const res: any = await scoreApi.getProducts()
  list.value = res.data || []
}
</script>
