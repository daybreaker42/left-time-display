import { useState, useEffect, useCallback } from 'react'
import './App.css'

// 시간 인터페이스 정의
interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  totalDuration: number;
}

function App() {
  // 시작 시간과 종료 시간 상태 관리
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  
  // 타이머 관련 상태
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  // 반응형 상태 감지
  const [isMobile, setIsMobile] = useState(false)

  // 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // 시간 차이 계산 함수
  const calculateTimeRemaining = useCallback((start: string, end: string): TimeRemaining | null => {
    if (!start || !end) return null;
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    
    // 전체 기간 계산 (초 단위)
    const totalDuration = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    
    // 남은 시간 계산 (초 단위)
    const remainingMs = endDate.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    
    if (totalSeconds <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        totalDuration
      };
    }
    
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds,
      totalDuration
    };
  }, []);

  // 타이머 시작 함수
  const startTimer = useCallback(() => {
    if (!startTime || !endTime) {
      alert('시작 시간과 종료 시간을 모두 입력해주세요!');
      return;
    }
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    if (startDate >= endDate) {
      alert('종료 시간이 시작 시간보다 나중이어야 합니다!');
      return;
    }
    
    setIsTimerActive(true);
    setIsCompleted(false);
  }, [startTime, endTime]);

  // 타이머 정지 함수
  const stopTimer = useCallback(() => {
    setIsTimerActive(false);
    setTimeRemaining(null);
  }, []);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter로 타이머 시작/정지
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!isTimerActive) {
          startTimer()
        } else {
          stopTimer()
        }
      }

      // Escape로 타이머 정지
      if (event.key === 'Escape' && isTimerActive) {
        stopTimer()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isTimerActive, startTimer, stopTimer])

  // 타이머 업데이트 (1초마다 실행)
  useEffect(() => {
    let interval: number | null = null;
    
    if (isTimerActive) {
      interval = setInterval(() => {
        const remaining = calculateTimeRemaining(startTime, endTime);
        setTimeRemaining(remaining);
        
        // 시간이 다 되었을 때
        if (remaining && remaining.totalSeconds <= 0) {
          setIsCompleted(true);
          setIsTimerActive(false);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, startTime, endTime, calculateTimeRemaining]);

  // 진행률 계산 (0-100%)
  const getProgress = (): number => {
    if (!timeRemaining || timeRemaining.totalDuration <= 0) return 0;
    
    const elapsed = timeRemaining.totalDuration - timeRemaining.totalSeconds;
    return Math.min(100, Math.max(0, (elapsed / timeRemaining.totalDuration) * 100));
  };

  // 원형 프로그레스 바 생성 (반응형 크기)
  const renderCircularProgress = () => {
    const progress = getProgress();
    // 화면 크기에 따라 반지름 조정
    const radius = isMobile ? (window.innerWidth <= 479 ? 90 : 110) : 120;
    const strokeWidth = isMobile ? 10 : 12;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="circular-progress">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="progress-ring"
        >
          {/* 배경 원 */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* 진행률 원 */}
          <circle
            stroke={isCompleted ? "#10b981" : "#3b82f6"}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="progress-circle"
          />
        </svg>
        <div className="progress-text">
          <div className="progress-percentage">{Math.round(progress)}%</div>
          {timeRemaining && (
            <div className="time-display">
              <div className="time-large">
                {String(timeRemaining.hours).padStart(2, '0')}:
                {String(timeRemaining.minutes).padStart(2, '0')}:
                {String(timeRemaining.seconds).padStart(2, '0')}
              </div>
              {timeRemaining.days > 0 && (
                <div className="days-display">{timeRemaining.days}일 남음</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 빠른 시간 설정 함수 (모바일 최적화)
  const setQuickTime = (hours: number) => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // ISO 형식으로 변환 (datetime-local input에 맞춤)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}`;
    };

    setStartTime(formatDateTime(start));
    setEndTime(formatDateTime(end));
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">🏆 해커톤 타이머</h1>
        
        {/* 빠른 설정 버튼들 (모바일에서 유용) */}
        {!isTimerActive && (
          <div className="quick-setup">
            <p className="quick-setup-label">빠른 설정</p>
            <div className="quick-buttons">
              <button
                className="quick-btn"
                onClick={() => setQuickTime(1)}
                title="1시간 타이머"
              >
                1시간
              </button>
              <button
                className="quick-btn"
                onClick={() => setQuickTime(2)}
                title="2시간 타이머"
              >
                2시간
              </button>
              <button
                className="quick-btn"
                onClick={() => setQuickTime(4)}
                title="4시간 타이머"
              >
                4시간
              </button>
              <button
                className="quick-btn"
                onClick={() => setQuickTime(8)}
                title="8시간 타이머"
              >
                8시간
              </button>
            </div>
          </div>
        )}

        {/* 시간 입력 섹션 */}
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="start-time">시작 시간</label>
            <input
              id="start-time"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isTimerActive}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="end-time">종료 시간</label>
            <input
              id="end-time"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={isTimerActive}
            />
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="control-section">
          {!isTimerActive ? (
            <button
              onClick={startTimer}
              className="btn btn-primary"
              title={isMobile ? "타이머 시작" : "타이머 시작 (Ctrl+Enter)"}
            >
              타이머 시작
            </button>
          ) : (
              <button
                onClick={stopTimer}
                className="btn btn-secondary"
                title={isMobile ? "타이머 정지" : "타이머 정지 (Escape)"}
              >
              타이머 정지
            </button>
          )}
        </div>

        {/* 타이머 디스플레이 */}
        {(isTimerActive || isCompleted) && (
          <div className="timer-section">
            {isCompleted ? (
              <div className="completion-message">
                <h2>🎉 해커톤 완료!</h2>
                <p>수고하셨습니다!</p>
              </div>
            ) : (
              renderCircularProgress()
            )}
          </div>
        )}

        {/* 상태 정보 */}
        {timeRemaining && !isCompleted && (
          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-label">전체 시간</span>
              <span className="stat-value">
                {Math.floor(timeRemaining.totalDuration / 3600)}시간 {Math.floor((timeRemaining.totalDuration % 3600) / 60)}분
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">남은 시간</span>
              <span className="stat-value">
                {timeRemaining.totalSeconds}초
              </span>
            </div>
          </div>
        )}

        {/* 키보드 단축키 안내 (데스크톱에서만 표시) */}
        {!isMobile && (
          <div className="keyboard-shortcuts">
            <p className="shortcuts-text">
              💡 <strong>Ctrl+Enter</strong>: 타이머 시작/정지 | <strong>Escape</strong>: 타이머 정지
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
