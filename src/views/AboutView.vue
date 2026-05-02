<template>
  <div class="about-view">
    <el-card class="about-card">
      <div class="about-header">
        <el-avatar :size="100" :src="aboutData.avatar || defaultAvatar" class="about-avatar" />
        <h1 class="about-title">{{ aboutData.name || '我的博客' }}</h1>
        <p class="about-subtitle">{{ aboutData.bio || '一个分享技术与生活的博客' }}</p>
      </div>

      <el-divider />

      <div class="about-content" v-loading="loading">
        <div v-if="!isEditing" class="content-display">
          <div v-html="renderedContent"></div>
          <el-button v-if="isAdmin" type="primary" @click="startEditing" class="edit-btn">
            <el-icon><Edit /></el-icon> 编辑内容
          </el-button>
        </div>

        <div v-else class="content-editor">
          <MdEditor
            v-model="editingContent"
            :height="400"
            placeholder="请输入关于页内容（支持 Markdown）"
            :toolbars="mdToolbars"
          />
          <div class="editor-actions">
            <el-button type="primary" @click="saveContent" :loading="saving">保存</el-button>
            <el-button @click="cancelEditing">取消</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import api from '@/api'
import defaultAvatar from '@/picture/my.png'
import { getUserRole } from '@/utils/auth'

const isAdmin = computed(() => getUserRole() === 'admin')
const isEditing = ref(false)
const saving = ref(false)
const loading = ref(false)
const editingContent = ref('')

const aboutData = reactive({
  name: '',
  avatar: '',
  bio: '',
  content: ''
})

const mdToolbars = [
  'bold', 'underline', 'italic', '-',
  'title', 'strikeThrough', 'sub', 'sup', 'quote',
  'unorderedList', 'orderedList', 'task', '-',
  'codeRow', 'code', 'link', 'image', 'table', '-',
  'revoke', 'next', '=', 'prettier',
  'pageFullscreen', 'fullscreen', 'preview'
]

const renderedContent = computed(() => {
  if (!aboutData.content) return '<p style="color: #909399; text-align: center;">暂无内容</p>'
  return marked.parse(aboutData.content)
})

const fetchAboutData = async () => {
  loading.value = true
  try {
    const data = await api.get('/about')
    if (data) {
      aboutData.name = data.name || ''
      aboutData.avatar = data.avatar || ''
      aboutData.bio = data.bio || ''
      aboutData.content = data.content || ''
    }
  } catch (error) {
    console.error('获取关于页数据失败:', error)
  } finally {
    loading.value = false
  }
}

const startEditing = () => {
  editingContent.value = aboutData.content
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  editingContent.value = ''
}

const saveContent = async () => {
  if (!editingContent.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }

  saving.value = true
  try {
    await api.put('/admin/about', {
      content: editingContent.value
    })
    aboutData.content = editingContent.value
    isEditing.value = false
    ElMessage.success('保存成功！所有用户现在都能看到更新后的内容')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.response?.data?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchAboutData()
})
</script>

<style scoped lang="scss">
.about-view {
  .about-card {
    border: none;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .about-header {
      text-align: center;
      padding: 30px 0;

      .about-avatar {
        border: 4px solid #fff;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
      }

      .about-title {
        margin: 15px 0 10px;
        font-size: 28px;
        color: #303133;
      }

      .about-subtitle {
        margin: 0;
        font-size: 16px;
        color: #909399;
      }
    }

    .about-content {
      padding: 20px 0;

      .content-display {
        position: relative;
        min-height: 200px;
        padding: 20px;
        background-color: #fafafa;
        border-radius: 8px;

        :deep(h2), :deep(h3) {
          margin-top: 20px;
          color: #303133;
        }

        :deep(p), :deep(ul), :deep(ol) {
          line-height: 1.8;
          color: #606266;
          margin-bottom: 16px;
        }

        :deep(ul), :deep(ol) {
          padding-left: 24px;
        }

        :deep(code) {
          background-color: #f5f7fa;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
        }

        :deep(pre) {
          background-color: #282c34;
          color: #abb2bf;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;

          code {
            background-color: transparent;
            color: inherit;
          }
        }

        .edit-btn {
          position: absolute;
          top: 20px;
          right: 20px;
        }
      }

      .content-editor {
        padding: 10px;
        background-color: #fff;
        border-radius: 8px;
        border: 1px solid #e4e7ed;

        .editor-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #ebeef5;
        }
      }
    }
  }
}
</style>
