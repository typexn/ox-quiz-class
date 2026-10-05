/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Teacher from './pages/Teacher'
import Join from './pages/Join'
import Display from './pages/Display'
import { firebaseConfigured } from './firebase'
import './styles.css'

function Home() {
  return <><main className="home"><div><p className="eyebrow">REALTIME CLASSROOM</p><h1>생각하고,<br /><em>고르고,</em><br />함께 확인해요.</h1><p>교실을 위한 실시간 O/X 투표 퀴즈</p><nav><a href="/teacher">교사용 시작</a><a href="/join">학생 입장</a><a href="/display">전자칠판</a></nav></div><div className="home-mark"><span>O</span><span>X</span></div></main>{!firebaseConfigured && <div className="config-banner">개발 환경 설정 필요 · <code>.env.local</code>에 Firebase 설정값을 입력하세요.</div>}</>
}

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/teacher" element={<Teacher />} /><Route path="/join" element={<Join />} /><Route path="/display" element={<Display />} /><Route path="*" element={<Navigate to="/" />} /></Routes></BrowserRouter></React.StrictMode>)
