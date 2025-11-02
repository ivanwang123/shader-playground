import { System, type Entity } from "../ecs";
import { Velocity, Position } from "../entities";

export class MovementSystem extends System {
  public componentsRequired = new Set<Function>([Position, Velocity]);

  public update(entities: Set<Entity>) {
    for (let entity of entities) {
      const components = this.ecs.getComponents(entity);
      const velocity = components.get(Velocity);
      const position = components.get(Position);
      position.x += velocity.xVel;
      position.y += velocity.yVel;
    }
  }
}
