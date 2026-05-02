import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const instance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 清理过期 token 并跳转登录
const handleTokenExpired = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
  localStorage.removeItem('avatar')
  localStorage.removeItem('admin_avatar')
  
  if (router.currentRoute.value.path !== '/login') {
    ElMessage.warning('登录已过期，请重新登录')
    router.push('')
  }
}

// Response interceptor
instance.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      if (res.code === 401 || res.code === 403) {
        handleTokenExpired()
        return Promise.reject(new Error(res.message || 'Unauthorized'))
      }
      ElMessage.error(res.message || 'Error')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data
  },
  (error) => {
    const status = error.response?.status
    
    if (status === 401) {
      handleTokenExpired()
      return Promise.reject(error)
    }

    ElMessage.error(error.response?.data?.message || error.message)
    return Promise.reject(error)
  }
)

export default instance