<template>
  <div v-if="article" class="article-detail">
    <el-card class="article-header-card">
      <div class="article-header">
        <div class="article-category" v-if="article.category">
          <el-tag type="success" size="small">{{ article.category.name }}</el-tag>
        </div>
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="meta-item">
            <el-icon><Calendar /></el-icon>
            发布于 {{ formatDate(article.published_at) }}
          </span>
          <span v-if="article.updated_at && article.updated_at !== article.published_at" class="meta-item updated">
            <el-icon><Refresh /></el-icon>
            更新于 {{ formatDate(article.updated_at) }}
          </span>
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ article.author?.nickname || article.author?.username || '管理员' }}
          </span>
          <span class="meta-item">
            <el-icon><View /></el-icon>
            {{ article.view_count || 0 }} 阅读
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ article.like_count || 0 }} 点赞
          </span>
        </div>
        <div class="article-tags" v-if="article.tags && article.tags.length > 0">
          <el-tag
            v-for="tag in article.tags"
            :key="tag.id"
            size="small"
            class="tag-item"
            effect="plain"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="article-content-card">
      <div class="article-body markdown-body" v-html="renderContent"></div>

      <div class="like-section">
        <button type="button" class="like-btn" :class="{ 'liked': isLiked, 'loading': likeLoading }" :disabled="likeLoading" @click="handleLike">
          <svg v-if="isLiked" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span class="like-text">{{ isLiked ? '取消点赞' : '点赞' }}</span>
          <span class="like-count">{{ likeCount }}</span>
        </button>
      </div>

      <div class="article-footer">
        <div class="article-nav">
          <div class="nav-prev" v-if="prevArticle">
            <span class="nav-label">上一篇</span>
            <router-link :to="'/article/' + prevArticle.id">{{ prevArticle.title }}</router-link>
          </div>
          <div class="nav-next" v-if="nextArticle">
            <span class="nav-label">下一篇</span>
            <router-link :to="'/article/' + nextArticle.id">{{ nextArticle.title }}</router-link>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="comment-section">
      <template #header>
        <div class="comment-header">
          <span class="comment-title">
            <el-icon><ChatRound /></el-icon>
            评论
          </span>
          <span class="comment-count">{{ commentTotal }} 条评论</span>
        </div>
      </template>

      <div class="comment-input" v-if="getToken()">
        <el-input
          v-model="commentForm.content"
          type="textarea"
          :rows="3"
          placeholder="写下你的评论..."
          :maxlength="1000"
          show-word-limit
        />
        <div class="comment-actions">
          <el-button type="primary" @click="submitComment">发表评论</el-button>
        </div>
      </div>
      <div v-else class="login-tip">
        <el-button type="primary" @click="$router.push('/login')">登录后参与评论</el-button>
      </div>

      <div class="comment-list" v-if="comments.length > 0">
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-avatar">
            <el-avatar :size="40" :src="comment.user?.avatar || 'https://loremflickr.com/400/400?lock=4167935627070742'" />
          </div>
          <div class="comment-body">
            <div class="comment-user-info">
              <span class="username" :class="{ 'admin-tag': comment.user?.role === 'admin' }">
                {{ comment.user?.username || '用户' }}
                <el-tag v-if="comment.user?.role === 'admin'" size="small" type="danger" class="admin-badge">作者</el-tag>
              </span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
            <div class="comment-content">
              <span v-if="comment.reply_to_name" class="reply-to">@{{ comment.reply_to_name }} </span>
              {{ comment.content }}
            </div>
            <div class="comment-footer">
              <el-button size="small" text @click="replyToComment(comment)">回复</el-button>
              <el-button v-if="canEditComment(comment)" size="small" text @click="editComment(comment)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button v-if="canDeleteComment(comment)" size="small" text type="danger" @click="deleteComment(comment.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <div v-if="replyingTo === comment.id && getToken()" class="reply-input-wrapper">
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="2"
                :placeholder="`回复 @${comment.user?.username || '用户'}...`"
                :maxlength="500"
                show-word-limit
              />
              <div class="reply-actions">
                <el-button size="small" @click="cancelReply">取消</el-button>
                <el-button size="small" type="primary" @click="submitReply(comment.id)">发送</el-button>
              </div>
            </div>

            <div v-if="editingCommentId === comment.id && getToken()" class="reply-input-wrapper">
              <el-input
                v-model="editContent"
                type="textarea"
                :rows="2"
                placeholder="修改评论内容"
                :maxlength="1000"
                show-word-limit
              />
              <div class="reply-actions">
                <el-button size="small" @click="cancelEdit">取消</el-button>
                <el-button size="small" type="primary" @click="submitEdit(comment.id)">保存</el-button>
              </div>
            </div>

            <div v-if="comment.replies && comment.replies.length > 0" class="replies">
              <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                <div class="reply-avatar">
                  <el-avatar :size="30" :src="reply.user?.avatar || 'https://loremflickr.com/400/400?lock=4167935627070742'" />
                </div>
                <div class="reply-body">
                  <div class="reply-user-info">
                    <span class="username" :class="{ 'admin-tag': reply.user?.role === 'admin' }">
                      {{ reply.user?.username || '用户' }}
                      <el-tag v-if="reply.user?.role === 'admin'" size="small" type="danger" class="admin-badge">作者</el-tag>
                    </span>
                    <span class="comment-time">{{ formatTime(reply.created_at) }}</span>
                  </div>
                  <div class="reply-content">
                    <span v-if="reply.reply_to_name" class="reply-to">@{{ reply.reply_to_name }} </span>
                    {{ reply.content }}
                  </div>
                  <div class="reply-footer">
                    <el-button size="small" text @click="replyToComment(reply)">回复</el-button>
                    <el-button v-if="canEditComment(reply)" size="small" text @click="editComment(reply)">
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button v-if="canDeleteComment(reply)" size="small" text type="danger" @click="deleteComment(reply.id)">
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>

                  <div v-if="replyingTo === reply.id && getToken()" class="reply-input-wrapper">
                    <el-input
                      v-model="replyContent"
                      type="textarea"
                      :rows="2"
                      :placeholder="`回复 @${reply.user?.username || '用户'}...`"
                      :maxlength="500"
                      show-word-limit
                    />
                    <div class="reply-actions">
                      <el-button size="small" @click="cancelReply">取消</el-button>
                      <el-button size="small" type="primary" @click="submitReply(reply.id, comment.id)">发送</el-button>
                    </div>
                  </div>

                  <div v-if="editingCommentId === reply.id && getToken()" class="reply-input-wrapper">
                    <el-input
                      v-model="editContent"
                      type="textarea"
                      :rows="2"
                      placeholder="修改评论内容"
                      :maxlength="1000"
                      show-word-limit
                    />
                    <div class="reply-actions">
                      <el-button size="small" @click="cancelEdit">取消</el-button>
                      <el-button size="small" type="primary" @click="submitEdit(reply.id)">保存</el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-comments">
        <el-icon><ChatRound /></el-icon>
        <p>暂无评论，快来抢沙发吧！</p>
      </div>

      <div class="comment-pagination" v-if="commentTotal > commentPageSize">
        <el-pagination
          v-model:current-page="commentPage"
          :page-size="commentPageSize"
          :total="commentTotal"
          layout="prev, pager, next"
          @current-change="fetchComments"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Refresh, User, View, ChatRound, Delete, Edit } from '@element-plus/icons-vue'
