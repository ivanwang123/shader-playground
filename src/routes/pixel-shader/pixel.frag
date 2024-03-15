uniform vec2 uResolution;
uniform float uIntensity;
uniform sampler2D tDiffuse;

varying vec2 vUv;

vec3 pixelColor(vec3 color) {
  float granularity = floor(uIntensity);

  if (mod(granularity, 2.0) > 0.0) {
    granularity += 1.0;
  }

  if (granularity > 0.0) {
    float dx = granularity / uResolution.x;
    float dy = granularity / uResolution.y;
    vec2 uv =
        vec2(dx * (floor(vUv.x / dx) + 0.5), dy * (floor(vUv.y / dy) + 0.5));

    return texture2D(tDiffuse, uv).rgb;
  }

  return color;
}

void main() {
  vec3 texel = texture2D(tDiffuse, vUv).rgb;
  vec3 color = pixelColor(texel);
  gl_FragColor = vec4(color, 1.0);
}