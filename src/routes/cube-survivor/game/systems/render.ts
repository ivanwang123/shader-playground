import { System, type Entity } from "../ecs";
import { CircleCollider, Health, Position, Render } from "../entities";

export class RenderSystem extends System {
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
