<template>
  <div class="comment-section">
    <div v-if="!comments.length" class="no-comments">暂无评论</div>
    <div v-else class="comment-list">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-content">
          <span class="username">{{ comment.user?.username || '用户' }}</span>
          <span class="content">{{ comment.content }}</span>
          <span class="time">{{ formatTime(comment.created_at) }}</span>
        </div>
        <div class="comment-actions">
          <el-button v-if="canEditComment(comment)" link type="primary" size="small" @click="editComment(comment)">编辑</el-button>
          <el-popconfirm v-if="canDeleteComment(comment)" title="确定要删除此评论吗？" @confirm="deleteComment(comment.id)">
            <template #reference>
              <el-button link type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'

const props = defineProps({
  articleId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])

const comments = ref([])

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 8640000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return date.toLocaleDateString()
}

const canEditComment = (comment) => {
  const userId = localStorage.getItem('user_id')
  return comment.user_id === parseInt(userId)
}

const canDeleteComment = (comment) => {
  const userId = localStorage.getItem('user_id')
  const role = localStorage.getItem('role')
  return comment.user_id === parseInt(userId) || role === 'admin'
}

const fetchComments = async () => {
  try {
    const res = await api.get(`/articles/${props.articleId}/comments`)
    comments.value = res.data || []
  } catch (err) {
    console.error('获取评论失败:', err)
  }
}

const editComment = (comment) => {
  emit('edit', comment)
}

const deleteComment = async (commentId) => {
  try {
    await api.delete(`/user/comments/${commentId}`)
    emit('delete', commentId)
    ElMessage.success('删除成功')
    fetchComments()
  } catch (err) {
    console.error('删除评论失败:', err)
  }
}

onMounted(fetchComments)
</script>

<style scoped lang="scss">
.comment-section {
  margin-top: 2rem;
}

.no-comments {
  text-align: center;
  padding: 2rem 0;
  color: #999;
}

.comment-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
}

.comment-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.username {
  font-weight: bold;
  color: #333;
}

.content {
  color: #666;
}

.time {
  font-size: 0.8rem;
  color: #999;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
</style>
