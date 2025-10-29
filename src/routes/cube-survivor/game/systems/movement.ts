import { System, type Entity } from "../ecs";
import { Move, Position } from "../entities";

export class MovementSystem extends System {
  public componentsRequired = new Set<Function>([Position, Move]);

  public update(entities: Set<Entity>) {
    for (let entity of entities) {
      const components = this.ecs.getComponents(entity);
      const move = components.get(Move);
      const position = components.get(Position);
      position.x += move.xVel;
      position.y += move.yVel;
      this.ecs.removeComponent(entity, Move);
    }
  }
}
