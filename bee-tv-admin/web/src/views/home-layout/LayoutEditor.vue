<template>
  <div class="layout-editor">
    <div class="toolbar">
      <el-select v-model="currentType" @change="loadLayouts" style="width:120px">
        <el-option label="手机端 / H5" value="mobile" />
        <el-option label="TV端" value="tv" />
      </el-select>
      <el-select v-model="currentPage" @change="loadLayouts" style="width:140px">
        <el-option label="首页" value="home" />
        <el-option label="推荐页" value="recommend" />
        <el-option label="我的页" value="profile" />
      </el-select>
      <el-select v-model="currentLayoutId" @change="selectLayout" placeholder="选择布局" style="width:200px;margin-left:8px" clearable>
        <el-option v-for="l in layouts" :key="l.id" :label="`${l.name}${l.status ? '（已激活）' : ''}`" :value="l.id" />
      </el-select>
      <el-button type="primary" @click="showSaveDialog = true" :disabled="!sections.length">保存布局</el-button>
      <el-button @click="exportLayout" :disabled="!sections.length">导出JSON</el-button>
      <el-button @click="triggerImport">导入JSON</el-button>
      <input ref="importInput" type="file" accept=".json,application/json" style="display:none" @change="importLayout" />
      <el-radio-group v-model="previewMode" style="margin-left:16px">
        <el-radio-button value="edit">编辑模式</el-radio-button>
        <el-radio-button value="preview-mobile">手机预览</el-radio-button>
        <el-radio-button value="preview-tv">TV预览</el-radio-button>
      </el-radio-group>
      <el-dropdown @command="applyTemplate" style="margin-left:8px">
        <el-button>内置模板 <el-icon><ArrowDown /></el-icon></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="classic">UI6 手机端模板</el-dropdown-item>
            <el-dropdown-item command="simple">简洁流媒体模板</el-dropdown-item>
            <el-dropdown-item command="tv">UI6 TV 大屏模板</el-dropdown-item>
            <el-dropdown-item command="cinema">沉浸影音模板</el-dropdown-item>
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

      <div class="layout-panel" v-if="previewMode === 'edit'">
        <h4>布局列表</h4>
        <div v-if="!layouts.length" class="empty-tip">暂无布局</div>
        <div v-for="layout in layouts" :key="layout.id" class="layout-row" :class="{ active: layout.status === 1 }">
          <div class="layout-info" @click="selectLayout(layout.id)">
            <span class="layout-name">{{ layout.name }}</span>
            <el-tag size="small" :type="layout.status ? 'success' : 'info'">{{ layout.status ? '激活' : '未激活' }}</el-tag>
          </div>
          <div class="layout-actions">
            <el-button size="small" type="primary" link @click="activateLayout(layout)">激活</el-button>
            <el-button size="small" type="danger" link @click="removeLayout(layout.id)">删除</el-button>
          </div>
        </div>
      </div>

      <div class="canvas-area" :class="previewMode">
        <div class="phone-frame" v-if="previewMode === 'preview-mobile'">
          <div class="phone-screen">
            <div v-for="(section, idx) in sections" :key="idx" class="preview-section" :style="sectionStyle(section)">
              <div v-if="section.type === 'banner'" class="preview-banner">{{ section.data.items?.[0]?.title || 'Banner轮播' }}</div>
              <div v-else-if="section.type === 'search_bar'" class="preview-search">🔍 {{ section.data.placeholder || '搜索影视、演员、专题' }}</div>
              <div v-else-if="section.type === 'category_grid'" class="preview-grid">
                <div v-for="i in 6" :key="i" class="preview-grid-item">{{ ['电影','电视剧','综艺','动漫','纪录片','少儿'][i-1] }}</div>
              </div>
              <div v-else-if="section.type === 'recommend_list'" class="preview-list">
                <div v-for="i in 3" :key="i" class="preview-list-item">推荐内容 {{ i }}</div>
              </div>
              <div v-else-if="section.type === 'ranking_list'" class="preview-list">
                <div v-for="i in 3" :key="i" class="preview-list-item">{{ i }}. {{ section.data.rankType || '日榜' }} 热门影片</div>
              </div>
              <div v-else-if="section.type === 'history_row'" class="preview-list">
                <div v-for="i in 2" :key="i" class="preview-list-item">继续观看 {{ i }}</div>
              </div>
              <div v-else-if="section.type === 'section_divider'" class="preview-divider">{{ section.data.title || '分隔标题' }}</div>
              <div v-else-if="section.type === 'ad_banner'" class="preview-ad">广告位 {{ section.data.imageUrl || '' }}</div>
              <div v-else-if="section.type === 'live_wall'" class="preview-live">直播墙</div>
              <div v-else-if="section.type === 'quick_entry'" class="preview-entry">
                <span v-for="entry in section.data.items || defaultQuickEntries" :key="entry.label || entry">{{ entry.label || entry }}</span>
              </div>
              <div v-else-if="section.type === 'bottom_nav'" class="preview-bottom-nav">
                <span v-for="item in section.data.items || defaultBottomNav" :key="item.label || item">{{ item.label || item }}</span>
              </div>
              <div v-else-if="section.type === 'member_summary'" class="preview-list-item">会员、余额、积分、卡券与充值入口</div>
              <div v-else-if="section.type === 'profile_tools'" class="preview-list-item">签到 · TV扫码登录 · 消息 · 客服 · 卡密</div>
            </div>
          </div>
        </div>

        <div class="tv-frame" v-else-if="previewMode === 'preview-tv'">
          <div class="tv-screen">
            <div v-for="(section, idx) in sections" :key="idx" class="preview-section-tv" :style="sectionStyle(section)">
              <div v-if="section.type === 'banner'" class="tv-banner">{{ section.data.items?.[0]?.title || 'Banner轮播' }}</div>
              <div v-else-if="section.type === 'category_grid'" class="tv-grid">
                <div v-for="i in 8" :key="i" class="tv-grid-item">{{ i }}</div>
              </div>
              <div v-else-if="section.type === 'search_bar'" class="tv-placeholder">🔍 {{ section.data.placeholder || '搜索影片' }}</div>
              <div v-else class="tv-placeholder">{{ sectionLabel(section.type) }}</div>
            </div>
          </div>
        </div>

        <div class="edit-canvas" v-else @drop="onDrop" @dragover.prevent>
          <el-empty v-if="!sections.length" description="拖拽组件到此处，或选择内置模板" />
          <draggable v-model="sections" item-key="id" handle=".drag-handle" animation="200" ghost-class="ghost">
            <template #item="{ element, index }">
              <div class="section-item" :style="sectionStyle(element)">
                <div class="section-header">
                  <el-icon class="drag-handle"><Rank /></el-icon>
                  <span>{{ sectionLabel(element.type) }}</span>
                  <el-button type="danger" size="small" circle @click="removeSection(index)"><el-icon><Delete /></el-icon></el-button>
                </div>
                <div class="section-config">
                  <el-form label-width="90px" size="small">
                    <el-form-item label="标题" v-if="element.type !== 'banner' && element.type !== 'search_bar' && element.type !== 'ad_banner'">
                      <el-input v-model="element.data.title" placeholder="可选标题" />
                    </el-form-item>
                    <el-form-item label="搜索提示" v-if="element.type === 'search_bar'">
                      <el-input v-model="element.data.placeholder" placeholder="搜索影视、演员、专题" />
                    </el-form-item>
                    <el-form-item label="广告图URL" v-if="element.type === 'ad_banner'">
                      <el-input v-model="element.data.imageUrl" placeholder="https://example.com/ad.jpg" />
                    </el-form-item>
                    <el-form-item label="跳转链接" v-if="element.type === 'ad_banner'">
                      <el-input v-model="element.data.link" placeholder="https://example.com 或 app://页面标识" />
                    </el-form-item>
                    <el-form-item label="排行榜" v-if="element.type === 'ranking_list'">
                      <el-select v-model="element.data.rankType"><el-option label="日榜" value="日榜" /><el-option label="周榜" value="周榜" /><el-option label="月榜" value="月榜" /></el-select>
                    </el-form-item>
                    <el-form-item label="显示数量" v-if="['category_grid','recommend_list','history_row','ranking_list'].includes(element.type)">
                      <el-input-number v-model="element.data.count" :min="1" :max="30" />
                    </el-form-item>
                    <el-form-item label="样式" v-if="element.type === 'category_grid'">
                      <el-select v-model="element.data.style"><el-option label="网格" value="grid" /><el-option label="横向滚动" value="horizontal" /></el-select>
                    </el-form-item>
                    <el-form-item label="自动播放" v-if="element.type === 'banner'">
                      <el-switch v-model="element.data.autoplay" />
                    </el-form-item>
                    <el-form-item label="轮播内容" v-if="element.type === 'banner'">
                      <el-input v-model="element.data.itemsText" type="textarea" :rows="4" placeholder='每行：标题|图片URL|跳转链接' @change="syncBannerItems(element)" />
                    </el-form-item>
                    <el-form-item label="菜单样式" v-if="element.type === 'bottom_nav'">
                      <el-select v-model="element.data.style"><el-option label="标准底栏" value="standard" /><el-option label="悬浮胶囊" value="floating" /><el-option label="图文方格" value="grid" /></el-select>
                    </el-form-item>
                    <el-form-item label="导航项目" v-if="element.type === 'bottom_nav'">
                      <el-input v-model="element.data.itemsText" type="textarea" :rows="3" placeholder='每行：名称|页面标识，例如：首页|home' @change="syncNavItems(element)" />
                    </el-form-item>
                    <el-form-item label="入口项目" v-if="element.type === 'quick_entry' || element.type === 'profile_tools'">
                      <el-input v-model="element.data.itemsText" type="textarea" :rows="3" placeholder='每行：名称|动作标识，例如：签到|signin' @change="syncNavItems(element)" />
                    </el-form-item>
                    <el-divider content-position="left">样式配置</el-divider>
                    <el-form-item label="背景色"><el-color-picker v-model="element.style.backgroundColor" show-alpha /></el-form-item>
                    <el-form-item label="圆角"><el-input-number v-model="element.style.borderRadius" :min="0" :max="40" /></el-form-item>
                    <el-form-item label="内边距"><el-input-number v-model="element.style.padding" :min="0" :max="40" /></el-form-item>
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
        <el-form-item label="模板标识"><el-select v-model="saveForm.template"><el-option label="UI6 手机端" value="classic" /><el-option label="简洁流媒体" value="simple" /><el-option label="UI6 TV 大屏" value="tv" /><el-option label="沉浸影音" value="cinema" /></el-select></el-form-item>
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
import draggable from 'vuedraggable'
import { homeLayoutApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Grid, VideoCamera, Monitor, Link, Rank, Delete, ArrowDown } from '@element-plus/icons-vue'

