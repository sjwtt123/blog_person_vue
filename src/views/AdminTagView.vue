<template>
  <div class="admin-page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">标签管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增标签</el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="tags" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="标签名称" min-width="150" />
        <el-table-column prop="slug" label="别名 (Slug)" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="确定删除该标签吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑标签' : '新增标签'"
      width="500px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入标签名称" clearable />
        </el-form-item>
        <el-form-item label="别名 (Slug)" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入唯一标识 (Slug)" clearable />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="标签描述..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
        </div>
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
const dialogVisible = ref(false)
const tags = ref([])
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  slug: '',
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入唯一标识', trigger: 'blur' }]
}

const fetchTags = async () => {
  loading.value = true
  try {
    const data = await api.get('/tags')
    tags.value = data.list || []
  } catch (err) {
    console.error('获取标签列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.id = row.id
  form.name = row.name
  form.slug = row.slug
  form.description = row.description || ''
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/admin/tags/${id}`)
    ElMessage.success('删除成功')
    fetchTags()
  } catch (err) {
    console.error('删除标签失败:', err)
  }
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.slug = ''
  form.description = ''
  if (formRef.value) formRef.value.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (form.id) {
          await api.put(`/admin/tags/${form.id}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/admin/tags', form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        await fetchTags()
      } catch (err) {
        console.error('保存标签失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(fetchTags)
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
  }

  :deep(.el-table) {
    --el-table-header-bg-color: #f5f7fa;
    thead {
      color: #606266;
      font-weight: 600;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
