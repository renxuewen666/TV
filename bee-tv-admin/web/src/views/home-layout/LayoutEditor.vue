<template>
  <div class="layout-editor">
    <div class="toolbar">
      <el-select v-model="currentType" @change="loadLayouts" style="width:120px">
        <el-option label="手机端" value="mobile" />
        <el-option label="TV端" value="tv" />
      </el-select>
      <el-select v-model="currentLayoutId" @change="selectLayout" placeholder="选择布局" style="width:200px;margin-left:8px" clearable>
        <el-option v-for="l in layouts" :key="l.id" :label="l.name" :value="l.id" />
      </el-select>
      <el-button type="primary" @click="showSaveDialog = true" :disabled="!sections.length">保存布局</el-button>
      <el-radio-group v-model="previewMode" style="margin-left:16px">
        <el-radio-button value="edit">编辑模式</el-radio-button>
        <el-radio-button value="preview-mobile">手机预览</el-radio-button>
        <el-radio-button value="preview-tv">TV预览</el-radio-button>
      </el-radio-group>
      <el-dropdown @command="applyTemplate" style="margin-left:8px">
        <el-button>内置模板 <el-icon><ArrowDown /></el-icon></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="classic">经典模式</el-dropdown-item>
            <el-dropdown-item command="simple">简洁模式</el-dropdown-item>
            <el-dropdown-item command="tv">TV大屏模式</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="editor-body">
      <div class="component-palette" v-if="previewMode === 'edit'">
        <h4>组件库</h4>
        <div v-for="comp in availableComponents" :key="comp.type" class="palette-item" draggable="true" @dragstart="onDragStart($event, comp)">
          <el-icon><component :is="comp.icon" /></el-icon>
          <span>{{ comp.label }}</span>
        </div>
      </div>

      <div class="canvas-area" :class="previewMode">
        <div class="phone-frame" v-if="previewMode === 'preview-mobile'">
          <div class="phone-screen">
            <div v-for="(section, idx) in sections" :key="idx" class="preview-section">
              <div v-if="section.type === 'banner'" class="preview-banner">Banner轮播</div>
              <div v-else-if="section.type === 'category_grid'" class="preview-grid">
                <div v-for="i in 6" :key="i" class="preview-grid-item">{{ ['电影','电视剧','综艺','动漫','纪录片','少儿'][i-1] }}</div>
              </div>
              <div v-else-if="section.type === 'recommend_list'" class="preview-list">
                <div v-for="i in 3" :key="i" class="preview-list-item">推荐内容 {{ i }}</div>
              </div>
              <div v-else-if="section.type === 'live_wall'" class="preview-live">直播墙</div>
              <div v-else-if="section.type === 'quick_entry'" class="preview-entry">
                <span v-for="e in ['搜索','历史','收藏','设置']" :key="e">{{ e }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tv-frame" v-else-if="previewMode === 'preview-tv'">
          <div class="tv-screen">
            <div v-for="(section, idx) in sections" :key="idx" class="preview-section-tv">
              <div v-if="section.type === 'banner'" class="tv-banner">Banner轮播</div>
              <div v-else-if="section.type === 'category_grid'" class="tv-grid">
                <div v-for="i in 8" :key="i" class="tv-grid-item">{{ i }}</div>
              </div>
              <div v-else class="tv-placeholder">{{ sectionLabel(section.type) }}</div>
            </div>
          </div>
        </div>

        <div class="edit-canvas" v-else @drop="onDrop" @dragover.prevent>
          <el-empty v-if="!sections.length" description="拖拽组件到此处，或选择内置模板" />
          <draggable v-model="sections" item-key="id" handle=".drag-handle" animation="200" ghost-class="ghost">
            <template #item="{ element, index }">
              <div class="section-item">
                <div class="section-header">
                  <el-icon class="drag-handle"><Rank /></el-icon>
                  <span>{{ sectionLabel(element.type) }}</span>
                  <el-button type="danger" size="small" circle @click="removeSection(index)"><el-icon><Delete /></el-icon></el-button>
                </div>
                <div class="section-config">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="标题" v-if="element.type !== 'banner'">
                      <el-input v-model="element.data.title" placeholder="可选标题" />
                    </el-form-item>
                    <el-form-item label="显示数量" v-if="['category_grid','recommend_list'].includes(element.type)">
                      <el-input-number v-model="element.data.count" :min="4" :max="20" />
                    </el-form-item>
                    <el-form-item label="样式" v-if="element.type === 'category_grid'">
                      <el-select v-model="element.data.style"><el-option label="网格" value="grid" /><el-option label="横向滚动" value="horizontal" /></el-select>
                    </el-form-item>
                    <el-form-item label="自动播放" v-if="element.type === 'banner'">
                      <el-switch v-model="element.data.autoplay" />
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <el-dialog v-model="showSaveDialog" title="保存布局" width="400px">
      <el-form :model="saveForm" label-width="80px">
        <el-form-item label="布局名称"><el-input v-model="saveForm.name" /></el-form-item>
        <el-form-item label="模板标识"><el-select v-model="saveForm.template"><el-option label="经典模式" value="classic" /><el-option label="简洁模式" value="simple" /><el-option label="TV模式" value="tv" /></el-select></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLayout">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { homeLayoutApi } from '@/api'
import { ElMessage } from 'element-plus'
import { Picture, Grid, VideoCamera, Monitor, Link, Rank, Delete, ArrowDown } from '@element-plus/icons-vue'

let sectionId = 0

const layouts = ref<any[]>([])
const sections = ref<any[]>([])
const currentType = ref('mobile')
const currentLayoutId = ref<number | null>(null)
const previewMode = ref('edit')
const showSaveDialog = ref(false)
const saveForm = ref({ name: '', template: 'classic' })
const editingId = ref<number | null>(null)

const availableComponents = [
  { type: 'banner', label: 'Banner轮播', icon: Picture },
  { type: 'category_grid', label: '分类网格', icon: Grid },
  { type: 'recommend_list', label: '推荐列表', icon: VideoCamera },
  { type: 'live_wall', label: '直播墙', icon: Monitor },
  { type: 'quick_entry', label: '快捷入口', icon: Link },
]

const sectionLabel = (type: string) => {
  return { banner: 'Banner轮播', category_grid: '分类网格', recommend_list: '推荐列表', live_wall: '直播墙', quick_entry: '快捷入口' }[type] || type
}

const templates: Record<string, any[]> = {
  classic: [
    { id: ++sectionId, type: 'banner', data: { autoplay: true } },
    { id: ++sectionId, type: 'quick_entry', data: { title: '快捷入口' } },
    { id: ++sectionId, type: 'category_grid', data: { title: '全部分类', count: 8, style: 'grid' } },
    { id: ++sectionId, type: 'recommend_list', data: { title: '热门推荐', count: 10 } },
  ],
  simple: [
    { id: ++sectionId, type: 'banner', data: { autoplay: true } },
    { id: ++sectionId, type: 'category_grid', data: { title: '分类', count: 6, style: 'horizontal' } },
    { id: ++sectionId, type: 'recommend_list', data: { title: '最新上线', count: 12 } },
  ],
  tv: [
    { id: ++sectionId, type: 'banner', data: { autoplay: true } },
    { id: ++sectionId, type: 'category_grid', data: { title: '视频分类', count: 8, style: 'grid' } },
    { id: ++sectionId, type: 'live_wall', data: { title: '直播频道' } },
    { id: ++sectionId, type: 'recommend_list', data: { title: '猜你喜欢', count: 10 } },
  ],
}

const loadLayouts = async () => {
  const res: any = await homeLayoutApi.list(currentType.value)
  layouts.value = res.data || []
}

const selectLayout = async (id: number | null) => {
  if (!id) { sections.value = []; editingId.value = null; return }
  const res: any = await homeLayoutApi.list(currentType.value)
  const layout = (res.data || []).find((l: any) => l.id === id)
  if (layout) {
    sections.value = JSON.parse(layout.config).sections || []
    editingId.value = layout.id
    saveForm.value = { name: layout.name, template: layout.template }
  }
}

const applyTemplate = (name: string) => {
  sections.value = JSON.parse(JSON.stringify(templates[name] || templates.classic))
  editingId.value = null
  saveForm.value.template = name
}

const onDragStart = (e: DragEvent, comp: any) => {
  e.dataTransfer!.setData('component', comp.type)
}

const onDrop = (e: DragEvent) => {
  const type = e.dataTransfer!.getData('component')
  if (!type) return
  sections.value.push({ id: ++sectionId, type, data: getDefaultData(type) })
}

const getDefaultData = (type: string) => {
  const defaults: Record<string, any> = {
    banner: { autoplay: true },
    category_grid: { title: '', count: 8, style: 'grid' },
    recommend_list: { title: '', count: 10 },
    live_wall: { title: '' },
    quick_entry: { title: '' },
  }
  return defaults[type] || {}
}

const removeSection = (index: number) => { sections.value.splice(index, 1) }

const saveLayout = async () => {
  const config = JSON.stringify({ sections: sections.value })
  const data = { ...saveForm.value, type: currentType.value, config }
  if (editingId.value) {
    await homeLayoutApi.update(editingId.value, data)
  } else {
    await homeLayoutApi.create(data)
  }
  showSaveDialog.value = false
  ElMessage.success('保存成功')
  loadLayouts()
}

loadLayouts()
</script>

<style scoped>
.layout-editor { display: flex; flex-direction: column; height: calc(100vh - 120px); }
.toolbar { padding: 12px; background: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; }
.editor-body { display: flex; flex: 1; overflow: hidden; }
.component-palette { width: 160px; padding: 12px; background: #fff; border-right: 1px solid #eee; }
.palette-item { display: flex; align-items: center; gap: 8px; padding: 10px; margin-bottom: 8px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 4px; cursor: grab; }
.canvas-area { flex: 1; overflow-y: auto; padding: 20px; }
.edit-canvas { min-height: 400px; border: 2px dashed #dcdfe6; border-radius: 8px; padding: 16px; }
.section-item { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; margin-bottom: 12px; }
.section-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #f5f7fa; border-radius: 6px 6px 0 0; }
.drag-handle { cursor: move; }
.section-config { padding: 12px; }
.ghost { opacity: 0.5; background: #c8ebfb; }

.preview-mobile { display: flex; justify-content: center; background: #e8e8e8; }
.phone-frame { width: 375px; min-height: 667px; background: #fff; border-radius: 24px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
.phone-screen { overflow-y: auto; }
.preview-section { margin-bottom: 8px; }
.preview-banner { height: 160px; background: linear-gradient(135deg, #667eea, #764ba2); color:#fff; display:flex; align-items:center; justify-content:center; border-radius:8px; }
.preview-grid { display: grid; grid-template-columns: repeat(3,1fr); gap:6px; }
.preview-grid-item { height: 60px; background: #f0f2f5; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px; }
.preview-list-item { height: 48px; background: #f0f2f5; border-radius:6px; margin-bottom:6px; padding:0 12px; display:flex; align-items:center; font-size:13px; }
.preview-live { height: 120px; background: #f0f2f5; border-radius:8px; display:flex; align-items:center; justify-content:center; }
.preview-entry { display:flex; gap:8px; }
.preview-entry span { flex:1; text-align:center; padding:10px 0; background:#f0f2f5; border-radius:6px; font-size:12px; }

.preview-tv { display:flex; justify-content:center; background:#1a1a2e; }
.tv-frame { width: 640px; min-height: 360px; background: #16213e; border-radius: 12px; padding: 20px; }
.tv-screen { color: #fff; }
.tv-banner { height: 140px; background: linear-gradient(135deg, #e94560, #0f3460); display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:12px; }
.tv-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.tv-grid-item { height:50px; background:rgba(255,255,255,.1); border-radius:4px; display:flex; align-items:center; justify-content:center; }
.tv-placeholder { height:60px; background:rgba(255,255,255,.05); border-radius:4px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:13px; }
.preview-section-tv { margin-bottom: 12px; }
</style>
