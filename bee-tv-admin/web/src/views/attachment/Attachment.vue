<template>
  <el-card>
    <template #header>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>附件管理</span>
        <el-button type="primary" @click="uploadVisible = true">上传附件</el-button>
      </div>
      <div style="display:flex;gap:12px;margin-top:12px">
        <el-input v-model="keyword" placeholder="搜索文件名" clearable style="width:200px" @keyup.enter="loadData(1)" />
        <el-select v-model="filterType" placeholder="类型筛选" clearable style="width:120px" @change="loadData(1)">
          <el-option label="图片" value="image" />
          <el-option label="文件" value="file" />
        </el-select>
        <el-button type="primary" @click="loadData(1)">查询</el-button>
      </div>
    </template>

    <el-table :data="list" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="名称" min-width="150" show-overflow-tooltip />
      <el-table-column label="预览" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.type === 'image'"
            :src="row.url"
            style="width:60px;height:40px"
            fit="cover"
            :preview-src-list="[row.url]"
            preview-teleported
          />
          <span v-else style="color:#909399;font-size:12px">文件</span>
        </template>
      </el-table-column>
      <el-table-column prop="url" label="URL" min-width="180" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="90">
        <template #default="{ row }">
          <el-tag :type="row.type === 'image' ? 'success' : 'info'">
            {{ row.type === 'image' ? '图片' : '文件' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="120" show-overflow-tooltip />
      <el-table-column label="大小" width="100">
        <template #default="{ row }">
          {{ formatSize(row.size) }}
        </template>
      </el-table-column>
      <el-table-column prop="uploader" label="上传者" width="100" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
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

    <!-- Upload dialog -->
    <el-dialog v-model="uploadVisible" title="上传附件" width="520px" @close="handleUploadClose">
      <el-upload
        ref="uploadRef"
        drag
        :action="''"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileChange"
        :show-file-list="true"
        :multiple="true"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
      </el-upload>
      <el-form label-width="80px" style="margin-top:16px">
        <el-form-item label="所属模块">
          <el-input v-model="uploadModule" placeholder="如：system, advertisement, member" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" @click="doUpload" :loading="uploading">开始上传</el-button>
      </template>
    </el-dialog>

    <!-- Edit dialog -->
    <el-dialog v-model="editVisible" title="编辑附件" width="460px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="所属模块">
          <el-input v-model="editForm.module" placeholder="请输入所属模块" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="editForm.type" placeholder="请选择类型" style="width:100%">
            <el-option label="图片" value="image" />
            <el-option label="文件" value="file" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="editForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSave">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { attachmentApi, uploadApi } from '@/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const list = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20

const keyword = ref('')
const filterType = ref('')

const uploadVisible = ref(false)
const uploading = ref(false)
const uploadModule = ref('')
const pendingFiles = ref<any[]>([])
const uploadRef = ref()

const editVisible = ref(false)
const editingId = ref<number | undefined>()
const editForm = ref({
  name: '',
  module: '',
  type: 'image',
  status: 1,
})

onMounted(() => loadData())

const loadData = async (page = 1) => {
  currentPage.value = page
  const params: any = { page, size: pageSize }
  if (keyword.value) params.keyword = keyword.value
  if (filterType.value) params.type = filterType.value
  const res: any = await attachmentApi.list(params)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}

const handlePageChange = (page: number) => {
  loadData(page)
}

const formatSize = (bytes: number) => {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

const formatTime = (str: string) => {
  if (!str) return '-'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const handleFileChange = (_file: any, fileList: any[]) => {
  pendingFiles.value = fileList
}

const handleUploadClose = () => {
  uploadRef.value?.clearFiles()
  pendingFiles.value = []
  uploadModule.value = ''
}

const doUpload = async () => {
  if (!pendingFiles.value.length) {
    ElMessage.warning('请先选择文件')
    return
  }
  uploading.value = true
  try {
    for (const item of pendingFiles.value) {
      const rawFile = item.raw
      if (!rawFile) continue
      const formData = new FormData()
      formData.append('file', rawFile)
      const isImage = rawFile.type.startsWith('image/')
      const res: any = isImage
        ? await uploadApi.image(formData)
        : await uploadApi.file(formData)
      await attachmentApi.create({
        name: rawFile.name,
        url: res.data.url,
        size: res.data.size,
        type: isImage ? 'image' : 'file',
        module: uploadModule.value || '',
        uploader: userStore.userInfo?.username || '',
        status: 1,
      })
    }
    ElMessage.success('上传成功')
    uploadVisible.value = false
    loadData(1)
  } finally {
    uploading.value = false
  }
}

const openEdit = (row: any) => {
  editingId.value = row.id
  editForm.value = {
    name: row.name,
    module: row.module,
    type: row.type,
    status: row.status,
  }
  editVisible.value = true
}

const handleEditSave = async () => {
  await attachmentApi.update(editingId.value!, { ...editForm.value })
  ElMessage.success('保存成功')
  editVisible.value = false
  loadData(currentPage.value)
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确认删除该附件？', '提示', { type: 'warning' })
  await attachmentApi.remove(id)
  ElMessage.success('删除成功')
  loadData(currentPage.value)
}
</script>
