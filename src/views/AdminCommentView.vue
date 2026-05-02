<template>
  <div class="admin-page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">评论管理</h2>
      </div>
      <div class="header-right">
        <!-- 这里可以放导出按钮等 -->
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="文章ID">
          <el-input v-model="searchForm.article_id" placeholder="输入文章ID筛选" clearable style="width: 180px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索评论内容" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="comments" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="content" label="评论内容" min-width="300" show-overflow-tooltip />
        <el-table-column label="用户" width="150">
          <template #default="{ row }">
            <span class="user-info">
              {{ row.user?.nickname || row.user?.username || '匿名用户' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="文章" width="150" align="center">
          <template #default="{ row }">
            <router-link :to="`/article/${row.article_id}`" class="article-link">
              查看文章 #{{ row.article_id }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column label="评论日期" width="170" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-popconfirm title="确定删除这条评论吗？" @confirm="handleDelete(row.id)">
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
          @current-change="fetchComments"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const loading = ref(false)
const comments = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchForm = ref({
  article_id: '',
  keyword: ''
})

const handleSearch = () => {
  currentPage.value = 1
  fetchComments()
}

const handleReset = () => {
  searchForm.value = { article_id: '', keyword: '' }
  currentPage.value = 1
  fetchComments()
}

const fetchComments = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    if (searchForm.value.article_id) {
      params.article_id = parseInt(searchForm.value.article_id)
    }
    if (searchForm.value.keyword) {
      params.keyword = searchForm.value.keyword
    }
    const data = await api.get('/admin/comments', { params })
    comments.value = data.list || []
    total.value = data.total || 0
  } catch (err) {
    console.error('获取评论列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchComments()
}

const handleDelete = async (id) => {
  try {
    await api.delete(`/admin/comments/${id}`)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (err) {
    console.error('删除评论失败:', err)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

onMounted(fetchComments)
</script>

<style scoped lang="scss">
.admin-page-container {
  padding: 0;

  .search-card {
    margin-bottom: 16px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

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

  .article-link {
    color: #409eff;
    text-decoration: none;
    font-size: 13px;
    &:hover {
      text-decoration: underline;
    }
  }

  .user-info {
    color: #606266;
  }
}
</style>
