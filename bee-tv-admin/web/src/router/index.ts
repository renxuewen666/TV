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
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/Dashboard.vue'), meta: { title: '控制台' } },

        { path: 'system', redirect: '/system/basic' },
        { path: 'system/:group', name: 'SystemGroup', component: () => import('@/views/system/System.vue'), meta: { title: '系统设置' } },

        { path: 'users', name: 'Users', component: () => import('@/views/user/User.vue'), meta: { title: '管理员管理' } },
        { path: 'admin-logs', name: 'AdminLogs', component: () => import('@/views/admin-logs/AdminLogs.vue'), meta: { title: '管理员日志' } },
        { path: 'database', name: 'Database', component: () => import('@/views/database/Database.vue'), meta: { title: '数据库管理' } },

        { path: 'advertisement', name: 'Advertisement', component: () => import('@/views/advertisement/Advertisement.vue'), meta: { title: '综合广告管理' } },
        { path: 'notice', name: 'Notice', component: () => import('@/views/notice/Notice.vue'), meta: { title: '公告动态' } },
        { path: 'notice-tv-home', name: 'NoticeTvHome', component: () => import('@/views/notice/Notice.vue'), meta: { title: 'TV首页公告', activeMenu: '/notice-tv-home', noticeType: 3 } },
        { path: 'marquee', name: 'Marquee', component: () => import('@/views/marquee/Marquee.vue'), meta: { title: '跑马灯公告' } },
        { path: 'hotsearch', name: 'Hotsearch', component: () => import('@/views/hotsearch/Hotsearch.vue'), meta: { title: '搜索内容推荐' } },
        { path: 'danmaku', name: 'Danmaku', component: () => import('@/views/danmaku/Danmaku.vue'), meta: { title: '弹幕API配置' } },

        { path: 'member', redirect: '/member/users' },
        { path: 'member/:tab', name: 'MemberTab', component: () => import('@/views/member/Member.vue'), meta: { title: '会员管理' } },

        { path: 'payment', redirect: '/payment/orders' },
        { path: 'payment/orders', name: 'PaymentOrders', component: () => import('@/views/payment/Payment.vue'), meta: { title: '支付订单' } },
        { path: 'epay', name: 'Epay', component: () => import('@/views/epay/Epay.vue'), meta: { title: '支付配置' } },

        { path: 'app-manage', redirect: '/app-manage/apps' },
        { path: 'app-manage/:tab', name: 'AppManageTab', component: () => import('@/views/app-manage/AppManage.vue'), meta: { title: '客户端管理' } },
        { path: 'home-layout', name: 'HomeLayout', component: () => import('@/views/home-layout/LayoutEditor.vue'), meta: { title: '首页配置管理' } },
        { path: 'repo', name: 'Repo', component: () => import('@/views/repo/Repo.vue'), meta: { title: '仓库配置管理' } },
        { path: 'api-manage', name: 'ApiManage', component: () => import('@/views/api-manage/ApiManage.vue'), meta: { title: '视频接口管理' } },

        { path: 'compile', name: 'Compile', component: () => import('@/views/compile/Compile.vue'), meta: { title: 'APP编译' } },

        { path: 'signin', name: 'Signin', component: () => import('@/views/signin/Signin.vue'), meta: { title: '签到积分' } },
        { path: 'score-products', name: 'ScoreProducts', component: () => import('@/views/score/ScoreProducts.vue'), meta: { title: '积分商品' } },
        { path: 'score-exchanges', name: 'ScoreExchanges', component: () => import('@/views/score/ScoreExchanges.vue'), meta: { title: '兑换记录' } },

        { path: 'attachment', name: 'Attachment', component: () => import('@/views/attachment/Attachment.vue'), meta: { title: '附件管理' } },
        { path: 'member/signin', redirect: '/member/sign-logs' },
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
