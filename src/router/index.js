import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import HomeView from '@/views/HomeView.vue'
import ArticleView from '@/views/ArticleView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import AdminArticleView from '@/views/AdminArticleView.vue'
import AdminCategoryView from '@/views/AdminCategoryView.vue'
import AdminTagView from '@/views/AdminTagView.vue'
import AdminUserView from '@/views/AdminUserView.vue'
import AdminCommentView from '@/views/AdminCommentView.vue'
import ArticleEditView from '@/views/ArticleEditView.vue'
import ProfileView from '@/views/ProfileView.vue'
import AboutView from '@/views/AboutView.vue'
import CategoryView from '@/views/CategoryView.vue'
import CategoriesView from '@/views/CategoriesView.vue'
import TagArticlesView from '@/views/TagArticlesView.vue'
import ArchiveView from '@/views/ArchiveView.vue'
import TagsView from '@/views/TagsView.vue'
import LikedArticlesView from '@/views/LikedArticlesView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
      },
      {
        path: 'article/:id',
        name: 'article',
        component: ArticleView,
      },
      {
        path: 'category/:id',
        name: 'category',
        component: CategoryView,
      },
      {
        path: 'tag/:id',
        name: 'tag',
        component: TagArticlesView,
      },
      {
        path: 'categories',
        name: 'categories',
        component: CategoriesView,
      },
      {
        path: 'archive',
        name: 'archive',
        component: ArchiveView,
      },
      {
        path: 'tags',
        name: 'tags',
        component: TagsView,
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView,
      },
      {
        path: 'about',
        name: 'about',
        component: AboutView,
      },
      {
        path: 'liked',
        name: 'liked',
        component: LikedArticlesView,
      },
      {
        path: 'admin/articles',
        name: 'admin-articles',
        component: AdminArticleView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/articles/edit/:id?',
        name: 'admin-article-edit',
        component: ArticleEditView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/categories',
        name: 'admin-categories',
        component: AdminCategoryView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/tags',
        name: 'admin-tags',
        component: AdminTagView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: AdminUserView,
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/comments',
        name: 'admin-comments',
        component: AdminCommentView,
        meta: { requiresAdmin: true }
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  // 需要管理员权限但用户未登录或不是管理员
  if (to.meta.requiresAdmin) {
    if (!token) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    const role = localStorage.getItem('role')
    if (role !== 'admin') {
      next({ name: 'home' })
      return
    }
  }
  
  // 已登录用户访问登录页时跳转到首页
  if (to.path === '/login' && token) {
    next({ name: 'home' })
    return
  }
  
  next()
})

export default router
