<template>
  <div class="liked-view">
    <div class="page-header">
      <h1 class="page-title">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        我的点赞
      </h1>
      <p class="page-desc">我点赞过的文章</p>
    </div>

    <div v-if="articles.length > 0" class="article-list">
      <article v-for="article in articles" :key="article.id" class="post-card">
        <router-link :to="'/article/' + article.id" class="post-thumb-link">
          <img
            v-if="article.cover_image"
            :src="article.cover_image"
            :alt="article.title"
            class="post-thumb"
          />
          <div v-else class="post-thumb-placeholder" :style="{ background: getGradientColor(article.id) }"></div>
        </router-link>

        <div class="post-content">
          <div class="post-meta">
            <span class="date">发布于 {{ formatDate(article.published_at || article.created_at) }}</span>
            <router-link
              v-if="article.category"
              :to="'/category/' + article.category.id"
              class="category"
              :style="{ color: getCategoryColor(article.category.id), background: getCategoryBgColor(article.category.id) }"
            >{{ article.category.name }}</router-link>
            <span class="views">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ article.view_count || 0 }} 浏览
            </span>
            <span class="likes">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {{ article.like_count || 0 }} 点赞
            </span>
            <span class="comments">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ article.comment_count || 0 }} 评论
            </span>
          </div>

          <router-link :to="'/article/' + article.id" class="post-title">{{ article.title }}</router-link>

          <p class="post-excerpt">{{ article.summary || '文章摘要为空' }}</p>

          <div v-if="article.tags && article.tags.length > 0" class="post-tags">
            <router-link
              v-for="tag in article.tags.slice(0, 4)"
              :key="tag.id"
              :to="{ name: 'tag', params: { id: tag.id } }"
              class="tag"
              :style="{ backgroundColor: getTagBgColor(tag.id), color: getTagTextColor(tag.id) }"
            >
              {{ tag.name }}
            </router-link>
          </div>
        </div>
      </article>
    </div>

    <div v-if="articles.length === 0 && !loading" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#d1d5db" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <p>暂无点赞的文章</p>
    </div>

    <div v-if="loading" class="loading-state">
      <p>加载中...</p>
    </div>

    <div v-if="totalPage > 1" class="pagination-wrapper">
      <button
        class="page-btn"
        :disabled="currentPage <= 1"
        @click="handlePageChange(currentPage - 1)"
      >上一页</button>
      <template v-for="p in totalPage" :key="p">
        <button
          v-if="p === 1 || p === totalPage || (p >= currentPage - 2 && p <= currentPage + 2)"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="handlePageChange(p)"
        >{{ p }}</button>
        <span v-else-if="p === 2 || p === totalPage - 1" class="page-ellipsis">...</span>
      </template>
      <button
        class="page-btn"
        :disabled="currentPage >= totalPage"
        @click="handlePageChange(currentPage + 1)"
      >下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { likeApi } from '@/api'
import { getToken } from '@/utils/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const articles = ref([])
const total = ref(0)
const totalPage = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)

const gradientColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
]

const tagColors = [
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#fce7f3', color: '#db2777' },
  { bg: '#d1fae5', color: '#059669' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ffedd5', color: '#ea580c' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#ecfdf5', color: '#059669' },
  { bg: '#fdf2f8', color: '#db2777' },
]

const categoryBgColors = ['#eff6ff', '#fffbeb', '#ecfdf5', '#f5f3ff']
const categoryColors = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6']

const getGradientColor = (id) => gradientColors[id % gradientColors.length]
const getTagBgColor = (id) => tagColors[id % tagColors.length].bg
const getTagTextColor = (id) => tagColors[id % tagColors.length].color
const getCategoryBgColor = (id) => categoryBgColors[id % categoryBgColors.length]
const getCategoryColor = (id) => categoryColors[id % categoryColors.length]

const fetchLikedArticles = async () => {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  loading.value = true
  try {
    const data = await likeApi.getUserLikedArticles({
      page: currentPage.value,
      size: pageSize.value,
    })
    articles.value = data.list || []
    total.value = Number(data.total || 0)
    totalPage.value = Number(data.total_page || 0)
  } catch (err) {
    console.error('获取点赞文章列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchLikedArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知日期'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(fetchLikedArticles)
</script>

<style scoped lang="scss">
.liked-view {
  .page-header {
    margin-bottom: 30px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 28px;
      color: #303133;
      margin: 0 0 10px;

      svg {
        color: #f56c6c;
      }
    }

    .page-desc {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .article-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .post-card {
    background: #fff;
    border-radius: 12px;
    display: flex;
    gap: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s, box-shadow 0.2s;
    overflow: hidden;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .post-thumb-link {
    flex-shrink: 0;
    display: block;
    width: 240px;
    height: 200px;
  }

  .post-thumb {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  .post-card:hover .post-thumb {
    transform: scale(1.05);
  }

  .post-thumb-placeholder {
    width: 100%;
    height: 100%;
  }

  .post-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    padding: 20px;
  }

  .post-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 12px;
    font-size: 12px;
    color: #9ca3af;
    flex-wrap: wrap;

    .date {
      color: #9ca3af;
    }

    .category {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      text-decoration: none;
      font-weight: 500;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.85;
      }
    }

    .views,
    .comments,
    .likes {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #9ca3af;
    }
  }

  .post-title {
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 10px;
    text-decoration: none;
    display: block;
    transition: color 0.2s;

    &:hover {
      color: #3b82f6;
    }
  }

  .post-excerpt {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.6;
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tag {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 40px;
    padding-top: 30px;
  }

  .page-btn {
    min-width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #4b5563;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    transition: all 0.2s;

    &:hover:not(:disabled):not(.active) {
      border-color: #3b82f6;
      color: #3b82f6;
    }

    &.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .page-ellipsis {
    padding: 0 4px;
    color: #9ca3af;
  }

  .empty-state {
    padding: 80px 0;
    text-align: center;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

    .empty-icon {
      margin-bottom: 16px;
    }

    p {
      color: #9ca3af;
      font-size: 15px;
      margin: 0;
    }
  }

  .loading-state {
    padding: 40px 0;
    text-align: center;
    color: #909399;
  }
}

@media (max-width: 768px) {
  .liked-view {
    .post-card {
      flex-direction: column;
    }

    .post-thumb-link {
      width: 100%;
    }

    .post-thumb,
    .post-thumb-placeholder {
      width: 100%;
      height: 200px;
    }
  }
}
</style>
