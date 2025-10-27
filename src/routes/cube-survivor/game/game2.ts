import { Component, ECS, System, type Entity } from "./ecs";
import InputListener from "./input-listener";

class Position extends Component {
  public constructor(public x: number, public y: number) {
    super();
  }
}

class CircleCollider extends Component {
  public constructor(public radius: number) {
    super();
  }
}

class Render extends Component {}

class Move extends Component {
  public constructor(public xVel: number, public yVel: number) {
    super();
  }
}

class Input extends Component {
  // TODO: Clean up inputListener
  public constructor(public inputListener: InputListener) {
    super();
  }
}

type Vector2 = { x: number; y: number };

class CollisionEvent extends Component {
  public constructor(
    public entityA: Entity,
    public entityB: Entity,
    public contactPoint: Vector2
  ) {
    super();
  }
}

// class Moveable extends Component {
//   public dLeft: number;
//   public dRight: number;
//   public dUp: number;
//   public dDown: number;

//   public constructor() {
//     super();
//     this.dLeft = 0;
//     this.dRight = 0;
//     this.dUp = 0;
//     this.dDown = 0;
//   }
// }

// class MovementSystem extends System {
//   public componentsRequired = new Set<Function>([Position, Moveable]);

//   public update(entities: Set<Entity>) {
//     for (let entity of entities) {
//       this.ecs?.getComponents(entity)?.get(Position);
//     }
//   }
// }

enum Inputs {
  MoveUp = "w",
  MoveLeft = "a",
  MoveDown = "s",
  MoveRight = "d",
}

class InputSystem extends System {
  public componentsRequired = new Set<Function>([Input, Position]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const components = this.ecs?.getComponents(entity);
      const inputListener = components?.get(Input).inputListener;
      if (inputListener) {
        let xVel = 0;
        let yVel = 0;
        if (inputListener.isPressed(Inputs.MoveUp)) {
          yVel += -10;
        }
        if (inputListener.isPressed(Inputs.MoveDown)) {
          yVel += 10;
        }
        if (inputListener.isPressed(Inputs.MoveLeft)) {
          xVel += -10;
        }
        if (inputListener.isPressed(Inputs.MoveRight)) {
          xVel += 10;
        }
        if (xVel !== 0 || yVel !== 0) {
          this.ecs?.addComponent(entity, new Move(xVel, yVel));
        }
      }
    }
  }
}

class CollisionDetectionSystem extends System {
  public componentsRequired = new Set<Function>([Position, CircleCollider]);

  public update(entities: Set<Entity>) {
    let entitiesArray = Array.from(entities);
    for (let i = 0; i < entitiesArray.length - 1; i++) {
      for (let j = i + 1; j < entitiesArray.length; j++) {
        const entityA = entitiesArray[i];
        const entityB = entitiesArray[j];
        const componentsA = this.ecs?.getComponents(entityA);
        const componentsB = this.ecs?.getComponents(entityB);
        const positionA = componentsA?.get(Position);
        const colliderA = componentsA?.get(CircleCollider);
        const positionB = componentsB?.get(Position);
        const colliderB = componentsB?.get(CircleCollider);
        if (!positionA || !colliderA || !positionB || !colliderB) continue;
        // TODO: Optimize collision detection
        if (
          Math.hypot(positionA.x - positionB.x, positionA.y - positionB.y) <
          colliderA.radius + colliderB.radius
        ) {
          console.log("COLLISION DETECTED");
          if (this.ecs) {
            const collision = this.ecs.addEntity();
            this.ecs.addComponent(collision, new Position());
          }
        }
      }
    }
  }
}

class PhysicsResolutionSystem extends System {
  public componentsRequired = new Set<Function>([CollisionEvent]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const components = this.ecs?.getComponents(entity);
      // TODO
    }
  }
}

class RenderSystem extends System {
  public componentsRequired = new Set<Function>([
    Render,
    Position,
    CircleCollider,
  ]);

  private renderer: CanvasRenderingContext2D;
  private canvasWidth: number;
  private canvasHeight: number;

  public constructor(
    renderer: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ) {
    super();
    this.renderer = renderer;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  public update(entities: Set<Entity>) {
    this.renderer.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    for (const entity of entities) {
      const components = this.ecs?.getComponents(entity);
      const position = components?.get(Position);
      const collider = components?.get(CircleCollider);
      if (position && collider) {
        this.renderer.strokeRect(
          position.x,
          position.y,
          collider.radius * 2,
          collider.radius * 2
        );
      }
    }
  }
}

class MovementSystem extends System {
  public componentsRequired = new Set<Function>([Position, Move]);

  public update(entities: Set<Entity>) {
    for (let entity of entities) {
      const components = this.ecs?.getComponents(entity);
      const move = components?.get(Move);
      const position = components?.get(Position);
      if (position && move) {
        position.x += move.xVel;
        position.y += move.yVel;
        this.ecs?.removeComponent(entity, Move);
      }
    }
  }
}

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
    ecs.addSystem(new RenderSystem(renderer, width, height));

    // Player entity
    const player = ecs.addEntity();
    ecs.addComponent(player, new Position(10, 10));
    ecs.addComponent(player, new CircleCollider(10));
    ecs.addComponent(player, new Input(new InputListener()));
    ecs.addComponent(player, new Render());

    // Enemy entity
    const enemy = ecs.addEntity();
    ecs.addComponent(enemy, new Position(105, 105));
    ecs.addComponent(enemy, new CircleCollider(10));
    ecs.addComponent(enemy, new Render());

    let gameLoop = function () {
      setTimeout(function () {
        ecs.update();
        let components = ecs.getComponents(player);
        if (components?.has(Position)) {
          const p = components.get(Position);
          // console.log("POSITION", p.x, p.y);
        }
        gameLoop();
      }, 100);
    };
    gameLoop();
  }
}

export default Game;
