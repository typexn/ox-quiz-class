import { useState } from 'react'
import { Brand, JoinQr, ResultBars, RoomEntry, Shell, VoteButtons, Winners } from '../components'
import { QUESTIONS } from '../data'
import { getCodeFromUrl, goToRoom, useLiveValue } from '../hooks'

export default function Display() {
  const [code] = useState(getCodeFromUrl())
  const [room, loading] = useLiveValue(code ? `rooms/${code}/room` : null)
  const [students] = useLiveValue(code ? `rooms/${code}/students` : null, {})
  const [stats] = useLiveValue(code && room?.resultVisible ? `rooms/${code}/publicStats/${room.currentQuestion}` : null)
  const [submitted] = useLiveValue(code && room ? `rooms/${code}/submitted/${room.currentQuestion}` : null, {})
  const [finalResults] = useLiveValue(code && room?.status === 'finished' ? `rooms/${code}/finalResults` : null)
  const submittedTotal = Object.keys(submitted || {}).length
  const connectedTotal = Object.values(students || {}).filter((s) => s.connected).length
  const question = QUESTIONS[(room?.currentQuestion || 1) - 1]
  if (!code) return <Shell><Brand label="전자칠판" /><RoomEntry title="수업방 연결" onSubmit={goToRoom} /></Shell>
  if (loading) return <Shell><p className="loading">전자칠판을 연결하는 중…</p></Shell>
  if (!room) return <Shell><div className="card empty"><h1>방을 찾을 수 없어요</h1><a href="/display">방 코드 다시 입력</a></div></Shell>
  if (room.status === 'finished') return <main className="display display--final"><Winners ranking={finalResults?.ranking || []} total={QUESTIONS.length} /></main>
  return <main className="display"><header><span>LIVE O/X</span><strong>방 코드 {code}</strong></header><div className="display-question"><p>문제 {room.currentQuestion} <span>/ {QUESTIONS.length}</span></p><h1>{room.status === 'waiting' ? '곧 문제가 시작됩니다' : question.text}</h1></div>{room.status === 'waiting' && <div className="display-waiting-qr"><JoinQr code={code} size={330} /><div><strong>QR을 찍고 입장하세요</strong><span>방 코드 <b>{code}</b></span><span>현재 접속 <b>{connectedTotal}명</b></span></div></div>}{room.status === 'voting' && <><VoteButtons displayOnly /><div className="display-progress"><strong>투표 중…</strong><span>제출 {submittedTotal} / {room.totalQuestions ? (28 - (room.absentStudents?.length || 0)) : connectedTotal}</span></div></>}{room.status === 'closed' && <div className="display-wait"><div className="lock">✓</div><p>투표 마감 · 결과 집계 중</p></div>}{room.status === 'result' && <ResultBars stats={stats} answer={question.answer} large />}<footer>접속 {connectedTotal}명 {room.status === 'result' && `· 제출 ${submittedTotal}명`}</footer></main>
}
