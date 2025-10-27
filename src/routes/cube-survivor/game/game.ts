// enum Face {
//   Front,
//   Back,
//   Left,
//   Right,
//   Top,
//   Bottom,
// }

// class Attachment {
//   public constructor() {}
// }

// class Player {
//   #faces: {
//     [face in Face]: {
//       width: number;
//       height: number;
//       attachments;
//     };
//   };
//   #attachmentInventory;

//   public constructor() {}

//   public addAttachment(face: Face, attachment: Attachment, ) {

//   }

//   public update() {
//     attachment.update(position, direction, zLevel);
//   }
// }

interface Actor {
  left: number;
  right: number;
  up: number;
  down: number;
  zLevel: number;

  update(world: World): void;

  moveLeft(): void;
  moveRight(): void;
  moveUp(): void;
  moveDown(): void;
}

class Player implements Actor {
  left: number;
  right: number;
  up: number;
  down: number;
  zLevel: number;

  #inputHandler: InputHandler;

  public constructor(inputHandler: InputHandler) {
    this.left = 0;
    this.right = 0;
    this.up = 0;
    this.down = 0;
    this.zLevel = 0;

    this.#inputHandler = inputHandler;
  }

  public update(world: World) {
    this.#inputHandler.handleInput(this);

    console.log(this.left, this.right, this.up, this.down);

    this.resetMovement();
  }

  private resetMovement() {
    this.left = 0;
    this.right = 0;
    this.up = 0;
    this.down = 0;
  }

  public moveLeft() {
    this.left = -1;
  }
  public moveRight() {
    this.right = 1;
  }
  public moveUp() {
    this.up = 1;
  }
  public moveDown() {
    this.down = -1;
  }
}

interface Command {
  execute(actor: Actor): void;
}

class MoveLeftCommand implements Command {
  execute(actor: Actor) {
    actor.moveLeft();
  }
}
class MoveRightCommand implements Command {
  execute(actor: Actor) {
    actor.moveRight();
  }
}
class MoveUpCommand implements Command {
  execute(actor: Actor) {
    actor.moveUp();
  }
}
class MoveDownCommand implements Command {
  execute(actor: Actor) {
    actor.moveDown();
  }
}

enum KeyInput {
  W = "w",
  A = "a",
  S = "s",
  D = "d",
}

type Commands = { [key in KeyInput]: Command };

class InputHandler {
  #commands: Commands;

  #pressedKeys: { [key: string]: boolean };
  #keyDownListener: ((e: KeyboardEvent) => void) | null;
  #keyUpListener: ((e: KeyboardEvent) => void) | null;

  public constructor(commands: Commands) {
    this.#commands = commands;

    this.#pressedKeys = {};

    this.#keyDownListener = (e: KeyboardEvent) => {
      this.#pressedKeys[e.key] = true;
    };

    this.#keyUpListener = (e: KeyboardEvent) => {
      this.#pressedKeys[e.key] = false;
    };

    window.addEventListener("keydown", this.#keyDownListener);
    window.addEventListener("keyup", this.#keyUpListener);
  }

  public handleInput(actor: Actor) {
    if (this.#pressedKeys[KeyInput.W])
      this.#commands[KeyInput.W].execute(actor);
    if (this.#pressedKeys[KeyInput.A])
      this.#commands[KeyInput.A].execute(actor);
    if (this.#pressedKeys[KeyInput.S])
      this.#commands[KeyInput.S].execute(actor);
    if (this.#pressedKeys[KeyInput.D])
      this.#commands[KeyInput.D].execute(actor);
  }

  public cleanUp() {
    if (this.#keyDownListener) {
      window.removeEventListener("keydown", this.#keyDownListener);
      this.#keyDownListener = null;
    }
    if (this.#keyUpListener) {
      window.removeEventListener("keyup", this.#keyUpListener);
      this.#keyUpListener = null;
    }
  }
}

class Entity {
  #components: Component[];

  public constructor() {
    this.#components = [];
  }

  public addComponent(component: InstanceType<T[P]>) {
    this.#components;
  }

  public removeComponent(component: any) {}

  public getComponent(component: any) {}
}

class World {
  #obstacles: any[];
  #enemyHitboxes: any[];
  #enemyHitzones: any[];

  addEnemy() {
    this.#enemyHitboxes.push();
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

  public start() {
    console.log("START GAME", Game.#instance);

    const world = new World();

    const inputHandler = new InputHandler({
      [KeyInput.W]: new MoveUpCommand(),
      [KeyInput.A]: new MoveLeftCommand(),
      [KeyInput.S]: new MoveDownCommand(),
      [KeyInput.D]: new MoveRightCommand(),
    });
    const player = new Player(inputHandler);
    console.log(Player.constructor);

    let gameLoop = function () {
      setTimeout(function () {
        // inputHandler.handleInput(player);
        player.update(world);
        gameLoop();
      }, 100);
    };
    // gameLoop();

    // inputHandler.cleanUp();
  }
}

export default Game;
