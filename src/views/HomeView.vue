<template>
  <div class="home-view">
    <div class="article-list">
      <article v-for="article in articles" :key="article.id" class="post-card">
        <!-- 左侧图片 -->
        <router-link :to="'/article/' + article.id" class="post-thumb-link">
          <img
            v-if="article.cover_image"
            :src="article.cover_image"
            :alt="article.title"
            class="post-thumb"
          />
          <div v-else class="post-thumb-placeholder" :style="{ background: getGradientColor(article.id) }"></div>
        </router-link>

        <!-- 右侧内容 -->
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

    <div v-if="articles.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#d1d5db" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <p>暂无文章</p>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'

const route = useRoute()
const articles = ref([])
const total = ref(0)
const totalPage = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

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

const fetchArticles = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      category_id: route.name === 'category' ? route.params.id : undefined,
      keyword: route.query.q || undefined,
    }
    const data = await api.get('/articles', { params })
    articles.value = data.list || []
    total.value = Number(data.total || 0)
    totalPage.value = Number(data.total_page || 0)
  } catch (err) {
    console.error('获取文章列表失败:', err)
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知日期'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(
  () => [route.name, route.params.id, route.query.q, route.query.tag, route.query.date],
  () => {
    currentPage.value = 1
    fetchArticles()
  }
)

onMounted(fetchArticles)
</script>

<style scoped>
.home-view {
  width: 100%;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 文章卡片 */
.post-card {
  background: #fff;
  border-radius: 12px;
  display: flex;
  gap: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
}

.post-meta .date {
  color: #9ca3af;
}

.post-meta .category {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.post-meta .category:hover {
  opacity: 0.85;
}

.post-meta .views,
.post-meta .comments,
.post-meta .likes {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #9ca3af;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10px;
  text-decoration: none;
  display: block;
  transition: color 0.2s;
}

.post-title:hover {
  color: #3b82f6;
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
}

.tag:hover {
  opacity: 0.8;
}

/* 分页 */
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
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-ellipsis {
  padding: 0 4px;
  color: #9ca3af;
}

/* 空状态 */
.empty-state {
  padding: 80px 0;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.empty-state .empty-icon {
  margin-bottom: 16px;
}

.empty-state p {
  color: #9ca3af;
  font-size: 15px;
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
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
</style>
