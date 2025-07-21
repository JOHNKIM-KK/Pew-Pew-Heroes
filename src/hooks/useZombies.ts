import { useState, useCallback, useRef, useEffect } from "react";
import type { Zombie, Position } from "../types/GameTypes";

const MAX_ZOMBIES = 30;
const ZOMBIE_SPAWN_INTERVAL = 2000; // 2초마다
const ZOMBIES_PER_SPAWN = 2; // 한 번에 2마리씩
const ZOMBIE_COLORS = ["#8B0000", "#A0522D", "#556B2F", "#2F4F4F", "#8B4513"];

const ZOMBIE_TYPES = {
  "#8B0000": {
    // 빨간색 - 빠르고 작은 좀비
    health: 50,
    maxHealth: 50,  
    speed: 1.0 + Math.random() * 0.5,
    size: 15 + Math.random() * 5,
    reward: 50,
    name: "Fast",
  },
  "#A0522D": {
    // 갈색 - 일반 좀비
    health: 100,
    maxHealth: 100,
    speed: 0.7 + Math.random() * 0.3,
    size: 20 + Math.random() * 8,
    reward: 100,
    name: "Normal",
  },
  "#556B2F": {
    // 올리브색 - 강한 좀비
    health: 150,
    maxHealth: 150,
    speed: 0.4 + Math.random() * 0.3,
    size: 25 + Math.random() * 10,
    reward: 200,
    name: "Strong",
  },
  "#2F4F4F": {
    // 진한 회색 - 탱크 좀비
    health: 250,
    maxHealth: 250,
    speed: 0.3 + Math.random() * 0.2,
    size: 30 + Math.random() * 15,
    reward: 350,
    name: "Tank",
  },
  "#8B4513": {
    // 새들브라운 - 엘리트 좀비
    health: 200,
    maxHealth: 200,
    speed: 0.6 + Math.random() * 0.4,
    size: 28 + Math.random() * 12,
    reward: 300,
    name: "Elite",
  },
};

interface UseZombiesProps {
  canvasWidth: number;
  canvasHeight: number;
  playerPosition: Position;
  onZombieKilled: () => void;
}

export const useZombies = ({
  canvasWidth,
  canvasHeight,
  playerPosition,
  onZombieKilled,
}: UseZombiesProps) => {
  const [zombies, setZombies] = useState<Zombie[]>([]);
  const [isSpawning, setIsSpawning] = useState(false);
  const spawnIntervalRef = useRef<number | null>(null);
  const zombieIdCounter = useRef(0);
  const playerPositionRef = useRef(playerPosition);
  const canvasSizeRef = useRef({ width: canvasWidth, height: canvasHeight });
  const isSpawningRef = useRef(false);

  // playerPosition 업데이트
  playerPositionRef.current = playerPosition;
  // canvasSize 업데이트
  canvasSizeRef.current = { width: canvasWidth, height: canvasHeight };
  // isSpawning 업데이트
  isSpawningRef.current = isSpawning;

  // 좀비 스폰 - 의존성 제거
  const spawnZombies = useCallback(() => {
    setZombies((prev) => {
      // isSpawning 체크를 함수 내부로 이동
      if (!isSpawningRef.current) return prev;
      if (prev.length >= MAX_ZOMBIES) return prev;

      const newZombies = [];
      const spawnCount = Math.min(ZOMBIES_PER_SPAWN, MAX_ZOMBIES - prev.length);

      for (let i = 0; i < spawnCount; i++) {
        // createZombie를 직접 호출하는 대신 내부에서 생성
        const side = Math.floor(Math.random() * 4);
        let x: number, y: number;

        switch (side) {
          case 0:
            x = Math.random() * canvasSizeRef.current.width;
            y = -50;
            break;
          case 1:
            x = canvasSizeRef.current.width + 50;
            y = Math.random() * canvasSizeRef.current.height;
            break;
          case 2:
            x = Math.random() * canvasSizeRef.current.width;
            y = canvasSizeRef.current.height + 50;
            break;
          case 3:
            x = -50;
            y = Math.random() * canvasSizeRef.current.height;
            break;
          default:
            x = Math.random() * canvasSizeRef.current.width;
            y = -50;
        }

        const zombieColor =
          ZOMBIE_COLORS[Math.floor(Math.random() * ZOMBIE_COLORS.length)];
        const zombieType =
          ZOMBIE_TYPES[zombieColor as keyof typeof ZOMBIE_TYPES];

        newZombies.push({
          id: `zombie-${zombieIdCounter.current++}`,
          position: { x, y },
          targetPosition: {
            x: playerPositionRef.current.x,
            y: playerPositionRef.current.y,
          },
          health: zombieType.health,
          maxHealth: zombieType.health,
          speed: zombieType.speed,
          angle: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          size: zombieType.size,
          reward: zombieType.reward,
          color: zombieColor,
        });
      }

      return [...prev, ...newZombies];
    });
  }, []);

  // spawnZombies를 ref로 관리
  const spawnZombiesRef = useRef(spawnZombies);
  spawnZombiesRef.current = spawnZombies;

  // 좀비 스폰 시작 - 의존성 제거
  const startZombieSpawning = useCallback(() => {
    setIsSpawning(true);

    // 즉시 첫 번째 좀비 생성
    setTimeout(() => {
      spawnZombiesRef.current();
    }, 1000);

    // 주기적으로 좀비 생성
    spawnIntervalRef.current = setInterval(() => {
      spawnZombiesRef.current();
    }, ZOMBIE_SPAWN_INTERVAL);
  }, []);

  // 좀비 스폰 중지 - 의존성 제거
  const stopZombieSpawning = useCallback(() => {
    setIsSpawning(false);
    if (spawnIntervalRef.current) {
      clearInterval(spawnIntervalRef.current);
      spawnIntervalRef.current = null;
    }
  }, []);

  // 좀비 업데이트 - 의존성 제거
  const updateZombies = useCallback(() => {
    setZombies((prev) =>
      prev.map((zombie) => {
        const dx = playerPositionRef.current.x - zombie.position.x;
        const dy = playerPositionRef.current.y - zombie.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
          const newPosition = {
            x: zombie.position.x + (dx / distance) * zombie.speed,
            y: zombie.position.y + (dy / distance) * zombie.speed,
          };

          return {
            ...zombie,
            position: newPosition,
          };
        }

        return zombie;
      })
    );
  }, []);

  // 좀비 제거
  const removeZombie = useCallback(
    (zombieId: string) => {
      setZombies((prev) => prev.filter((zombie) => zombie.id !== zombieId));
      onZombieKilled();
    },
    [onZombieKilled]
  );

  // 좀비 데미지
  const damageZombie = useCallback(
    (zombieId: string, damage: number) => {
      setZombies((prev) =>
        prev.map((zombie) => {
          if (zombie.id === zombieId) {
            const newHealth = zombie.health - damage;
            if (newHealth <= 0) {
              // 좀비가 죽으면 제거
              setTimeout(() => removeZombie(zombieId), 0);
              return zombie;
            }
            return { ...zombie, health: newHealth };
          }
          return zombie;
        })
      );
    },
    [removeZombie]
  );

  // 모든 좀비 제거
  const clearZombies = useCallback(() => {
    setZombies([]);
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, []);

  return {
    zombies,
    startZombieSpawning,
    stopZombieSpawning,
    updateZombies,
    damageZombie,
    clearZombies,
  };
};
