<template>
  <div class="tag-articles-view">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><PriceTag /></el-icon>
        标签：{{ tagName }}
      </h2>
    </div>

    <el-card v-for="article in articles" :key="article.id" class="article-card">
      <div class="article-content-wrapper">
        <div v-if="article.cover_image" class="article-cover">
          <router-link :to="'/article/' + article.id">
            <el-image :src="article.cover_image" fit="cover" class="cover-img" />
          </router-link>
        </div>
        <div class="article-info">
          <h3 class="article-title">
            <router-link :to="'/article/' + article.id">{{ article.title }}</router-link>
          </h3>
          <p class="article-summary">{{ article.summary || '暂无摘要' }}</p>
          <div class="article-meta">
            <span class="meta-item">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(article.published_at || article.created_at) }}
            </span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article.view_count || 0 }}
            </span>
            <span class="meta-item">
              <el-icon><ChatLineRound /></el-icon>
              {{ article.comment_count || 0 }}
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <div v-if="articles.length === 0" class="empty-state">
      <el-empty :description="'暂无标签为「' + tagName + '」的文章'" />
    </div>

    <div v-if="total > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, View, ChatLineRound, PriceTag } from '@element-plus/icons-vue'
import api from '@/api'

const route = useRoute()
const router = useRouter()
const articles = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const tagName = ref('')

const fetchTagInfo = async () => {
  try {
    const data = await api.get('/tags', { params: { page: 1, size: 100 } })
    const list = data.list || []
    const tag = list.find(t => t.id === parseInt(route.params.id))
    if (tag) {
      tagName.value = tag.name
    } else {
      tagName.value = route.params.id
    }
  } catch (err) {
    tagName.value = route.params.id
    console.error('获取标签信息失败:', err)
  }
}

const fetchArticles = async () => {
  try {
    const data = await api.get('/articles', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        tag_id: route.params.id
      }
    })
    articles.value = data.list || []
    total.value = data.total || 0
  } catch (err) {
    console.error('获取文章列表失败:', err)
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchArticles()
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知日期'
  return new Date(dateStr).toLocaleDateString()
}

const init = () => {
  currentPage.value = 1
  fetchTagInfo()
  fetchArticles()
}

watch(() => route.params.id, init)

onMounted(init)
</script>

<style scoped lang="scss">
.tag-articles-view {
  .page-header {
    margin-bottom: 25px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      color: #303133;
      margin: 0;

      .el-icon {
        color: #409eff;
      }
    }
  }

  .article-card {
    margin-bottom: 20px;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.1);
    }

    .article-content-wrapper {
      display: flex;
      gap: 20px;

      .article-cover {
        flex-shrink: 0;
        width: 180px;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;

        .cover-img {
          width: 100%;
          height: 100%;
        }
      }

      .article-info {
        flex: 1;
        min-width: 0;

        .article-title {
          margin: 0 0 10px;
          font-size: 18px;

          a {
            color: #333;
            text-decoration: none;
            &:hover { color: #409eff; }
          }
        }

        .article-summary {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
          margin: 0 0 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .article-meta {
          display: flex;
          gap: 15px;
          font-size: 13px;
          color: #909399;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 50px 0;
  }

  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 30px;
  }
}
</style>
