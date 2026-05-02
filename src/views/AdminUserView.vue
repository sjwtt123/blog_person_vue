<template>
  <div class="admin-page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">用户管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAdd">新增用户</el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="users" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="2"
              size="small"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该用户吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        style="padding: 0 20px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" :prop="isEdit ? '' : 'password'">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="2">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const submitting = ref(false)
const users = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentId = ref(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  role: 'user',
  status: 1
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '长度在 6 到 50 个字符', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    const data = await api.get('/admin/users', { params })
    users.value = data.list || []
    total.value = data.total || 0
  } catch (err) {
    console.error('获取用户列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchUsers()
}

const handleAdd = () => {
  isEdit.value = false
  currentId.value = null
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    username: row.username,
    email: row.email,
    password: '',
    role: row.role,
    status: row.status
  })
  dialogVisible.value = true
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.put(`/admin/users/${currentId.value}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/admin/users', form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        await fetchUsers()
      } catch (err) {
        console.error('保存用户失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleStatusChange = async (row) => {
  try {
    await api.put(`/admin/users/${row.id}`, { status: row.status })
    ElMessage.success(`用户 ${row.username} 状态已更新`)
  } catch (err) {
    row.status = row.status === 1 ? 2 : 1
    console.error('更新用户状态失败:', err)
  }
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/admin/users/${id}`)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (err) {
    console.error('删除用户失败:', err)
  }
}

const handleDialogClosed = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    username: '',
    email: '',
    password: '',
    role: 'user',
    status: 1
  })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.admin-page-container {
  padding: 0;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .table-card {
    border-radius: 8px;

    .pagination-container {
      margin-top: 25px;
      display: flex;
      justify-content: flex-end;
    }
  }

  :deep(.el-table) {
    --el-table-header-bg-color: #f5f7fa;
    thead {
      color: #606266;
      font-weight: 600;
    }
  }
}
</style>
