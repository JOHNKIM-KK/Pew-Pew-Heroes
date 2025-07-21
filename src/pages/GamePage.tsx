import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Joystick from "../components/Joystick";
import { useZombies } from "../hooks/useZombies";
import { useWeapons } from "../hooks/useWeapons";
import {
  checkPlayerZombieCollision,
  checkBulletZombieCollisions,
} from "../utils/collision";
import type {
  GameStats,
  JoystickDirection,
  Position,
} from "../types/GameTypes";
import "./GamePage.css";

const GamePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // 게임 상태 - ref로 관리하여 의존성 문제 해결
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    zombiesKilled: 0,
    timeAlive: 0,
    currentWeapon: "pistol",
  });
  const gameStatsRef = useRef(gameStats);
  gameStatsRef.current = gameStats;

  const gamePageRef = useRef<HTMLDivElement>(null);

  const [playerPosition, setPlayerPosition] = useState<Position>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const playerPositionRef = useRef(playerPosition);
  playerPositionRef.current = playerPosition;

  const [joystickDirection, setJoystickDirection] = useState<JoystickDirection>(
    {
      x: 0,
      y: 0,
      distance: 0,
      angle: 0,
    }
  );
  const joystickDirectionRef = useRef(joystickDirection);
  joystickDirectionRef.current = joystickDirection;

  const [playerImage, setPlayerImage] = useState<HTMLImageElement | null>(null);

  // 캔버스 크기
  const [canvasSize, setCanvasSize] = useState<Position>({
    x: window.innerWidth,
    y: window.innerHeight,
  });

  // 좀비 시스템
  const {
    zombies,
    startZombieSpawning,
    stopZombieSpawning,
    updateZombies,
    damageZombie,
    clearZombies,
  } = useZombies({
    canvasWidth: canvasSize.x,
    canvasHeight: canvasSize.y,
    playerPosition,
    onZombieKilled: () => {
      setGameStats((prev) => ({
        ...prev,
        zombiesKilled: prev.zombiesKilled + 1,
        score: prev.score + 50,
      }));
    },
  });

  // 무기 시스템
  const {
    bullets,
    weaponDrops,
    autoFire,
    updateBullets,
    checkWeaponPickup,
    removeBullet,
    startWeaponSpawning,
    stopWeaponSpawning,
    clearAll: clearWeapons,
  } = useWeapons({
    canvasWidth: canvasSize.x,
    canvasHeight: canvasSize.y,
    playerPosition,
    currentWeapon: gameStats.currentWeapon,
    onWeaponPickup: (weaponType) => {
      setGameStats((prev) => ({
        ...prev,
        currentWeapon: weaponType,
        score: prev.score + 50,
      }));
    },
  });

  // 함수들을 ref로 관리
  const zombiesRef = useRef(zombies);
  const bulletsRef = useRef(bullets);
  const updateZombiesRef = useRef(updateZombies);
  const autoFireRef = useRef(autoFire);
  const updateBulletsRef = useRef(updateBullets);
  const checkWeaponPickupRef = useRef(checkWeaponPickup);
  const damageZombieRef = useRef(damageZombie);
  const removeBulletRef = useRef(removeBullet);

  // ref 업데이트
  zombiesRef.current = zombies;
  bulletsRef.current = bullets;
  updateZombiesRef.current = updateZombies;
  autoFireRef.current = autoFire;
  updateBulletsRef.current = updateBullets;
  checkWeaponPickupRef.current = checkWeaponPickup;
  damageZombieRef.current = damageZombie;
  removeBulletRef.current = removeBullet;

  // 플레이어 이미지 로드
  useEffect(() => {
    const playerImageData = localStorage.getItem("playerImage");
    if (!playerImageData) {
      navigate("/setup");
      return;
    }

    const img = new Image();
    img.onload = () => {
      setPlayerImage(img);
    };
    img.onerror = () => {
      console.error("플레이어 이미지 로드 실패");
    };
    img.src = playerImageData;
  }, [navigate]);

  // 캔버스 크기 설정
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCanvasSize({ x: canvas.width, y: canvas.height });

      // 플레이어 위치를 화면 중앙으로 설정
      setPlayerPosition({
        x: canvas.width / 2,
        y: canvas.height / 2,
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // 게임 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 게임 시작
    const startTime = Date.now();
    startZombieSpawning();
    startWeaponSpawning();

    // 게임 시간 업데이트
    const timeInterval = setInterval(() => {
      setGameStats((prev) => ({
        ...prev,
        timeAlive: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    // 게임 루프
    const gameLoop = (currentTime: number) => {
      if (currentTime - lastTimeRef.current >= 16) {
        // 60fps
        // 플레이어 업데이트
        if (joystickDirectionRef.current.distance > 0) {
          const speed = 3;
          setPlayerPosition((prev) => {
            const newX = Math.max(
              30,
              Math.min(
                canvas.width - 30,
                prev.x + joystickDirectionRef.current.x * speed
              )
            );
            const newY = Math.max(
              30,
              Math.min(
                canvas.height - 30,
                prev.y + joystickDirectionRef.current.y * speed
              )
            );
            return { x: newX, y: newY };
          });
        }

        // 게임 시스템 업데이트
        updateZombiesRef.current();
        autoFireRef.current(zombiesRef.current);
        updateBulletsRef.current();
        checkWeaponPickupRef.current();

        // 충돌 감지
        const bulletZombieCollisions = checkBulletZombieCollisions(
          bulletsRef.current,
          zombiesRef.current
        );
        bulletZombieCollisions.forEach(({ bullet, zombie }) => {
          damageZombieRef.current(zombie.id, bullet.damage);
          removeBulletRef.current(bullet.id);
        });

        // 플레이어-좀비 충돌 확인
        const hitZombie = checkPlayerZombieCollision(
          playerPositionRef.current,
          25,
          zombiesRef.current
        );
        if (hitZombie) {
          localStorage.setItem(
            "gameResults",
            JSON.stringify(gameStatsRef.current)
          );
          navigate("/result");
          return;
        }

        // 화면 그리기
        drawGameRef.current();

        lastTimeRef.current = currentTime;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    // 정리
    return () => {
      clearInterval(timeInterval);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      stopZombieSpawning();
      stopWeaponSpawning();
      clearZombies();
      clearWeapons();
    };
  }, []); // 의존성 배열을 빈 배열로 변경

  // 화면 그리기 함수
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 무기 드롭 그리기
    weaponDrops.forEach((weapon) => {
      const now = Date.now();
      const age = now - weapon.spawnTime;
      const pulseIntensity = Math.sin(age / 200) * 0.3 + 0.7;

      ctx.save();
      ctx.globalAlpha = pulseIntensity;

      ctx.fillStyle = weapon.type === "flamethrower" ? "#ff5722" : "#f44336";
      ctx.beginPath();
      ctx.arc(weapon.position.x, weapon.position.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        weapon.type === "flamethrower" ? "🔥" : "🚀",
        weapon.position.x,
        weapon.position.y + 7
      );

      ctx.restore();
    });

    // 총알 그리기
    bulletsRef.current.forEach((bullet) => {
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(
        bullet.position.x,
        bullet.position.y,
        bullet.size,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (gameStatsRef.current.currentWeapon === "flamethrower") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 좀비 그리기
    zombiesRef.current.forEach((zombie) => {
      ctx.save();

      // 좀비 본체
      ctx.fillStyle = zombie.color;
      ctx.beginPath();
      ctx.arc(
        zombie.position.x,
        zombie.position.y,
        zombie.size,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 좀비 테두리
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 좀비 눈
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.arc(zombie.position.x - 8, zombie.position.y - 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(zombie.position.x + 8, zombie.position.y - 8, 3, 0, Math.PI * 2);
      ctx.fill();

      // 체력바
      const healthBarWidth = zombie.size * 2;
      const healthBarHeight = 4;
      const healthBarY = zombie.position.y - zombie.size - 10;

      ctx.fillStyle = "#333";
      ctx.fillRect(
        zombie.position.x - healthBarWidth / 2,
        healthBarY,
        healthBarWidth,
        healthBarHeight
      );

      const healthPercent = zombie.health / zombie.maxHealth;
      ctx.fillStyle = healthPercent > 0.5 ? "#4caf50" : "#f44336";
      ctx.fillRect(
        zombie.position.x - healthBarWidth / 2,
        healthBarY,
        healthBarWidth * healthPercent,
        healthBarHeight
      );

      ctx.restore();
    });

    // 플레이어 그리기
    if (playerImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        playerPositionRef.current.x,
        playerPositionRef.current.y,
        25,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(
        playerImage,
        playerPositionRef.current.x - 25,
        playerPositionRef.current.y - 25,
        50,
        50
      );
      ctx.restore();

      ctx.strokeStyle = "#4ecdc4";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        playerPositionRef.current.x,
        playerPositionRef.current.y,
        25,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    } else {
      ctx.fillStyle = "#4ecdc4";
      ctx.beginPath();
      ctx.arc(
        playerPositionRef.current.x,
        playerPositionRef.current.y,
        25,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        playerPositionRef.current.x,
        playerPositionRef.current.y,
        25,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    // 조이스틱 방향 표시
    if (joystickDirectionRef.current.distance > 0) {
      const lineLength = 60;
      const endX =
        playerPositionRef.current.x +
        Math.cos(joystickDirectionRef.current.angle) * lineLength;
      const endY =
        playerPositionRef.current.y +
        Math.sin(joystickDirectionRef.current.angle) * lineLength;

      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(playerPositionRef.current.x, playerPositionRef.current.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const arrowSize = 10;
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX -
          arrowSize *
            Math.cos(joystickDirectionRef.current.angle - Math.PI / 6),
        endY -
          arrowSize * Math.sin(joystickDirectionRef.current.angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX -
          arrowSize *
            Math.cos(joystickDirectionRef.current.angle + Math.PI / 6),
        endY -
          arrowSize * Math.sin(joystickDirectionRef.current.angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    // 게임 정보 표시
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "left";
    // ctx.fillText(`점수: ${gameStatsRef.current.score}`, 10, 30);
    // ctx.fillText(`처치: ${gameStatsRef.current.zombiesKilled}`, 10, 55);
    // ctx.fillText(`시간: ${gameStatsRef.current.timeAlive}s`, 10, 80);
  }, [weaponDrops, playerImage]);

  // drawGame ref 관리
  const drawGameRef = useRef(drawGame);
  drawGameRef.current = drawGame;

  // 조이스틱 이벤트 핸들러
  const handleJoystickMove = (direction: JoystickDirection) => {
    setJoystickDirection(direction);
  };

  return (
    <div className="game-page" ref={gamePageRef}>
      {/* 게임 UI */}
      <div className="game-ui">
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-label">🏆</span>
            <span className="stat-value">{gameStats.score}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">💀</span>
            <span className="stat-value">{gameStats.zombiesKilled}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">⚔️</span>
            <span className="stat-value">
              {gameStats.currentWeapon === "pistol" && "🔫"}
              {gameStats.currentWeapon === "flamethrower" && "🔥"}
              {gameStats.currentWeapon === "missile" && "🚀"}
            </span>
          </div>

          <div className="stat-item">
            <span className="stat-label">⏱️</span>
            <span className="stat-value">{gameStats.timeAlive}s</span>
          </div>
        </div>
      </div>

      {/* 게임 캔버스 */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* 조이스틱 */}
      <div className="joystick-area">
        <Joystick onMove={handleJoystickMove} size={120} maxDistance={50} />
      </div>
    </div>
  );
};

export default GamePage;
