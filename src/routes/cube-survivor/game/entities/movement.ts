import { Component } from "../ecs";

export class Position extends Component {
  public constructor(public x: number, public y: number) {
    super();
  }
}

export class Velocity extends Component {
  public constructor(
    public xVel: number,
    public yVel: number,
    public direction: number = 0
  ) {
    super();
  }

  public setVelocity(xVel: number, yVel: number) {
    this.xVel = xVel;
    this.yVel = yVel;
    if (xVel !== 0 || yVel !== 0) {
      this.direction = Math.atan2(yVel, xVel);
    }
  }
}
