uniform sampler2D tNoise;
uniform sampler2D tDisplacement;

uniform float uTime;
uniform float uSpeed;
uniform float uDisplacementAmount;
uniform float uBottomFoamThreshold;

uniform vec3 uTopLightColor;
uniform vec3 uTopDarkColor;
uniform vec3 uBottomLightColor;
uniform vec3 uBottomDarkColor;

varying vec2 vUv;

void main() {
  vec2 displacement = texture2D(tDisplacement, vUv / 2.0 + uTime / 8.0).rg;
  displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

  float noise = texture2D(tNoise, vec2(vUv.x, vUv.y / 3.0 + uTime * uSpeed) +
                                      displacement)
                    .r;
  noise = round(noise * 3.0) / 3.0;

  vec3 color = mix(mix(uBottomDarkColor, uTopDarkColor, vUv.y),
                   mix(uBottomLightColor, uTopLightColor, vUv.y), noise);
  color = mix(color, vec3(1.0, 1.0, 1.0),
              step(vUv.y + displacement.y, uBottomFoamThreshold));

  gl_FragColor = vec4(color, 1.0);
}