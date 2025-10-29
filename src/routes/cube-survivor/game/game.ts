import { ECS } from "./ecs";
import {
  CircleCollider,
  Damage,
  Health,
  Input,
  Position,
  Render,
} from "./entities";
import InputListener from "./utilities/input-listener";
import {
  CollisionDetectionSystem,
  CollisionResolutionSystem,
  DamageSystem,
  DeathSystem,
  InputSystem,
  MovementSystem,
  RenderSystem,
} from "./systems";

class Game {
  static #instance: Game;

  private constructor() {}

  public static get instance(): Game {
    if (!Game.#instance) {
      Game.#instance = new Game();
    }

    return Game.#instance;
  }

  public start(
    width: number,
    height: number,
    renderer: CanvasRenderingContext2D
  ) {
    console.log("START GAME", Game.#instance);

    const ecs = new ECS();

    // Systems
    ecs.addSystem(new InputSystem());
    ecs.addSystem(new MovementSystem());
    ecs.addSystem(new CollisionDetectionSystem());
    ecs.addSystem(new DamageSystem());
    ecs.addSystem(new CollisionResolutionSystem());
    ecs.addSystem(new RenderSystem(renderer, width, height));
    ecs.addSystem(new DeathSystem());

    // Player entity
    const player = ecs.addEntity();
    ecs.addComponent(player, new Position(10, 10));
    ecs.addComponent(player, new CircleCollider(10));
    ecs.addComponent(player, new Input(new InputListener()));
    ecs.addComponent(player, new Health(100));
    ecs.addComponent(player, new Render());

    // Enemy entity
    const enemy = ecs.addEntity();
    ecs.addComponent(enemy, new Position(105, 105));
    ecs.addComponent(enemy, new CircleCollider(10));
    ecs.addComponent(enemy, new Damage(10));
    ecs.addComponent(enemy, new Render());

    let gameLoop = function () {
      setTimeout(function () {
        ecs.update();
        gameLoop();
      }, 100);
    };
    gameLoop();
  }
}

export default Game;
