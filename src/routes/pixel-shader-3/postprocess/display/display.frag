uniform sampler2D tDiffuse;

varying vec2 vUv;

void main() {
  vec3 texel = texture2D(tDiffuse, vUv).rgb;

  gl_FragColor = vec4(texel, 1.0);
}