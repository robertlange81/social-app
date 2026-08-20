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
    { path: '/password-reset', name: 'password-reset', component: () => import(/* webpackChunkName: "auth" */ './views/PasswordReset.vue') },
    { path: '/verify-email', name: 'verify-email', component: () => import(/* webpackChunkName: "auth" */ './views/VerifyEmail.vue') },
    { path: '/impressum', name: 'imprint', component: () => import(/* webpackChunkName: "legal" */ './views/Imprint.vue') },
    { path: '/datenschutz', name: 'privacy', component: () => import(/* webpackChunkName: "legal" */ './views/PrivacyPolicy.vue') },
    { path: '/nutzungsbedingungen', name: 'terms', component: () => import(/* webpackChunkName: "legal" */ './views/Terms.vue') },
    { path: '/community-regeln', name: 'guidelines', component: () => import(/* webpackChunkName: "legal" */ './views/CommunityGuidelines.vue') },
    {
      path: '/discover',
      name: 'discover',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Discover.vue')
    },
    {
      path: '/feed',
      name: 'feed',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "social" */ './views/Feed.vue')
    },
    {
      path: '/resonance',
      name: 'resonance',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "social" */ './views/Resonance.vue')
    },
    {
      path: '/groups',
      name: 'groups',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "social" */ './views/Groups.vue')
    },
    {
      path: '/matches',
      name: 'matches',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Matches.vue')
    },
    {
      path: '/chats',
      name: 'chats',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Chats.vue')
    },
    {
      path: '/chat/:id',
      name: 'chat',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Chat.vue')
    },
    {
      path: '/blocked',
      name: 'blocked',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/BlockedUsers.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      meta: { requiresAuth: true },
      component: () => import(/* webpackChunkName: "dating" */ './views/Settings.vue')
    },
    { path: '/moderation', name: 'moderation', meta: { requiresAuth: true }, component: () => import(/* webpackChunkName: "social" */ './views/Moderation.vue') },
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
    { path: '/map', name: 'map', meta: { requiresAuth: true }, component: () => import(/* webpackChunkName: "map" */ './views/MapSearch.vue') },
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
