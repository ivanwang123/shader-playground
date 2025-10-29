import { System, type Entity } from "../ecs";
import {
  CircleCollider,
  CollisionEvent,
  Damage,
  DamageEvent,
  Health,
  Position,
} from "../entities";
import {
  calculateCircleContactNormal,
  checkCircleCollision,
} from "../utilities/collision";

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
        const radiusA = componentsA.get(CircleCollider).radius;
        const positionB = componentsB.get(Position);
        const radiusB = componentsB.get(CircleCollider).radius;

        if (checkCircleCollision(positionA, positionB, radiusA, radiusB)) {
          const collision = this.ecs.addEntity();
          const distance = Math.hypot(
            positionB.x - positionA.x,
            positionB.y - positionA.y
          );
          const penetrationDepth = radiusA + radiusB - distance;
          const contactNormal = calculateCircleContactNormal(
            positionA,
            positionB,
            distance
          );
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
      const collisionEvent = this.ecs.getComponents(entity).get(CollisionEvent);
      const resolutionOffset = collisionEvent.penetrationDepth / 2 + 0.1;

      const positionA = this.ecs
        .getComponents(collisionEvent.entityA)
        .get(Position);
      const positionB = this.ecs
        .getComponents(collisionEvent.entityB)
        .get(Position);
      positionA.x -= collisionEvent.contactNormal.x * resolutionOffset;
      positionA.y -= collisionEvent.contactNormal.y * resolutionOffset;
      positionB.x += collisionEvent.contactNormal.x * resolutionOffset;
      positionB.y += collisionEvent.contactNormal.y * resolutionOffset;

      this.ecs.removeEntity(entity);
    }
  }
}