let sectionId = 0

const layouts = ref<any[]>([])
const sections = ref<any[]>([])
const currentType = ref('mobile')
const currentPage = ref('home')
const currentLayoutId = ref<number | null>(null)
const previewMode = ref('edit')
const showSaveDialog = ref(false)
const saveForm = ref({ name: '', template: 'classic' })
const editingId = ref<number | null>(null)
const importInput = ref<HTMLInputElement>()

const availableComponents = [
  { type: 'banner', label: 'Banner轮播', icon: Picture },
  { type: 'search_bar', label: '搜索栏', icon: Link },
  { type: 'category_grid', label: '分类网格', icon: Grid },
  { type: 'recommend_list', label: '推荐列表', icon: VideoCamera },
  { type: 'ranking_list', label: '排行榜', icon: Rank },
  { type: 'history_row', label: '观看历史', icon: VideoCamera },
  { type: 'section_divider', label: '分隔线', icon: Link },
  { type: 'ad_banner', label: '广告位', icon: Picture },
  { type: 'live_wall', label: '直播墙', icon: Monitor },
  { type: 'quick_entry', label: '快捷入口', icon: Link },
  { type: 'bottom_nav', label: '底部导航', icon: Grid },
  { type: 'member_summary', label: '会员账户信息', icon: VideoCamera },
  { type: 'profile_tools', label: '我的页工具', icon: Link },
]

