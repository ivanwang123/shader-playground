uniform vec2 uResolution;
uniform float uIntensity;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
uniform sampler2D tDepth;

varying vec2 vUv;

float getDepth(int x, int y) {
  return texture2D(tDepth, vUv + vec2(x, y) * vec2(1.0 / uResolution.x,
                                                   1.0 / uResolution.y))
      .r;
}

vec3 getNormal(int x, int y) {
  return texture2D(tNormal, vUv + vec2(x, y) * vec2(1.0 / uResolution.x,
                                                    1.0 / uResolution.y))
                 .rgb *
             2.0 -
         1.0;
}

float neighborNormalEdgeIndicator(int x, int y, float depth, vec3 normal) {
  float depthDiff = getDepth(x, y) - depth;

  // Edge pixels should yield to faces closer to the bias direction.
  vec3 normalEdgeBias =
      vec3(1., 1., 1.); // This should probably be a parameter.
  float normalDiff = dot(normal - getNormal(x, y), normalEdgeBias);
  float normalIndicator = clamp(smoothstep(-.01, .01, normalDiff), 0.0, 1.0);

  // Only the shallower pixel should detect the normal edge.
  float depthIndicator = clamp(sign(depthDiff * .25 + .0025), 0.0, 1.0);

  return distance(normal, getNormal(x, y)) * depthIndicator * normalIndicator;
}

float depthEdgeIndicator() {
  float depth = getDepth(0, 0);
  vec3 normal = getNormal(0, 0);
  float diff = 0.0;
  diff += clamp(getDepth(1, 0) - depth, 0.0, 1.0);
  diff += clamp(getDepth(-1, 0) - depth, 0.0, 1.0);
  diff += clamp(getDepth(0, 1) - depth, 0.0, 1.0);
  diff += clamp(getDepth(0, -1) - depth, 0.0, 1.0);
  return floor(smoothstep(0.01, 0.02, diff) * 2.) / 2.;
}

float normalEdgeIndicator() {
  float depth = getDepth(0, 0);
  vec3 normal = getNormal(0, 0);

  float indicator = 0.0;

  indicator += neighborNormalEdgeIndicator(0, -1, depth, normal);
  indicator += neighborNormalEdgeIndicator(0, 1, depth, normal);
  indicator += neighborNormalEdgeIndicator(-1, 0, depth, normal);
  indicator += neighborNormalEdgeIndicator(1, 0, depth, normal);

  return step(0.1, indicator);
}

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

  float normalEdgeCoefficient = .3;
  float depthEdgeCoefficient = .4;

  float dei = depthEdgeIndicator();
  float nei = normalEdgeIndicator();

  float coefficient = dei > 0.0 ? (1.0 - depthEdgeCoefficient * dei)
                                : (1.0 + normalEdgeCoefficient * nei);

  gl_FragColor = vec4(color, 1.0) * coefficient;
}