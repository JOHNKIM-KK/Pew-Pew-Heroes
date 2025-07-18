import type { Position, Zombie, Bullet } from "../types/GameTypes";

// 두 원형 객체 간의 충돌 감지
export const checkCircleCollision = (
  pos1: Position,
  radius1: number,
  pos2: Position,
  radius2: number
): boolean => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < radius1 + radius2;
};

// 플레이어와 좀비 충돌 감지
export const checkPlayerZombieCollision = (
  playerPosition: Position,
  playerRadius: number,
  zombies: Zombie[]
): Zombie | null => {
  for (const zombie of zombies) {
    if (
      checkCircleCollision(
        playerPosition,
        playerRadius,
        zombie.position,
        zombie.size
      )
    ) {
      return zombie;
    }
  }
  return null;
};

// 총알과 좀비 충돌 감지
export const checkBulletZombieCollisions = (
  bullets: Bullet[],
  zombies: Zombie[]
): Array<{ bullet: Bullet; zombie: Zombie }> => {
  const collisions: Array<{ bullet: Bullet; zombie: Zombie }> = [];

  bullets.forEach((bullet) => {
    zombies.forEach((zombie) => {
      if (
        checkCircleCollision(
          bullet.position,
          bullet.size,
          zombie.position,
          zombie.size
        )
      ) {
        collisions.push({ bullet, zombie });
      }
    });
  });

  return collisions;
};

// 거리 계산
export const calculateDistance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// 각도 계산
export const calculateAngle = (from: Position, to: Position): number => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
};
