import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, ensureAuth } from './firebase'

export function useLiveValue(path, initial = null, options = {}) {
  const [result, setResult] = useState({ path: null, value: initial, error: null })
  useEffect(() => {
    if (!path || !db) return undefined
    let active = true
    let unsubscribe = null

    ensureAuth().then((user) => {
      if (!active) return
      if (import.meta.env.DEV && options.debugLabel) console.debug(`[${options.debugLabel}] auth ready`, user.uid)
      unsubscribe = onValue(ref(db, path), (snapshot) => {
        if (!active) return
        const nextValue = snapshot.exists() ? snapshot.val() : initial
        setResult({ path, value: nextValue, error: null })
        if (import.meta.env.DEV && options.debugLabel) console.debug(`[${options.debugLabel}] ${snapshot.exists() ? 'data found' : 'data missing'}`, path)
      }, (firebaseError) => {
        if (!active) return
        setResult({ path, value: initial, error: firebaseError })
        if (import.meta.env.DEV && options.debugLabel) console.error(`[${options.debugLabel}] read failed`, firebaseError)
      })
    }).catch((authError) => {
      if (!active) return
      setResult({ path, value: initial, error: authError })
      if (import.meta.env.DEV && options.debugLabel) console.error(`[${options.debugLabel}] auth failed`, authError)
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [path]) // eslint-disable-line react-hooks/exhaustive-deps
  const configurationError = path && !db ? new Error('Firebase 환경변수가 설정되지 않았습니다.') : null
  const hasCurrentResult = result.path === path
  const value = hasCurrentResult ? result.value : initial
  const loading = Boolean(path && db && !hasCurrentResult)
  const error = hasCurrentResult ? result.error : null
  return [value, loading, error || configurationError]
}

export const getCodeFromUrl = () => new URLSearchParams(window.location.search).get('room')?.trim().toUpperCase() || ''
export function goToRoom(code) {
  const url = new URL(window.location.href)
  url.searchParams.set('room', code.trim().toUpperCase())
  window.location.href = url.toString()
}
