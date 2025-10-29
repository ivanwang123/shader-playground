class InputListener {
  private pressedKeys: Map<string, boolean>;
  private keyDownListener: ((e: KeyboardEvent) => void) | null;
  private keyUpListener: ((e: KeyboardEvent) => void) | null;

  public constructor() {
    this.pressedKeys = new Map();

    this.keyDownListener = (e: KeyboardEvent) => {
      this.pressedKeys.set(e.key, true);
    };

    this.keyUpListener = (e: KeyboardEvent) => {
      this.pressedKeys.set(e.key, false);
    };

    window.addEventListener("keydown", this.keyDownListener);
    window.addEventListener("keyup", this.keyUpListener);
  }

  public isPressed(key: string): boolean {
    return !!this.pressedKeys.get(key);
  }

  public cleanUp() {
    if (this.keyDownListener) {
      window.removeEventListener("keydown", this.keyDownListener);
      this.keyDownListener = null;
    }
    if (this.keyUpListener) {
      window.removeEventListener("keyup", this.keyUpListener);
      this.keyUpListener = null;
    }
  }
}

export default InputListener;
