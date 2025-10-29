import { System, type Entity } from "../ecs";
import {
  CircleCollider,
  CollisionEvent,
  Damage,
  DamageEvent,
  Health,
  Position,
} from "../entities";

export class CollisionDetectionSystem extends System {
  public componentsRequired = new Set<Function>([Position, CircleCollider]);

  public update(entities: Set<Entity>) {
    let entitiesArray = Array.from(entities);
    for (let i = 0; i < entitiesArray.length - 1; i++) {
      for (let j = i + 1; j < entitiesArray.length; j++) {
        const entityA = entitiesArray[i];
        const entityB = entitiesArray[j];
        const componentsA = this.ecs.getComponents(entityA);
        const componentsB = this.ecs.getComponents(entityB);
        const positionA = componentsA.get(Position);
        const colliderA = componentsA.get(CircleCollider);
        const positionB = componentsB.get(Position);
        const colliderB = componentsB.get(CircleCollider);
        // TODO: Optimize collision detection
        const distance = Math.hypot(
          positionA.x - positionB.x,
          positionA.y - positionB.y
        );
        const minDistance = colliderA.radius + colliderB.radius;
        if (distance < minDistance) {
          const collision = this.ecs.addEntity();
          const penetrationDepth = minDistance - distance;
          const contactNormal = {
            x: (positionB.x - positionA.x) / distance,
            y: (positionB.y - positionA.y) / distance,
          };
          this.ecs.addComponent(
            collision,
            new CollisionEvent(
              entityA,
              entityB,
              contactNormal,
              penetrationDepth
            )
          );

          if (
            this.ecs.getComponents(entityA).has(Health) &&
            this.ecs.getComponents(entityB).has(Damage)
          ) {
            const attack = this.ecs.addEntity();
            this.ecs.addComponent(attack, new DamageEvent(entityB, entityA));
          }
          if (
            this.ecs.getComponents(entityB).has(Health) &&
            this.ecs.getComponents(entityA).has(Damage)
          ) {
            const attack = this.ecs.addEntity();
            this.ecs.addComponent(attack, new DamageEvent(entityA, entityB));
          }
        }
      }
    }
  }
}

export class CollisionResolutionSystem extends System {
  public componentsRequired = new Set<Function>([CollisionEvent]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const collisionEvent = components.get(CollisionEvent);
      const resolutionOffset = collisionEvent.penetrationDepth / 2 + 0.1;
      const componentsA = this.ecs.getComponents(collisionEvent.entityA);
      const componentsB = this.ecs.getComponents(collisionEvent.entityB);
      const positionA = componentsA.get(Position);
      const positionB = componentsB.get(Position);
      positionA.x -= collisionEvent.contactNormal.x * resolutionOffset;
      positionA.y -= collisionEvent.contactNormal.y * resolutionOffset;
      positionB.x += collisionEvent.contactNormal.x * resolutionOffset;
      positionB.y += collisionEvent.contactNormal.y * resolutionOffset;
      this.ecs.removeEntity(entity);
    }
  }
}
