<template>
  <div class="categories-view">
    <div class="page-header">
      <h2 class="page-title"><el-icon><Folder /></el-icon> 分类</h2>
    </div>

    <div class="category-grid">
      <el-card v-for="cat in categories" :key="cat.id" class="category-card" shadow="hover" @click="goToCategory(cat.id)">
        <div class="category-content">
          <div class="category-icon">
            <el-icon><Folder /></el-icon>
          </div>
          <div class="category-info">
            <h3 class="category-name">{{ cat.name }}</h3>
            <p class="category-desc">{{ cat.description || '暂无描述' }}</p>
            <div class="category-stats">
              <span class="stat-item">
                <el-icon><Document /></el-icon>
                {{ cat.post_count || 0 }} 篇文章
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="categories.length === 0" class="empty-state">
      <el-empty description="暂无分类" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Folder } from '@element-plus/icons-vue'
import api from '@/api'

const router = useRouter()
const categories = ref([])

const goToCategory = (id) => {
  router.push(`/category/${id}`)
}

const fetchCategories = async () => {
  try {
    const data = await api.get('/categories', { params: { page: 1, size: 100 } })
    categories.value = data.list || []
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

onMounted(fetchCategories)
</script>

<style scoped lang="scss">
.categories-view {
  .page-header {
    margin-bottom: 25px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      color: #303133;
      margin: 0;

    }
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .category-card {
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px 0 rgba(0, 0, 0, 0.1);
      border-color: #409eff;
    }

    .category-content {
      display: flex;
      gap: 15px;
      padding: 10px;

      .category-icon {
        width: 50px;
        height: 50px;
        border-radius: 10px;
        background: linear-gradient(135deg, #409eff, #66b1ff);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 24px;
          color: #fff;
        }
      }

      .category-info {
        flex: 1;
        min-width: 0;

        .category-name {
          margin: 0 0 5px;
          font-size: 16px;
          color: #303133;
        }

        .category-desc {
          margin: 0 0 8px;
          font-size: 13px;
          color: #909399;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .category-stats {
          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #c0c4cc;

            .el-icon {
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  .empty-state {
    padding: 50px 0;
  }
}
</style>
