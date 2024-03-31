uniform sampler2D tGround;

uniform vec2 uResolution;

varying vec2 vUv;
varying vec4 vWorldPosition;

void main() {
  vec2 groundUV = vec2(vWorldPosition.x, -vWorldPosition.z) / uResolution + 0.5;

  vec3 groundTexel = texture2D(tGround, groundUV).rgb;

  // purple panda
  gl_FragColor = vec4(groundTexel, 1.0);
}