<template>
  <el-card>
    <template #header><span>兑换记录</span></template>
    <el-form :inline="true" style="margin-bottom:12px">
      <el-form-item label="用户ID"><el-input v-model="searchUserId" placeholder="筛选用户" clearable style="width:200px" @clear="loadData" /></el-form-item>
      <el-form-item><el-button type="primary" @click="loadData">查询</el-button></el-form-item>
    </el-form>
    <el-table :data="list" border>
      <el-table-column prop="userId" label="用户ID" width="120" />
      <el-table-column prop="productName" label="商品名称" />
      <el-table-column prop="points" label="消耗积分" width="100" />
      <el-table-column prop="result" label="兑换结果" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{row}"><el-tag :type="row.status===0?'success':'danger'" size="small">{{ row.status===0?'成功':'失败' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="createdAt" label="兑换时间" width="170" />
    </el-table>
    <el-pagination
      style="margin-top:12px;justify-content:flex-end"
      layout="total, prev, pager, next"
      :total="total"
      :page-size="pageSize"
      v-model:current-page="page"
      @current-change="loadData"
    />
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { scoreApi } from '@/api'

const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchUserId = ref('')

onMounted(() => loadData())

const loadData = async () => {
  const params: any = { page: page.value, size: pageSize.value }
  if (searchUserId.value) params.userId = searchUserId.value
  const res: any = await scoreApi.getExchanges(params)
  list.value = res.data?.list || []
  total.value = res.data?.total || 0
}
</script>
