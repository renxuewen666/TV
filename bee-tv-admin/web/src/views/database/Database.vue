<template>
  <div class="database-page">
    <el-card style="margin-bottom:16px">
      <template #header>
        <div class="header-row">
          <span>数据库备份</span>
          <el-button type="primary" :loading="backing" @click="handleBackup">立即备份</el-button>
        </div>
      </template>
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom:12px">
        编辑、删除、清空数据表前系统会自动创建备份；数据库操作危险，请谨慎使用。
      </el-alert>
      <el-table :data="backups" border>
        <el-table-column prop="name" label="文件名" />
        <el-table-column prop="size" label="大小" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="230">
          <template #default="{ row }">
            <el-button size="small" @click="handleDownload(row.name)">下载</el-button>
            <el-button size="small" type="warning" @click="handleRestore(row.name)">还原</el-button>
            <el-button size="small" type="danger" @click="handleDeleteBackup(row.name)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card style="margin-bottom:16px">
      <template #header>
        <div class="header-row">
          <span>数据表管理</span>
          <el-button @click="loadTables">刷新表</el-button>
        </div>
      </template>
      <div class="table-bar">
        <el-select v-model="selectedTable" filterable placeholder="选择数据表" style="width:260px" @change="loadRows(1)">
          <el-option v-for="t in tables" :key="t.name" :label="`${t.name} (${t.count})`" :value="t.name" />
        </el-select>
        <el-input v-model="keyword" placeholder="关键词搜索文本字段" clearable style="width:260px" @keyup.enter="loadRows(1)" />
        <el-button type="primary" :disabled="!selectedTable" @click="loadRows(1)">查询</el-button>
        <el-button type="danger" plain :disabled="!selectedTable" @click="handleClearTable">清空当前表</el-button>
      </div>
      <el-table :data="rows" border v-loading="loadingRows" style="margin-top:12px" max-height="520">
        <el-table-column v-for="col in columns" :key="col.name" :prop="col.name" :label="col.name" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" :disabled="row.id === undefined" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" :disabled="row.id === undefined" @click="handleDeleteRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:12px" background layout="total,prev,pager,next" :total="rowTotal" :page-size="pageSize" @current-change="loadRows" />
    </el-card>

    <el-card>
      <template #header>SQL 查询</template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">仅允许 SELECT 查询，不允许在这里执行写入或删除语句。</el-alert>
      <el-input v-model="sql" type="textarea" :rows="4" placeholder="SELECT * FROM AdminUser LIMIT 20" />
      <el-button type="primary" style="margin-top:8px" @click="handleQuery">执行查询</el-button>
      <el-table :data="queryRows" border style="margin-top:12px" max-height="360">
        <el-table-column v-for="col in queryColumns" :key="col" :prop="col" :label="col" min-width="140" show-overflow-tooltip />
      </el-table>
    </el-card>

    <el-dialog v-model="editVisible" title="编辑数据行" width="760px">
      <el-form label-width="150px">
        <el-form-item v-for="col in editableColumns" :key="col.name" :label="col.name">
          <el-input v-model="editForm[col.name]" :type="isLongField(col.name) ? 'textarea' : 'text'" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRow">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { databaseApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const backups = ref<any[]>([])
const tables = ref<any[]>([])
const columns = ref<any[]>([])
const rows = ref<any[]>([])
const rowTotal = ref(0)
const pageSize = 20
const selectedTable = ref('')
const keyword = ref('')
const loadingRows = ref(false)
const backing = ref(false)
const sql = ref('')
const queryRows = ref<any[]>([])
const editVisible = ref(false)
const editForm = ref<Record<string, any>>({})
const editingId = ref<number | null>(null)

const editableColumns = computed(() => columns.value.filter(c => c.name !== 'id'))
const queryColumns = computed(() => queryRows.value.length ? Object.keys(queryRows.value[0]) : [])
const isLongField = (name: string) => ['config', 'content', 'remark', 'description', 'headers', 'params', 'images', 'text'].includes(name)

onMounted(() => { loadBackups(); loadTables() })

const loadBackups = async () => {
  const res: any = await databaseApi.listBackups()
  backups.value = res.data || []
}
const loadTables = async () => {
  const res: any = await databaseApi.tables()
  tables.value = res.data || []
  if (!selectedTable.value && tables.value.length) {
    selectedTable.value = tables.value[0].name
    await loadRows(1)
  }
}
const loadRows = async (page = 1) => {
  if (!selectedTable.value) return
  loadingRows.value = true
  try {
    const res: any = await databaseApi.rows(selectedTable.value, { page, size: pageSize, keyword: keyword.value })
    rows.value = res.data?.list || []
    columns.value = res.data?.columns || []
    rowTotal.value = res.data?.total || 0
  } finally { loadingRows.value = false }
}
const handleBackup = async () => {
  backing.value = true
  try {
    const res: any = await databaseApi.backup()
    ElMessage.success(`备份成功: ${res.data?.filename}`)
    loadBackups()
  } finally { backing.value = false }
}
const handleDownload = (filename: string) => {
  const token = localStorage.getItem('token')
  const a = document.createElement('a')
  a.href = `${databaseApi.downloadUrl(filename)}?token=${token}`
  a.click()
}
const handleRestore = async (filename: string) => {
  await ElMessageBox.confirm(`确认还原到「${filename}」？当前数据将被覆盖。`, '危险操作', { type: 'error', confirmButtonText: '确认还原' })
  await databaseApi.restore(filename)
  ElMessage.success('还原成功，请重启服务生效')
  loadBackups()
}
const handleDeleteBackup = async (filename: string) => {
  await ElMessageBox.confirm(`确认删除备份「${filename}」？`, '提示', { type: 'warning' })
  await databaseApi.deleteBackup(filename)
  ElMessage.success('删除成功')
  loadBackups()
}
const openEdit = (row: any) => {
  editingId.value = Number(row.id)
  editForm.value = { ...row }
  delete editForm.value.id
  editVisible.value = true
}
const handleSaveRow = async () => {
  if (!selectedTable.value || editingId.value === null) return
  await ElMessageBox.confirm('保存前将自动备份数据库，确认修改该行？', '确认编辑', { type: 'warning' })
  await databaseApi.updateRow(selectedTable.value, editingId.value, editForm.value)
  ElMessage.success('保存成功')
  editVisible.value = false
  await loadBackups()
  await loadRows(1)
}
const handleDeleteRow = async (row: any) => {
  await ElMessageBox.confirm(`确认删除 ${selectedTable.value} 表 ID=${row.id} 的记录？删除前会自动备份。`, '危险操作', { type: 'error', confirmButtonText: '确认删除' })
  await databaseApi.deleteRow(selectedTable.value, Number(row.id))
  ElMessage.success('删除成功')
  await loadBackups()
  await loadRows(1)
}
const handleClearTable = async () => {
  await ElMessageBox.confirm(`确认清空 ${selectedTable.value} 表全部数据？清空前会自动备份。`, '危险操作', { type: 'error', confirmButtonText: '确认清空' })
  await databaseApi.clearTable(selectedTable.value)
  ElMessage.success('清空成功')
  await loadBackups()
  await loadRows(1)
}
const handleQuery = async () => {
  const res: any = await databaseApi.query(sql.value)
  queryRows.value = res.data?.list || []
}
</script>

<style scoped>
.database-page { display: block; }
.header-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.table-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
</style>
