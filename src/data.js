export const QUESTIONS = [
  { id: 1, text: '∠APB = ∠CQD이면 부채꼴 AOB와 부채꼴 COD의 넓이는 같다.', answer: 'O' },
  { id: 2, text: '∠APB < ∠CQD이면 현 AB < 현 CD이다.', answer: 'X' },
  { id: 3, text: '∠APB = ∠AQC이면 호 BC의 길이는 호 AB의 2배이다.', answer: 'X' },
  { id: 4, text: '∠APB + ∠AQB = 180°이면 현 AB ≥ 현 CD이다.', answer: 'X' },
  { id: 5, text: '현 AB = 현 CD이면 ∠APB = ∠CQD이다.', answer: 'X' },
  { id: 6, text: '∠APB = ∠CQD이면\n호 AB, 현 AP, 현 BP로 둘러싸인 도형의 넓이는\n호 CD, 현 CQ, 현 DQ로 둘러싸인 도형의 넓이와 같다.', answer: 'X' },
  { id: 7, text: '현 AB의 길이가 현 CD의 2배이면 ∠APB = 2∠CQD이다.', answer: 'X' },
  { id: 8, text: 'P와 Q가 현 AB의 서로 반대쪽에 있으면\n∠APB + ∠AQB = 180°이다.', answer: 'O' },
  { id: 9, text: '사각형 ABCD가 정사각형이면 ∠APC = 90°이다.', answer: 'O' },
  { id: 10, text: '호 BC = 2호 AB, 호 CD = 3호 AB이고 ∠BPC = 30°이면\n∠AOD = 180°이다.', answer: 'X' },
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
