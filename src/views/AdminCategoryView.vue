<template>
  <div class="admin-page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">分类管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增分类</el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="categories" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="slug" label="别名 (Slug)" min-width="150" />
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="post_count" label="文章数" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.post_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="确定删除该分类吗？" @confirm="handleDelete(row.id)">
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
      :title="form.id ? '编辑分类' : '新增分类'"
      width="500px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" clearable />
        </el-form-item>
        <el-form-item label="别名 (Slug)" prop="slug">
          <el-input v-model="form.slug" placeholder="请输入唯一标识 (Slug)" clearable />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" rows="3" placeholder="分类描述..." />
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
const categories = ref([])
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  slug: '',
  sort_order: 0,
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请输入唯一标识', trigger: 'blur' }]
}

const fetchCategories = async () => {
  loading.value = true
  try {
    const data = await api.get('/categories')
    categories.value = data.list || []
  } catch (err) {
    console.error('获取分类列表失败:', err)
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
  form.sort_order = row.sort_order || 0
  form.description = row.description || ''
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/admin/categories/${id}`)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (err) {
    console.error('删除分类失败:', err)
  }
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.slug = ''
  form.sort_order = 0
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
          await api.put(`/admin/categories/${form.id}`, form)
          ElMessage.success('更新成功')
        } else {
          await api.post('/admin/categories', form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchCategories()
      } catch (err) {
        console.error('保存分类失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(fetchCategories)
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
