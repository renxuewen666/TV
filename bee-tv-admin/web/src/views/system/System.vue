<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>系统设置</span>
        <div>
          <el-button type="success" @click="handleExport">导出配置</el-button>
          <el-upload :show-file-list="false" :before-upload="handleImport" accept=".json" style="display:inline-block;margin-left:8px">
            <el-button type="warning">导入配置</el-button>
          </el-upload>
        </div>
      </div>
    </template>
    <el-form label-width="120px">
      <el-form-item v-for="item in list" :key="item.key" :label="item.remark || item.key">
        <el-input v-model="item.value" style="width:400px" />
        <el-button type="primary" size="small" style="margin-left:8px" @click="save(item)">保存</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { systemApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref<any[]>([])

onMounted(async () => {
  const res: any = await systemApi.list()
  list.value = res.data || []
})

const save = async (item: any) => {
  await systemApi.update(item.key, { value: item.value, remark: item.remark })
  ElMessage.success('保存成功')
}

const handleExport = async () => {
  try {
    const blob: any = await systemApi.exportConfig()
    const url = window.URL.createObjectURL(new Blob([blob]))
    const a = document.createElement('a')
    a.href = url
    a.download = `beetv-config-${Date.now()}.json`
    a.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  }
}

const handleImport = async (file: File) => {
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await ElMessageBox.confirm('导入将新增成员等级、接口源、首页布局等配置，确认继续？', '导入确认', { type: 'warning' })
    await systemApi.importConfig(data)
    ElMessage.success('导入成功')
    const res: any = await systemApi.list()
    list.value = res.data || []
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('导入失败: ' + (e?.message || '数据格式错误'))
  }
  return false
}
</script>
