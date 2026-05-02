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
        <el-form-item>
          <el-button type="primary" :loading="loading" class="submit-btn" @click="handleLogin">登录</el-button>
        </el-form-item>
        <div class="form-footer">
          还没有账号？<router-link to="/register">立即注册</router-link>
          <el-divider direction="vertical" />
          <router-link to="/">返回首页</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const data = await api.post('/auth/login', form)
        localStorage.setItem('token', data.token)
        if (data.user && data.user.role) {
          localStorage.setItem('role', data.user.role)
        }
        if (data.user && data.user.avatar) {
          localStorage.setItem('avatar', data.user.avatar)
          // 管理员头像保存到admin_avatar
          if (data.user.role === 'admin') {
            localStorage.setItem('admin_avatar', data.user.avatar)
          }
        }
        localStorage.setItem('username', data.user?.username || form.username)
        ElMessage.success('登录成功')
        
        // 跳转到之前访问的页面或首页
        const redirect = route.query.redirect
        router.push(redirect || '/')
      } catch (err) {
        // Error already handled by interceptor
      } finally {
        loading.value = false
      }
    }
  })
}
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
</style>
