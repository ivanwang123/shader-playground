uniform sampler2D tGroundDepth;

uniform float uFar;
uniform float uTime;

uniform vec2 uResolution;

varying vec2 vUv;
varying vec4 vWorldPosition;

void main() {
  vUv = uv;
  vWorldPosition = instanceMatrix[3];

  vec4 mvPosition = instanceMatrix * vec4(position, 1.0);

  float dispPower = 1.0 - cos(uv.y * 3.1416 / 2.0);
  float displacement = sin(mvPosition.z + uTime * 2.0) * (0.08 * dispPower);
  mvPosition.z += displacement;

  vec2 groundUV = vec2(vWorldPosition.x, -vWorldPosition.z) / uResolution + 0.5;
  float groundDepth = texture2D(tGroundDepth, groundUV).r;
  mvPosition.y -= groundDepth * uFar - 5.0;

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
}