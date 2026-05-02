<template>
  <div class="layout-container">
    <el-container>
      <el-header class="site-header">
        <div class="header-content container">
          <div class="brand">
            <router-link to="/" class="brand-link">MyBlog</router-link>
          </div>
          <el-menu mode="horizontal" router :default-active="activePath" class="nav-menu" :ellipsis="false">
            <el-menu-item index="/">首页</el-menu-item>
            <el-menu-item index="/archive">归档</el-menu-item>
            <el-menu-item v-for="cat in categories" :key="cat.id" :index="'/category/' + cat.id">
              {{ cat.name }}
            </el-menu-item>
            <el-menu-item index="/tags">标签</el-menu-item>
            <el-menu-item index="/about">关于</el-menu-item>
            <el-sub-menu v-if="isAdmin" index="admin">
              <template #title>后台管理</template>
              <el-menu-item index="/admin/articles">文章管理</el-menu-item>
              <el-menu-item index="/admin/categories">分类管理</el-menu-item>
              <el-menu-item index="/admin/tags">标签管理</el-menu-item>
              <el-menu-item index="/admin/users">用户管理</el-menu-item>
              <el-menu-item index="/admin/comments">评论管理</el-menu-item>
            </el-sub-menu>
          </el-menu>
          <div class="header-right">
            <div class="search-box">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input v-model="searchQuery" type="text" placeholder="搜索文章..." class="search-input" @keyup.enter="onSearch" />
            </div>

            <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
              <svg v-if="!isDark" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            </button>

            <el-button v-if="!isLoggedIn" type="primary" round size="small" @click="router.push('/login')">登录</el-button>
            <el-dropdown v-else>
              <span class="user-info">
                <el-avatar :size="32" :src="isAdminUser ? adminAvatarUrl : userAvatar" class="header-avatar" />
                <span class="username">{{ username }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="router.push('/profile')">个人中心</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="main-content">
        <div class="container">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="24" :md="isAdminPage ? 24 : 17">
              <router-view />
            </el-col>
            <el-col v-if="!isAdminPage" :xs="24" :sm="24" :md="7">
              <div class="sidebar">
                <el-card class="sidebar-widget profile-widget" :body-style="{ padding: '24px 20px' }">
                  <div class="author-info" @click="router.push('/about')" style="cursor:pointer;">
                    <el-avatar :size="80" :src="authorInfo.avatar || DEFAULT_AVATAR" class="author-avatar" />
                    <h3 class="author-name">{{ authorInfo.name || 'user' }}</h3>
                    <p class="author-bio">{{ authorInfo.bio || '一个分享技术与生活的博客' }}</p>

                    <div class="author-stats">
                      <div class="stat-item">
                        <span class="stat-number">6</span>
                        <span class="stat-label">文章</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-number">4</span>
                        <span class="stat-label">分类</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-number">6</span>
                        <span class="stat-label">标签</span>
                      </div>
                    </div>
                  </div>
                  <div class="profile-decoration"></div>
                </el-card>

                <el-card class="sidebar-widget hot-widget" :body-style="{ padding: '0' }">
                  <h4 class="widget-title"><span class="widget-icon">🔥</span>热门推荐</h4>
                  <div v-if="hotArticles.length > 0" class="hot-carousel" @mouseenter="pauseCarousel" @mouseleave="startCarousel">
                    <div class="hot-carousel-inner">
                      <transition name="hot-fade" mode="out-in">
                        <router-link 
                          :key="currentSlide" 
                          :to="'/article/' + hotArticles[currentSlide].id" 
                          class="hot-item"
                        >
                          <div class="hot-item-image">
                            <img :src="hotArticles[currentSlide].cover_image || '/uploads/covers/default.png'" :alt="hotArticles[currentSlide].title" />
                            <div class="hot-item-overlay"></div>
                          </div>
                          <div class="hot-item-content">
                            <h5 class="hot-item-title">{{ hotArticles[currentSlide].title }}</h5>
                            <div class="hot-item-meta">
                              <span class="hot-item-category">{{ hotArticles[currentSlide].category?.name || '未分类' }}</span>
                              <span class="hot-item-date">{{ formatDate(hotArticles[currentSlide].created_at) }}</span>
                            </div>
                          </div>
                        </router-link>
                      </transition>
                    </div>
                    
                    <!-- 左右翻页箭头 + 底部指示器 -->
                    <div class="hot-controls">
                      <div class="hot-arrows">
                        <button class="hot-arrow-btn prev" @click.stop="prevSlide">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"></polyline>
                          </svg>
                        </button>
                        <button class="hot-arrow-btn next" @click.stop="nextSlide">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      </div>
                      <div class="hot-indicators">
                        <span 
                          v-for="(article, index) in hotArticles" 
                          :key="article.id"
                          class="hot-dot"
                          :class="{ active: currentSlide === index }"
                          @click="goToSlide(index)"
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-widget">暂无热门文章</div>
                </el-card>

                <el-card class="sidebar-widget category-widget" :body-style="{ padding: '20px' }">
                  <h4 class="widget-title"><span class="widget-icon"></span>分类</h4>
                  <ul class="category-list" v-if="categories.length > 0">
                    <li v-for="cat in categories" :key="cat.id">
                      <router-link :to="'/category/' + cat.id">
                        <span class="cat-icon" :style="{ background: getCategoryColor(cat.id) }">{{ cat.name.charAt(0).toUpperCase() }}</span>
                        <span class="cat-name">{{ cat.name }}</span>
                        <span class="cat-count">{{ cat.post_count || 0 }}</span>
                      </router-link>
                    </li>
                  </ul>
                  <div v-else class="empty-widget">暂无分类</div>
                  <div v-if="catTotal > catPageSize" class="sidebar-pagination">
                    <el-pagination
                      v-model:current-page="catCurrentPage"
                      v-model:page-size="catPageSize"
                      :total="catTotal"
                      :page-sizes="[10, 20, 50]"
                      layout="total, sizes, prev, pager, next"
                      @current-change="handleCatPageChange"
                      @size-change="handleCatSizeChange"
                      small
                    />
                  </div>
                </el-card>

                <el-card class="sidebar-widget tag-widget" :body-style="{ padding: '20px' }">
                  <h4 class="widget-title"><span class="widget-icon"></span>标签云</h4>
                  <div class="tag-cloud-wrapper" v-if="tags.length > 0">
                    <div class="tag-cloud">
                      <span
                        v-for="tag in tags"
                        :key="tag.id"
                        class="tag-item"
                        :style="{ backgroundColor: getTagColor(tag.id), color: getTagTextColor(tag.id) }"
                        @click="router.push('/tag/' + tag.id)"
                      >
                        {{ tag.name }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="empty-widget">暂无标签</div>
                </el-card>

                <el-card class="sidebar-widget timeline-widget" :body-style="{ padding: '20px' }">
                  <h4 class="widget-title">时间轴</h4>
                  <div class="sidebar-timeline" v-if="timelineYears.length > 0">
                    <div class="timeline-year" v-for="group in timelineYears" :key="group.year">
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

              </div>
            </el-col>
          </el-row>
        </div>
      </el-main>

      <el-footer class="site-footer">
        <div class="container text-center">
          <p>© 2026 我的博客</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {ArrowDown, Search} from '@element-plus/icons-vue'
const DEFAULT_AVATAR = 'https://loremflickr.com/400/400?lock=4167935627070742'
import api from '@/api'
import {getUserRole} from '@/utils/auth'

const route = useRoute()
const router = useRouter()
const activePath = computed(() => route.path)
const isAdminPage = computed(() => route.meta.requiresAdmin)
const searchQuery = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const username = ref(localStorage.getItem('username') || 'User')
const userAvatar = ref(localStorage.getItem('avatar') || 'https://loremflickr.com/400/400?lock=4167935627070742')
const categories = ref([])
const hotArticles = ref([])
const tags = ref([])
const isAdmin = ref(false)
const isAdminUser = computed(() => getUserRole() === 'admin')
const adminAvatarUrl = ref(localStorage.getItem('admin_avatar') || DEFAULT_AVATAR)
const isDark = ref(localStorage.getItem('theme') === 'dark' || false)

const currentSlide = ref(0)
let carouselTimer = null

const authorInfo = ref({ name: '', avatar: '', bio: '', content: '' })

const catCurrentPage = ref(1)
const catPageSize = ref(10)
const catTotal = ref(0)

const timelineArticles = ref([])
const timelineYears = computed(() => {
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
      .sort((a, b) => b[0] - a[0])
      .map(([year, articles]) => ({
        year,
        articles: articles
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 20),
      }))
})

// 检查用户角色
const checkUserRole = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    isAdmin.value = false
    isLoggedIn.value = false
    return
  }
  
  try {
    const profile = await api.get('/user/profile')
    const role = profile?.role
    if (role) {
      localStorage.setItem('role', role)
      isAdmin.value = role === 'admin'
    }
    isLoggedIn.value = true
    // 保存用户头像
    if (profile?.avatar) {
      localStorage.setItem('avatar', profile.avatar)
      // 只有普通用户才更新userAvatar，管理员使用adminAvatar
      if (role !== 'admin') {
        userAvatar.value = profile.avatar
      } else {
        localStorage.setItem('admin_avatar', profile.avatar)
        adminAvatarUrl.value = profile.avatar
      }
    }
    // 保存用户名
    if (profile?.username) {
      localStorage.setItem('username', profile.username)
      username.value = profile.username
    }
  } catch (e) {
    // token 过期或请求失败
    if (e?.response?.status === 401) {
      handleLogout()
      return
    }
    isAdmin.value = false
    isLoggedIn.value = false
  }
};

