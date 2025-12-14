varying vec2 vUv;
varying vec3 viewSpaceDir;
varying mat4 inverseProjectionMatrix;

void main() {
  vUv = uv;
  inverseProjectionMatrix = inverse(projectionMatrix);
  viewSpaceDir = (inverseProjectionMatrix * vec4(position.xy, 0.0, 1.0)).xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}