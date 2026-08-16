import axios from 'axios'
import Api from '../service/Api'

function extractError (error) {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error
  }
  return 'Es ist ein Netzwerkfehler aufgetreten. Läuft der Server?'
}

export default {

  // AUTH
  SIGN_IN: ({ dispatch, commit }, { email, password }) => new Promise((resolve, reject) => {
    commit('SET_LOADING', { name: 'form', value: true })
    Api().post('auth/login', { email, password })
      .then((res) => {
        dispatch('AUTH_SUCCESS', res.data.token)
        commit('SET_AUTH_USER', res.data.user)
        commit('SET_LOADING', { name: 'form', value: false })
        resolve()
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'form', value: false })
        reject(error)
      })
  }),
  SIGN_UP: ({ dispatch, commit }, formNewUser) => new Promise((resolve, reject) => {
    commit('SET_LOADING', { name: 'form', value: true })
    Api().post('auth/signup', formNewUser)
      .then((res) => {
        dispatch('AUTH_SUCCESS', res.data.token)
        commit('SET_AUTH_USER', res.data.user)
        commit('SET_LOADING', { name: 'form', value: false })
        resolve(res)
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'form', value: false })
        reject(error)
      })
  }),
  LOGOUT_USER: ({ commit }) => new Promise((resolve) => {
    localStorage.removeItem('authToken')
    delete axios.defaults.headers.common['Authorization']
    commit('SET_USER_UNAUTHENTICATED')
    resolve()
  }),
  AUTH_SUCCESS: ({ commit }, token) => {
    localStorage.setItem('authToken', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    commit('SET_AUTHORIZATION', token)
  },
  AUTH_USER: ({ commit, dispatch }, token) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    commit('SET_AUTHORIZATION', token)
    dispatch('FETCH_AUTH_USER')
  },
  CLEAR_ERROR: ({ commit }) => commit('SET_CLEAR_ERROR'),

  FETCH_AUTH_USER: ({ commit, dispatch }) => {
    Api().get('me')
      .then((res) => commit('SET_AUTH_USER', res.data.user))
      .catch(() => dispatch('LOGOUT_USER'))
  },

  // EDIT AUTH USER PROFILE
  UPLOAD_IMAGE: ({ commit }, formData) => {
    commit('SET_LOADING', { name: 'user', value: true })
    return Api().post('me/photo', formData)
      .then((res) => {
        commit('SET_AUTH_USER', res.data.user)
        commit('SET_LOADING', { name: 'user', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'user', value: false })
        throw error
      })
  },
  EDIT_USER_DETAILS: ({ commit }, userDetails) => new Promise((resolve, reject) => {
    commit('SET_LOADING', { name: 'form', value: true })
    Api().put('me', userDetails)
      .then((res) => {
        commit('SET_AUTH_USER', res.data.user)
        commit('SET_LOADING', { name: 'form', value: false })
        resolve(res)
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'form', value: false })
        reject(error)
      })
  }),

  // DISCOVER / SWIPE
  FETCH_DISCOVER: ({ commit }, filters) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('discover', { params: filters })
      .then((res) => {
        commit('SET_DISCOVER_PROFILES', res.data.profiles)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  FETCH_NEWEST: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('discover', { params: { sort: 'newest', limit: 15 } })
      .then((res) => {
        commit('SET_NEWEST_PROFILES', res.data.profiles)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  SWIPE: ({ commit }, { toUserId, direction }) => {
    commit('REMOVE_DISCOVER_PROFILE', toUserId)
    return Api().post('swipes', { toUserId, direction })
      .then((res) => {
        commit('SET_LAST_MATCH_RESULT', res.data.matched ? res.data : null)
        return res.data
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
      })
  },
  CLEAR_MATCH_RESULT: ({ commit }) => commit('SET_LAST_MATCH_RESULT', null),

  // SEARCH
  SEARCH_PROFILES: ({ commit }, filters) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('search', { params: filters })
      .then((res) => {
        commit('SET_SEARCH_RESULTS', { profiles: res.data.profiles, total: res.data.total })
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },

  // BOOKMARKS ("MERKEN")
  FETCH_BOOKMARKS: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('bookmarks')
      .then((res) => {
        commit('SET_BOOKMARKS', res.data.bookmarks)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  TOGGLE_BOOKMARK: ({ commit }, { userId, bookmarked }) => {
    const request = bookmarked
      ? Api().delete(`bookmarks/${userId}`)
      : Api().post('bookmarks', { toUserId: userId })
    return request
      .then(() => commit('SET_PROFILE_BOOKMARKED', { userId, value: !bookmarked }))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },

  // PROFILBESUCHER
  FETCH_VISITORS: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('me/visitors')
      .then((res) => {
        commit('SET_VISITORS', res.data.visitors)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },

  // LIKES (GESENDET / ERHALTEN)
  FETCH_LIKES: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Promise.all([Api().get('likes/sent'), Api().get('likes/received')])
      .then(([sentRes, receivedRes]) => {
        commit('SET_LIKES_SENT', sentRes.data.likes)
        commit('SET_LIKES_RECEIVED', receivedRes.data.likes)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },

  // UNMATCH
  UNMATCH: ({ commit }, matchId) => {
    return Api().delete(`matches/${matchId}`)
      .then(() => commit('REMOVE_MATCH', matchId))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },

  // MATCHES / CHAT
  FETCH_MATCHES: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('matches')
      .then((res) => {
        commit('SET_MATCHES', res.data.matches)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  FETCH_MATCH_MESSAGES: ({ commit }, matchId) => {
    return Api().get(`matches/${matchId}/messages`)
      .then((res) => commit('SET_MATCH_MESSAGES', res.data.messages))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  SEND_MATCH_MESSAGE: ({ commit }, { matchId, body }) => {
    return Api().post(`matches/${matchId}/messages`, { body })
      .then((res) => {
        commit('ADD_MATCH_MESSAGE', res.data.message)
        return res.data.message
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
      })
  },

  // VIEW OTHER PROFILE
  FETCH_USER_PROFILE: ({ commit }, handle) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get(`users/${handle}`)
      .then((res) => {
        commit('SET_VIEWED_PROFILE', res.data.user)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  }
}
