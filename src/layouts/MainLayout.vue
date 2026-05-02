<template>
  <div class="layout-wrapper" :class="{ 'theme-dark': isDark }">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-left">
          <router-link to="/" class="logo">MyBlog</router-link>
          <button class="menu-toggle" @click="showMobileMenu = !showMobileMenu">
            <svg v-if="!showMobileMenu" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <ul class="nav-menu" :class="{ 'menu-open': showMobileMenu }">
            <li><router-link to="/" :class="{ active: isHome }" @click="closeMobileMenu">首页</router-link></li>
            <li><router-link to="/archive" :class="{ active: $route.path === '/archive' }" @click="closeMobileMenu">归档</router-link></li>
            <li><router-link to="/categories" :class="{ active: $route.path === '/categories' }" @click="closeMobileMenu">分类</router-link></li>
            <li><router-link to="/tags" :class="{ active: $route.path === '/tags' }" @click="closeMobileMenu">标签</router-link></li>
            <li><router-link to="/about" :class="{ active: $route.path === '/about' }" @click="closeMobileMenu">关于</router-link></li>
            <li v-if="isLoggedIn" class="nav-liked">
              <router-link to="/liked" :class="{ active: $route.path === '/liked' }" @click="closeMobileMenu">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                我的点赞
              </router-link>
            </li>
            <li v-if="isAdmin" class="nav-admin" @click.stop>
              <span class="admin-trigger" @click="showAdminMenu = !showAdminMenu">
                后台管理
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </span>
              <ul v-show="showAdminMenu" class="admin-dropdown">
                <li><router-link to="/admin/articles">文章管理</router-link></li>
                <li><router-link to="/admin/categories">分类管理</router-link></li>
                <li><router-link to="/admin/tags">标签管理</router-link></li>
                <li><router-link to="/admin/users">用户管理</router-link></li>
                <li><router-link to="/admin/comments">评论管理</router-link></li>
              </ul>
            </li>
          </ul>
        </div>
        <div class="nav-right">
          <div class="search-box">
            <input v-model="searchQuery" type="text" placeholder="搜索文章..." @keyup.enter="onSearch" />
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <button class="theme-toggle" @click="toggleTheme" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
            <svg v-if="!isDark" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button v-if="!isLoggedIn" class="login-btn" @click="router.push('/login')">登录</button>
          <div v-else class="user-dropdown" @click.stop>
            <span class="user-trigger" @click="showUserMenu = !showUserMenu">
              <img :src="isAdminUser ? adminAvatarUrl : userAvatar" class="user-avatar-small" />
              <span class="user-name-small">{{ username }}</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <ul v-show="showUserMenu" class="admin-dropdown">
              <li><router-link to="/profile">个人中心</router-link></li>
              <li><a @click="handleLogout">退出登录</a></li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主体 -->
    <div class="main-container" :class="{ 'no-sidebar': isAdminPage }">
      <div class="left-column">
        <router-view />
      </div>
      <aside v-if="!isAdminPage" class="right-column">
        <!-- 用户信息 -->
        <div class="sidebar-card user-card">
          <img :src="authorInfo.avatar || DEFAULT_AVATAR" alt="avatar" class="user-avatar" @click="router.push('/about')" style="cursor:pointer;" />
          <div class="user-name">{{ authorInfo.name || 'user' }}</div>
          <div class="user-bio">{{ authorInfo.bio || '一个分享技术与生活的博客' }}</div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-num">{{ articleCount }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ categoryCount }}</span>
              <span class="stat-label">分类</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ tagCount }}</span>
              <span class="stat-label">标签</span>
            </div>
          </div>
        </div>

        <!-- 热门推荐 -->
        <div class="sidebar-card">
          <div class="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ef4444" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            热门推荐
          </div>
          <div v-if="hotArticles.length > 0" class="hot-carousel" @mouseenter="pauseCarousel" @mouseleave="startCarousel">
            <transition name="hot-fade" mode="out-in">
              <div :key="currentSlide" class="hot-item">
                <img :src="hotArticles[currentSlide].cover_image || '/uploads/covers/default.png'" :alt="hotArticles[currentSlide].title" />
                <div class="hot-info">
                  <div class="hot-title">{{ hotArticles[currentSlide].title }}</div>
                  <div class="hot-meta">
                    <span>{{ hotArticles[currentSlide].category?.name || '未分类' }}</span>
                    <span>{{ formatDate(hotArticles[currentSlide].created_at) }}</span>
                  </div>
                </div>
              </div>
            </transition>
            <div class="hot-nav">
              <button class="hot-nav-btn" @click="prevSlide">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div class="hot-dots">
                <span
                  v-for="(article, index) in hotArticles"
                  :key="article.id"
                  class="dot"
                  :class="{ active: currentSlide === index }"
                  @click="goToSlide(index)"
                ></span>
              </div>
              <button class="hot-nav-btn" @click="nextSlide">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
          <div v-else class="empty-widget">暂无热门文章</div>
        </div>

        <!-- 分类 -->
        <div class="sidebar-card">
          <div class="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            分类
          </div>
          <ul v-if="categories.length > 0" class="category-list">
            <li v-for="cat in categories" :key="cat.id" class="category-item">
              <router-link :to="'/category/' + cat.id" class="cat-left">
                <span class="cat-icon" :style="{ background: getCategoryColor(cat.id) }">{{ cat.name.charAt(0).toUpperCase() }}</span>
                <span>{{ cat.name }}</span>
              </router-link>
              <span class="cat-count">{{ cat.post_count || 0 }}</span>
            </li>
          </ul>
          <div v-else class="empty-widget">暂无分类</div>
        </div>

        <!-- 标签云 -->
        <div class="sidebar-card">
          <div class="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            标签云
          </div>
          <div v-if="tags.length > 0" class="tag-cloud">
            <span
              v-for="tag in tags"
              :key="tag.id"
              class="cloud-tag"
              :style="{ backgroundColor: getTagBgColor(tag.id), color: getTagTextColor(tag.id) }"
              @click="router.push('/tag/' + tag.id)"
            >
              {{ tag.name }}
            </span>
          </div>
          <div v-else class="empty-widget">暂无标签</div>
        </div>

        <!-- 时间轴 -->
        <div class="sidebar-card">
          <div class="section-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            时间轴
          </div>
          <div v-if="timelineYears.length > 0" class="sidebar-timeline">
            <div v-for="group in timelineYears" :key="group.year" class="timeline-year-group">
              <div class="timeline-year">{{ group.year }}年</div>
              <ul class="timeline-list">
                <li
                  v-for="(a, idx) in group.articles"
                  :key="a.id"
                  class="timeline-item"
                  :class="{ active: idx === 0 }"
                  @click="router.push('/article/' + a.id)"
                >
                  <span class="timeline-date">{{ a.mmdd }}</span>
                  <span class="timeline-title">{{ a.title }}</span>
                </li>
              </ul>
            </div>
          </div>
          <div v-else class="empty-widget">暂无文章</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const DEFAULT_AVATAR = 'https://loremflickr.com/400/400?lock=4167935627070742'