import { marked } from 'marked'
import { ElMessage, ElMessageBox } from 'element-plus'
import api, { likeApi } from '@/api'
import { getToken, getUserRole } from '@/utils/auth'

const route = useRoute()
const article = ref(null)
const prevArticle = ref(null)
const nextArticle = ref(null)
const isLiked = ref(false)
const likeCount = ref(0)
const likeLoading = ref(false)

const renderContent = computed(() => {
  if (!article.value) return ''
  if (article.value.content) {
    return marked.parse(article.value.content)
  }
  return ''
})

const router = useRouter()
const comments = ref([])
const commentTotal = ref(0)
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentForm = reactive({
  content: '',
  parent_id: 0,
  reply_to_id: 0,
  reply_to_name: ''
})
const editingCommentId = ref(null)
const currentUserRole = ref(getUserRole() || '')
const replyingTo = ref(null)
const replyContent = ref('')
const replyParentId = ref(0)
const replyTargetName = ref('')
const editContent = ref('')

const fetchComments = async () => {
  try {
    const res = await api.get(`/articles/${route.params.id}/comments`, {
      params: {
        page: commentPage.value,
        size: commentPageSize.value
      }
    })
    comments.value = res.list || []
    commentTotal.value = res.total || 0
  } catch (err) {
    console.error('获取评论失败:', err)
  }
}

