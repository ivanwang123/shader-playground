import { System, type Entity } from "../ecs";
import { Damage, DamageEvent, DeathEvent, Health } from "../entities";

export class DamageSystem extends System {
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

export class DeathSystem extends System {
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
