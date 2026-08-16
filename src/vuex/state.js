export default {
  loading: {
    user: false,
    form: false,
    ui: false
  },
  error: null,
  token: localStorage.getItem('authToken') || '',
  authUser: null,
  discoverProfiles: [],
  newestProfiles: [],
  searchResults: [],
  searchTotal: 0,
  bookmarks: [],
  visitors: [],
  likesSent: [],
  likesReceived: [],
  lastMatchResult: null,
  matches: [],
  currentMatchMessages: [],
  viewedProfile: null
}
