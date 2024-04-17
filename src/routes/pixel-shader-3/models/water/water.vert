uniform sampler2D tDisplacement;
uniform mat4 uTextureMatrix;
uniform float uTime;

varying vec2 vUv;
varying vec4 vTextureUV;

void main() {
  vUv = uv;
  vTextureUV = uTextureMatrix * vec4(position, 1.0);

  float displacement = texture2D(tDisplacement, vUv + uTime / 16.0).r;
  displacement = ((displacement * 2.0) - 1.0) * 0.1;

  vec4 mvPosition = vec4(position, 1.0);
  mvPosition.z += displacement;

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;
}