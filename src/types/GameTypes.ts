export interface Position {
  x: number;
  y: number;
}

export interface Zombie {
  id: string;
  position: Position;
  targetPosition: Position;
  health: number;
  maxHealth: number;
  speed: number;
  angle: number;
  rotationSpeed: number;
  size: number;
  color: string;
  reward: number;
}

export interface Player {
  position: Position;
  health: number;
  size: number;
  speed: number;
}

export interface Bullet {
  id: string;
  position: Position;
  velocity: Position;
  damage: number;
  size: number;
  color: string;
  range: number;
  distanceTraveled: number;
}

export interface Weapon {
  id: string;
  position: Position;
  type: "flamethrower" | "missile";
  spawnTime: number;
}

export type WeaponType = "pistol" | "flamethrower" | "missile";

export interface GameStats {
  score: number;
  zombiesKilled: number;
  timeAlive: number;
  currentWeapon: WeaponType;
}

export interface JoystickDirection {
  x: number;
  y: number;
  distance: number;
  angle: number;
}
