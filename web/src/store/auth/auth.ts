import { create } from 'zustand'
import jwtDecode from 'jwt-decode'

import { useAppStore } from 'store/app/app'
import { deleteCookie, getCookie, setCookie } from 'helpers/cookies'
import { login } from 'api/auth/auth'
import { setLocal } from 'helpers/localStorage'
import { queryClient } from 'libs/react-query'

import type { AuthState, AuthStore, UserTokenDecoded } from './types'

const tokenCookieName = 'token'

const initialState: AuthState = {
  token: getCookie(tokenCookieName) || null,
  user: null,
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  login: async ({ email, password }) => {
    useAppStore.getState().setLoading(true)
    try {
      const { data } = await login({ email, password })

      setLocal('email', email)
      get().setToken(data.token)
    } catch (err) {
      useAppStore.getState().handleError({
        title: 'Erro ao fazer login',
        message: 'Verifique suas credenciais e tente novamente',
      })
    } finally {
      useAppStore.getState().setLoading(false)
    }
  },
  logout: async () => {
    try {
      queryClient.clear()
      deleteCookie(tokenCookieName)
      set({ token: null, user: null })
    } catch (err) {
      window.location.reload()
    }
  },
  setToken: (token) => {
    const decodedToken = jwtDecode(token) as UserTokenDecoded

    setCookie({ name: tokenCookieName, value: token })

    get().setUser({
      sub: decodedToken.sub,
    })

    set({ token })
  },
  setUser: (user) => set({ user }),
  clearStore: () => {
    useAppStore.getState().clearStore()
    set(initialState)
    deleteCookie(tokenCookieName)

    window.location.href = '/'
  },
}))