const sectionLabel = (type: string) => {
  return {
    banner: 'Banner轮播',
    search_bar: '搜索栏',
    category_grid: '分类网格',
    recommend_list: '推荐列表',
    ranking_list: '排行榜',
    history_row: '观看历史',
    section_divider: '分隔线',
    ad_banner: '广告位',
    live_wall: '直播墙',
    quick_entry: '快捷入口',
    bottom_nav: '底部导航',
    member_summary: '会员账户信息',
    profile_tools: '我的页工具',
  }[type] || type
}

const defaultQuickEntries = ['搜索', '历史', '收藏', '设置']
const defaultBottomNav = ['首页', '推荐', '我的']
const parseItems = (text = '') => text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
  const [label, action = ''] = line.split('|').map(item => item.trim())
  return { label, action }
})
const formatItems = (items: any[] = []) => items.map(item => typeof item === 'string' ? item : `${item.label || ''}|${item.action || item.link || ''}`).join('\n')
const withStyle = (item: any) => ({
  ...item,
  data: { ...item.data },
  style: item.style || { backgroundColor: '', borderRadius: 8, padding: 8 },
})

const templates: Record<string, any[]> = {
  classic: [
    withStyle({ id: ++sectionId, type: 'search_bar', data: { placeholder: '搜索影视、演员、专题' } }),
    withStyle({ id: ++sectionId, type: 'banner', data: { autoplay: true } }),
    withStyle({ id: ++sectionId, type: 'quick_entry', data: { title: '快捷入口' } }),
    withStyle({ id: ++sectionId, type: 'category_grid', data: { title: '全部分类', count: 8, style: 'grid' } }),
    withStyle({ id: ++sectionId, type: 'recommend_list', data: { title: '热门推荐', count: 10 } }),
  ],
  simple: [
    withStyle({ id: ++sectionId, type: 'search_bar', data: { placeholder: '搜索影片' } }),
    withStyle({ id: ++sectionId, type: 'banner', data: { autoplay: true } }),
    withStyle({ id: ++sectionId, type: 'category_grid', data: { title: '分类', count: 6, style: 'horizontal' } }),
    withStyle({ id: ++sectionId, type: 'recommend_list', data: { title: '最新上线', count: 12 } }),
  ],
  tv: [
    withStyle({ id: ++sectionId, type: 'banner', data: { autoplay: true, items: [], itemsText: '' } }),
    withStyle({ id: ++sectionId, type: 'category_grid', data: { title: '视频分类', count: 8, style: 'grid' } }),
    withStyle({ id: ++sectionId, type: 'ranking_list', data: { title: '热播排行', count: 10, rankType: '周榜' } }),
    withStyle({ id: ++sectionId, type: 'live_wall', data: { title: '直播频道' } }),
    withStyle({ id: ++sectionId, type: 'recommend_list', data: { title: '猜你喜欢', count: 10 } }),
  ],
  cinema: [
    withStyle({ id: ++sectionId, type: 'search_bar', data: { placeholder: '搜索电影、剧集与演员' } }),
    withStyle({ id: ++sectionId, type: 'banner', data: { autoplay: true, items: [], itemsText: '' } }),
    withStyle({ id: ++sectionId, type: 'ranking_list', data: { title: '本周热播', count: 10, rankType: '周榜' } }),
    withStyle({ id: ++sectionId, type: 'recommend_list', data: { title: '为你精选', count: 12 } }),
    withStyle({ id: ++sectionId, type: 'bottom_nav', data: { style: 'standard', items: parseItems('首页|home\n推荐|recommend\n我的|profile'), itemsText: '首页|home\n推荐|recommend\n我的|profile' } }),
  ],
}