const fetchCategories = async () => {
  try {
    const data = await api.get('/categories', { 
      params: { 
        page: catCurrentPage.value, 
        size: catPageSize.value 
      } 
    })
    categories.value = data.list || []
    catTotal.value = data.total || 0
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

const handleCatPageChange = (page) => {
  catCurrentPage.value = page
  fetchCategories()
}

const handleCatSizeChange = (size) => {
  catPageSize.value = size
  catCurrentPage.value = 1
  fetchCategories()
}

const fetchHotArticles = async () => {
  try {
    const data = await api.get('/articles/timelines')
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => b.view_count - a.view_count)
    hotArticles.value = list.slice(0, 5)
  } catch (err) {
    console.error('获取热门文章失败:', err)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const nextSlide = () => {
  if (hotArticles.value.length === 0) return
  currentSlide.value = (currentSlide.value + 1) % hotArticles.value.length
}

const prevSlide = () => {
  if (hotArticles.value.length === 0) return
  currentSlide.value = (currentSlide.value - 1 + hotArticles.value.length) % hotArticles.value.length
}

const goToSlide = (index) => {
  currentSlide.value = index
}

const startCarousel = () => {
  if (carouselTimer) return
  carouselTimer = setInterval(() => {
    nextSlide()
  }, 4000)
}

const pauseCarousel = () => {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
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

const fetchAboutInfo = async () => {
  try {
    const data = await api.get('/about')
    authorInfo.value = data || {}
  } catch (err) {
    console.error('获取关于信息失败:', err)
  }
}

const getTagColor = (id) => {
  const colors = ['#fce7f3', '#ede9fe', '#d1fae5', '#dbeafe', '#ffedd5']
  return colors[id % colors.length]
}

const getTagTextColor = (id) => {
  const colors = ['#db2777', '#7c3aed', '#059669', '#2563eb', '#ea580c']
  return colors[id % colors.length]
}

const getCategoryColor = (id) => {
  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
  return colors[id % colors.length]
}

const fetchTimeline = async () => {
  try {
    const data = await api.get('/articles/timelines')
    timelineArticles.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('获取时间轴失败:', err)
    timelineArticles.value = []
  }
}


onMounted(() => {
  // 初始化头像
  const savedRole = getUserRole()
  // 只有非管理员才加载本地存储的头像
  if (savedRole !== 'admin') {
    const savedAvatar = localStorage.getItem('avatar')
    if (savedAvatar) {
      userAvatar.value = savedAvatar
    }
  }
  checkUserRole();
  fetchAboutInfo();
  fetchCategories();
  fetchHotArticles();
  fetchTags();
  fetchTimeline();
  
  // 监听头像更新事件
  window.addEventListener('avatar-updated', (e) => {
    if (e.detail) {
      localStorage.setItem('avatar', e.detail)
      userAvatar.value = e.detail
      // 如果是管理员，也更新 adminAvatarUrl
      if (isAdminUser.value) {
        localStorage.setItem('admin_avatar', e.detail)
        adminAvatarUrl.value = e.detail
      }
    }
  })
})

const onSearch = () => {
  const q = (searchQuery.value || '').trim()
  if (q) {
    router.push({ name: 'home', query: { q } })
  } else {
    router.push({ name: 'home', query: {} })
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('username')
  localStorage.removeItem('role')
  localStorage.removeItem('avatar')
  isLoggedIn.value = false
  isAdmin.value = false;
  userAvatar.value = ''
  router.push('/login')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}
</script>

<style scoped lang="scss">
.layout-container {
  min-height: 100vh;
  background-color: #f5f7fb;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.site-header {
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 60px;
  display: flex;
  align-items: center;

  .header-content {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .brand {
    margin-right: 40px;

    .brand-link {
      font-size: 22px;
      font-weight: 700;
      color: #3b82f6;
      text-decoration: none;

      &:hover {
        opacity: 0.85;
      }
    }
  }

  .nav-menu {
    border-bottom: none !important;
    flex-grow: 1;
    height: 100%;
    overflow: hidden;
    background: transparent;

    :deep(.el-menu-item) {
      font-weight: 500;
      font-size: 14px;
      color: #666;
      transition: all 0.2s ease;
      padding: 0 16px;

      &:hover {
        background-color: transparent !important;
        color: #3b82f6;
      }

      &.is-active {
        color: #3b82f6;
        font-weight: 600;
        border-bottom: 2px solid #3b82f6;
      }
    }

    :deep(.el-sub-menu__title) {
      font-weight: 500;
      font-size: 14px;
      color: #666;

      &:hover {
        color: #3b82f6;
        background-color: transparent !important;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-left: 20px;

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 18px;
      background: #f5f7fb;
      border-radius: 20px;
      transition: all 0.2s ease;

      svg {
        color: #999;
        flex-shrink: 0;
      }

      .search-input {
        border: none;
        outline: none;
        background: transparent;
        width: 140px;
        font-size: 13px;
        color: #333;

        &::placeholder {
          color: #bbb;
        }
      }

      &:focus-within {
        background: #fff;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);

        svg {
          color: #3b82f6;
        }

        .search-input {
          width: 180px;
        }
      }
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: #666;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f7fb;
        color: #3b82f6;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      padding: 4px 8px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f7fb;
      }

      .username {
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .header-avatar {
        border: 2px solid #e5e7eb;
        transition: border-color 0.2s ease;
      }

      &:hover .header-avatar {
        border-color: #3b82f6;
      }
    }
  }
}

.main-content {
  padding: 25px 0;
  min-height: calc(100vh - 120px);
  background-color: #f5f7fb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.sidebar {
  .sidebar-widget {
    margin-bottom: 20px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: transform 0.2s, box-shadow 0.2s;
    background: #ffffff;
    overflow: hidden;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }

    :deep(.el-card__body) { padding: 20px; }
  }

  .profile-widget {
    text-align: center;

    .profile-decoration {
      display: none;
    }
  }

  .author-info {
    padding: 4px 0;

    .author-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 12px;
      border: 3px solid #f3f4f6;
      box-shadow: none;
      transition: all 0.3s ease;
    }

    &:hover .author-avatar {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .author-name {
      margin: 0 0 6px;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .author-bio {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 20px;
      line-height: 1.5;
    }

    .author-stats {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 30px;
      padding: 0;
      background: transparent;
      border-radius: 0;

      .stat-item {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .stat-number {
          font-size: 20px;
          font-weight: 700;
          color: #3b82f6;
          display: block;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          display: block;
        }
      }
    }
  }

  .widget-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1f2937;
    padding: 0;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0;

    .widget-icon {
      font-size: 16px;
      line-height: 1;
    }
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 0;

      &:last-child {
        border-bottom: none;
      }

      a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        font-size: 13px;
        color: #4b5563;
        text-decoration: none;
        padding: 0;
        border-radius: 0;
        transition: color 0.2s ease;

        &:hover {
          color: #3b82f6;
          background: transparent;
          transform: none;
        }

        .cat-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .cat-name { flex: 1; }

        .cat-count {
          font-size: 13px;
          color: #9ca3af;
          background: transparent;
          padding: 0;
          border-radius: 0;
          min-width: auto;
          text-align: center;
          transition: color 0.2s ease;
        }

        &:hover .cat-count {
          background: transparent;
          color: #9ca3af;
        }
      }
    }
  }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 0;

    .tag-item {
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      padding: 4px 12px;
      transition: opacity 0.2s ease;
      box-shadow: none;

      &:hover {
        opacity: 0.8;
        transform: none;
        box-shadow: none;
      }
    }
  }

  .tag-cloud-wrapper {
    max-height: 220px;
    overflow-y: auto;
    padding: 8px 4px;
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background-color: #d1d5db;
      border-radius: 2px;
      
      &:hover {
        background-color: #9ca3af;
      }
    }
  }

  .hot-widget {
    overflow: hidden;

    .hot-carousel {
      padding: 0;
      overflow: hidden;
      position: relative;
    }

    .hot-carousel-inner {
      min-height: 200px;
    }

    .hot-item {
      display: block;
      text-decoration: none;
      color: inherit;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 10px;

      &:hover {
        transform: none;
      }

      .hot-item-image {
        position: relative;
        width: 100%;
        height: 140px;
        overflow: hidden;
        border-radius: 8px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .hot-item-overlay {
          display: none;
        }

        &:hover {
          img {
            transform: scale(1.05);
          }
        }
      }

      .hot-item-content {
        padding: 10px 0;
        background: transparent;

        .hot-item-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;

          .hot-item:hover & {
            color: #3b82f6;
          }
        }

        .hot-item-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;

          .hot-item-category {
            background: #f0f0f0;
            padding: 3px 10px;
            border-radius: 10px;
            color: #666;
            font-weight: 500;
          }

          .hot-item-date {
            color: #999;
          }
        }
      }
    }

    .hot-arrows {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      transform: translateY(-50%);
      display: flex;
      justify-content: space-between;
      padding: 0 8px;
      pointer-events: none;
      z-index: 3;

      .hot-arrow-btn {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: none;
        background-color: rgba(255, 255, 255, 0.95);
        color: #666;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        pointer-events: auto;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

        &:hover {
          background-color: #fff;
          color: #3b82f6;
          transform: scale(1.1);
          box-shadow: 0 2px 10px rgba(59, 130, 246, 0.15);
        }
      }
    }

    .hot-controls {
      position: relative;
      padding: 0;
    }

    .hot-indicators {
      display: flex;
      justify-content: center;
      gap: 6px;
      padding: 10px 0 14px;
      background: #fff;

      .hot-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #ddd;
        cursor: pointer;
        transition: all 0.2s ease;

        &.active {
          width: 18px;
          border-radius: 3px;
          background: #3b82f6;
        }

        &:hover:not(.active) {
          background-color: #bbb;
        }
      }
    }

    .hot-fade-enter-active {
      transition: all 0.3s ease;
    }

    .hot-fade-leave-active {
      transition: all 0.2s ease;
    }

    .hot-fade-enter-from {
      opacity: 0;
      transform: translateX(10px);
    }

    .hot-fade-leave-to {
      opacity: 0;
      transform: translateX(-10px);
    }
  }

  .empty-widget {
    text-align: center;
    color: #999;
    font-size: 13px;
    padding: 24px 16px;
    line-height: 1.6;
  }

  .sidebar-pagination {
    margin-top: 14px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #f3f4f6;
    padding-top: 14px;
  }

  .sidebar-timeline {
    position: relative;
    max-height: 260px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #ddd transparent;

    &::-webkit-scrollbar {
      width: 3px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }

    .timeline-year {
      position: relative;
      padding: 6px 0 10px;

      .year-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;

        .year-text {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
      }

      .year-list {
        list-style: none;
        position: relative;
        padding-left: 20px;

        &::before {
          content: '';
          position: absolute;
          left: 4px;
          top: 6px;
          bottom: 6px;
          width: 2px;
          background: #e5e7eb;
        }
      }

      .timeline-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 6px 0;
        font-size: 13px;
        position: relative;
        cursor: pointer;

        &::before {
          content: '';
          position: absolute;
          left: -16px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d1d5db;
          border: 2px solid #fff;
        }

        &:first-child::before {
          background: #3b82f6;
        }

        &:hover {
          .row-title {
            color: #3b82f6;
          }
        }

        .row-date {
          width: 36px;
          font-size: 13px;
          color: #6b7280;
          flex-shrink: 0;
        }

        .row-title {
          font-size: 13px;
          color: #4b5563;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

.site-footer {
  background-color: #fff;
  color: #999;
  font-size: 13px;
  display: flex;
  align-items: center;
  border-top: 1px solid #eee;
  height: 50px;
}

.text-center { text-align: center; width: 100%; }

@media (max-width: 968px) {
  .main-content {
    .container {
      .el-row {
        flex-direction: column;
      }

      .sidebar {
        width: 100%;
      }
    }
  }
}
</style>
