<template>
  <div class="admin-page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">文章管理</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" icon="Plus" @click="router.push('/admin/articles/edit')">发布文章</el-button>
      </div>
    </div>

    <el-card class="table-card" shadow="never">
      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="状态">
            <el-select 
              v-model="filterForm.status" 
              placeholder="全部状态" 
              clearable 
              style="width: 130px"
              @change="handleFilter"
            >
              <el-option :value="1" label="已发布" />
              <el-option :value="2" label="草稿" />
              <el-option :value="3" label="隐藏" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索标题..."
              clearable
              @keyup.enter="handleFilter"
            >
              <template #append>
                <el-button icon="Search" @click="handleFilter" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="articles" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.category?.name || '未分类' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="作者" width="120">
          <template #default="{ row }">
            {{ row.author?.nickname || row.author?.username || '管理员' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/admin/articles/edit/${row.id}`)">编辑</el-button>
            <el-divider direction="vertical" />
            <el-popconfirm title="确定删除该文章吗？" @confirm="handleDelete(row.id)">
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
          @current-change="fetchArticles"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const router = useRouter()
const loading = ref(false)
const articles = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const filterForm = ref({
  status: null,
  keyword: ''
})

const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      keyword: filterForm.value.keyword || undefined,
      status: filterForm.value.status ?? undefined
    }
    const data = await api.get('/admin/articles', { params })
    articles.value = data.list || []
    total.value = data.total || 0
  } catch (err) {
    console.error('获取文章列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  currentPage.value = 1
  fetchArticles()
}

const resetFilter = () => {
  filterForm.value.status = null
  filterForm.value.keyword = ''
  handleFilter()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchArticles()
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/admin/articles/${id}`)
    ElMessage.success('删除成功')
    fetchArticles()
  } catch (err) {
    console.error('删除文章失败:', err)
  }
}

const getStatusType = (status) => {
  const types = { 1: 'success', 2: 'info', 3: 'warning', 0: 'success' }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = { 1: '已发布', 2: '草稿', 3: '隐藏', 0: '已发布' }
  return labels[status] || '未知'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

onMounted(fetchArticles)
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
    
    .filter-bar {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;

      .filter-form {
        :deep(.el-form-item) {
          margin-bottom: 0;
          margin-right: 20px;
        }
      }
    }

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
