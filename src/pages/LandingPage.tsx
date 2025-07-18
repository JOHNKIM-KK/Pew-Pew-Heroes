import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate("/setup"), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="game-title">🧟‍♂️ Pew Pew Heroes 🔫</h1>
        <div className="zombie-emoji">🧟‍♂️🧟‍♀️🧟‍♂️</div>
        <p className="game-subtitle">좀비에서 살아남아라!</p>

        <div className="loading-container">
          <div className="loading-bar">
            <div
              className="loading-progress"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <p className="loading-text">Loading... {loadingProgress}%</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
