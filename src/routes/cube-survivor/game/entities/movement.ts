import { Component } from "../ecs";

export class Position extends Component {
  public constructor(public x: number, public y: number) {
    super();
  }
}

export class Move extends Component {
  public constructor(public xVel: number, public yVel: number) {
    super();
  }
}
