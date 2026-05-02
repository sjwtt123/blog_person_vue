<template>
  <div class="home-view">
    <div class="article-list">
      <article v-for="article in articles" :key="article.id" class="article-card">
        <!-- 左侧图片 -->
        <div class="card-image">
          <router-link :to="'/article/' + article.id">
            <el-image v-if="article.cover_image" :src="article.cover_image" fit="cover" class="cover-img" lazy />
            <div v-else class="cover-placeholder" :style="{ background: getGradientColor(article.id) }"></div>
          </router-link>
        </div>

        <!-- 右侧内容 -->
        <div class="card-content">
          <!-- 第一行：信息行 -->
          <div class="content-meta">
            <span class="meta-date">发布于 {{ formatDate(article.published_at || article.created_at) }}</span>
            <router-link v-if="article.category" :to="'/category/' + article.category.id" class="meta-category">{{ article.category.name }}</router-link>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ article.view_count || 0 }} 浏览
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ article.comment_count || 0 }} 评论
            </span>
          </div>

          <!-- 第二行：标题 -->
          <h2 class="article-title">
            <router-link :to="'/article/' + article.id">{{ article.title }}</router-link>
          </h2>

          <!-- 第三行：摘要 -->
          <p class="article-summary">{{ article.summary || '文章摘要为空' }}</p>

          <!-- 第四行：标签 -->
          <div v-if="article.tags && article.tags.length > 0" class="article-tags">
            <router-link
              v-for="tag in article.tags.slice(0, 4)"
              :key="tag.id"
              :to="{ name: 'tag', params: { id: tag.id } }"
              class="tag-item"
              :style="{ backgroundColor: getTagBgColor(tag.id), color: getTagTextColor(tag.id) }"
            >
              {{ tag.name }}
            </router-link>
          </div>
        </div>
      </article>
    </div>

    <div v-if="articles.length === 0" class="empty-state">
      <el-empty description="暂无文章" :image-size="120" />
    </div>

    <div v-if="totalPage > 1" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
        background
      />
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
  { bg: '#eff6ff', color: '#2563eb' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#ecfdf5', color: '#059669' },
  { bg: '#fdf2f8', color: '#db2777' },
  { bg: '#f5f3ff', color: '#7c3aed' },
  { bg: '#fff7ed', color: '#ea580c' },
  { bg: '#f0fdfa', color: '#0d9488' },
  { bg: '#fefce8', color: '#ca8a04' },
]

const getGradientColor = (id) => gradientColors[id % gradientColors.length]
const getTagBgColor = (id) => tagColors[id % tagColors.length].bg
const getTagTextColor = (id) => tagColors[id % tagColors.length].color

const fetchArticles = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      category_id: route.name === 'category' ? route.params.id : undefined,
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

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  fetchArticles()
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

<style scoped lang="scss">
.home-view {
  width: 100%;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.article-card {
  display: flex;
  gap: 20px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .article-title a {
      color: #3b82f6;
    }

    .cover-img {
      transform: scale(1.05);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .card-image {
      width: 100%;
      height: 200px;

      .cover-img,
      .cover-placeholder {
        height: 200px !important;
      }
    }
  }
}

.card-image {
  width: 240px;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;

  a {
    display: block;
    width: 100%;
    height: 100%;
  }

  .cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .cover-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 10px;
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.content-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #9ca3af;
  flex-wrap: wrap;

  .meta-date {
    color: #9ca3af;
  }

  .meta-category {
    display: inline-block;
    padding: 2px 8px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 4px;
    font-size: 11px;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      opacity: 0.85;
    }
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #9ca3af;

    svg {
      opacity: 0.7;
    }
  }
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 10px;

  a {
    color: #1f2937;
    text-decoration: none;
    transition: color 0.2s ease;
    display: block;

    &:hover {
      color: #3b82f6;
    }
  }
}

.article-summary {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .tag-item {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.8;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding-top: 30px;

  :deep(.el-pagination) {
    --el-pagination-button-bg-color: #f5f7fb;
    
    .btn-prev,
    .btn-next,
    li {
      border-radius: 6px;
      
      &.is-active {
        background: #3b82f6 !important;
      }
    }
  }
}

.empty-state {
  padding: 80px 0;
  text-align: center;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

@media (max-width: 968px) {
  .article-card {
    flex-direction: column;

    .card-image {
      width: 100%;
      height: 200px;

      .cover-img,
      .cover-placeholder {
        height: 200px !important;
      }
    }
  }
}
</style>
