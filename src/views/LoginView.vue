<template>
  <div class="login-view">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span class="title">用户登录</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item label="验证码" prop="captchaCode">
          <div class="captcha-input">
            <el-input v-model="form.captchaCode" placeholder="请输入验证码" @keyup.enter="handleLogin" />
            <img :src="captchaImage" class="captcha-image" @click="refreshCaptcha" alt="验证码" />
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleLogin">登录</el-button>
        </el-form-item>
        <div class="form-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
          <el-divider direction="vertical" />
          <a href="javascript:void(0)" @click="showForgotDialog = true">忘记密码？</a>
          <el-divider direction="vertical" />
          <router-link to="/">返回首页</router-link>
        </div>
      </el-form>
    </el-card>

    <el-dialog v-model="showForgotDialog" title="重置密码" width="400px">
      <el-form :model="forgotForm" :rules="forgotRules" ref="forgotFormRef" label-position="top">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="forgotForm.email" placeholder="请输入注册邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="forgotForm.code" placeholder="请输入验证码" />
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
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="forgotForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="forgotForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgotDialog = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="handleResetPassword">重置密码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)

const showForgotDialog = ref(false)
const forgotFormRef = ref(null)
const sendingCode = ref(false)
const resetting = ref(false)
const countdown = ref(0)
let timer = null

const form = reactive({
  username: '',
  password: '',
  captchaId: '',
  captchaCode: '',
})

const captchaImage = ref('')

const refreshCaptcha = async () => {
  try {
    const data = await api.get('/auth/captcha')
    captchaImage.value = data.captcha
    form.captchaId = data.id
    form.captchaCode = ''
  } catch (err) {
    ElMessage.error('验证码加载失败')
  }
}

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
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

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
    return
  }
  if (value !== forgotForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const forgotRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }],
}

const handleSendCode = async () => {
  if (!forgotForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(forgotForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }
  
  sendingCode.value = true
  try {
    await api.post('/auth/send-code', { email: forgotForm.email })
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

const handleResetPassword = async () => {
  if (!forgotFormRef.value) return
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      resetting.value = true
      try {
        await api.post('/auth/reset-password', forgotForm)
        ElMessage.success('密码重置成功，请登录')
        showForgotDialog.value = false
        forgotForm.email = ''
        forgotForm.code = ''
        forgotForm.newPassword = ''
        if (timer) {
          clearInterval(timer)
          timer = null
        }
        countdown.value = 0
      } catch (err) {
        // Error handled by interceptor
      } finally {
        resetting.value = false
      }
    }
  })
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = await api.post('/auth/login', {
          username: form.username,
          password: form.password,
          captchaId: form.captchaId,
          captchaCode: form.captchaCode,
        })
        localStorage.setItem('token', data.token)
        if (data.user && data.user.role) {
          localStorage.setItem('role', data.user.role)
        }
        if (data.user && data.user.avatar) {
          localStorage.setItem('avatar', data.user.avatar)
          if (data.user.role === 'admin') {
            localStorage.setItem('admin_avatar', data.user.avatar)
          }
        }
        localStorage.setItem('username', data.user?.username || form.username)
        ElMessage.success('登录成功')
        
        const redirect = route.query.redirect
        router.push(redirect || '/')
      } catch (err) {
        refreshCaptcha()
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(refreshCaptcha)
</script>

<style scoped lang="scss">
.login-view {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7f9;

  .login-card {
    width: 400px;
    border: none;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1);

    .card-header {
      text-align: center;
      .title { font-size: 20px; font-weight: bold; }
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

.code-input {
  display: flex;
  gap: 10px;
  :deep(.el-input) { flex: 1; }
}

.captcha-input {
  display: flex;
  gap: 10px;
  :deep(.el-input) { flex: 1; }
  .captcha-image {
    height: 40px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
  }
}
</style>
