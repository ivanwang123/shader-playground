import type { Vector2 } from "../common/types";

export function checkCircleCollision(
  positionA: Vector2,
  positionB: Vector2,
  radiusA: number,
  radiusB: number
): boolean {
  const dx = positionB.x - positionA.x;
  const dy = positionB.y - positionA.y;
  const distance = dx * dx + dy * dy;
  const minDistance = (radiusA + radiusB) * (radiusA + radiusB);
  return distance < minDistance;
}

export function calculateCircleContactNormal(
  positionA: Vector2,
  positionB: Vector2,
  distance: number
): Vector2 {
  return {
    x: (positionB.x - positionA.x) / distance,
    y: (positionB.y - positionA.y) / distance,
  };
}
