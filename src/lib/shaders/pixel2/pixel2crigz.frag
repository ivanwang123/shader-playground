uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tGrassDiffuse;
uniform sampler2D tGrassDepth;
uniform vec3 uDirectionalLight;
uniform mat4 uInverseViewMatrix;
uniform mat4 uInverseProjectionMatrix;
uniform vec4 uResolution;

varying vec2 vUv;
varying mat4 inverseProjectionMatrix;

float getDepth(sampler2D depthTexture, vec2 uv) {
  float depth = texture2D(depthTexture, uv).r;
  vec3 ndc = vec3(uv * 2.0 - 1.0, depth);
  vec4 view = uInverseProjectionMatrix * vec4(ndc, 1.0);
  view.xyz /= view.w;
  return -view.z;
}

void main() {
  float centerDepth = getDepth(tDepth, vUv);
  vec3 centerNormal = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;

  vec2 uvs[4];
  uvs[0] = vec2(vUv.x, vUv.y + uResolution.w);
  uvs[1] = vec2(vUv.x, vUv.y - uResolution.w);
  uvs[2] = vec2(vUv.x + uResolution.z, vUv.y);
  uvs[3] = vec2(vUv.x - uResolution.z, vUv.y);

  float depthDiff = 0.0;
  float nearestDepth = centerDepth;
  vec2 nearestUV = vUv;

  float normalSum = 0.0;

  for (int i = 0; i < 4; i++) {
    float offsetDepth = getDepth(tDepth, uvs[i]);
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

  vec3 texel = texture2D(tDiffuse, vUv).rgb;
  vec3 edgeTexel = texture2D(tDiffuse, nearestUV).rgb;

  mat3 viewToWorldNormalMat =
      mat3(uInverseViewMatrix[0].xyz, uInverseViewMatrix[1].xyz,
           uInverseViewMatrix[2].xyz);
  float ld =
      dot((viewToWorldNormalMat * centerNormal), -normalize(uDirectionalLight));

  vec3 edgeMix;
  if ((getDepth(tGrassDepth, nearestUV) + 0.01) < nearestDepth) {
    edgeMix = texture2D(tGrassDiffuse, nearestUV).rgb;
  } else if (depthEdge > 0.0) {
    edgeMix = mix(texel, edgeTexel * darkenAmount, depthEdge);
  } else {
    edgeMix = mix(texel, texel * (ld > 0.0 ? darkenAmount : lightenAmount),
                  normalEdge);
  }

  // vec3 color = mix(texel, edgeTexel * darkenAmount, depthEdge);

  gl_FragColor = vec4(edgeMix, 1.0);
  // gl_FragColor = vec4(viewToWorldNormalMat * centerNormal, 1.0);
}
