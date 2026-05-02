<template>
  <div class="archive-view">
    <div class="page-header">
      <h2 class="page-title">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        归档
      </h2>
    </div>

    <div class="archive-timeline" v-if="archiveYears.length > 0">
      <div class="archive-year" v-for="group in archiveYears" :key="group.year">
        <div class="year-header">
          <span class="year-text">{{ group.year }}年</span>
          <span class="year-count">{{ group.articles.length }} 篇</span>
        </div>
        <div class="article-list">
          <div
            class="article-item"
            v-for="a in group.articles"
            :key="a.id"
            @click="router.push('/article/' + a.id)"
          >
            <span class="article-date">{{ a.mmdd }}</span>
            <span class="article-title">{{ a.title }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无文章" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const allArticles = ref([])

const archiveYears = computed(() => {
  const list = Array.isArray(allArticles.value) ? allArticles.value : []
  const groups = new Map()

  for (const a of list) {
    const raw = a?.published_at || a?.created_at
    const d = raw ? new Date(raw) : null
    if (!d || Number.isNaN(d.getTime())) continue

    const year = d.getFullYear()
    const mm = d.getMonth() + 1
    const dd = d.getDate()
    const mmdd = `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`

    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push({ id: a.id, title: a.title, mmdd, ts: d.getTime() })
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, articles]) => ({
      year,
      articles: articles.sort((a, b) => b.ts - a.ts),
    }))
})

const fetchAllArticles = async () => {
  try {
    const data = await api.get('/articles', { params: { page: 1, size: 100 } })
    allArticles.value = data.list || []
  } catch (err) {
    console.error('获取文章列表失败:', err)
  }
}

onMounted(fetchAllArticles)
</script>

<style scoped lang="scss">
.archive-view {
  .page-header {
    margin-bottom: 30px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      color: #1f2937;
      margin: 0;

      svg {
        color: #3b82f6;
      }
    }
  }

  .archive-timeline {
    .archive-year {
      margin-bottom: 30px;

      .year-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e5e7eb;

        .year-text {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .year-count {
          font-size: 13px;
          color: #9ca3af;
        }
      }

      .article-list {
        padding-left: 20px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e5e7eb;
        }

        .article-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 0;
          cursor: pointer;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            left: -16px;
            top: 50%;
            transform: translateY(-50%);
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #d1d5db;
            border: 2px solid #fff;
          }

          &:first-child::before {
            background: #3b82f6;
          }

          &:hover {
            .article-title {
              color: #3b82f6;
            }
          }

          .article-date {
            width: 48px;
            font-size: 13px;
            color: #6b7280;
            flex-shrink: 0;
          }

          .article-title {
            font-size: 14px;
            color: #4b5563;
            transition: color 0.2s;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 80px 0;
    text-align: center;
    background: #fff;
    border-radius: 12px;
  }
}
</style>
