import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import store from './vuex'

Vue.use(Router)

const ifNotAuthenticated = (to, from, next) => {
  if (!store.getters.isAuthenticated) {
    next()
    return
  }
  next('/')
}

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/login',
      name: 'login',
      beforeEnter: ifNotAuthenticated,
      component: () => import(/* webpackChunkName: "auth" */ './views/Login.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      beforeEnter: ifNotAuthenticated,
      component: () => import(/* webpackChunkName: "auth" */ './views/Signup.vue')
    },
    {
      path: '/discover',
      name: 'discover',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Discover.vue')
    },
    {
      path: '/matches',
      name: 'matches',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Matches.vue')
    },
    {
      path: '/matches/:id',
      name: 'chat',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Chat.vue')
    },
    {
      path: '/profile/:handle',
      name: 'profile',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/UsersProfile.vue')
    },
    {
      path: '/search',
      name: 'search',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Search.vue')
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Bookmarks.vue')
    },
    {
      path: '/visitors',
      name: 'visitors',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Visitors.vue')
    },
    {
      path: '/likes',
      name: 'likes',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Likes.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.matched.some(route => route.meta.requiresAuth)) {
    if (store.getters.isAuthenticated) {
      next()
      return
    }
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router
