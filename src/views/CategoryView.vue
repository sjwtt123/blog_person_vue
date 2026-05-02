<template>
  <div class="category-view">
    <el-row :gutter="20">
      <el-col :xs="24" :md="16">
        <div class="article-list">
          <div class="list-header">
            <h2 class="category-title">
              <el-icon><Folder /></el-icon>
              {{ categoryName }}
              <span class="article-count">共 {{ total }} 篇文章</span>
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
                  <span v-if="article.updated_at && article.updated_at !== article.created_at" class="meta-item updated">
                    <el-icon><Refresh /></el-icon>
                    更新于 {{ formatDate(article.updated_at) }}
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
                <div class="article-tags" v-if="article.tags && article.tags.length > 0">
                  <el-tag v-for="tag in article.tags" :key="tag.id" size="small" effect="plain">
                    {{ tag.name }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <div v-if="articles.length === 0" class="empty-state">
            <el-empty description="该分类下暂无文章" />
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
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card class="category-info-card">
          <div class="category-detail">
            <h2 class="detail-name">{{ categoryName }}</h2>
            <p class="detail-desc">{{ categoryDesc || '暂无分类描述' }}</p>
            <div class="detail-stats">
              <div class="stat-item">
                <span class="stat-value">{{ total }}</span>
                <span class="stat-label">文章</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="timeline-card" :body-style="{ padding: '20px' }">
          <h4 class="widget-title">时间轴</h4>
          <div class="sidebar-timeline" v-if="categoryTimelineYears.length > 0">
            <div class="timeline-year" v-for="group in categoryTimelineYears" :key="group.year">
              <div class="year-header">
                <span class="year-text">{{ group.year }}年</span>
              </div>
              <div class="year-list">
                <div
                  class="timeline-row"
                  v-for="a in group.articles"
                  :key="a.id"
                  @click="router.push('/article/' + a.id)"
                >
                  <span class="row-date">{{ a.mmdd }}</span>
                  <span class="row-title" :title="a.title">{{ a.title }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-widget">暂无文章</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Calendar, View, ChatLineRound, Folder, Refresh } from '@element-plus/icons-vue'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const articles = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const categoryName = ref('')
const categoryDesc = ref('')
const currentCategoryId = ref(null)
const timelineArticles = ref([])

const categoryTimelineYears = computed(() => {
  const list = Array.isArray(timelineArticles.value) ? timelineArticles.value : []
  const groups = new Map()

  for (const a of list) {
    const raw = a?.published_at || a?.created_at
    const d = raw ? new Date(raw) : null
    if (!d || Number.isNaN(d.getTime())) continue

    const year = d.getFullYear()
    const mm = d.getMonth() + 1
    const dd = d.getDate()
    const mmdd = `${mm}/${dd}`

    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push({ id: a.id, title: a.title, mmdd, ts: d.getTime() })
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, items]) => ({
      year,
      articles: items.sort((a, b) => b.ts - a.ts),
    }))
})

const fetchCategoryInfo = async () => {
  try {
    const data = await api.get('/categories', { params: { page: 1, size: 100 } })
    const list = data.list || []
    const cat = list.find(c => c.id === parseInt(route.params.id))
    if (cat) {
      categoryName.value = cat.name
      categoryDesc.value = cat.description
      currentCategoryId.value = cat.id
    }
  } catch (err) {
    console.error('获取分类信息失败:', err)
  }
}

const fetchArticles = async () => {
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
      category_id: route.params.id
    }
    const data = await api.get('/articles', { params })
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

const fetchTimeline = async () => {
  try {
    const data = await api.get('/articles', {
      params: { page: 1, size: 100, category_id: route.params.id }
    })
    timelineArticles.value = data.list || []
  } catch (err) {
    console.error('获取时间轴失败:', err)
  }
}

const init = () => {
  fetchCategoryInfo()
  fetchArticles()
  fetchTimeline()
}

watch(() => route.params.id, () => {
  currentPage.value = 1
  init()
})

onMounted(init)
</script>

<style scoped lang="scss">
.category-view {
  .list-header {
    margin-bottom: 20px;

    .category-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 22px;
      color: #303133;
      margin: 0;

      .el-icon {
        color: #409eff;
      }

      .article-count {
        font-size: 14px;
        color: #909399;
        font-weight: normal;
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
          flex-wrap: wrap;
          gap: 15px;
          font-size: 13px;
          color: #909399;
          margin-bottom: 10px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;

            .el-icon {
              font-size: 14px;
            }

            &.updated {
              color: #e6a23c;
            }
          }
        }

        .article-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
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

  .category-info-card {
    margin-bottom: 20px;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .category-detail {
      text-align: center;
      padding: 20px;

      .detail-name {
        font-size: 24px;
        margin: 0 0 10px;
        color: #303133;
      }

      .detail-desc {
        font-size: 14px;
        color: #909399;
        margin: 0 0 20px;
      }

      .detail-stats {
        display: flex;
        justify-content: center;

        .stat-item {
          text-align: center;

          .stat-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #409eff;
          }

          .stat-label {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .timeline-card {
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .widget-title {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      padding-bottom: 12px;
      border-bottom: 1px solid #f0f0f0;
    }

    .sidebar-timeline {
      .timeline-year {
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        .year-header {
          margin-bottom: 8px;

          .year-text {
            font-size: 13px;
            font-weight: 600;
            color: #606266;
            background: #f5f7fa;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }

        .year-list {
          .timeline-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 0;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              .row-title {
                color: #409eff;
              }
            }

            .row-date {
              font-size: 12px;
              color: #909399;
              white-space: nowrap;
              min-width: 36px;
            }

            .row-title {
              font-size: 13px;
              color: #606266;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              transition: color 0.2s ease;
            }
          }
        }
      }
    }

    .empty-widget {
      text-align: center;
      padding: 20px 0;
      color: #c0c4cc;
      font-size: 13px;
    }
  }
}
</style>
