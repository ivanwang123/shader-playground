import { Component, type Entity } from "../ecs";

export class Health extends Component {
  public constructor(public health: number) {
    super();
  }
}

export class Damage extends Component {
  public constructor(public damage: number) {
    super();
  }
}

export class DamageEvent extends Component {
  public constructor(public attacker: Entity, public target: Entity) {
    super();
  }
}

export class DeathEvent extends Component {
  public constructor(public entity: Entity) {
    super();
  }
}
