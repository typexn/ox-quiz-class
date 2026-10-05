import { useEffect, useState } from 'react'
import { get, ref, set, update } from 'firebase/database'
import { Brand, JoinQr, ResultBars, Shell, StatusPill, Winners } from '../components'
import { calculateRanking, makeRoomCode, parseAbsent, participantNumbers, QUESTIONS } from '../data'
import { db, ensureAuth } from '../firebase'
import { useLiveValue } from '../hooks'

const savedCode = sessionStorage.getItem('ox-teacher-room') || ''

export default function Teacher() {
  const [code, setCode] = useState(savedCode)
  const [absentInput, setAbsentInput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [room, loading] = useLiveValue(code ? `rooms/${code}/room` : null)
  const [students] = useLiveValue(code ? `rooms/${code}/students` : null, {})
  const [answers] = useLiveValue(code && room?.ownerUid ? `rooms/${code}/answers` : null, {})
  const statsPath = code && room?.resultVisible ? `rooms/${code}/publicStats/${room.currentQuestion}` : null
  const [stats, statsLoading, statsError] = useLiveValue(statsPath, null, { debugLabel: 'Teacher stats' })

  useEffect(() => { ensureAuth().catch(() => setError('Firebase 연결에 실패했습니다. 환경변수와 인증 설정을 확인해 주세요.')) }, [])
  const present = participantNumbers(room?.absentStudents || [])
  const connected = Object.entries(students || {}).filter(([, s]) => s.connected)
  const submitted = room ? Object.keys(answers?.[room.currentQuestion] || {}).length : 0
  const missing = present.filter((n) => !answers?.[room?.currentQuestion]?.[n])
  const question = QUESTIONS[(room?.currentQuestion || 1) - 1]

  async function createRoom(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      const user = await ensureAuth(); const absent = parseAbsent(absentInput); let nextCode = makeRoomCode()
      while ((await get(ref(db, `rooms/${nextCode}/room`))).exists()) nextCode = makeRoomCode()
      const questions = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))
      const eligibleStudents = Object.fromEntries(participantNumbers(absent).map((n) => [n, true]))
      await set(ref(db, `rooms/${nextCode}/room`), { ownerUid: user.uid, status: 'waiting', currentQuestion: 1, activeQuestionKey: '1', absentStudents: absent, eligibleStudents, votingOpen: false, resultVisible: false, totalQuestions: QUESTIONS.length, createdAt: Date.now() })
      await set(ref(db, `rooms/${nextCode}/questions`), questions)
      sessionStorage.setItem('ox-teacher-room', nextCode); setCode(nextCode)
    } catch (err) { setError(err.message || '방을 만들지 못했습니다.') } finally { setBusy(false) }
  }

  async function roomUpdate(values) { setBusy(true); setError(''); try { await update(ref(db, `rooms/${code}/room`), values) } catch (err) { setError(err.message) } finally { setBusy(false) } }
  const startVote = () => roomUpdate({ status: 'voting', votingOpen: true, resultVisible: false })
  const closeVote = () => roomUpdate({ status: 'closed', votingOpen: false })
  async function revealResult() {
    setBusy(true); setError('')
    try {
      const votes = (await get(ref(db, `rooms/${code}/answers/${room.currentQuestion}`))).val() || {}
      const counts = Object.values(votes).reduce((acc, v) => ({ ...acc, [v.answer]: acc[v.answer] + 1 }), { O: 0, X: 0 })
      await update(ref(db, `rooms/${code}`), { [`publicStats/${room.currentQuestion}`]: counts, 'room/status': 'result', 'room/resultVisible': true, 'room/votingOpen': false })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function nextQuestion() {
    await roomUpdate({ currentQuestion: room.currentQuestion + 1, activeQuestionKey: String(room.currentQuestion + 1), status: 'waiting', votingOpen: false, resultVisible: false })
  }
  async function finishQuiz() {
    setBusy(true); setError('')
    try {
      const allAnswers = (await get(ref(db, `rooms/${code}/answers`))).val() || {}
      const ranking = calculateRanking(students, allAnswers)
      await update(ref(db, `rooms/${code}`), { finalResults: { ranking, publishedAt: Date.now() }, 'room/status': 'finished', 'room/votingOpen': false, 'room/resultVisible': false })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  function leaveRoom() { sessionStorage.removeItem('ox-teacher-room'); setCode('') }

  if (!code) return <Shell><Brand label="교사용" /><form className="card setup" onSubmit={createRoom}><p className="eyebrow">NEW CLASS</p><h1>수업방 만들기</h1><label>결석한 학생 번호 <span>쉼표 또는 띄어쓰기로 구분</span><input value={absentInput} onChange={(e) => setAbsentInput(e.target.value)} placeholder="예: 3, 7, 21" /></label><p className="hint">입력하지 않으면 1번부터 28번까지 모두 참여합니다.</p>{error && <p className="error">{error}</p>}<button disabled={busy} className="button button--dark">{busy ? '만드는 중…' : '수업방 만들기'}</button></form></Shell>
  if (loading || !room) return <Shell><p className="loading">수업방을 불러오는 중…</p>{!loading && <button onClick={leaveRoom}>새 방 만들기</button>}</Shell>
  const displayUrl = `${window.location.origin}/display?room=${code}`
  const ranking = room.status === 'finished' ? calculateRanking(students, answers) : []

  return <Shell wide><Brand label="교사용 콘솔" />{error && <p className="error">{error}</p>}<div className="teacher-grid">
    <aside className="sidebar card"><div className="room-code"><span>방 코드</span><strong>{code}</strong></div><div className="qr"><JoinQr code={code} size={170} /><p>학생 입장 QR</p></div><a className="text-link" href={displayUrl} target="_blank" rel="noreferrer">전자칠판 새 창 ↗</a><div className="metric"><span>참여 대상</span><strong>{present.length}명</strong></div><div className="metric"><span>현재 접속</span><strong>{connected.length}명</strong></div><button className="link-button" onClick={leaveRoom}>다른 수업방 만들기</button></aside>
    <section className="teacher-main">{room.status === 'finished' ? <Winners ranking={ranking} total={QUESTIONS.length} showAll /> : <><div className="question-card card"><div className="question-top"><span>문제 {room.currentQuestion} / {QUESTIONS.length}</span><StatusPill status={room.status} /></div><h1>{question.text}</h1><div className="teacher-answer">교사용 정답 <strong>{question.answer}</strong></div>{room.status === 'voting' && <div className="submission"><strong>제출 {submitted} / {present.length}</strong><span>미제출: {missing.length ? missing.join(', ') + '번' : '없음'}</span></div>}{room.status === 'closed' && <p className="closed-message">투표가 마감되었습니다. 아직 결과는 공개되지 않았습니다.</p>}{room.status === 'result' && statsLoading && <p className="closed-message">결과를 불러오는 중…</p>}{room.status === 'result' && statsError && <p className="error">결과를 불러오지 못했습니다. Realtime Database 규칙을 확인해 주세요.</p>}{room.status === 'result' && stats && <ResultBars stats={stats} answer={question.answer} />}</div><div className="controls">{room.status === 'waiting' && <button disabled={busy} onClick={startVote} className="button button--accent">문제 시작</button>}{room.status === 'voting' && <button disabled={busy} onClick={closeVote} className="button button--warn">투표 종료</button>}{room.status === 'closed' && <button disabled={busy} onClick={revealResult} className="button button--accent">결과 공개</button>}{room.status === 'result' && room.currentQuestion < QUESTIONS.length && <button disabled={busy} onClick={nextQuestion} className="button button--dark">다음 문제</button>}{room.status === 'result' && room.currentQuestion === QUESTIONS.length && <button disabled={busy} onClick={finishQuiz} className="button button--dark">최종 결과 발표</button>}</div></>}
      <div className="roster card"><h2>학생 현황</h2><div className="student-chips">{present.map((n) => { const s = students?.[n]; return <span key={n} className={s?.connected ? 'online' : ''}><i />{n}번 {s?.nickname || '미접속'}</span> })}</div></div>
    </section></div></Shell>
}
