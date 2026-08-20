<template><v-container class="page-container py-8"><v-card class="pa-6 mx-auto legal-copy" max-width="900"><h1 class="mb-6">{{title}}</h1><slot></slot></v-card></v-container></template>
<script>export default { props: { title: { type: String, required: true } } }</script>
<style scoped>.legal-copy{line-height:1.65}.legal-copy ::v-deep h2{font-size:1.25rem;margin:1.6rem 0 .5rem}.legal-copy ::v-deep h3{font-size:1.05rem;margin:1.2rem 0 .4rem}</style>
