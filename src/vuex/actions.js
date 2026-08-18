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
    localStorage.removeItem('activePetId')
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
      .then((res) => {
        commit('SET_AUTH_USER', res.data.user)
        dispatch('FETCH_MY_PETS')
      })
      .catch(() => dispatch('LOGOUT_USER'))
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

  // EIGENE TIERE
  FETCH_MY_PETS: ({ commit, state }) => {
    return Api().get('pets/mine')
      .then((res) => {
        commit('SET_MY_PETS', res.data.pets)
        const stillExists = res.data.pets.some(p => p.id === state.activePetId)
        if (!stillExists) {
          commit('SET_ACTIVE_PET_ID', res.data.pets.length ? res.data.pets[0].id : null)
        }
      })
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  CREATE_PET: ({ commit }, petData) => {
    commit('SET_LOADING', { name: 'form', value: true })
    return Api().post('pets', petData)
      .then((res) => {
        commit('UPSERT_MY_PET', res.data.pet)
        commit('SET_ACTIVE_PET_ID', res.data.pet.id)
        commit('SET_LOADING', { name: 'form', value: false })
        return res.data.pet
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'form', value: false })
        throw error
      })
  },
  UPDATE_PET: ({ commit }, { petId, petData }) => {
    commit('SET_LOADING', { name: 'form', value: true })
    return Api().put(`pets/${petId}`, petData)
      .then((res) => {
        commit('UPSERT_MY_PET', res.data.pet)
        commit('SET_LOADING', { name: 'form', value: false })
        return res.data.pet
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'form', value: false })
        throw error
      })
  },
  DELETE_PET: ({ commit }, petId) => {
    return Api().delete(`pets/${petId}`)
      .then(() => commit('REMOVE_MY_PET', petId))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  UPLOAD_PET_PHOTO: ({ commit }, { petId, formData }) => {
    commit('SET_LOADING', { name: 'user', value: true })
    return Api().post(`pets/${petId}/photo`, formData)
      .then((res) => {
        commit('UPSERT_MY_PET', res.data.pet)
        commit('SET_LOADING', { name: 'user', value: false })
        return res.data.pet
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'user', value: false })
        throw error
      })
  },
  SET_ACTIVE_PET: ({ commit }, petId) => commit('SET_ACTIVE_PET_ID', petId),

  // DISCOVER / SWIPE
  FETCH_DISCOVER: ({ commit }, params) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('discover', { params })
      .then((res) => {
        commit('SET_DISCOVER_PETS', res.data.pets)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  FETCH_NEWEST: ({ commit }, petId) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('discover', { params: { petId, sort: 'newest', limit: 15 } })
      .then((res) => {
        commit('SET_NEWEST_PETS', res.data.pets)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  SWIPE: ({ commit }, { fromPetId, toPetId, direction }) => {
    commit('REMOVE_DISCOVER_PET', toPetId)
    return Api().post('swipes', { fromPetId, toPetId, direction })
      .then((res) => {
        commit('SET_LAST_MATCH_RESULT', res.data.matched ? res.data : null)
        return res.data
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
      })
  },
  CLEAR_MATCH_RESULT: ({ commit }) => commit('SET_LAST_MATCH_RESULT', null),

  // SUCHE
  SEARCH_PETS: ({ commit }, filters) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('search', { params: filters })
      .then((res) => {
        commit('SET_SEARCH_RESULTS', { pets: res.data.pets, total: res.data.total })
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },

  // MERKEN
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
  TOGGLE_BOOKMARK: ({ commit }, { petId, bookmarked }) => {
    const request = bookmarked
      ? Api().delete(`bookmarks/${petId}`)
      : Api().post('bookmarks', { toPetId: petId })
    return request
      .then(() => commit('SET_PET_BOOKMARKED', { petId, value: !bookmarked }))
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

  // LIKES
  FETCH_LIKES: ({ commit }, petId) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Promise.all([
      Api().get('likes/sent', { params: { petId } }),
      Api().get('likes/received', { params: { petId } })
    ])
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

  // MATCHES
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
  UNMATCH: ({ commit }, matchId) => {
    return Api().delete(`matches/${matchId}`)
      .then(() => commit('REMOVE_MATCH', matchId))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },

  // UNTERHALTUNGEN / CHAT (auch ohne Match möglich, chatten mit beliebigen Nutzern)
  FETCH_CONVERSATIONS: ({ commit }) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get('conversations')
      .then((res) => {
        commit('SET_CONVERSATIONS', res.data.conversations)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  },
  START_CONVERSATION: ({ commit }, toUserId) => {
    return Api().post('conversations', { toUserId })
      .then((res) => res.data.conversation)
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        throw error
      })
  },
  FETCH_CONVERSATION: ({ commit }, conversationId) => {
    return Api().get(`conversations/${conversationId}`)
      .then((res) => commit('SET_CURRENT_CONVERSATION', res.data.conversation))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  FETCH_CONVERSATION_MESSAGES: ({ commit }, conversationId) => {
    return Api().get(`conversations/${conversationId}/messages`)
      .then((res) => commit('SET_CONVERSATION_MESSAGES', res.data.messages))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  SEND_CONVERSATION_MESSAGE: ({ commit }, { conversationId, body }) => {
    return Api().post(`conversations/${conversationId}/messages`, { body })
      .then((res) => {
        commit('ADD_CONVERSATION_MESSAGE', res.data.message)
        return res.data.message
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        throw error
      })
  },
  DELETE_CONVERSATION: ({ commit }, conversationId) => {
    return Api().delete(`conversations/${conversationId}`)
      .then(() => commit('REMOVE_CONVERSATION', conversationId))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },

  // BLOCKIEREN
  FETCH_BLOCKED: ({ commit }) => {
    return Api().get('blocks')
      .then((res) => commit('SET_BLOCKED_USERS', res.data.blocked))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },
  BLOCK_USER: ({ commit }, userId) => {
    return Api().post('blocks', { userId })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        throw error
      })
  },
  UNBLOCK_USER: ({ commit }, userId) => {
    return Api().delete(`blocks/${userId}`)
      .then(() => commit('REMOVE_BLOCKED_USER', userId))
      .catch((error) => commit('SET_ERROR', extractError(error)))
  },

  // TIER-PROFIL ANSICHT
  FETCH_PET: ({ commit }, petId) => {
    commit('SET_LOADING', { name: 'ui', value: true })
    return Api().get(`pets/${petId}`)
      .then((res) => {
        commit('SET_VIEWED_PET', res.data.pet)
        commit('SET_LOADING', { name: 'ui', value: false })
      })
      .catch((error) => {
        commit('SET_ERROR', extractError(error))
        commit('SET_LOADING', { name: 'ui', value: false })
      })
  }
}
