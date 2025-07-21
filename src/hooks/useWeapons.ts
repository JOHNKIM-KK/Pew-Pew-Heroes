import { useState, useCallback, useRef } from "react";
import type {
  Bullet,
  Weapon,
  Position,
  WeaponType,
  Zombie,
} from "../types/GameTypes";

export const WEAPON_DURATION = 7000;

const BULLET_SPEED = 8;
const PISTOL_FIRE_RATE = 300; // 300ms 간격
const WEAPON_SPAWN_INTERVAL = 10000; // 10초
const BULLET_RANGE = 400;

interface UseWeaponsProps {
  canvasWidth: number;
  canvasHeight: number;
  playerPosition: Position;
  currentWeapon: WeaponType;
  onWeaponPickup: (weaponType: WeaponType) => void;
  onWeaponExpire: () => void; // 무기 만료 콜백 추가
}

export const useWeapons = ({
  canvasWidth,
  canvasHeight,
  playerPosition,
  currentWeapon,
  onWeaponPickup,
  onWeaponExpire,
}: UseWeaponsProps) => {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [weaponDrops, setWeaponDrops] = useState<Weapon[]>([]);

  const lastFireTime = useRef(0);
  const bulletIdCounter = useRef(0);
  const weaponIdCounter = useRef(0);
  const weaponSpawnInterval = useRef<number | null>(null);
  const playerPositionRef = useRef(playerPosition);

  // playerPosition 업데이트
  playerPositionRef.current = playerPosition;

  // 가장 가까운 좀비 방향으로 총알 발사
  const findNearestZombieDirection = useCallback(
    (zombies: Zombie[]): number | null => {
      if (zombies.length === 0) return null;

      let nearestZombie: Zombie | null = null;
      let minDistance = Infinity;

      zombies.forEach((zombie) => {
        const dx = zombie.position.x - playerPositionRef.current.x;
        const dy = zombie.position.y - playerPositionRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearestZombie = zombie;
        }
      });

      if (nearestZombie) {
        const dx =
          (nearestZombie as Zombie).position.x - playerPositionRef.current.x;
        const dy =
          (nearestZombie as Zombie).position.y - playerPositionRef.current.y;
        return Math.atan2(dy, dx);
      }

      return null;
    },
    []
  );

  // 총알 생성
  const createBullet = useCallback(
    (angle: number): Bullet => {
      const velocity = {
        x: Math.cos(angle) * BULLET_SPEED,
        y: Math.sin(angle) * BULLET_SPEED,
      };

      let damage = 25;
      let color = "#ffeb3b";
      let size = 3;

      if (currentWeapon === "flamethrower") {
        damage = 15;
        color = "#ff5722";
        size = 5;
      } else if (currentWeapon === "missile") {
        damage = 100;
        color = "#f44336";
        size = 8;
      }

      return {
        id: `bullet-${bulletIdCounter.current++}`,
        position: {
          x: playerPositionRef.current.x,
          y: playerPositionRef.current.y,
        },
        velocity,
        damage,
        size,
        color,
        range: BULLET_RANGE,
        distanceTraveled: 0,
      };
    },
    [currentWeapon]
  );

  // 자동 발사
  const autoFire = useCallback(
    (zombies: Zombie[]) => {
      const now = Date.now();
      let fireRate = PISTOL_FIRE_RATE;

      if (currentWeapon === "flamethrower") {
        fireRate = 100; // 더 빠른 발사
      } else if (currentWeapon === "missile") {
        fireRate = 800; // 더 느린 발사
      }

      if (now - lastFireTime.current > fireRate) {
        const angle = findNearestZombieDirection(zombies);

        if (angle !== null) {
          const newBullet = createBullet(angle);
          setBullets((prev) => [...prev, newBullet]);
          lastFireTime.current = now;
        }
      }
    },
    [currentWeapon, findNearestZombieDirection, createBullet]
  );

  // 총알 업데이트
  const updateBullets = useCallback(() => {
    setBullets((prev) =>
      prev
        .map((bullet) => {
          const newPosition = {
            x: bullet.position.x + bullet.velocity.x,
            y: bullet.position.y + bullet.velocity.y,
          };

          const newDistanceTraveled =
            bullet.distanceTraveled +
            Math.sqrt(
              bullet.velocity.x * bullet.velocity.x +
                bullet.velocity.y * bullet.velocity.y
            );

          return {
            ...bullet,
            position: newPosition,
            distanceTraveled: newDistanceTraveled,
          };
        })
        .filter((bullet) => {
          // 화면 밖이나 사거리 초과한 총알 제거
          return (
            bullet.position.x >= 0 &&
            bullet.position.x <= canvasWidth &&
            bullet.position.y >= 0 &&
            bullet.position.y <= canvasHeight &&
            bullet.distanceTraveled < bullet.range
          );
        })
    );
  }, [canvasWidth, canvasHeight]);

  // 무기 드롭 생성
  const createWeaponDrop = useCallback((): Weapon => {
    const weaponTypes: ("flamethrower" | "missile")[] = [
      "flamethrower",
      "missile",
    ];
    const weaponType =
      weaponTypes[Math.floor(Math.random() * weaponTypes.length)];

    const position = {
      x: Math.random() * (canvasWidth - 100) + 50,
      y: Math.random() * (canvasHeight - 100) + 50,
    };

    return {
      id: `weapon-${weaponIdCounter.current++}`,
      position,
      type: weaponType,
      spawnTime: Date.now(),
    };
  }, [canvasWidth, canvasHeight]);

  // 무기 스폰 시작
  const startWeaponSpawning = useCallback(() => {
    weaponSpawnInterval.current = setInterval(() => {
      setWeaponDrops((prev) => {
        // 최대 3개의 무기만 동시에 존재
        if (prev.length >= 3) return prev;

        const newWeapon = createWeaponDrop();
        return [...prev, newWeapon];
      });
    }, WEAPON_SPAWN_INTERVAL);
  }, [createWeaponDrop]);

  // 무기 스폰 중지
  const stopWeaponSpawning = useCallback(() => {
    if (weaponSpawnInterval.current) {
      clearInterval(weaponSpawnInterval.current);
      weaponSpawnInterval.current = null;
    }
  }, []);

  // 무기 픽업 확인
  const checkWeaponPickup = useCallback(() => {
    weaponDrops.forEach((weapon) => {
      const dx = weapon.position.x - playerPositionRef.current.x;
      const dy = weapon.position.y - playerPositionRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 40) {
        // 픽업 거리
        onWeaponPickup(weapon.type);
        setWeaponDrops((prev) => prev.filter((w) => w.id !== weapon.id));
      }
    });
  }, [weaponDrops, onWeaponPickup]);

  const checkWeaponExpiry = useCallback(
    (weaponExpiryTime: number | null) => {
      if (weaponExpiryTime && Date.now() > weaponExpiryTime) {
        onWeaponExpire();
      }
    },
    [onWeaponExpire]
  );

  // 총알 제거
  const removeBullet = useCallback((bulletId: string) => {
    setBullets((prev) => prev.filter((bullet) => bullet.id !== bulletId));
  }, []);

  // 모든 총알과 무기 제거
  const clearAll = useCallback(() => {
    setBullets([]);
    setWeaponDrops([]);
  }, []);

  return {
    bullets,
    weaponDrops,
    autoFire,
    updateBullets,
    checkWeaponPickup,
    removeBullet,
    startWeaponSpawning,
    stopWeaponSpawning,
    checkWeaponExpiry,
    clearAll,
  };
};
