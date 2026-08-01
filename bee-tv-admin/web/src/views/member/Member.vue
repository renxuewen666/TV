<template>
  <div class="member-page">
    <el-card shadow="never" class="page-header">
      <div>
        <h3>{{ pageTitle }}</h3>
        <p>{{ pageDesc }}</p>
      </div>
      <el-tag type="info">会员中心</el-tag>
    </el-card>

    <el-card v-if="tab === 'users'">
      <template #header>
        <div class="member-toolbar">
          <div class="toolbar"><span>会员管理</span><div><el-button type="primary" @click="openMember()">添加会员</el-button><el-button type="danger" :disabled="!selectedMembers.length" @click="openMemberBatch">批量操作</el-button><el-button @click="loadMembers">刷新</el-button></div></div>
          <el-form inline class="member-filter"><el-form-item label="关键词"><el-input v-model="memberKeyword" clearable placeholder="用户名、昵称或邮箱" @keyup.enter="loadMembers(1)" /></el-form-item><el-form-item label="状态"><el-select v-model="memberStatus" clearable placeholder="全部"><el-option label="正常" value="1" /><el-option label="禁用" value="0" /></el-select></el-form-item><el-button type="primary" @click="loadMembers(1)">查询</el-button><el-button @click="resetMemberFilter">重置</el-button></el-form>
        </div>
      </template>
      <el-table :data="members" border @selection-change="handleMemberSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="userId" label="用户ID" width="90" />
        <el-table-column prop="username" label="用户名" min-width="130" />
        <el-table-column prop="nickname" label="昵称" min-width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column label="会员套餐" width="130"><template #default="{row}">{{ row.level?.name || (row.levelId ? `等级 ${row.levelId}` : '普通用户') }}</template></el-table-column>
        <el-table-column prop="score" label="积分" width="90" />
        <el-table-column prop="balance" label="余额" width="100" />
        <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '正常' : '禁用' }}</el-tag></template></el-table-column>
        <el-table-column prop="expireAt" label="到期时间" width="180" />
        <el-table-column prop="createdAt" label="注册时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="openMember(row)">编辑</el-button>
            <el-button size="small" type="success" @click="openRecharge(row.userId)">充值</el-button>
            <el-button size="small" type="danger" @click="deleteMember(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination style="margin-top:12px" background layout="prev,pager,next,total" :total="memberTotal" :page-size="20" @current-change="loadMembers" />
    </el-card>

    <el-card v-if="tab === 'groups'">
      <template #header><div class="toolbar"><span>会员套餐</span><el-button type="primary" @click="openGroupDialog()">添加套餐</el-button></div></template>
      <el-table :data="groups" border>
        <el-table-column prop="name" label="套餐名称" min-width="140" />
        <el-table-column prop="price" label="价格" width="100"><template #default="{row}">¥{{ row.price }}</template></el-table-column>
        <el-table-column label="会员时长" width="130"><template #default="{row}">{{ row.isPermanent ? '永久会员' : `${row.duration} 天` }}</template></el-table-column>
        <el-table-column prop="description" label="套餐说明" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '禁用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="160"><template #default="{row}"><el-button size="small" @click="openGroupDialog(row)">编辑</el-button><el-button size="small" type="danger" @click="delGroup(row.id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="tab === 'rules'">
      <template #header><div class="toolbar"><span>会员规则</span><el-button type="primary" @click="openRule()">添加规则</el-button></div></template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">用于控制会员等级权益，例如播放清晰度、下载权限、每日播放次数、广告豁免等。</el-alert>
      <el-table :data="rules" border>
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="type" label="规则类型" />
        <el-table-column prop="value" label="规则值" />
        <el-table-column label="等级"><template #default="{row}">{{ levelName(row.levelId) || '全部' }}</template></el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="状态" width="90"><template #default="{row}"><el-tag :type="row.status ? 'success' : 'danger'">{{ row.status ? '启用' : '禁用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="160"><template #default="{row}"><el-button size="small" @click="openRule(row)">编辑</el-button><el-button size="small" type="danger" @click="deleteRule(row.id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="tab === 'balance-logs'">
      <template #header><div class="toolbar"><span>会员余额日志</span><el-button @click="loadBalanceLogs">刷新</el-button></div></template>
      <el-table :data="balanceLogs" border>
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="amount" label="变动金额" />
        <el-table-column prop="balance" label="变动后余额" />
        <el-table-column prop="orderId" label="订单号" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-card v-if="tab === 'score-logs'">
      <template #header><div class="toolbar"><span>会员积分日志</span><el-button @click="loadScoreLogs">刷新</el-button></div></template>
      <el-table :data="scoreLogs" border>
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="type" label="类型" />
        <el-table-column prop="score" label="积分变动" />
        <el-table-column prop="balance" label="变动后积分" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-card v-if="tab === 'codes'">
      <template #header><div class="toolbar"><span>卡密列表管理</span><div><el-button type="primary" @click="codeVisible = true">生成卡密</el-button><el-button type="danger" :disabled="!selectedCodes.length" @click="batchDeleteCodes">批量删除</el-button></div></div></template>
      <el-table :data="codes" border @selection-change="handleCodeSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="code" label="卡密" min-width="180" />
        <el-table-column label="等级"><template #default="{row}">{{ levelName(row.levelId) || row.levelId }}</template></el-table-column>
        <el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status === 0 ? 'success' : 'info'">{{ row.status === 0 ? '未使用' : '已使用' }}</el-tag></template></el-table-column>
        <el-table-column prop="usedBy" label="使用人" />
        <el-table-column prop="usedAt" label="使用时间" width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="120"><template #default="{row}"><el-button size="small" type="danger" @click="deleteCode(row.id)">删除</el-button></template></el-table-column>
      </el-table>
    </el-card>

    <el-card v-if="tab === 'recharge'">
      <template #header>充值管理</template>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom:12px">可对已有会员进行后台手动充值，同时写入会员余额日志。</el-alert>
      <el-form label-width="100px" style="max-width:520px">
        <el-form-item label="用户ID"><el-input v-model="rechargeForm.userId" placeholder="输入会员 userId" /></el-form-item>
        <el-form-item label="充值金额"><el-input-number v-model="rechargeForm.amount" :min="0" :step="1" /></el-form-item>
        <el-form-item label="充值方式"><el-select v-model="rechargeForm.method"><el-option label="后台手动" value="admin" /><el-option label="易支付" value="epay" /></el-select></el-form-item>
        <el-form-item label="备注"><el-input v-model="rechargeForm.remark" type="textarea" /></el-form-item>
        <el-form-item><el-button type="primary" @click="submitRecharge">确认充值</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-dialog v-model="memberVisible" :title="memberForm.id ? '编辑会员' : '添加会员'" width="520px">
      <el-form :model="memberForm" label-width="100px">
        <el-form-item label="用户名" :required="!memberForm.id"><el-input v-model="memberForm.username" placeholder="用于登录，至少2个字符；历史账号可留空" /></el-form-item>
        <el-form-item label="昵称"><el-input v-model="memberForm.nickname" placeholder="页面展示名称" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="memberForm.email" placeholder="留空时生成内部邮箱" /></el-form-item>
        <el-form-item :label="memberForm.id ? '新密码' : '登录密码'" :required="!memberForm.id"><el-input v-model="memberForm.password" type="password" show-password :placeholder="memberForm.id ? '留空则不修改密码' : '至少6个字符'" /></el-form-item>
        <el-form-item label="会员套餐"><el-select v-model="memberForm.levelId"><el-option label="普通用户" :value="0" /><el-option v-for="l in levels" :key="l.id" :label="l.name" :value="l.id" /></el-select></el-form-item>
        <el-form-item label="授权说明"><el-input v-model="memberForm.remark" placeholder="后台授予/调整的原因" /></el-form-item>
        <el-form-item label="积分"><el-input-number v-model="memberForm.score" :min="0" /></el-form-item>
        <el-form-item label="余额"><el-input-number v-model="memberForm.balance" :min="0" :step="1" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="memberForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="memberVisible=false">取消</el-button><el-button type="primary" @click="saveMember">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="memberBatchVisible" title="批量操作会员" width="460px">
      <el-alert :closable="false" type="warning" show-icon style="margin-bottom:14px">将操作已选中的 {{ selectedMembers.length }} 位会员；删除采用软删除（禁用账号），且会立即使设备登录失效。</el-alert>
      <el-form :model="memberBatchForm" label-width="90px">
        <el-form-item label="操作"><el-select v-model="memberBatchForm.action"><el-option label="启用会员" value="enable" /><el-option label="禁用会员" value="disable" /><el-option label="删除会员" value="delete" /><el-option label="设置会员套餐" value="setLevel" /></el-select></el-form-item>
        <el-form-item v-if="memberBatchForm.action === 'setLevel'" label="会员套餐"><el-select v-model="memberBatchForm.levelId"><el-option v-for="l in levels" :key="l.id" :label="l.name" :value="l.id" /></el-select></el-form-item>
        <el-form-item label="操作说明"><el-input v-model="memberBatchForm.remark" placeholder="批量授权时写入记录" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="memberBatchVisible=false">取消</el-button><el-button type="primary" @click="submitMemberBatch">确认操作</el-button></template>
    </el-dialog>

    <el-dialog v-model="groupVisible" title="会员套餐" width="520px">
      <el-form :model="groupForm" label-width="110px">
        <el-form-item label="套餐名称"><el-input v-model="groupForm.name" /></el-form-item>
        <el-form-item label="套餐价格"><el-input-number v-model="groupForm.price" :min="0" :precision="2" :step="1" /></el-form-item>
        <el-form-item label="永久会员"><el-switch v-model="groupForm.isPermanent" /></el-form-item>
        <el-form-item v-if="!groupForm.isPermanent" label="会员时长"><el-input-number v-model="groupForm.duration" :min="1" :step="1" /><span class="field-suffix">天</span></el-form-item>
        <el-form-item label="套餐说明"><el-input v-model="groupForm.description" type="textarea" :rows="3" /></el-form-item>
        <el-form-item label="购买折扣"><el-input-number v-model="groupForm.discount" :min="0.01" :max="1" :precision="2" :step="0.05" /><span class="field-suffix">1 = 原价</span></el-form-item>
        <el-form-item label="每日积分"><el-input-number v-model="groupForm.dailyScore" :min="0" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="groupForm.sort" :min="0" /></el-form-item>
        <el-form-item label="可购买"><el-switch v-model="groupForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="groupVisible=false">取消</el-button><el-button type="primary" @click="saveGroup">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="ruleVisible" title="会员规则" width="520px">
      <el-form :model="ruleForm" label-width="100px">
        <el-form-item label="规则名称"><el-input v-model="ruleForm.name" /></el-form-item>
        <el-form-item label="规则类型"><el-select v-model="ruleForm.type"><el-option label="播放清晰度" value="play_quality" /><el-option label="下载权限" value="download" /><el-option label="每日播放次数" value="daily_play_limit" /><el-option label="广告豁免" value="ad_free" /></el-select></el-form-item>
        <el-form-item label="规则值"><el-input v-model="ruleForm.value" placeholder="如 1080p、true、50" /></el-form-item>
        <el-form-item label="适用等级"><el-select v-model="ruleForm.levelId"><el-option label="全部" :value="0" /><el-option v-for="l in levels" :key="l.id" :label="l.name" :value="l.id" /></el-select></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="ruleForm.sort" :min="0" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="ruleForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="ruleVisible=false">取消</el-button><el-button type="primary" @click="saveRule">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="codeVisible" title="生成卡密" width="420px">
      <el-form :model="codeForm" label-width="90px">
        <el-form-item label="会员等级"><el-select v-model="codeForm.levelId"><el-option v-for="l in levels" :key="l.id" :label="l.name" :value="l.id" /></el-select></el-form-item>
        <el-form-item label="生成数量"><el-input-number v-model="codeForm.count" :min="1" :max="500" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="codeVisible=false">取消</el-button><el-button type="primary" @click="generateCodes">生成</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { memberApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const tab = computed(() => String(route.params.tab || 'users'))
const metaMap: Record<string, { title: string; desc: string }> = {
  users: { title: '会员管理', desc: '查看、编辑、禁用和删除会员账号。' },
  groups: { title: '会员套餐', desc: '配置客户端可购买套餐、价格、会员时长和永久会员。' },
  rules: { title: '会员规则', desc: '配置会员等级权益与权限规则。' },
  'balance-logs': { title: '会员余额日志', desc: '查看会员余额充值和扣费流水。' },
  'score-logs': { title: '会员积分日志', desc: '查看会员签到、消费和后台调整积分流水。' },
  codes: { title: '卡密列表管理', desc: '生成、查看、删除和批量管理会员卡密。' },
  recharge: { title: '充值管理', desc: '后台手动为会员充值余额。' },
}
const pageTitle = computed(() => metaMap[tab.value]?.title || '会员管理')
const pageDesc = computed(() => metaMap[tab.value]?.desc || '')

const levels = ref<any[]>([])
const members = ref<any[]>([])
const memberTotal = ref(0)
const groups = ref<any[]>([])
const rules = ref<any[]>([])
const balanceLogs = ref<any[]>([])
const scoreLogs = ref<any[]>([])
const codes = ref<any[]>([])
const selectedCodes = ref<number[]>([])
const selectedMembers = ref<number[]>([])
const memberKeyword = ref('')
const memberStatus = ref<string | undefined>()

const memberVisible = ref(false)
const memberBatchVisible = ref(false)
const memberForm = ref<any>({})
const memberBatchForm = ref<any>({ action: 'enable', levelId: undefined, remark: '' })
const groupVisible = ref(false)
const groupForm = ref<any>({})
const ruleVisible = ref(false)
const ruleForm = ref<any>({})
const codeVisible = ref(false)
const codeForm = ref<any>({ levelId: 0, count: 10 })
const rechargeForm = ref({ userId: '', amount: 0, method: 'admin', remark: '' })

const levelName = (id: number) => levels.value.find(l => l.id === id)?.name || ''

const loadBase = async () => {
  const res: any = await memberApi.getLevels()
  levels.value = res.data || []
  if (!codeForm.value.levelId && levels.value[0]) codeForm.value.levelId = levels.value[0].id
}
const loadMembers = async (page = 1) => { const res: any = await memberApi.getMembers({ page, size: 20, keyword: memberKeyword.value || undefined, status: memberStatus.value }); members.value = res.data?.list || []; memberTotal.value = res.data?.total || 0 }
const loadGroups = async () => { const res: any = await memberApi.getGroups({ page: 1, size: 100 }); groups.value = res.data?.list || res.data || [] }
const loadRules = async () => { const res: any = await memberApi.getRules({ page: 1, size: 100 }); rules.value = res.data?.list || [] }
const loadBalanceLogs = async () => { const res: any = await memberApi.getBalanceLogs({ page: 1, size: 100 }); balanceLogs.value = res.data?.list || [] }
const loadScoreLogs = async () => { const res: any = await memberApi.getScoreLogs({ page: 1, size: 100 }); scoreLogs.value = res.data?.list || [] }
const loadCodes = async () => { const res: any = await memberApi.getCodes({ page: 1, size: 100 }); codes.value = res.data?.list || [] }

const loadCurrent = async () => {
  await loadBase()
  if (tab.value === 'users') await loadMembers()
  if (tab.value === 'groups') await loadGroups()
  if (tab.value === 'rules') await loadRules()
  if (tab.value === 'balance-logs') await loadBalanceLogs()
  if (tab.value === 'score-logs') await loadScoreLogs()
  if (tab.value === 'codes') await loadCodes()
}

onMounted(loadCurrent)
watch(tab, loadCurrent)

const openMember = (row?: any) => { memberForm.value = row ? { ...row, password: '', remark: '' } : { username: '', nickname: '', email: '', password: '', levelId: 0, score: 0, balance: 0, status: 1, remark: '' }; memberVisible.value = true }
const saveMember = async () => {
  if (!memberForm.value.id && !memberForm.value.username?.trim()) return ElMessage.warning('请输入用户名')
  if (!memberForm.value.id && !memberForm.value.password) return ElMessage.warning('请输入登录密码')
  if (memberForm.value.id) await memberApi.updateMember(memberForm.value.id, memberForm.value)
  else await memberApi.createMember(memberForm.value)
  ElMessage.success('保存成功'); memberVisible.value = false; loadMembers()
}
const deleteMember = async (id: number) => { await ElMessageBox.confirm('删除后该会员将被禁用，且所有设备登录立即失效。确认继续？', '确认删除', { type: 'warning' }); await memberApi.deleteMember(id); ElMessage.success('删除成功'); loadMembers() }
const handleMemberSelectionChange = (rows: any[]) => { selectedMembers.value = rows.map(row => row.id) }
const resetMemberFilter = () => { memberKeyword.value = ''; memberStatus.value = undefined; loadMembers(1) }
const openMemberBatch = () => { memberBatchForm.value = { action: 'enable', levelId: undefined, remark: '' }; memberBatchVisible.value = true }
const submitMemberBatch = async () => {
  if (memberBatchForm.value.action === 'setLevel' && !memberBatchForm.value.levelId) return ElMessage.warning('请选择会员套餐')
  const actionName: Record<string, string> = { enable: '启用', disable: '禁用', delete: '删除', setLevel: '设置套餐' }
  await ElMessageBox.confirm(`确认${actionName[memberBatchForm.value.action]}选中的 ${selectedMembers.value.length} 位会员？`, '批量操作确认', { type: 'warning' })
  await memberApi.batchUpdateMembers({ ids: selectedMembers.value, ...memberBatchForm.value })
  ElMessage.success('批量操作成功'); memberBatchVisible.value = false; loadMembers()
}

const openGroupDialog = (row?: any) => { groupForm.value = row ? { ...row, discount: row.discount ?? 1 } : { name: '', price: 0, duration: 30, isPermanent: false, description: '', discount: 1, dailyScore: 0, status: 1, sort: 0 }; groupVisible.value = true }
const saveGroup = async () => { if (groupForm.value.id) await memberApi.updateGroup(groupForm.value.id, groupForm.value); else await memberApi.createGroup(groupForm.value); ElMessage.success('保存成功'); groupVisible.value = false; loadGroups() }
const delGroup = async (id: number) => { await ElMessageBox.confirm('确认删除该分组？', '提示', { type: 'warning' }); await memberApi.removeGroup(id); ElMessage.success('删除成功'); loadGroups() }

const openRule = (row?: any) => { ruleForm.value = row ? { ...row } : { name: '', type: 'play_quality', value: '', levelId: 0, status: 1, sort: 0 }; ruleVisible.value = true }
const saveRule = async () => { if (ruleForm.value.id) await memberApi.updateRule(ruleForm.value.id, ruleForm.value); else await memberApi.createRule(ruleForm.value); ElMessage.success('保存成功'); ruleVisible.value = false; loadRules() }
const deleteRule = async (id: number) => { await ElMessageBox.confirm('确认删除该规则？', '提示', { type: 'warning' }); await memberApi.deleteRule(id); ElMessage.success('删除成功'); loadRules() }

const handleCodeSelectionChange = (rows: any[]) => { selectedCodes.value = rows.map(r => r.id) }
const generateCodes = async () => { await memberApi.generateCodes(codeForm.value); ElMessage.success('生成成功'); codeVisible.value = false; loadCodes() }
const deleteCode = async (id: number) => { await ElMessageBox.confirm('确认删除该卡密？', '提示', { type: 'warning' }); await memberApi.deleteCode(id); ElMessage.success('删除成功'); loadCodes() }
const batchDeleteCodes = async () => { await ElMessageBox.confirm(`确认删除选中的 ${selectedCodes.value.length} 个卡密？`, '提示', { type: 'warning' }); await memberApi.batchDeleteCodes(selectedCodes.value); ElMessage.success('批量删除成功'); loadCodes() }

const openRecharge = (userId: string) => { rechargeForm.value = { userId, amount: 0, method: 'admin', remark: '' }; window.location.hash = '#/member/recharge' }
const submitRecharge = async () => { if (!rechargeForm.value.userId) return ElMessage.warning('请输入用户ID'); await memberApi.recharge(rechargeForm.value.userId, { amount: rechargeForm.value.amount, method: rechargeForm.value.method, remark: rechargeForm.value.remark }); ElMessage.success('充值成功'); rechargeForm.value = { userId: '', amount: 0, method: 'admin', remark: '' } }
</script>

<style scoped>
.member-page { display: flex; flex-direction: column; gap: 16px; }
.page-header :deep(.el-card__body) { display: flex; justify-content: space-between; align-items: center; }
.page-header h3 { margin: 0; font-size: 18px; }
.page-header p { margin: 6px 0 0; color: #909399; font-size: 13px; }
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.member-toolbar { display: flex; flex-direction: column; gap: 12px; }
.member-filter { margin: 0; }
.field-suffix { margin-left: 8px; color: #606266; }
</style>
