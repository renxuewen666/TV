import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/Login.vue'),
      meta: { title: '登录' },
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/Dashboard.vue'), meta: { title: '仪表盘' } },
        { path: 'system', name: 'System', component: () => import('@/views/system/System.vue'), meta: { title: '系统设置' } },
        { path: 'member', name: 'Member', component: () => import('@/views/member/Member.vue'), meta: { title: '会员配置' } },
        { path: 'payment', name: 'Payment', component: () => import('@/views/payment/Payment.vue'), meta: { title: '支付设置' } },
        { path: 'api-manage', name: 'ApiManage', component: () => import('@/views/api-manage/ApiManage.vue'), meta: { title: '接口管理' } },
        { path: 'repo', name: 'Repo', component: () => import('@/views/repo/Repo.vue'), meta: { title: '仓库配置' } },
        { path: 'home-layout', name: 'HomeLayout', component: () => import('@/views/home-layout/LayoutEditor.vue'), meta: { title: '首页配置' } },
        { path: 'app-manage', name: 'AppManage', component: () => import('@/views/app-manage/AppManage.vue'), meta: { title: '应用管理' } },
        { path: 'epay', name: 'Epay', component: () => import('@/views/epay/Epay.vue'), meta: { title: '易支付' } },
        { path: 'notice', name: 'Notice', component: () => import('@/views/notice/Notice.vue'), meta: { title: '公告管理' } },
        { path: 'hotsearch', name: 'Hotsearch', component: () => import('@/views/hotsearch/Hotsearch.vue'), meta: { title: '热搜管理' } },
        { path: 'signin', name: 'Signin', component: () => import('@/views/signin/Signin.vue'), meta: { title: '签到积分' } },
        { path: 'database', name: 'Database', component: () => import('@/views/database/Database.vue'), meta: { title: '数据库管理' } },
        { path: 'compile', name: 'Compile', component: () => import('@/views/compile/Compile.vue'), meta: { title: 'APP编译' } },
        { path: 'score-products', name: 'ScoreProducts', component: () => import('@/views/score/ScoreProducts.vue'), meta: { title: '积分商品' } },
        { path: 'score-exchanges', name: 'ScoreExchanges', component: () => import('@/views/score/ScoreExchanges.vue'), meta: { title: '兑换记录' } },
        { path: 'users', name: 'Users', component: () => import('@/views/user/User.vue'), meta: { title: '管理员管理' } },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) return next('/login')
  if (to.path === '/login' && token) return next('/')
  next()
})

export default router
