<template>
  <div class="admin-page-container article-edit-view">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="router.back()" icon="ArrowLeft" circle />
        <h2 class="page-title">{{ articleId ? '编辑文章' : '发布新文章' }}</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存文章</el-button>
        <el-button @click="router.back()">取消</el-button>
      </div>
    </div>

    <el-card class="form-card" shadow="never">
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入文章标题" clearable />
        </el-form-item>

        <el-form-item label="封面图片">
          <div class="cover-upload">
            <el-upload
              class="cover-uploader"
              :http-request="handleCoverUpload"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
            >
              <img v-if="form.cover_image" :src="form.cover_image" class="cover-image" />
              <div v-else class="cover-placeholder" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <el-icon class="cover-icon"><Plus /></el-icon>
                <span>上传封面</span>
              </div>
            </el-upload>
            <div class="cover-tip">建议尺寸 800x450 或相同比例的图片</div>
          </div>
        </el-form-item>
        
        <el-form-item label="摘要" prop="summary">
          <el-input v-model="form.summary" type="textarea" rows="2" placeholder="请输入文章摘要..." clearable />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :md="12">
            <el-form-item label="文章分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%" clearable>
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="12">
            <el-form-item label="发布状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="立即发布" :value="1" />
                <el-option label="保存为草稿" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入新标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="文章内容" prop="content" style="margin-top: 20px;">
          <div class="wang-editor-wrapper">
            <Toolbar
              class="wang-toolbar"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              class="wang-editor"
              v-model="form.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleEditorCreated"
            />
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const articleId = route.params.id
const formRef = ref(null)
const submitting = ref(false)
const categories = ref([])
const tags = ref([])
const editorRef = shallowRef(null)
let fullscreenCheckTimer = null
const toolbarConfig = {
  // 完全移除视频相关功能
  excludeKeys: ['group-video', 'insertVideo', 'uploadVideo', 'insertImage']
}
const editorConfig = {
  placeholder: '开始创作你的故事...',
  MENU_CONF: {
    uploadImage: {
          maxFileSize: 5 * 1024 * 1024,
          allowedFileTypes: ['image/*'],
          async customUpload(file, insertFn) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'article')
            try {
              const res = await api.post('/user/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              })
              const url = res.url
              insertFn(url, file.name, url)
            } catch (error) {
              ElMessage.error('图片上传失败')
            }
          }
        }
  }
}

const setFullscreenState = (isFullscreen) => {
  const siteHeader = document.querySelector('.site-header')
  const mainContent = document.querySelector('.main-content')

  document.documentElement.classList.toggle('editor-fullscreen-active', isFullscreen)
  document.body.classList.toggle('editor-fullscreen-active', isFullscreen)

  if (siteHeader instanceof HTMLElement) {
    if (isFullscreen) {
      if (!siteHeader.dataset.prevStyle) {
        siteHeader.dataset.prevStyle = siteHeader.getAttribute('style') || ''
      }
      siteHeader.style.display = 'none'
      siteHeader.style.visibility = 'hidden'
      siteHeader.style.pointerEvents = 'none'
      siteHeader.style.zIndex = '-1'
    } else {
      const prevStyle = siteHeader.dataset.prevStyle || ''
      if (prevStyle) {
        siteHeader.setAttribute('style', prevStyle)
      } else {
        siteHeader.removeAttribute('style')
      }
      delete siteHeader.dataset.prevStyle
    }
  }

  if (mainContent instanceof HTMLElement) {
    if (isFullscreen) {
      if (!mainContent.dataset.prevStyle) {
        mainContent.dataset.prevStyle = mainContent.getAttribute('style') || ''
      }
      mainContent.style.paddingTop = '0'
    } else {
      const prevStyle = mainContent.dataset.prevStyle || ''
      if (prevStyle) {
        mainContent.setAttribute('style', prevStyle)
      } else {
        mainContent.removeAttribute('style')
      }
      delete mainContent.dataset.prevStyle
    }
  }
}

const handleEditorCreated = (editor) => {
  editorRef.value = editor
  
  // 尝试监听多种可能的全屏事件
  const fullscreenEvents = ['fullScreenChanged', 'fullscreenChanged', 'onFullScreenChange']
  
  fullscreenEvents.forEach(eventName => {
    if (typeof editor.on === 'function') {
      try {
        editor.on(eventName, (isFullScreen) => {
          console.log(`Full screen event: ${eventName}`, isFullScreen)
          setFullscreenState(!!isFullScreen)
        })
      } catch (e) {
        console.log(`Event ${eventName} not supported`)
      }
    }
  })
  
  // 添加一个按钮点击监听器作为备用方案
  const checkFullscreen = () => {
    const fullscreenEl = document.querySelector('.w-e-full-screen-container')
    setFullscreenState(!!fullscreenEl)
  }
  
  // 定时检查全屏状态
  fullscreenCheckTimer = setInterval(checkFullscreen, 200)
}

const form = reactive({
  title: '',
  summary: '',
  content: '',
  cover_image: '',
  category_id: null,
  status: 1,
  tags: []
})