const normalizeSections = (value: any[]) => (value || []).map((item: any) => {
  const normalized = withStyle({ ...item, id: item.id || ++sectionId })
  if (normalized.type === 'banner' && !normalized.data.itemsText) {
    normalized.data.itemsText = (normalized.data.items || []).map((entry: any) => `${entry.title || ''}|${entry.image || ''}|${entry.link || ''}`).join('\n')
  }
  if (['bottom_nav', 'quick_entry', 'profile_tools'].includes(normalized.type) && !normalized.data.itemsText) normalized.data.itemsText = formatItems(normalized.data.items)
  return normalized
})

const sectionStyle = (section: any) => {
  const style = section.style || {}
  return {
    backgroundColor: style.backgroundColor || undefined,
    borderRadius: `${style.borderRadius ?? 8}px`,
    padding: `${style.padding ?? 8}px`,
  }
}

const loadLayouts = async () => {
  const res: any = await homeLayoutApi.list(currentType.value, currentPage.value)
  layouts.value = res.data || []
  if (currentLayoutId.value && !layouts.value.some((layout: any) => layout.id === currentLayoutId.value)) {
    currentLayoutId.value = null
    editingId.value = null
    sections.value = []
  }
}

const selectLayout = async (id: number | null) => {
  if (!id) { sections.value = []; editingId.value = null; return }
  const layout = layouts.value.find((l: any) => l.id === id) || (await homeLayoutApi.list(currentType.value, currentPage.value) as any).data?.find((l: any) => l.id === id)
  if (layout) {
    try {
      sections.value = normalizeSections(JSON.parse(layout.config || '{}').sections || [])
      editingId.value = layout.id
      currentLayoutId.value = layout.id
      saveForm.value = { name: layout.name, template: layout.template }
    } catch {
      ElMessage.error('布局配置解析失败')
    }
  }
}

