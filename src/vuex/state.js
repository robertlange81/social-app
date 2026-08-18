export default {
  loading: {
    user: false,
    form: false,
    ui: false
  },
  error: null,
  token: localStorage.getItem('authToken') || '',
  authUser: null,
  myPets: [],
  activePetId: localStorage.getItem('activePetId') || null,
  discoverPets: [],
  newestPets: [],
  searchResults: [],
  searchTotal: 0,
  bookmarks: [],
  visitors: [],
  likesSent: [],
  likesReceived: [],
  lastMatchResult: null,
  matches: [],
  conversations: [],
  currentConversation: null,
  currentConversationMessages: [],
  blockedUsers: [],
  viewedPet: null
}