import api from '@/api'
import { getUserRole } from '@/utils/auth'

const route = useRoute()
const router = useRouter()

const isHome = computed(() => route.path === '/')
const isAdminPage = computed(() => route.meta.requiresAdmin || route.path.startsWith('/admin'))

const searchQuery = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))
const username = ref(localStorage.getItem('username') || 'User')
const userAvatar = ref(localStorage.getItem('avatar') || DEFAULT_AVATAR)
const categories = ref([])
const hotArticles = ref([])
const tags = ref([])
const isAdmin = ref(false)
const isAdminUser = computed(() => getUserRole() === 'admin')
const adminAvatarUrl = ref(localStorage.getItem('admin_avatar') || DEFAULT_AVATAR)
const isDark = ref(localStorage.getItem('theme') === 'dark' || false)
const showAdminMenu = ref(false)
const showUserMenu = ref(false)
const showMobileMenu = ref(false)

const closeMobileMenu = () => {
  showMobileMenu.value = false
  showAdminMenu.value = false
  showUserMenu.value = false
}

const articleCount = ref(0)
const categoryCount = ref(0)
const tagCount = ref(0)

const currentSlide = ref(0)
let carouselTimer = null

const authorInfo = ref({ name: '', avatar: '', bio: '' })

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

// Close dropdowns when clicking outside
const handleClickOutside = (e) => {
  if (!e.target.closest('.nav-admin') && !e.target.closest('.user-dropdown')) {
    showAdminMenu.value = false
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  const savedRole = getUserRole()
  if (savedRole !== 'admin') {
    const savedAvatar = localStorage.getItem('avatar')
    if (savedAvatar) {
      userAvatar.value = savedAvatar
    }
  }
  checkUserRole()
  fetchAboutInfo()
  fetchCategories()
  fetchHotArticles()
  fetchTags()
  fetchTimeline()

  window.addEventListener('avatar-updated', (e) => {
    if (e.detail) {
      localStorage.setItem('avatar', e.detail)
      userAvatar.value = e.detail
      if (isAdminUser.value) {
        localStorage.setItem('admin_avatar', e.detail)
        adminAvatarUrl.value = e.detail
      }
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  pauseCarousel()
})

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
    if (profile?.avatar) {
      localStorage.setItem('avatar', profile.avatar)
      if (role !== 'admin') {
        userAvatar.value = profile.avatar
      } else {
        localStorage.setItem('admin_avatar', profile.avatar)
        adminAvatarUrl.value = profile.avatar
      }
    }
    if (profile?.username) {
      localStorage.setItem('username', profile.username)
      username.value = profile.username
    }
  } catch (e) {
    if (e?.response?.status === 401) {
      handleLogout()
      return
    }
    isAdmin.value = false
    isLoggedIn.value = false
  }
}

const fetchCategories = async () => {
  try {
    const data = await api.get('/categories', { params: { page: 1, size: 100 } })
    categories.value = data.list || []
    categoryCount.value = data.total || categories.value.length
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

const fetchHotArticles = async () => {
  try {
    const data = await api.get('/articles/timelines')
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => b.view_count - a.view_count)
    hotArticles.value = list.slice(0, 5)
    articleCount.value = list.length
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
    tagCount.value = data.total || tags.value.length
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

const getTagBgColor = (id) => {
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
  isAdmin.value = false
  userAvatar.value = DEFAULT_AVATAR
  showUserMenu.value = false
  router.push('/login')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.layout-wrapper {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
  font-size: 14px;
  transition: background-color 0.3s, color 0.3s;
}

/* 深色模式 */
.theme-dark {
  background-color: #0f1419 !important;
  color: #e7e9ea !important;
}

.theme-dark .navbar {
  background: #15202b !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4) !important;
}

.theme-dark .nav-menu a,
.theme-dark .nav-menu .admin-trigger {
  color: #8b98a5 !important;
}

.theme-dark .nav-menu a:hover,
.theme-dark .nav-menu a.active,
.theme-dark .nav-menu .admin-trigger:hover {
  color: #1d9bf0 !important;
}

.theme-dark .search-box input {
  background: #192734 !important;
  border-color: #38444d !important;
  color: #e7e9ea !important;
}

.theme-dark .search-box input::placeholder {
  color: #657786 !important;
}

.theme-dark .theme-toggle {
  border-color: #38444d !important;
  background: #192734 !important;
  color: #e7e9ea !important;
}

.theme-dark .theme-toggle:hover {
  border-color: #1d9bf0 !important;
  color: #1d9bf0 !important;
}

.theme-dark .login-btn {
  background: #1d9bf0 !important;
  border-color: #1d9bf0 !important;
}

.theme-dark .sidebar-card {
  background: #15202b !important;
  border-color: #38444d !important;
}

.theme-dark .section-title {
  color: #e7e9ea !important;
}

.theme-dark .timeline-item .timeline-date {
  color: #657786 !important;
}

.theme-dark .timeline-item .timeline-title {
  color: #8b98a5 !important;
}

.theme-dark .timeline-item:hover .timeline-title {
  color: #1d9bf0 !important;
}

.theme-dark .hot-item img {
  opacity: 0.85;
}

.theme-dark .hot-title {
  color: #e7e9ea !important;
}

.theme-dark .hot-meta span {
  color: #657786 !important;
}

.theme-dark .tag-cloud-item {
  background: #192734 !important;
  color: #8b98a5 !important;
}

.theme-dark .tag-cloud-item:hover {
  background: #1d9bf0 !important;
  color: #fff !important;
}

.theme-dark .user-name {
  color: #e7e9ea !important;
}

.theme-dark .user-bio {
  color: #657786 !important;
}

.theme-dark .stat-item .stat-num {
  color: #e7e9ea !important;
}

.theme-dark .stat-item .stat-label {
  color: #657786 !important;
}

/* 顶部导航 */
.navbar {
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.menu-toggle {
  display: none;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: #3b82f6;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: 30px;
  list-style: none;
  align-items: center;
}

.nav-menu a,
.nav-menu .admin-trigger {
  text-decoration: none;
  color: #666;
  font-size: 14px;
  transition: color 0.2s;
  cursor: pointer;
}

.nav-menu a:hover,
.nav-menu a.active,
.nav-menu .admin-trigger:hover {
  color: #3b82f6;
}

/* Admin dropdown */
.nav-admin {
  position: relative;
}

.admin-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.admin-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 6px 0;
  min-width: 140px;
  z-index: 200;
}

.admin-dropdown li a {
  display: block;
  padding: 8px 16px;
  color: #4b5563;
  font-size: 13px;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.admin-dropdown li a:hover {
  background: #f5f7fb;
  color: #3b82f6;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.search-box {
  position: relative;
}

.search-box input {
  width: 220px;
  height: 36px;
  border-radius: 18px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 0 35px 0 15px;
  font-size: 13px;
  outline: none;
  color: #333;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-box input::placeholder {
  color: #9ca3af;
}

.search-box input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.search-box svg {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: border-color 0.2s, color 0.2s;
}

.theme-toggle:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.login-btn {
  height: 36px;
  padding: 0 18px;
  border-radius: 18px;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:hover {
  opacity: 0.85;
}

/* User dropdown */
.user-dropdown {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f7fb;
}

.user-avatar-small {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.user-name-small {
  font-size: 13px;
  color: #4b5563;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown .admin-dropdown {
  right: 0;
  left: auto;
}

/* 主体布局 */
.main-container {
  max-width: 1200px;
  margin: 25px auto;
  padding: 0 20px;
  display: flex;
  gap: 25px;
}

.main-container.no-sidebar .left-column {
  flex: 1;
}

.left-column {
  flex: 1;
  min-width: 0;
}

.right-column {
  width: 320px;
  flex-shrink: 0;
}

/* 右侧边栏卡片 */
.sidebar-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.sidebar-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 用户信息 */
.user-card {
  text-align: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 12px;
  border: 3px solid #f3f4f6;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.user-bio {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 20px;
}

.user-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.stat-num {
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

/* 热门推荐 */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hot-carousel {
  position: relative;
}

.hot-item {
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.hot-item img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
  border-radius: 8px;
}

.hot-info {
  padding: 10px 0;
}

.hot-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 6px;
}

.hot-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
}

.hot-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.hot-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #9ca3af;
  font-size: 12px;
  transition: border-color 0.2s, color 0.2s;
}

.hot-nav-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.hot-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.2s;
}

.dot.active {
  background: #3b82f6;
}


/* 分类 */
.category-list {
  list-style: none;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.category-item:last-child {
  border-bottom: none;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #4b5563;
  text-decoration: none;
  transition: color 0.2s;
}

.cat-left:hover {
  color: #3b82f6;
}

.cat-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
  flex-shrink: 0;
}

.cat-count {
  font-size: 13px;
  color: #9ca3af;
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.cloud-tag {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cloud-tag:hover {
  opacity: 0.8;
}

/* 时间轴 */
.sidebar-timeline {
  max-height: 300px;
  overflow-y: auto;
}

.sidebar-timeline::-webkit-scrollbar {
  width: 3px;
}

.sidebar-timeline::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-timeline::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.timeline-year-group {
  margin-bottom: 8px;
}

.timeline-year {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.timeline-list {
  list-style: none;
  position: relative;
  padding-left: 20px;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
  position: relative;
  cursor: pointer;
}

.timeline-item::before {
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

.timeline-item.active::before {
  background: #3b82f6;
}

.timeline-date {
  color: #6b7280;
  width: 36px;
  flex-shrink: 0;
}

.timeline-title {
  color: #4b5563;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-item:hover .timeline-title {
  color: #3b82f6;
}

/* Empty widget */
.empty-widget {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 20px 10px;
}

/* 响应式 */
@media (max-width: 968px) {
  .main-container {
    flex-direction: column;
  }

  .right-column {
    width: 100%;
  }

  .nav-menu {
    gap: 15px;
  }

  .search-box input {
    width: 150px;
  }
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 8px;
    margin-left: 10px;
  }

  .nav-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fff;
    flex-direction: column;
    padding: 15px 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    gap: 0;
    z-index: 100;
  }

  .theme-dark .nav-menu {
    background: #15202b;
  }

  .nav-menu.menu-open {
    display: flex;
  }

  .nav-menu li {
    width: 100%;
  }

  .nav-menu li a,
  .nav-menu li .admin-trigger {
    display: block;
    padding: 12px 20px;
    border-bottom: 1px solid #f0f0f0;
  }

  .theme-dark .nav-menu li a,
  .theme-dark .nav-menu li .admin-trigger {
    border-bottom-color: #38444d;
  }

  .nav-menu li:last-child a {
    border-bottom: none;
  }

  .admin-dropdown {
    position: static;
    box-shadow: none;
    background: #f8f9fa;
  }

  .theme-dark .admin-dropdown {
    background: #192734;
  }

  .search-box {
    display: none;
  }

  .nav-right {
    gap: 8px;
  }

  .user-name-small {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-container {
    padding: 0 10px;
  }

  .logo {
    font-size: 18px;
  }

  .theme-toggle {
    padding: 6px;
  }

  .login-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