const applyTemplate = (name: string) => {
  sections.value = normalizeSections(JSON.parse(JSON.stringify(templates[name] || templates.classic)))
  editingId.value = null
  currentLayoutId.value = null
  saveForm.value.template = name
}

const onDragStart = (e: DragEvent, comp: any) => {
  e.dataTransfer!.setData('component', comp.type)
}

const onDrop = (e: DragEvent) => {
  const type = e.dataTransfer!.getData('component')
  if (!type) return
  sections.value.push(withStyle({ id: ++sectionId, type, data: getDefaultData(type) }))
}

const syncBannerItems = (element: any) => {
  element.data.items = (element.data.itemsText || '').split('\n').map((line: string) => line.trim()).filter(Boolean).map((line: string) => {
    const [title, image, link] = line.split('|').map(item => item.trim())
    return { title, image, link }
  })
}
const syncNavItems = (element: any) => { element.data.items = parseItems(element.data.itemsText) }

const getDefaultData = (type: string) => {
  const defaults: Record<string, any> = {
    banner: { autoplay: true, items: [], itemsText: '' },
    search_bar: { placeholder: '搜索影视、演员、专题' },
    category_grid: { title: '', count: 8, style: 'grid' },
    recommend_list: { title: '', count: 10 },
    ranking_list: { title: '排行榜', count: 10, rankType: '日榜' },
    history_row: { title: '观看历史', count: 8 },
    section_divider: { title: '为你推荐' },
    ad_banner: { imageUrl: '', link: '' },
    live_wall: { title: '' },
    quick_entry: { title: '', items: parseItems(defaultQuickEntries.join('\n')), itemsText: defaultQuickEntries.join('\n') },
    bottom_nav: { style: 'standard', items: parseItems('首页|home\n推荐|recommend\n我的|profile'), itemsText: '首页|home\n推荐|recommend\n我的|profile' },
    member_summary: { title: '我的账户' },
    profile_tools: { title: '常用设置', items: parseItems('签到|signin\n扫码登录TV端|tv_scan_login\n消息|messages\n客服|service\n会员卡密|activation\n仓库与线路|repo\n首页数据|home_data\n本地墙纸|wallpaper\n个性设置|appearance\n播放设置|player\n我的下载|downloads\n缓存|cache\n版本|version\n关于|about'), itemsText: '签到|signin\n扫码登录TV端|tv_scan_login\n消息|messages\n客服|service\n会员卡密|activation\n仓库与线路|repo\n首页数据|home_data\n本地墙纸|wallpaper\n个性设置|appearance\n播放设置|player\n我的下载|downloads\n缓存|cache\n版本|version\n关于|about' },
  }
  return defaults[type] || {}
}

const removeSection = (index: number) => { sections.value.splice(index, 1) }

const saveLayout = async () => {
  if (!saveForm.value.name) return ElMessage.warning('请输入布局名称')
  const config = JSON.stringify({ sections: sections.value })
  const data = { ...saveForm.value, type: currentType.value, page: currentPage.value, config }
  if (editingId.value) {
    await homeLayoutApi.update(editingId.value, data)
  } else {
    await homeLayoutApi.create(data)
  }
  showSaveDialog.value = false
  ElMessage.success('保存成功')
  await loadLayouts()
}

const activateLayout = async (layout: any) => {
  await homeLayoutApi.activate(layout.id)
  ElMessage.success(`已激活布局：${layout.name}`)
  await loadLayouts()
}

const removeLayout = async (id: number) => {
  await ElMessageBox.confirm('确定删除该布局吗？', '提示', { type: 'warning' })
  await homeLayoutApi.remove(id)
  if (editingId.value === id) {
    editingId.value = null
    currentLayoutId.value = null
    sections.value = []
  }
  ElMessage.success('删除成功')
  await loadLayouts()
}

const exportLayout = () => {
  const data = JSON.stringify({ type: currentType.value, template: saveForm.value.template, sections: sections.value }, null, 2)
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bee-layout-${currentType.value}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const triggerImport = () => importInput.value?.click()

const importLayout = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    sections.value = normalizeSections(Array.isArray(json) ? json : json.sections || [])
    if (json.template) saveForm.value.template = json.template
    ElMessage.success('导入成功')
  } catch (err: any) {
    ElMessage.error(`导入失败：${err.message}`)
  } finally {
    ;(e.target as HTMLInputElement).value = ''
  }
}

