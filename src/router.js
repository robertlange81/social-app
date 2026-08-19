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
      path: '/pets',
      name: 'my-pets',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/MyPets.vue')
    },
    {
      path: '/discover',
      name: 'discover',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Discover.vue')
    },
    {
      path: '/matches',
      name: 'matches',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Matches.vue')
    },
    {
      path: '/chats',
      name: 'chats',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Chats.vue')
    },
    {
      path: '/chat/:id',
      name: 'chat',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Chat.vue')
    },
    {
      path: '/blocked',
      name: 'blocked',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/BlockedUsers.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Settings.vue')
    },
    {
      path: '/pet/:id',
      name: 'pet-profile',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/PetProfile.vue')
    },
    {
      path: '/search',
      name: 'search',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Search.vue')
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Bookmarks.vue')
    },
    {
      path: '/visitors',
      name: 'visitors',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Visitors.vue')
    },
    {
      path: '/likes',
      name: 'likes',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "matching" */ './views/Likes.vue')
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
