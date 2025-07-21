import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSetupPage.css";

const GameSetupPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        setIsImageLoaded(true);
        // 이미지를 localStorage에 저장하여 게임에서 사용
        localStorage.setItem("playerImage", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleStartGame = () => {
    if (selectedImage) {
      navigate("/game");
    }
  };

  const useDefaultImage = () => {
    // 기본 플레이어 이미지 (간단한 원)
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // 기본 플레이어 그리기
      ctx.fillStyle = "#4ecdc4";
      ctx.beginPath();
      ctx.arc(50, 50, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("👤", 50, 60);
    }

    const defaultImage = canvas.toDataURL();
    setSelectedImage(defaultImage);
    setIsImageLoaded(true);
    localStorage.setItem("playerImage", defaultImage);
  };

  return (
    <div className="game-setup-page">
      <div className="setup-content">
        <h1 className="setup-title">🎮 게임 설정</h1>

        <div className="image-section">
          <h2>당신의 영웅을 선택하세요!</h2>

          <div className="image-upload-area" onClick={handleImageClick}>
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Player character"
                className="player-preview"
              />
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>
                  사진을 업로드하여
                  <br />
                  나만의 영웅 만들기
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: "none" }}
          />

          <div className="image-options">
            <button className="option-button" onClick={handleImageClick}>
              📷 사진 업로드
            </button>
            <button
              className="option-button default-btn"
              onClick={useDefaultImage}
            >
              👤 기본 캐릭터 사용
            </button>
          </div>
        </div>

        <div className="game-info">
          <h3>🎯 게임 규칙</h3>
          <ul>
            <li>🕹️ 조이스틱으로 360도 이동</li>
            <li>🔫 자동으로 총알 발사</li>
            <li>🧟‍♂️ 5초마다 좀비 2마리 생성</li>
            <li>🔥 10초마다 특수 무기 등장</li>
            <li>💀 좀비에 닿으면 게임 오버!</li>
          </ul>
        </div>

        <button
          className={`start-button ${isImageLoaded ? "active" : "disabled"}`}
          onClick={handleStartGame}
          disabled={!isImageLoaded}
        >
          {isImageLoaded ? "🚀 게임 시작!" : "캐릭터를 선택하세요"}
        </button>
      </div>
    </div>
  );
};

export default GameSetupPage;
