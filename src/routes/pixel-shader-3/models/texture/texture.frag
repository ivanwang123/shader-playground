uniform sampler2D tTexture;

varying vec2 vUv;

float linearize(float depth) {
  float near = 0.1;
  float far = 1000.0;
  return near * far / (far + depth * (near - far));
}

void main() {
  vec3 texel = texture2D(tTexture, vUv).rgb;
  gl_FragColor = vec4(vec3(linearize(texel.r)), 1.0);
}