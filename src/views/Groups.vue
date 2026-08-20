<template>
  <v-container class="page-container py-6" style="max-width:1000px; min-height:100vh;">
    <div class="content-board d-flex align-center mb-4"><div><div class="headline font-weight-bold text-secundario">Community-Gruppen</div><div>Finde Menschen über gemeinsame Interessen und Orte.</div></div><v-spacer></v-spacer><v-btn color="#32BCC3" dark @click="createDialog=true">Gruppe gründen</v-btn></div>
    <v-row><v-col v-for="group in groups" :key="group.id" cols="12" md="6"><v-card height="100%">
      <v-card-title>{{group.name}}</v-card-title><v-card-subtitle>{{group.city || 'Überregional'}} · {{group.memberCount}} Mitglieder</v-card-subtitle>
      <v-card-text>{{group.description}}</v-card-text><v-card-actions>
        <v-btn text color="#168890" @click="openGroup(group)">Pinnwand</v-btn><v-spacer></v-spacer>
        <v-btn text :color="group.joined ? 'grey' : '#168890'" @click="toggleMembership(group)">{{group.joined ? 'Verlassen' : 'Beitreten'}}</v-btn>
      </v-card-actions></v-card></v-col></v-row>
    <v-dialog v-model="groupDialog" max-width="700"><v-card class="pa-4" v-if="selected">
      <div class="title mb-3">{{selected.name}}</div>
      <v-textarea v-if="selected.joined" v-model="postBody" outlined rows="2" counter="1000" label="In der Gruppe posten"></v-textarea>
      <v-btn v-if="selected.joined" color="#32BCC3" dark :disabled="!postBody.trim()" @click="post">Posten</v-btn>
      <v-alert v-else type="info" text>Bitte tritt der Gruppe bei, um mitzuschreiben.</v-alert>
      <v-divider class="my-4"></v-divider><div v-for="postItem in posts" :key="postItem.id" class="mb-4"><strong>@{{postItem.author.handle}}</strong><div class="caption">{{formatDate(postItem.createdAt)}}</div><div class="mt-1">{{postItem.body}}</div></div>
    </v-card></v-dialog>
    <v-dialog v-model="createDialog" max-width="500"><v-card class="pa-4"><div class="title mb-3">Neue Gruppe</div><v-text-field v-model="form.name" label="Name" counter="80"></v-text-field><v-text-field v-model="form.city" label="Ort (optional)" counter="100"></v-text-field><v-textarea v-model="form.description" label="Beschreibung" counter="500"></v-textarea><div class="text-right"><v-btn text @click="createDialog=false">Abbrechen</v-btn><v-btn color="#32BCC3" dark @click="createGroup">Gründen</v-btn></div></v-card></v-dialog>
  </v-container>
</template>
<script>
import Api from '@/service/Api'
export default {
  data: () => ({ groups: [], selected: null, posts: [], postBody: '', groupDialog: false, createDialog: false, form: { name: '', city: '', description: '' } }),
  created () { this.load() },
  methods: {
    load () { return Api().get('groups').then(({ data }) => { this.groups = data.groups }) },
    toggleMembership (group) { const request = group.joined ? Api().delete(`groups/${group.id}/membership`) : Api().post(`groups/${group.id}/membership`); request.then(this.load) },
    openGroup (group) { this.selected = group; this.groupDialog = true; Api().get(`groups/${group.id}/posts`).then(({ data }) => { this.posts = data.posts }) },
    post () { Api().post(`groups/${this.selected.id}/posts`, { body: this.postBody }).then(() => { this.postBody = ''; this.openGroup(this.selected) }) },
    createGroup () { Api().post('groups', this.form).then(() => { this.createDialog = false; this.form = { name: '', city: '', description: '' }; this.load() }) },
    formatDate (value) { const normalized = /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`; return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(normalized)) }
  }
}
</script>