const rules = {
  title: [{ required: true, message: '请输入文章标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入文章内容', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择文章分类', trigger: 'change' }]
}

const fetchCategories = async () => {
  try {
    const data = await api.get('/categories')
    categories.value = data.list || []
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

const fetchTags = async () => {
  try {
    const data = await api.get('/tags')
    tags.value = data.list || []
  } catch (err) {
    console.error('获取标签列表失败:', err)
  }
}

const fetchArticle = async () => {
  if (!articleId) {
    form.content = ''
    return
  }
  try {
    const data = await api.get(`/articles/${articleId}`)
    form.title = data.title
    form.summary = data.summary || ''
    form.content = data.content || ''
    form.cover_image = data.cover_image || ''
    form.category_id = data.category?.id || null
    form.status = data.status || 1
    form.tags = data.tags ? data.tags.map(t => t.name) : []
  } catch (err) {
    console.error('Failed to fetch article:', err)
    ElMessage.error('加载文章数据失败')
    router.back()
  }
}

const beforeCoverUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/jpg'
  const isPNG = file.type === 'image/png'
  const isWebP = file.type === 'image/webp'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isJPG && !isPNG && !isWebP) {
    ElMessage.error('封面只能是 JPG、PNG 或 WebP 格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('封面大小不能超过 5MB!')
    return false
  }
  return true
}

const handleCoverUpload = async (options) => {
  const { file } = options
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'cover')
  try {
    const res = await api.post('/user/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.cover_image = res.url
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const content = (form.content || '').trim()
  if (!content || content.trim() === '') {
    ElMessage.warning('请输入文章内容')
    return
  }
  form.content = content

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const payload = {
          ...form,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          tags: form.tags
        }
        if (articleId) {
          await api.put(`/admin/articles/${articleId}`, payload)
          ElMessage.success('文章更新成功')
        } else {
          await api.post('/admin/articles', payload)
          ElMessage.success('文章发布成功')
        }
        router.push('/admin/articles')
      } catch (err) {
        console.error('保存文章失败:', err)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
  fetchTags()
  fetchArticle()
})

onBeforeUnmount(() => {
  if (fullscreenCheckTimer) {
    clearInterval(fullscreenCheckTimer)
    fullscreenCheckTimer = null
  }
  setFullscreenState(false)
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style scoped lang="scss">
.admin-page-container {
  padding: 20px;
  width: 100%;
  box-sizing: border-box;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .form-card {
    border-radius: 8px;
    width: 100%;
    max-width: 100%;
    margin: 0;
    
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .cover-upload {
    .cover-uploader {
      :deep(.el-upload) {
        width: 320px;
        height: 180px;
        border: 1px dashed #d9d9d9;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        &:hover {
          border-color: #409eff;
        }
      }

      :deep(.el-upload .el-upload__input) {
        display: none;
      }

      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .cover-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        background-color: #fafafa;
        width: 100%;
        height: 100%;

        .cover-icon {
          font-size: 40px;
          margin-bottom: 8px;
        }

        span {
          font-size: 14px;
        }
      }
    }

    .cover-tip {
      margin-top: 10px;
      font-size: 12px;
      color: #909399;
    }
  }
  
  .wang-editor-wrapper {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    overflow: hidden;
    width: 100%;

    .wang-toolbar {
      border-bottom: 1px solid #dcdfe6;
    }

    .wang-editor {
      min-height: 420px;
      max-height: 80vh;
      overflow-y: auto;
      resize: vertical;
    }

    :deep(.w-e-text-container) {
      min-height: 420px !important;
    }

    :deep(.w-e-bar) {
      border-bottom: 1px solid #dcdfe6;
      background-color: #f8f9fa;
    }

    // 视频样式 - 移除灰色方框，只显示视频画面
    :deep(.w-e-text-container video) {
      max-width: 100%;
      display: block;
      margin: 0 auto;
      background: none;
      border: none;
      outline: none;
    }

    // 视频容器 - 响应式自适应
    :deep(.w-e-text-container .w-e-textarea-video-container) {
      width: 100%;
      margin: 16px auto;
      position: relative;
      padding-bottom: 56.25%; /* 16:9 比例 */
      height: 0;
      overflow: hidden;
      background: #000;
      border-radius: 4px;
      
      video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    // 调整选中状态的边框，使其与视频画面一致
    :deep(.w-e-selected-video-container) {
      outline: none !important;
      border: none !important;
      background: none !important;
      box-shadow: none !important;
    }
  }

}

:global(.w-e-full-screen-container) {
  position: fixed !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 999999 !important;
  background: #fff !important;
  overflow: hidden !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

:global(.w-e-full-screen-container .w-e-bar) {
  position: relative !important;
  z-index: 1000000 !important;
  background: #f8f9fa !important;
}

:global(.w-e-full-screen-container .w-e-text-container) {
  height: calc(100vh - 41px) !important;
  background: #fff !important;
}

:global(html.editor-fullscreen-active),
:global(body.editor-fullscreen-active) {
  overflow: hidden !important;
}

:global(html.editor-fullscreen-active .site-header),
:global(body.editor-fullscreen-active .site-header) {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  z-index: -1 !important;
}

:global(html.editor-fullscreen-active .main-content),
:global(body.editor-fullscreen-active .main-content) {
  padding-top: 0 !important;
}
</style>
