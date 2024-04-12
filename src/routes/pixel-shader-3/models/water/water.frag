uniform sampler2D tRealDepth;
uniform sampler2D tRealDiffuse;
uniform sampler2D tDisplacement;

uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform float uDisplacementAmount;

uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tGrassDiffuse;
uniform sampler2D tGrassDepth;

uniform vec3 uDirectionalLight;
uniform mat4 uInverseViewMatrix;
uniform vec4 uResolution;
// uniform vec2 uResolution;

varying vec2 vUv;
varying vec4 vTextureUV;

float linearize(float depth) {
  return uNear * uFar / (uFar + depth * (uNear - uFar));
}

void main() {
  vec2 screenUV = gl_FragCoord.xy / uResolution.xy;

  vec2 displacement = texture2D(tDisplacement, vUv + uTime / 16.0).rg;
  displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

  float depth = texture2D(tRealDepth, screenUV).r;
  float zDepth = linearize(depth);

  float zPos = linearize(gl_FragCoord.z);

  float diff = clamp(zDepth - zPos, 0.0, 1.0);
  diff += displacement.x;

  vec3 waterColor =
      mix(texture2D(tRealDiffuse, screenUV).rgb, vec3(0.0, 0.0, 1.0), 0.5);
  vec3 foamColor = vec3(1.0, 1.0, 1.0);

  vec3 color = mix(foamColor, waterColor, step(0.25, diff));
  // gl_FragColor = vec4(color, 1.0);

  //

  vec4 newUV = vTextureUV;
  newUV.x = vTextureUV.x + displacement.x / 30.0 * vTextureUV.w;
  newUV.y = vTextureUV.y + displacement.y / 30.0 * vTextureUV.w;

  float centerDepth = texture2D(tDepth, newUV.xy / newUV.w).r;
  vec3 centerNormal = texture2D(tNormal, newUV.xy / newUV.w).xyz * 2.0 - 1.0;

  vec2 uvs[4];
  uvs[0] = newUV.xy / newUV.w + vec2(0.0, uResolution.w);
  uvs[1] = newUV.xy / newUV.w + vec2(0.0, -uResolution.w);
  uvs[2] = newUV.xy / newUV.w + vec2(uResolution.z, 0.0);
  uvs[3] = newUV.xy / newUV.w + vec2(-uResolution.z, 0.0);

  float depthDiff = 0.0;
  float nearestDepth = centerDepth;
  vec2 nearestUV = newUV.xy / newUV.w;

  float normalSum = 0.0;

  for (int i = 0; i < 4; i++) {
    float offsetDepth = texture2D(tDepth, uvs[i]).r;
    depthDiff += centerDepth - offsetDepth;

    if (offsetDepth < nearestDepth) {
      nearestDepth = offsetDepth;
      nearestUV = uvs[i];
    }

    vec3 offsetNormal = texture2D(tNormal, uvs[i]).xyz * 2.0 - 1.0;
    vec3 normalDiff = centerNormal - offsetNormal;

    vec3 normalEdgeBias = vec3(1.0, 1.0, 1.0);
    float normalBiasDiff = dot(normalDiff, normalEdgeBias);
    float normalIndicator = smoothstep(-0.01, 0.01, normalBiasDiff);

    normalSum += dot(normalDiff, normalDiff) * normalIndicator;
  }

  float depthThreshold = 0.05;
  float depthEdge = step(depthThreshold, depthDiff);

  float darkenAmount = 0.3;
  float lightenAmount = 1.5;

  float normalThreshold = 0.6;
  float indicator = sqrt(normalSum);
  float normalEdge = step(normalThreshold, indicator);

  vec3 texel = texture2D(tDiffuse, newUV.xy / newUV.w).rgb;
  vec3 edgeTexel = texture2D(tDiffuse, nearestUV).rgb;

  // TODO: Fix light edge outlining
  mat3 viewToWorldNormalMat =
      mat3(uInverseViewMatrix[0].xyz, uInverseViewMatrix[1].xyz,
           uInverseViewMatrix[2].xyz);
  float ld =
      dot((viewToWorldNormalMat * centerNormal), -normalize(uDirectionalLight));

  vec3 edgeMix;
  if ((texture2D(tGrassDepth, nearestUV).r + 0.01) < nearestDepth) {
    edgeMix = texture2D(tGrassDiffuse, nearestUV).rgb;
  } else if (depthEdge > 0.0) {
    edgeMix = mix(texel, edgeTexel * darkenAmount, depthEdge);
  } else {
    edgeMix = mix(texel, texel * (ld > 0.0 ? darkenAmount : lightenAmount),
                  normalEdge);
  }

  gl_FragColor = vec4(mix(color, edgeMix, 0.4), 1.0);
}