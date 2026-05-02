<template>
  <div class="tags-view">
    <div class="page-header">
      <h2 class="page-title">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        标签
      </h2>
    </div>

    <div class="tag-grid" v-if="tags.length > 0">
      <div
        class="tag-card"
        v-for="tag in tags"
        :key="tag.id"
        @click="router.push('/tag/' + tag.id)"
      >
        <div class="tag-info">
          <h3 class="tag-name">{{ tag.name }}</h3>
          <p class="tag-count">{{ tag.post_count || 0 }} 篇文章</p>
        </div>
        <div class="tag-decoration" :style="{ background: getTagColor(tag.id) }"></div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无标签" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()
const tags = ref([])

const tagColors = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const getTagColor = (id) => tagColors[id % tagColors.length]

const fetchTags = async () => {
  try {
    const data = await api.get('/tags', { params: { page: 1, size: 100 } })
    tags.value = data.list || []
  } catch (err) {
    console.error('获取标签列表失败:', err)
  }
}

onMounted(fetchTags)
</script>

<style scoped lang="scss">
.tags-view {
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

  .tag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .tag-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .tag-info {
      position: relative;
      z-index: 1;

      .tag-name {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 6px;
      }

      .tag-count {
        font-size: 13px;
        color: #9ca3af;
        margin: 0;
      }
    }

    .tag-decoration {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      opacity: 0.1;
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
