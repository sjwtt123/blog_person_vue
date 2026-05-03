<template>
  <div class="profile-view">
    <el-row :gutter="20">
      <el-col :xs="24" :md="8">
        <el-card class="profile-card">
          <div class="profile-avatar-section">
            <el-avatar :size="120" :src="profile.avatar || 'https://loremflickr.com/400/400?lock=4167935627070742'" class="profile-avatar" />
            <h2 class="profile-name">{{ profile.username }}</h2>
            <p class="profile-role">
              <el-tag :type="profile.role === 'admin' ? 'danger' : 'info'" size="small">
                {{ profile.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </p>
          </div>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formatDate(profile.created_at) }}</span>
              <span class="stat-label">注册于</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button v-if="!isEditing" type="primary" link @click="startEdit">编辑资料</el-button>
            </div>
          </template>

          <el-form v-if="!isEditing" :model="profile" label-width="100px" class="info-form">
            <el-form-item label="用户名">
              <span>{{ profile.username }}</span>
            </el-form-item>
            <el-form-item label="邮箱">
              <span>{{ profile.email || '未设置' }}</span>
            </el-form-item>
          </el-form>

          <el-form v-else ref="formRef" :model="form" :rules="rules" label-width="100px" class="info-form">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="头像">
              <div class="avatar-upload">
                <el-upload
                  class="avatar-uploader"
                  :http-request="handleAvatarUpload"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                >
                  <img v-if="form.avatar || profile.avatar" :src="form.avatar || profile.avatar" class="upload-avatar" />
                  <div v-else class="avatar-placeholder">
                    <el-icon class="upload-icon"><Plus /></el-icon>
                    <span>上传头像</span>
                  </div>
                </el-upload>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="password-card" style="margin-top: 20px;">
          <template #header>
            <span>修改密码</span>
          </template>
          <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordSubmitting" @click="handleChangePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'
import { getUserRole } from '@/utils/auth'

const profile = ref({
  username: '',
  email: '',
  bio: '',
  avatar: '',
  role: '',
  created_at: ''
})

const isAdminUser = computed(() => getUserRole() === 'admin')

const isEditing = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  username: '',
  email: '',
  bio: '',
  avatar: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ]
}

const passwordFormRef = ref(null)
const passwordSubmitting = ref(false)
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 头像上传前验证
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/jpg'
  const isPNG = file.type === 'image/png'
  const isWebP = file.type === 'image/webp'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG && !isWebP) {
    ElMessage.error('头像只能是 JPG、PNG 或 WebP 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

const originalAvatar = ref('')

const handleAvatarUpload = async (options) => {
  const { file } = options
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'avatar')
  try {
    const res = await api.post('/user/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    // 同时更新表单和profile的头像，让左侧卡片和编辑表单都实时显示新头像（预览）
    form.avatar = res.url
    profile.value.avatar = res.url
    // 但不更新 localStorage 和顶部导航栏，只有点击"保存"后才更新
    ElMessage.success('头像上传成功')
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

const fetchProfile = async () => {
  try {
    const data = await api.get('/user/profile')
    profile.value = data
    if (data.avatar) {
      localStorage.setItem('avatar', data.avatar)
      // 管理员头像保存到admin_avatar
      if (data.role === 'admin') {
        localStorage.setItem('admin_avatar', data.avatar)
      }
    }
  } catch (err) {
    console.error('获取个人信息失败:', err)
  }
}

const startEdit = () => {
  // 保存原始头像，用于取消时恢复
  originalAvatar.value = profile.value.avatar || ''
  Object.assign(form, {
    username: profile.value.username,
    email: profile.value.email || '',
    bio: profile.value.bio || '',
    avatar: profile.value.avatar || ''
  })
  isEditing.value = true
}

const cancelEdit = () => {
  // 恢复原始头像
  profile.value.avatar = originalAvatar.value
  isEditing.value = false
  formRef.value?.resetFields()
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.put('/user/profile', {
          username: form.username,
          email: form.email,
          avatar: form.avatar
        })
        profile.value.username = form.username
        profile.value.email = form.email
        profile.value.bio = form.bio
        profile.value.avatar = form.avatar
        // 更新 localStorage
        localStorage.setItem('avatar', form.avatar)
        if (isAdminUser.value) {
          localStorage.setItem('admin_avatar', form.avatar)
        }
        localStorage.setItem('username', form.username)
        // 通知头部更新头像
        window.dispatchEvent(new CustomEvent('avatar-updated', { detail: form.avatar }))
        ElMessage.success('更新成功')
        isEditing.value = false
      } catch (err) {
        console.error('更新用户信息失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordSubmitting.value = true
      try {
        await api.post('/user/password', {
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        })
        ElMessage.success('密码修改成功')
        passwordFormRef.value?.resetFields()
      } catch (err) {
        console.error('修改密码失败:', err)
      } finally {
        passwordSubmitting.value = false
      }
    }
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

onMounted(fetchProfile)
</script>

<style scoped lang="scss">
.profile-view {
  .profile-card {
    .profile-avatar-section {
      text-align: center;
      padding: 20px 0;

      .profile-avatar {
        border: 4px solid #fff;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        margin-bottom: 15px;
      }

      .profile-name {
        margin: 10px 0 5px;
        font-size: 22px;
        color: #303133;
      }

      .profile-role {
        margin: 5px 0 0;
      }
    }

    .profile-stats {
      display: flex;
      justify-content: space-around;
      padding: 20px 0;
      border-top: 1px solid #f0f0f0;
      margin-top: 20px;

      .stat-item {
        text-align: center;

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 600;
          color: #409eff;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .info-card, .password-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-form {
      .avatar-upload {
        .avatar-uploader {
          :deep(.el-upload) {
            position: relative;
            width: 100px;
            height: 100px;
            border: 2px dashed #d9d9d9;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
            overflow: hidden;

            &:hover {
              border-color: #409eff;
            }
          }

          .upload-avatar {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            display: block;
          }

          .avatar-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #909399;
            background-color: #fafafa;
            width: 100%;
            height: 100%;

            .upload-icon {
              font-size: 24px;
              margin-bottom: 4px;
            }

            span {
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}
</style>
