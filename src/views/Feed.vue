<template>
  <v-container class="page-container py-6" style="max-width:760px; min-height:100vh;">
    <div class="content-board mb-4">
      <div class="headline font-weight-bold text-secundario mb-3">Pinnwand</div>
      <v-textarea v-model="draft" outlined rows="3" counter="500" maxlength="500"
        label="Was möchtest du teilen?" hide-details="auto"></v-textarea>
      <div class="d-flex justify-end mt-3">
        <v-btn color="#32BCC3" dark elevation="0" :loading="posting" :disabled="!draft.trim()" @click="createPost">
          <v-icon left>{{svg.send}}</v-icon> Veröffentlichen
        </v-btn>
      </div>
    </div>

    <v-alert v-if="pokes.length" color="#e9fbfc" class="mb-4" border="left" colored-border>
      <strong>{{pokes[0].handle}}</strong> hat dich angestupst<span v-if="pokes.length > 1"> – und {{pokes.length - 1}} weitere</span>.
      <v-btn text small color="#168890" :to="`/profile/${pokes[0].handle}`">Profil ansehen</v-btn>
    </v-alert>

    <div v-if="loading" class="text-center pa-8"><v-progress-circular indeterminate color="#32BCC3"></v-progress-circular></div>
    <div v-else-if="!posts.length" class="content-board text-center pa-8">Noch keine Beiträge. Mach den Anfang!</div>
    <v-card v-for="post in posts" :key="post.id" class="mb-4" elevation="2">
      <v-card-title class="pb-1">
        <router-link :to="`/profile/${post.author.handle}`" class="feed-author">{{post.author.handle}}</router-link>
        <v-spacer></v-spacer>
        <v-btn v-if="post.author.id === authUser.id" icon small aria-label="Beitrag löschen" @click="deletePost(post)">
          <v-icon small>{{svg.delete}}</v-icon>
        </v-btn>
        <v-btn v-else text small color="#168890" @click="poke(post.author)">
          <v-icon left small>{{svg.poke}}</v-icon>Anstupsen
        </v-btn>
      </v-card-title>
      <v-card-subtitle>{{formatDate(post.createdAt)}} · {{post.author.city || post.author.party}}</v-card-subtitle>
      <v-card-text class="body-1 post-body">{{post.body}}</v-card-text>
      <v-card-actions>
        <v-btn text :color="post.likedByMe ? '#E91E63' : '#616161'" @click="toggleLike(post)">
          <v-icon left>{{post.likedByMe ? svg.heart : svg.heartOutline}}</v-icon>
          {{post.likeCount || 0}} Gefällt mir
        </v-btn>
      </v-card-actions>
    </v-card>
    <div v-if="hasMore" class="text-center"><v-btn text color="#168890" @click="loadMore">Mehr laden</v-btn></div>
    <v-snackbar v-model="snackbar.show" :color="snackbar.error ? 'error' : 'success'">{{snackbar.text}}</v-snackbar>
  </v-container>
</template>

<script>
import Api from '@/service/Api'
import { mapGetters } from 'vuex'
import { mdiSend, mdiDeleteOutline, mdiGestureTap, mdiHeart, mdiHeartOutline } from '@mdi/js'

export default {
  data: () => ({
    draft: '',
    posts: [],
    pokes: [],
    loading: true,
    posting: false,
    hasMore: false,
    snackbar: { show: false, text: '', error: false },
    svg: { send: mdiSend, delete: mdiDeleteOutline, poke: mdiGestureTap, heart: mdiHeart, heartOutline: mdiHeartOutline }
  }),
  computed: { ...mapGetters(['authUser']) },
  created () {
    Promise.all([this.fetchPosts(), this.fetchPokes()]).finally(() => { this.loading = false })
  },
  methods: {
    formatDate (value) {
      const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`
      return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(normalized))
    },
    notify (text, error = false) { this.snackbar = { show: true, text, error } },
    fetchPosts (append = false) {
      const offset = append ? this.posts.length : 0
      return Api().get('feed', { params: { offset, limit: 20 } }).then(({ data }) => {
        this.posts = append ? this.posts.concat(data.posts) : data.posts
        this.hasMore = data.hasMore
      }).catch(() => this.notify('Die Pinnwand konnte nicht geladen werden.', true))
    },
    fetchPokes () { return Api().get('pokes').then(({ data }) => { this.pokes = data.pokes }).catch(() => {}) },
    createPost () {
      if (!this.draft.trim()) return
      this.posting = true
      Api().post('feed', { body: this.draft }).then(({ data }) => {
        this.posts.unshift(data.post); this.draft = ''; this.notify('Dein Beitrag ist online.')
      }).catch(() => this.notify('Der Beitrag konnte nicht veröffentlicht werden.', true)).finally(() => { this.posting = false })
    },
    toggleLike (post) {
      Api().post(`feed/${post.id}/like`).then(({ data }) => {
        post.likedByMe = data.liked; post.likeCount = data.likeCount
      }).catch(() => this.notify('Das Like konnte nicht gespeichert werden.', true))
    },
    deletePost (post) {
      Api().delete(`feed/${post.id}`).then(() => {
        this.posts = this.posts.filter(item => item.id !== post.id); this.notify('Beitrag gelöscht.')
      }).catch(() => this.notify('Der Beitrag konnte nicht gelöscht werden.', true))
    },
    poke (user) {
      Api().post('pokes', { toUserId: user.id }).then(() => this.notify(`${user.handle} wurde angestupst.`))
        .catch(() => this.notify('Anstupsen war nicht möglich.', true))
    },
    loadMore () { this.fetchPosts(true) }
  }
}
</script>

<style scoped>
.feed-author { color: #168890; text-decoration: none; }
.post-body { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
