import { useEffect, useMemo, useState } from 'react'
import { onDisconnect, ref, runTransaction, serverTimestamp, update } from 'firebase/database'
import { Brand, ResultBars, RoomEntry, Shell, StatusPill, VoteButtons } from '../components'
import { participantNumbers, QUESTIONS } from '../data'
import { db, ensureAuth } from '../firebase'
import { getCodeFromUrl, goToRoom, useLiveValue } from '../hooks'

export default function Join() {
  const [code] = useState(getCodeFromUrl())
  const saved = (() => {
    if (!code) return null
    try {
      const parsed = JSON.parse(localStorage.getItem(`ox-student-${code}`) || 'null')
      return parsed && Number.isInteger(parsed.number) && typeof parsed.nickname === 'string' && typeof parsed.uid === 'string' ? parsed : null
    }
    catch { localStorage.removeItem(`ox-student-${code}`); return null }
  })()
  const [identity, setIdentity] = useState(saved)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [optimisticAnswer, setOptimisticAnswer] = useState(null)
  const validCode = /^[A-Z0-9]{6}$/.test(code)
  const [room, loading, roomError] = useLiveValue(validCode ? `rooms/${code}/room` : null, null, { debugLabel: 'Join room' })
  const [ownAnswer, answerLoading, answerError] = useLiveValue(code && identity && room ? `rooms/${code}/answers/${room.currentQuestion}/${identity.number}` : null, null, { debugLabel: 'Join answer' })
  const [stats] = useLiveValue(code && room?.resultVisible ? `rooms/${code}/publicStats/${room.currentQuestion}` : null)
  const [finalResults] = useLiveValue(code && room?.status === 'finished' ? `rooms/${code}/finalResults` : null)
  const question = QUESTIONS[(room?.currentQuestion || 1) - 1]
  const allowed = useMemo(() => participantNumbers(room?.absentStudents || []), [room?.absentStudents])
  const savedAnswer = ownAnswer?.answer === 'O' || ownAnswer?.answer === 'X' ? ownAnswer.answer : null
  const hasCurrentOptimisticAnswer = Boolean(
    optimisticAnswer &&
    room &&
    optimisticAnswer.questionId === room.currentQuestion &&
    (optimisticAnswer.answer === 'O' || optimisticAnswer.answer === 'X'),
  )
  const selectedAnswer = hasCurrentOptimisticAnswer ? optimisticAnswer?.answer ?? null : savedAnswer

  useEffect(() => {
    if (import.meta.env.DEV) console.debug('[Join] room code parsed', { code, valid: validCode })
  }, [code, validCode])

  useEffect(() => {
    if (!code || !identity) return
    let cancelled = false
    ensureAuth().then(async (user) => {
      if (cancelled || user.uid !== identity.uid) { if (!cancelled) setIdentity(null); return }
      const studentRef = ref(db, `rooms/${code}/students/${identity.number}`)
      await update(studentRef, { connected: true, lastSeen: Date.now() })
      await onDisconnect(studentRef).update({ connected: false, lastSeen: Date.now() })
    }).catch(() => setError('연결을 복구하지 못했습니다.'))
    return () => { cancelled = true }
  }, [code, identity])

  async function enter(e) {
    e.preventDefault(); setBusy(true); setError('')
    const number = Number(e.currentTarget.number.value); const nickname = e.currentTarget.nickname.value.trim().slice(0, 12)
    try {
      const user = await ensureAuth()
      const result = await runTransaction(ref(db, `rooms/${code}/students/${number}`), (current) => {
        if (current && current.uid !== user.uid) return
        return { uid: user.uid, studentNumber: number, nickname, connected: true, joinedAt: current?.joinedAt || Date.now(), lastSeen: Date.now() }
      }, { applyLocally: false })
      if (!result.committed) throw new Error('이미 다른 학생이 사용 중인 번호입니다.')
      await onDisconnect(ref(db, `rooms/${code}/students/${number}`)).update({ connected: false, lastSeen: Date.now() })
      const next = { number, nickname, uid: user.uid }; localStorage.setItem(`ox-student-${code}`, JSON.stringify(next)); setIdentity(next)
    } catch (err) { setError(err.message || '입장하지 못했습니다.') } finally { setBusy(false) }
  }

  async function vote(choice) {
    if (!room?.votingOpen || !identity) return
    const previousAnswer = optimisticAnswer
    setOptimisticAnswer({ questionId: room.currentQuestion, answer: choice })
    setBusy(true); setError('')
    try { await update(ref(db, `rooms/${code}`), { [`answers/${room.currentQuestion}/${identity.number}`]: { answer: choice, studentUid: identity.uid, submittedAt: serverTimestamp() }, [`submitted/${room.currentQuestion}/${identity.number}`]: true }) }
    catch (err) { setOptimisticAnswer(previousAnswer); setError(err.message) } finally { setBusy(false) }
  }

  if (!code) return <Shell><Brand label="학생용" /><RoomEntry title="수업방 입장" onSubmit={goToRoom} /></Shell>
  if (!validCode) return <Shell><Brand label="학생용" /><div className="card empty"><h1>방 코드 형식이 올바르지 않아요</h1><p>영문과 숫자로 된 6자리 방 코드를 확인해 주세요.</p><a className="button button--dark" href="/join">다시 입력</a></div></Shell>
  if (loading) return <Shell><p className="loading">수업방을 찾는 중…</p></Shell>
  if (roomError) return <Shell><Brand label="학생용" /><div className="card empty"><h1>수업방을 불러오지 못했어요</h1><p>{roomError.code === 'PERMISSION_DENIED' || roomError.code === 'database/permission-denied' ? 'Firebase 익명 인증과 Realtime Database 규칙을 확인해 주세요.' : roomError.message}</p><a className="button button--dark" href={`/join?room=${code}`}>다시 시도</a></div></Shell>
  if (!room) return <Shell><Brand label="학생용" /><div className="card empty"><h1>방을 찾을 수 없어요</h1><p>방 코드를 다시 확인해 주세요.</p><a className="button button--dark" href="/join">다시 입력</a></div></Shell>
  if (!identity) return <Shell><Brand label={`방 ${code}`} /><form className="card setup" onSubmit={enter}><p className="eyebrow">JOIN THE CLASS</p><h1>나는 누구인가요?</h1><label>학생 번호<select name="number" required defaultValue=""><option value="" disabled>번호 선택</option>{allowed.map((n) => <option key={n} value={n}>{n}번</option>)}</select></label><label>닉네임<input name="nickname" maxLength="12" placeholder="예: 민수" required /></label>{error && <p className="error">{error}</p>}<button disabled={busy} className="button button--dark">{busy ? '입장 중…' : '입장하기'}</button></form></Shell>
  if (room.status === 'finished') {
    const me = finalResults?.ranking?.find?.((s) => Number(s.number) === identity.number) || finalResults?.ranking?.[identity.number - 1]
    return <Shell><Brand label={`${identity.number}번 ${identity.nickname}`} /><div className="card my-final"><div className="trophy">🎉</div><p className="eyebrow">QUIZ FINISHED</p><h1>수고했어요!</h1><p>내 점수</p><strong>{me?.score ?? 0} <span>/ {QUESTIONS.length}</span></strong></div></Shell>
  }
  return <Shell><Brand label={`${identity.number}번 ${identity.nickname}`} /><section className="student-question"><div className="question-top"><span>문제 {room.currentQuestion} / {QUESTIONS.length}</span><StatusPill status={room.status} /></div><h1>{room.status === 'waiting' ? '선생님이 문제를 시작할 때까지 기다려 주세요.' : question?.text || '문제를 불러오는 중…'}</h1>{room.status === 'voting' && <><p className="muted center">투표 종료 전까지 선택을 바꿀 수 있어요.</p>{answerLoading ? <p className="selection-loading">내 선택을 불러오는 중…</p> : <VoteButtons selected={selectedAnswer} disabled={busy} onVote={vote} />}</>}{room.status === 'closed' && (answerLoading ? <p className="selection-loading">내 선택을 불러오는 중…</p> : <><VoteButtons selected={selectedAnswer} disabled /><div className="locked"><span>✓</span><h2>투표가 마감되었어요</h2><p>{selectedAnswer ? `내 선택은 ${selectedAnswer}입니다.` : '이 문제에는 답을 제출하지 않았습니다.'}</p><p>선생님이 결과를 공개할 때까지 기다려 주세요.</p></div></>)}{room.status === 'result' && <ResultBars stats={stats} answer={question?.answer || '—'} />}{answerError && <p className="error">내 선택을 불러오지 못했습니다. O/X 버튼은 계속 사용할 수 있으며, Realtime Database 규칙을 확인해 주세요.</p>}{error && <p className="error">{error}</p>}</section></Shell>
}