const submitComment = async () => {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!commentForm.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    if (editingCommentId.value) {
      await api.put(`/user/comments/${editingCommentId.value}`, {
        content: commentForm.content
      })
      ElMessage.success('评论修改成功')
      editingCommentId.value = null
    } else {
      await api.post(`/user/articles/${route.params.id}/comments`, {
        content: commentForm.content,
        parent_id: commentForm.parent_id,
        reply_to_id: commentForm.reply_to_id,
        reply_to_name: commentForm.reply_to_name
      })
      ElMessage.success('评论发表成功')
    }
    commentForm.content = ''
    commentForm.parent_id = 0
    commentForm.reply_to_id = 0
    commentForm.reply_to_name = ''
    fetchComments()
    fetchArticle()
  } catch (err) {
    ElMessage.error('操作失败')
  }
}

const replyToComment = (comment) => {
  replyingTo.value = comment.id
  replyParentId.value = comment.parent_id || 0
  replyTargetName.value = comment.user?.username || '用户'
  replyContent.value = ''
}

const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
  replyParentId.value = 0
  replyTargetName.value = ''
}

const submitReply = async (replyToId, parentCommentId) => {
  if (!getToken()) {
    ElMessage.warning('请先登录')
    return
  }

  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  try {
    await api.post(`/user/articles/${route.params.id}/comments`, {
      content: replyContent.value.trim(),
      parent_id: parentCommentId || replyToId,
      reply_to_id: replyToId,
      reply_to_name: replyTargetName.value
    })
    ElMessage.success('回复成功')
    replyingTo.value = null
    replyContent.value = ''
    replyParentId.value = 0
    replyTargetName.value = ''
    fetchComments()
    fetchArticle()
  } catch (err) {
    ElMessage.error('回复失败')
  }
}

const editComment = (comment) => {
  editingCommentId.value = comment.id
  editContent.value = comment.content
}

const cancelEdit = () => {
  editingCommentId.value = null
  editContent.value = ''
}

