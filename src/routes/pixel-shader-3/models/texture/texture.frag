uniform sampler2D tTexture;

varying vec2 vUv;

void main() {
  vec3 texel = texture2D(tTexture, vUv).rgb;
  gl_FragColor = vec4(texel, 1.0);
}