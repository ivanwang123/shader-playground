uniform mat4 uTextureMatrix;

varying vec2 vUv;
varying vec4 vTextureUV;

void main() {
  vUv = uv;
  vTextureUV = uTextureMatrix * vec4(position, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}