loadLayouts()
</script>

<style scoped>
.layout-editor { display: flex; flex-direction: column; height: calc(100vh - 120px); }
.toolbar { padding: 12px; background: #fff; border-bottom: 1px solid #eee; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.editor-body { display: flex; flex: 1; overflow: hidden; }
.component-palette { width: 170px; padding: 12px; background: #fff; border-right: 1px solid #eee; overflow-y: auto; }
.palette-item { display: flex; align-items: center; gap: 8px; padding: 10px; margin-bottom: 8px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 4px; cursor: grab; }
.palette-item:hover { border-color: #409eff; color: #409eff; }
.layout-panel { width: 220px; padding: 12px; background: #fbfcff; border-right: 1px solid #eee; overflow-y: auto; }
.empty-tip { color: #909399; font-size: 12px; text-align: center; padding: 20px 0; }
.layout-row { padding: 10px; background: #fff; border: 1px solid #e4e7ed; border-radius: 6px; margin-bottom: 8px; }
.layout-row.active { border-color: #67c23a; background: #f0f9eb; }
.layout-info { display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
.layout-name { font-weight: 600; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.layout-actions { display: flex; justify-content: flex-end; margin-top: 6px; }
.canvas-area { flex: 1; overflow-y: auto; padding: 20px; }
.edit-canvas { min-height: 400px; border: 2px dashed #dcdfe6; border-radius: 8px; padding: 16px; }
.section-item { background: #fff; border: 1px solid #ebeef5; border-radius: 6px; margin-bottom: 12px; }
.section-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #f5f7fa; border-radius: 6px 6px 0 0; }
.section-header span { flex: 1; }
.drag-handle { cursor: move; }
.section-config { padding: 12px; }
.ghost { opacity: 0.5; background: #c8ebfb; }

.preview-mobile { display: flex; justify-content: center; background: #e8e8e8; }
.phone-frame { width: 375px; min-height: 667px; background: #fff; border-radius: 24px; padding: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.15); }
.phone-screen { overflow-y: auto; }
.preview-section { margin-bottom: 8px; }
.preview-banner { height: 160px; background: linear-gradient(135deg, #667eea, #764ba2); color:#fff; display:flex; align-items:center; justify-content:center; border-radius:8px; }
.preview-search { height: 40px; background: #f5f7fa; color: #909399; border-radius: 20px; display: flex; align-items: center; padding: 0 16px; }
.preview-grid { display: grid; grid-template-columns: repeat(3,1fr); gap:6px; }
.preview-grid-item { height: 60px; background: #f0f2f5; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px; }
.preview-list-item { height: 48px; background: #f0f2f5; border-radius:6px; margin-bottom:6px; padding:0 12px; display:flex; align-items:center; font-size:13px; }
.preview-live { height: 120px; background: #f0f2f5; border-radius:8px; display:flex; align-items:center; justify-content:center; }
.preview-ad { height: 90px; background: linear-gradient(135deg, #ffecd2, #fcb69f); border-radius: 8px; display:flex; align-items:center; justify-content:center; color:#8a4b00; }
.preview-divider { color: #303133; font-weight: 600; border-left: 4px solid #409eff; padding-left: 8px; }
.preview-entry { display:flex; gap:8px; flex-wrap:wrap; }
.preview-entry span { flex:1; min-width:68px; text-align:center; padding:10px 0; background:#f0f2f5; border-radius:6px; font-size:12px; }
.preview-bottom-nav { display:flex; gap:8px; justify-content:space-around; position:sticky; bottom:0; padding:10px; background:#fff; border-top:1px solid #ebeef5; }
.preview-bottom-nav span { font-size:12px; color:#606266; }

.preview-tv { display:flex; justify-content:center; background:#1a1a2e; }
.tv-frame { width: 640px; min-height: 360px; background: #16213e; border-radius: 12px; padding: 20px; }
.tv-screen { color: #fff; }
.tv-banner { height: 140px; background: linear-gradient(135deg, #e94560, #0f3460); display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:12px; }
.tv-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.tv-grid-item { height:50px; background:rgba(255,255,255,.1); border-radius:4px; display:flex; align-items:center; justify-content:center; }
.tv-placeholder { height:60px; background:rgba(255,255,255,.08); border-radius:4px; margin-bottom:8px; display:flex; align-items:center; justify-content:center; font-size:13px; }
.preview-section-tv { margin-bottom: 12px; }
</style>
