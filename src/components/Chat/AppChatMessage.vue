<template>
    <div class="d-flex mb-2" :class="isOwn ? 'justify-end' : 'justify-start'">
        <div
            class="pa-3"
            :class="isOwn ? 'primario white--text' : 'background'"
            style="border-radius: 16px; max-width: 75%;"
        >
            <div>{{message.body}}</div>
            <div class="caption mt-1" :class="isOwn ? 'white--text' : 'grey--text'" style="opacity:0.8;">
                {{message.createdAt | day}}
            </div>
        </div>
    </div>
</template>

<script>
export default {
  props: {
    message: {
      type: Object,
      required: true
    },
    isOwn: {
      type: Boolean,
      default: false
    }
  }
}
</script>
