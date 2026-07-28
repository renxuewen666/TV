import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<any>(null)

  const login = async (username: string, password: string) => {
    const res: any = await authApi.login({ username, password })
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('token', token.value)
    return res
  }

  const getProfile = async () => {
    const res: any = await authApi.getProfile()
    userInfo.value = res.data
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.clear()
  }

  return { token, userInfo, login, getProfile, logout }
})
