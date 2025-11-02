import { System, type Entity } from "../ecs";
import { Input, Velocity, Position } from "../entities";
import Enums from "../common/enums";

export class InputSystem extends System {
  public componentsRequired = new Set<Function>([Input, Position, Velocity]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const inputListener = this.ecs
        .getComponents(entity)
        .get(Input).inputListener;

      const velocity = this.ecs.getComponents(entity).get(Velocity);

      if (inputListener) {
        let xVel = 0;
        let yVel = 0;
        if (inputListener.isPressed(Enums.Input.MoveUp)) {
          yVel += -10;
        }
        if (inputListener.isPressed(Enums.Input.MoveDown)) {
          yVel += 10;
        }
        if (inputListener.isPressed(Enums.Input.MoveLeft)) {
          xVel += -10;
        }
        if (inputListener.isPressed(Enums.Input.MoveRight)) {
          xVel += 10;
        }
        velocity.xVel = xVel;
        velocity.yVel = yVel;
      }
    }
  }
}
