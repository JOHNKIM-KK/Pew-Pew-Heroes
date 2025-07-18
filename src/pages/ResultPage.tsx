import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ResultPage.css";

interface GameResults {
  score: number;
  zombiesKilled: number;
  timeAlive: number;
  currentWeapon: string;
}

const ResultPage: React.FC = () => {
  const [results, setResults] = useState<GameResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedResults = localStorage.getItem("gameResults");
    if (savedResults) {
      setResults(JSON.parse(savedResults));
      setTimeout(() => setShowResults(true), 500);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getScoreRating = (score: number) => {
    if (score >= 2000)
      return { rating: "전설적!", emoji: "👑", color: "#ffd700" };
    if (score >= 1500)
      return { rating: "훌륭함!", emoji: "🏆", color: "#ff6b6b" };
    if (score >= 1000)
      return { rating: "좋음!", emoji: "⭐", color: "#4ecdc4" };
    if (score >= 500) return { rating: "보통", emoji: "👍", color: "#45b7d1" };
    return { rating: "다시 도전!", emoji: "💪", color: "#95a5a6" };
  };

  const handlePlayAgain = () => {
    navigate("/setup");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const shareResults = () => {
    if (navigator.share && results) {
      navigator.share({
        title: "Pew Pew Heroes 결과",
        text: `🧟‍♂️ ${results.zombiesKilled}마리 처치! ⏱️ ${results.timeAlive}초 생존! 🏆 ${results.score}점!`,
        url: window.location.origin,
      });
    } else {
      // 폴백: 클립보드에 복사
      const text = `🧟‍♂️ Pew Pew Heroes 결과: ${results?.zombiesKilled}마리 처치, ${results?.timeAlive}초 생존, ${results?.score}점!`;
      navigator.clipboard.writeText(text);
      alert("결과가 클립보드에 복사되었습니다!");
    }
  };

  if (!results) {
    return (
      <div className="result-page">
        <div className="loading">결과 로딩중...</div>
      </div>
    );
  }

  const scoreInfo = getScoreRating(results.score);

  return (
    <div className="result-page">
      <div className={`result-content ${showResults ? "show" : ""}`}>
        <div className="game-over-header">
          <h1 className="game-over-title">💀 게임 오버 💀</h1>
          <div className="survival-time">
            ⏱️ {results.timeAlive}초 동안 생존했습니다!
          </div>
        </div>

        <div className="score-section">
          <div className="score-rating" style={{ color: scoreInfo.color }}>
            <span className="rating-emoji">{scoreInfo.emoji}</span>
            <span className="rating-text">{scoreInfo.rating}</span>
          </div>
          <div className="final-score">{results.score}</div>
          <div className="score-label">최종 점수</div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🧟‍♂️</div>
            <div className="stat-number">{results.zombiesKilled}</div>
            <div className="stat-description">좀비 처치</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔫</div>
            <div className="stat-number">
              {results.currentWeapon === "pistol" && "권총"}
              {results.currentWeapon === "flamethrower" && "화염방사기"}
              {results.currentWeapon === "missile" && "미사일"}
            </div>
            <div className="stat-description">마지막 무기</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-number">
              {Math.round(
                (results.zombiesKilled / (results.timeAlive / 60)) * 10
              ) / 10}
            </div>
            <div className="stat-description">분당 처치율</div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn primary" onClick={handlePlayAgain}>
            🎮 다시 플레이
          </button>
          <button className="action-btn secondary" onClick={shareResults}>
            📤 결과 공유
          </button>
          <button className="action-btn tertiary" onClick={handleGoHome}>
            🏠 홈으로
          </button>
        </div>

        <div className="encouragement">
          {results.score >= 1500
            ? "대단해요! 진정한 좀비 헌터입니다! 🏆"
            : "더 오래 생존할 수 있을 거예요! 다시 도전해보세요! 💪"}
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
