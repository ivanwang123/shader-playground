uniform mat4 uTextureMatrix;

varying vec4 vUv;

void main() {
  vUv = uTextureMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}