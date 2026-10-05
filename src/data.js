export const QUESTIONS = [
  { id: 1, text: '지구는 태양 주위를 돈다.', answer: 'O' },
  { id: 2, text: '대한민국의 수도는 부산이다.', answer: 'X' },
  { id: 3, text: '물은 표준 대기압에서 100℃에 끓는다.', answer: 'O' },
  { id: 4, text: '삼각형의 내각의 합은 360도이다.', answer: 'X' },
  { id: 5, text: '한글을 창제한 왕은 세종대왕이다.', answer: 'O' },
  { id: 6, text: '소리는 진공 상태에서도 전달된다.', answer: 'X' },
  { id: 7, text: '광합성 과정에서 산소가 만들어진다.', answer: 'O' },
  { id: 8, text: '1은 소수이다.', answer: 'X' },
  { id: 9, text: '태평양은 지구에서 가장 큰 바다이다.', answer: 'O' },
  { id: 10, text: '모든 포유류는 알을 낳지 않는다.', answer: 'X' },
]

export const makeRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase()
export const makeJoinUrl = (code, origin = window.location.origin) => `${origin}/join?room=${encodeURIComponent(code)}`
export const participantNumbers = (absent = []) => Array.from({ length: 28 }, (_, i) => i + 1).filter((n) => !absent.includes(n))

export function parseAbsent(value) {
  const tokens = value.trim() ? value.split(/[\s,]+/) : []
  const values = tokens.map(Number)
  if (values.some((n) => !Number.isInteger(n) || n < 1 || n > 28)) throw new Error('결석 번호는 1~28 사이의 숫자로 입력해 주세요.')
  return [...new Set(values)].sort((a, b) => a - b)
}

export function calculateRanking(students = {}, answers = {}, questions = QUESTIONS) {
  return Object.entries(students).map(([number, student]) => ({
    number: Number(number), nickname: student.nickname,
    score: questions.reduce((sum, q) => sum + (answers[q.id]?.[number]?.answer === q.answer ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score || a.number - b.number)
}
