import { Component, type Entity } from "../ecs";
import type { Vector2 } from "../common/types";

export class CircleCollider extends Component {
  public constructor(public radius: number) {
    super();
  }
}

export class CollisionEvent extends Component {
  public constructor(
    public entityA: Entity,
    public entityB: Entity,
    public contactNormal: Vector2,
    public penetrationDepth: number
  ) {
    super();
  }
}
