uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tGrassDiffuse;
uniform sampler2D tGrassDepth;

uniform vec3 uDirectionalLight;
uniform mat4 uInverseViewMatrix;
uniform vec4 uResolution;

varying vec4 vUv;

void main() {
  float centerDepth = texture2DProj(tDepth, vUv).r;
  vec3 centerNormal = texture2DProj(tNormal, vUv).xyz * 2.0 - 1.0;

  vec2 uvs[4];
  uvs[0] = vUv.xy / vUv.w + vec2(0.0, uResolution.w);
  uvs[1] = vUv.xy / vUv.w + vec2(0.0, -uResolution.w);
  uvs[2] = vUv.xy / vUv.w + vec2(uResolution.z, 0.0);
  uvs[3] = vUv.xy / vUv.w + vec2(-uResolution.z, 0.0);

  float depthDiff = 0.0;
  float nearestDepth = centerDepth;
  vec2 nearestUV = vUv.xy / vUv.w;

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

  vec3 texel = texture2DProj(tDiffuse, vUv).rgb;
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

  gl_FragColor = vec4(edgeMix, 1.0);
}