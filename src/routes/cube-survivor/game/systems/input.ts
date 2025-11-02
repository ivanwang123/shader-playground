import { System, type Entity } from "../ecs";
import {
  Input,
  Velocity,
  Position,
  Damage,
  Render,
  CircleCollider,
} from "../entities";
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
        let shoot = false;
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
        if (inputListener.isPressed(Enums.Input.Shoot)) {
          shoot = true;
        }
        velocity.setVelocity(xVel, yVel);
        if (shoot) {
          const bullet = this.ecs.addEntity();
          const bulletXDir = Math.cos(velocity.direction);
          const bulletYDir = Math.sin(velocity.direction);
          const bulletSpeed = 10;
          this.ecs.addComponent(
            bullet,
            new Position(
              bulletXDir * 15 + this.ecs.getComponents(entity).get(Position).x,
              bulletYDir * 15 + this.ecs.getComponents(entity).get(Position).y
            )
          );
          this.ecs.addComponent(
            bullet,
            new Velocity(bulletXDir * bulletSpeed, bulletYDir * bulletSpeed)
          );
          this.ecs.addComponent(bullet, new Damage(1));
          this.ecs.addComponent(bullet, new CircleCollider(5));
          this.ecs.addComponent(bullet, new Render());
        }
      }
    }
  }
}
