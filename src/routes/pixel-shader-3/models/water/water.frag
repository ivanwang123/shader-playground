uniform sampler2D tDepth;
uniform sampler2D tDiffuse;
uniform sampler2D tDisplacement;

uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform float uDisplacementAmount;

uniform vec2 uResolution;

varying vec2 vUv;

float linearize(float depth) {
  return uNear * uFar / (uFar + depth * (uNear - uFar));
}

void main() {
  vec2 screenUV = gl_FragCoord.xy / uResolution;

  vec2 displacement = texture2D(tDisplacement, vUv + uTime / 16.0).rg;
  displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

  float depth = texture2D(tDepth, screenUV).r;
  float zDepth = linearize(depth);

  float zPos = linearize(gl_FragCoord.z);

  float diff = clamp(zDepth - zPos, 0.0, 1.0);
  diff += displacement.x;

  vec3 waterColor =
      mix(texture2D(tDiffuse, screenUV).rgb, vec3(0.0, 0.0, 1.0), 0.5);
  vec3 foamColor = vec3(1.0, 1.0, 1.0);

  vec3 color = mix(foamColor, waterColor, step(0.25, diff));
  gl_FragColor = vec4(color, 1.0);
}