const submitEdit = async (commentId) => {
  if (!editContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  try {
    await api.put(`/user/comments/${commentId}`, {
      content: editContent.value.trim()
    })
    ElMessage.success('评论修改成功')
    editingCommentId.value = null
    editContent.value = ''
    fetchComments()
    fetchArticle()
  } catch (err) {
    ElMessage.error('修改失败')
  }
}

const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除此评论吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/user/comments/${commentId}`)
    ElMessage.success('评论已删除')
    fetchComments()
    fetchArticle()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const canEditComment = (comment) => {
  const username = localStorage.getItem('username')
  return comment.user?.username === username
}

const canDeleteComment = (comment) => {
  const username = localStorage.getItem('username')
  return comment.user?.username === username || currentUserRole.value === 'admin'
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return date.toLocaleDateString()
}

const fetchArticle = async () => {
  try {
    article.value = await api.get(`/articles/${route.params.id}`)
    // 调用访问量增加接口
    api.put(`/articles/${route.params.id}/view`)
  } catch (err) {
    console.error('获取文章详情失败:', err)
  }
}

const fetchPrevNext = async () => {
  try {
    prevArticle.value = null
    nextArticle.value = null
    const data = await api.get('/articles', {
      params: { page: 1, size: 100 }
    })
    const list = data.list || []
    const index = list.findIndex(a => a.id === parseInt(route.params.id))
    if (index > 0) {
      nextArticle.value = list[index - 1]
    }
    if (index < list.length - 1 && index >= 0) {
      prevArticle.value = list[index + 1]
    }
  } catch (err) {
    console.error('获取上下篇文章失败:', err)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '未知日期'
  return new Date(dateStr).toLocaleDateString()
}

const fetchLikeCount = async () => {
  try {
    const articleId = route.params.id
    const res = await likeApi.getArticleLikeCount(articleId)
    likeCount.value = res.like_count ?? article.value?.like_count ?? 0
  } catch (err) {
    console.error('获取点赞数失败:', err)
    likeCount.value = article.value?.like_count || 0
  }
}

const fetchUserLikeStatus = async () => {
  if (!getToken()) {
    isLiked.value = false
    return
  }
  try {
    const articleId = route.params.id
    const res = await likeApi.getUserLikeStatus(articleId)
    isLiked.value = res.is_liked || false
  } catch (err) {
    console.error('获取用户点赞状态失败:', err)
  }
}

const handleLike = async () => {
  if (!getToken()) {
    ElMessage.warning('未登录不能点赞')
    return
  }

  if (likeLoading.value) return
  likeLoading.value = true

  try {
    const articleId = route.params.id
    if (isLiked.value) {
      await likeApi.unlikeArticle(articleId)
      ElMessage.success('已取消点赞')
    } else {
      await likeApi.likeArticle(articleId)
      ElMessage.success('点赞成功')
    }
    await fetchLikeCount()
    await fetchUserLikeStatus()
  } catch (err) {
    console.error('点赞操作失败:', err)
    await fetchLikeCount()
    await fetchUserLikeStatus()
  } finally {
    likeLoading.value = false
  }
}

onMounted(() => {
  fetchArticle()
  fetchPrevNext()
  fetchComments()
  fetchLikeCount()
  fetchUserLikeStatus()
})

watch(
  () => route.params.id,
  () => {
    fetchArticle()
    fetchPrevNext()
    fetchComments()
    fetchLikeCount()
    fetchUserLikeStatus()
  }
)
</script>

<style scoped lang="scss">
.article-detail {
  .article-header-card {
    margin-bottom: 20px;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .article-header {
      text-align: left;
      padding: 30px;

      .article-category {
        margin-bottom: 15px;
      }

      .article-title {
        font-size: 32px;
        margin: 0 0 20px;
        color: #303133;
        line-height: 1.4;
        font-weight: 700;
      }

      .article-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        color: #909399;
        font-size: 14px;
        margin-bottom: 20px;

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;


          &.updated {
            color: #e6a23c;
          }
        }
      }

      .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag-item {
          cursor: pointer;
          &:hover {
            opacity: 0.8;
          }
        }
      }
    }
  }

  .article-content-card {
    margin-bottom: 20px;
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border-radius: 8px;

    .article-body {
      line-height: 1.8;
      font-size: 16px;
      color: #333;
      min-height: 300px;
      padding: 30px;
      background: #fff;

      :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 20px 0;
      }

      :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
        margin-top: 30px;
        margin-bottom: 15px;
        color: #303133;
        font-weight: 600;
      }

      :deep(pre) {
        background: #f5f7fa;
        padding: 15px;
        border-radius: 8px;
        overflow-x: auto;
      }

      :deep(code) {
        font-family: 'Fira Code', monospace;
        font-size: 14px;
      }

      :deep(blockquote) {
        border-left: 4px solid #409eff;
        padding: 10px 15px;
        margin: 20px 0;
        background: #f5f7fa;
        border-radius: 0 8px 8px 0;
      }

      :deep(table) {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;

        th, td {
          border: 1px solid #ebeef5;
          padding: 10px 15px;
        }

        th {
          background: #f5f7fa;
        }
      }
    }

    .like-section {
      padding: 30px;
      display: flex;
      justify-content: center;
      border-top: 1px solid #f0f0f0;

      .like-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 32px;
        border: 2px solid #e0e0e0;
        border-radius: 50px;
        background: #fff;
        color: #666;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;

        &:hover {
          border-color: #f56c6c;
          color: #f56c6c;
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
        }

        &.liked {
          border-color: #f56c6c;
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          color: #f56c6c;

          svg {
            animation: likeAnimation 0.3s ease;
          }
        }

        &.loading {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &:disabled {
          cursor: not-allowed;
        }

        .like-text {
          font-size: 16px;
        }

        .like-count {
          font-size: 18px;
          font-weight: 700;
          min-width: 20px;
          text-align: center;
        }
      }
    }

    @keyframes likeAnimation {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .article-footer {
      padding: 25px 30px;
      border-top: 1px solid #f0f0f0;
      background: #fafafa;

      .article-nav {
        display: flex;
        justify-content: space-between;
        gap: 20px;

        .nav-prev, .nav-next {
          flex: 1;
          .nav-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 5px;
          }
          a {
            color: #409eff;
            text-decoration: none;
            font-size: 14px;
            &:hover {
              color: #66b1ff;
            }
          }
        }

        .nav-next {
          text-align: right;
        }
      }
    }
  }

  .comment-section {
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    border-radius: 8px;

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .comment-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 16px;
        font-weight: 600;
      }

      .comment-count {
        font-size: 14px;
        color: #909399;
      }
    }

    .comment-input {
      margin-bottom: 24px;

      .comment-actions {
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
    }

    .login-tip {
      text-align: center;
      padding: 20px 0;
    }

    .no-comments {
      text-align: center;
      color: #c0c4cc;
      padding: 30px 0;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;


      p {
        margin: 0;
      }
    }

    .comment-list {
      .comment-item {
        display: flex;
        gap: 12px;
        padding: 16px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .comment-avatar {
          flex-shrink: 0;
        }

        .comment-body {
          flex: 1;

          .comment-user-info {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;

            .username {
              font-weight: 600;
              color: #303133;

              &.admin-tag {
                color: #f56c6c;
              }
            }

            .admin-badge {
              margin-left: 4px;
            }

            .comment-time {
              font-size: 12px;
              color: #909399;
            }
          }

          .comment-content {
            font-size: 14px;
            color: #333;
            line-height: 1.6;
            margin-bottom: 8px;

            .reply-to {
              color: #409eff;
              font-weight: 500;
            }
          }

          .comment-footer {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .reply-input-wrapper {
            margin-top: 12px;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;

            .reply-actions {
              margin-top: 8px;
              display: flex;
              justify-content: flex-end;
              gap: 8px;
            }
          }

          .replies {
            margin-top: 12px;
            padding-left: 12px;
            border-left: 2px solid #e4e7ed;

            .reply-item {
              display: flex;
              gap: 8px;
              padding: 10px 0;

              &:not(:last-child) {
                border-bottom: 1px dashed #f0f0f0;
              }

              .reply-avatar {
                flex-shrink: 0;
              }

              .reply-body {
                flex: 1;

                .reply-user-info {
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  margin-bottom: 4px;

                  .username {
                    font-size: 13px;
                    font-weight: 500;
                    color: #303133;

                    &.admin-tag {
                      color: #f56c6c;
                    }
                  }

                  .admin-badge {
                    margin-left: 4px;
                  }

                  .comment-time {
                    font-size: 11px;
                    color: #909399;
                  }
                }

                .reply-content {
                  font-size: 13px;
                  color: #333;
                  line-height: 1.5;
                  margin-bottom: 4px;

                  .reply-to {
                    color: #409eff;
                    font-weight: 500;
                  }
                }

                .reply-footer {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                }
              }
            }
          }
        }
      }
    }

    .comment-pagination {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
