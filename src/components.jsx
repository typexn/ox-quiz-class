import { QRCodeSVG } from 'qrcode.react'
import { makeJoinUrl } from './data'

export function Shell({ children, wide = false }) { return <main className={`shell ${wide ? 'shell--wide' : ''}`}>{children}</main> }
export function Brand({ label }) { return <header className="brand"><a href="/">OX<span>!</span></a><p>{label}</p></header> }
export function StatusPill({ status }) {
  const labels = { waiting: '대기 중', voting: '투표 중', closed: '투표 마감', result: '결과 공개', finished: '수업 종료' }
  return <span className={`status status--${status}`}>{labels[status] || status}</span>
}
export function RoomEntry({ title, onSubmit }) {
  return <form className="card entry" onSubmit={(e) => { e.preventDefault(); onSubmit(e.currentTarget.room.value) }}><p className="eyebrow">ROOM CODE</p><h1>{title}</h1><p className="muted">선생님 화면에 표시된 6자리 방 코드를 입력하세요.</p><input name="room" aria-label="방 코드" placeholder="예: A1B2C3" maxLength="6" autoCapitalize="characters" required /><button className="button button--dark">입장하기</button></form>
}
export function JoinQr({ code, size = 170 }) {
  return <div className="join-qr" role="img" aria-label={`방 코드 ${code} 학생 입장 QR 코드`}><QRCodeSVG value={makeJoinUrl(code)} size={size} level="M" marginSize={2} /></div>
}
export function VoteButtons({ selected, disabled, onVote, displayOnly = false }) {
  return <div className={`vote-buttons ${displayOnly ? 'vote-buttons--display' : 'vote-buttons--student'}`}>{['O', 'X'].map((choice) => { const isSelected = selected === choice; return <button key={choice} type="button" disabled={disabled || displayOnly} aria-pressed={displayOnly ? undefined : isSelected} aria-label={displayOnly ? choice : `${choice}${isSelected ? ', 선택됨' : ', 선택되지 않음'}`} onClick={() => onVote?.(choice)} className={`vote vote--${choice.toLowerCase()} ${isSelected ? 'is-selected' : 'is-unselected'}`}><span className="vote__letter">{choice}</span>{!displayOnly && <span className="vote__state" aria-hidden="true">{isSelected ? '✓ 선택됨' : '선택하기'}</span>}</button> })}</div>
}
export function ResultBars({ stats, answer, large = false }) {
  const total = (stats?.O || 0) + (stats?.X || 0)
  return <section className={`results ${large ? 'results--large' : ''}`}>{['O', 'X'].map((choice) => { const count = stats?.[choice] || 0; const pct = total ? Math.round(count / total * 100) : 0; return <div className="result-row" key={choice}><div className="result-meta"><strong>{choice}</strong><span>{count}명 · {pct}%</span></div><div className="bar"><div className={`bar__fill bar__fill--${choice.toLowerCase()}`} style={{ width: `${pct}%` }} /></div></div> })}<div className="answer-reveal">정답 <strong>{answer}</strong></div></section>
}
export function Winners({ ranking, total, showAll = false }) {
  const best = ranking[0]?.score ?? 0; const winners = ranking.filter((s) => s.score === best)
  return <section className="final-card"><div className="trophy">🏆</div><p className="eyebrow">오늘의 O/X 퀴즈</p><h1>{winners.length > 1 ? '공동 최다 정답자' : '최다 정답자'}</h1><div className="winner-list">{winners.map((s) => <div key={s.number}><strong>{s.number}번 {s.nickname}</strong></div>)}</div><p className="winner-score">{best} / {total}<span>정답률 {Math.round(best / total * 100)}%</span></p>{showAll && <div className="ranking"><h2>전체 순위</h2>{ranking.map((s, i) => <div key={s.number}><span>{i + 1}위 · {s.number}번 {s.nickname}</span><strong>{s.score}점</strong></div>)}</div>}</section>
}
