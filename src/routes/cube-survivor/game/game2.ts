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
    public contactNormal: Vector2,
    public penetrationDepth: number
  ) {
    super();
  }
}

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
      const components = this.ecs.getComponents(entity);
      const inputListener = components.get(Input).inputListener;
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
          this.ecs.addComponent(entity, new Move(xVel, yVel));
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

class DeathEvent extends Component {
  public constructor(public entity: Entity) {
    super();
  }
}

class DeathSystem extends System {
  public componentsRequired = new Set<Function>([DeathEvent]);

  public update(entities: Set<Entity>) {
    for (const entity of entities) {
      const components = this.ecs.getComponents(entity);
      const deathEvent = components.get(DeathEvent);
      const deadEntity = deathEvent.entity;
      this.ecs.removeEntity(deadEntity);
      this.ecs.removeEntity(entity);
    }
  }
}

class CollisionResolutionSystem extends System {
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
      const components = this.ecs.getComponents(entity);
      const position = components.get(Position);
      const collider = components.get(CircleCollider);
      this.renderer.beginPath();
      this.renderer.arc(
        position.x,
        position.y,
        collider.radius,
        0,
        2 * Math.PI
      );
      this.renderer.stroke();

      if (components.has(Health)) {
        const health = components.get(Health);
        this.renderer.fillText(
          `HP: ${health.health}`,
          position.x - collider.radius,
          position.y - collider.radius - 10
        );
      }
    }
  }
}

class MovementSystem extends System {
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

class Health extends Component {
  public constructor(public health: number) {
    super();
  }
}

class Damage extends Component {
  public constructor(public damage: number) {
    super();
  }
}

class DamageEvent extends Component {
  public constructor(public attacker: Entity, public target: Entity) {
    super();
  }
}

class DamageSystem extends System {
  public componentsRequired = new Set<Function>([DamageEvent]);

  public update(entities: Set<Entity>) {
    for (let entity of entities) {
      const components = this.ecs.getComponents(entity);
      const damageEvent = components.get(DamageEvent);
      console.log(
        `Entity ${damageEvent.attacker} dealt damage to Entity ${damageEvent.target}`
      );
      const attacker = damageEvent.attacker;
      const target = damageEvent.target;
      this.ecs.getComponents(target).get(Health).health -= this.ecs
        .getComponents(attacker)
        .get(Damage).damage;
      if (this.ecs.getComponents(target).get(Health).health <= 0) {
        const deathEntity = this.ecs.addEntity();
        this.ecs.addComponent(deathEntity, new DeathEvent(target));
      }
      this.ecs.removeEntity(entity);
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
