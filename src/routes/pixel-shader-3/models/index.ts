import * as THREE from "three";

export type Options = {
  position?: THREE.Vector3;
  color?: THREE.ColorRepresentation;
};

export * from "./cube";
export * from "./ground";
export * from "./sphere";
export * from "./grass/grass";
export * from "./texture/texture";
export * from "./waterfall/waterfall";
