<template>
  <div class="register-view">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span class="title">用户注册</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="form.code" placeholder="请输入验证码" />
            <el-button 
              type="primary" 
              :disabled="countdown > 0" 
              :loading="sendingCode"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleRegister">注册</el-button>
        </el-form-item>
        <div class="form-footer">
          已有账号？<router-link to="/login">立即登录</router-link>
          <el-divider direction="vertical" />
          <router-link to="/">返回首页</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let timer = null

const form = reactive({
  username: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value.length < 8 || value.length > 50) {
    callback(new Error('密码长度必须为8-50位'))
    return
  }
  const hasDigit = /\d/.test(value)
  const hasLetter = /[a-zA-Z]/.test(value)
  if (!hasDigit || !hasLetter) {
    callback(new Error('密码必须包含数字和字母'))
    return
  }
  callback()
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
}

const handleSendCode = async () => {
  if (!form.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }
  
  sendingCode.value = true
  try {
    await api.post('/auth/send-code', { email: form.email })
    ElMessage.success('验证码已发送')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch (err) {
    // Error handled by interceptor
  } finally {
    sendingCode.value = false
  }
}

const handleRegister = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await api.post('/auth/register', form)
        ElMessage.success('注册成功，请登录')
        router.push('/login')
      } catch (err) {
        // Error handled by interceptor
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.register-view {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7f9;

  .register-card {
    width: 400px;
    border: none;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);

    .card-header {
      text-align: center;
      .title { font-size: 20px; font-weight: bold; }
    }

    .code-input {
      display: flex;
      gap: 10px;
      :deep(.el-input) { flex: 1; }
    }

    .submit-btn {
      width: 100%;
      height: 40px;
      margin-top: 10px;
    }

    .form-footer {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-top: 20px;
      a { color: #409eff; text-decoration: none; }
    }
  }
}
</style>
