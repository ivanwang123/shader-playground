import { System, type Entity } from "../ecs";
import { Input, Move, Position } from "../entities";
import Enums from "../common/enums";

export class InputSystem extends System {
  public componentsRequired = new Set<Function>([Input, Position]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const inputListener = components.get(Input).inputListener;
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
        if (xVel !== 0 || yVel !== 0) {
          this.ecs.addComponent(entity, new Move(xVel, yVel));
        }
      }
    }
  }
}
