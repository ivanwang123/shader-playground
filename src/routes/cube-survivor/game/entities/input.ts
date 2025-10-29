import { Component } from "../ecs";
import type InputListener from "../utilities/input-listener";

export class Input extends Component {
  public constructor(public inputListener: InputListener) {
    super();
  }
}
