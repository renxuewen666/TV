<template>
  <div>
    <el-card style="margin-bottom:16px">
      <template #header>会员等级</template>
      <el-button type="primary" @click="openLevelDialog()">添加等级</el-button>
      <el-table :data="levels" style="margin-top:12px" border>
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="price" label="价格" />
        <el-table-column prop="duration" label="有效期(天)" />
        <el-table-column prop="sort" label="排序" />
        <el-table-column prop="status" label="状态"><template #default="{row}">{{ row.status ? '启用' : '禁用' }}</template></el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{row}">
            <el-button size="small" @click="openLevelDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="delLevel(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-bottom:16px">
      <template #header>激活码管理</template>
      <el-button type="primary" @click="genCodeVisible = true">生成激活码</el-button>
      <el-table :data="codes" style="margin-top:12px" border>
        <el-table-column prop="code" label="激活码" />
        <el-table-column prop="levelId" label="等级ID" />
        <el-table-column prop="status" label="状态">
          <template #default="{row}">{{ row.status === 0 ? '未使用' : row.status === 1 ? '已使用' : '已过期' }}</template>
        </el-table-column>
        <el-table-column prop="usedBy" label="使用者" />
        <el-table-column prop="createdAt" label="生成时间" />
      </el-table>
    </el-card>

    <el-card>
      <template #header>会员列表</template>
      <el-table :data="members" border>
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="level.name" label="会员等级" />
        <el-table-column prop="expireAt" label="到期时间" />
        <el-table-column prop="createdAt" label="开通时间" />
      </el-table>
    </el-card>

    <el-dialog v-model="levelVisible" title="会员等级" width="500px">
      <el-form :model="levelForm" label-width="100px">
        <el-form-item label="名称"><el-input v-model="levelForm.name" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="levelForm.price" :min="0" :step="0.1" /></el-form-item>
        <el-form-item label="有效期(天)"><el-input-number v-model="levelForm.duration" :min="1" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="levelForm.sort" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLevel">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="genCodeVisible" title="生成激活码" width="400px">
      <el-form label-width="100px">
        <el-form-item label="会员等级">
          <el-select v-model="genForm.levelId" placeholder="请选择">
            <el-option v-for="l in levels" :key="l.id" :label="l.name" :value="l.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="生成数量"><el-input-number v-model="genForm.count" :min="1" :max="1000" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="genCodeVisible = false">取消</el-button>
        <el-button type="primary" @click="generateCodes">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { memberApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const levels = ref<any[]>([])
const members = ref<any[]>([])
const codes = ref<any[]>([])
const levelVisible = ref(false)
const genCodeVisible = ref(false)
const levelForm = ref<any>({})
const genForm = ref({ levelId: 0, count: 10 })

onMounted(async () => {
  const [l, m, c]: any[] = await Promise.all([memberApi.getLevels(), memberApi.getMembers(), memberApi.getCodes()])
  levels.value = l.data
  members.value = m.data?.list || []
  codes.value = c.data?.list || []
})

const openLevelDialog = (row?: any) => {
  levelForm.value = row ? { ...row } : { name: '', price: 0, duration: 30, sort: 0 }
  levelVisible.value = true
}

const saveLevel = async () => {
  if (levelForm.value.id) {
    await memberApi.updateLevel(levelForm.value.id, levelForm.value)
  } else {
    await memberApi.createLevel(levelForm.value)
  }
  levelVisible.value = false
  ElMessage.success('保存成功')
  const res: any = await memberApi.getLevels()
  levels.value = res.data
}

const delLevel = async (id: number) => {
  await ElMessageBox.confirm('确定删除?', '提示', { type: 'warning' })
  await memberApi.deleteLevel(id)
  ElMessage.success('删除成功')
  const res: any = await memberApi.getLevels()
  levels.value = res.data
}

const generateCodes = async () => {
  await memberApi.generateCodes(genForm.value)
  genCodeVisible.value = false
  ElMessage.success('生成成功')
  const res: any = await memberApi.getCodes()
  codes.value = res.data?.list || []
}
</script>
