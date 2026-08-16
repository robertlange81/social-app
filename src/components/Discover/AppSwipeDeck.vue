<template>
    <div>
        <div v-if="!profiles.length" class="content-board text-center pa-8">
            Keine weiteren Profile gerade verfügbar. Schau später nochmal vorbei oder nutze die
            <router-link to="/search">Suche</router-link>, um alle Profile zu durchstöbern.
        </div>
        <div v-else class="deck-stack">
            <AppProfileCard v-if="profiles[2]" :profile="profiles[2]" class="deck-card" style="transform: translateY(16px) scale(0.9); z-index:1;" />
            <AppProfileCard v-if="profiles[1]" :profile="profiles[1]" class="deck-card" style="transform: translateY(8px) scale(0.95); z-index:2;" />
            <div
                v-if="profiles[0]"
                class="deck-card deck-card--top"
                :style="topStyle"
                @pointerdown="onPointerDown"
                @pointermove="onPointerMove"
                @pointerup="onPointerUp"
                @pointercancel="onPointerUp"
            >
                <AppProfileCard :profile="profiles[0]" />
                <div class="swipe-badge swipe-badge--like" :style="{opacity: likeOpacity}">GEFÄLLT MIR</div>
                <div class="swipe-badge swipe-badge--nope" :style="{opacity: nopeOpacity}">NEIN</div>
            </div>
        </div>

        <div class="text-center mt-5" v-if="profiles[0]">
            <v-btn fab color="#E0E0E0" class="mx-3" @click="triggerSwipe('pass')">
                <v-icon color="grey darken-2">{{svg.close}}</v-icon>
            </v-btn>
            <v-btn fab color="#32BCC3" class="mx-3" dark @click="triggerSwipe('like')">
                <v-icon>{{svg.heart}}</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
import AppProfileCard from './AppProfileCard.vue'
import { mdiClose, mdiHeart } from '@mdi/js'

const SWIPE_THRESHOLD = 100

export default {
  components: { AppProfileCard },
  props: {
    profiles: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({
    dragging: false,
    startX: 0,
    dx: 0,
    exiting: null,
    svg: { close: mdiClose, heart: mdiHeart }
  }),
  computed: {
    topStyle () {
      if (this.exiting) {
        const flyX = this.exiting === 'right' ? 600 : -600
        return {
          transform: `translateX(${flyX}px) rotate(${flyX / 20}deg)`,
          transition: 'transform 0.35s ease-out',
          opacity: 0
        }
      }
      return {
        transform: `translateX(${this.dx}px) rotate(${this.dx / 20}deg)`,
        transition: this.dragging ? 'none' : 'transform 0.3s ease-out'
      }
    },
    likeOpacity () {
      return Math.min(Math.max(this.dx / SWIPE_THRESHOLD, 0), 1)
    },
    nopeOpacity () {
      return Math.min(Math.max(-this.dx / SWIPE_THRESHOLD, 0), 1)
    }
  },
  methods: {
    onPointerDown (e) {
      if (this.exiting) return
      this.dragging = true
      this.startX = e.clientX
      if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove (e) {
      if (!this.dragging) return
      this.dx = e.clientX - this.startX
    },
    onPointerUp (e) {
      if (!this.dragging) return
      this.dragging = false
      if (e.currentTarget.releasePointerCapture) {
        try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (err) { /* already released */ }
      }
      if (this.dx > SWIPE_THRESHOLD) this.finishSwipe('like')
      else if (this.dx < -SWIPE_THRESHOLD) this.finishSwipe('pass')
      else this.dx = 0
    },
    triggerSwipe (direction) {
      if (this.exiting || !this.profiles[0]) return
      this.finishSwipe(direction)
    },
    finishSwipe (direction) {
      this.exiting = direction === 'like' ? 'right' : 'left'
      const profile = this.profiles[0]
      setTimeout(() => {
        this.$emit('swipe', { userId: profile.id, direction })
        this.dx = 0
        this.exiting = null
      }, 300)
    }
  }
}
</script>

<style scoped>
.deck-stack {
    position: relative;
    width: 100%;
    max-width: 360px;
    height: 460px;
    margin: 0 auto;
}
.deck-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
.deck-card--top {
    cursor: grab;
    touch-action: none;
}
.swipe-badge {
    position: absolute;
    top: 24px;
    padding: 6px 14px;
    border: 3px solid;
    border-radius: 8px;
    font-weight: bold;
    font-size: 20px;
    pointer-events: none;
}
.swipe-badge--like {
    left: 20px;
    color: #32BCC3;
    border-color: #32BCC3;
    transform: rotate(-15deg);
}
.swipe-badge--nope {
    right: 20px;
    color: #d32f2f;
    border-color: #d32f2f;
    transform: rotate(15deg);
}
</style>
