uniform sampler2D tRealDepth;
uniform sampler2D tRealDiffuse;
uniform sampler2D tDisplacement;

uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform sampler2D tGrassDiffuse;
uniform sampler2D tGrassDepth;

uniform float uNear;
uniform float uFar;
uniform float uTime;
uniform float uDisplacementAmount;

uniform mat4 uInverseViewMatrix;
uniform vec3 uDirectionalLight;

uniform vec4 uResolution;

varying vec2 vUv;
varying vec4 vTextureUV;

float linearize(float depth) {
  return uNear * uFar / (uFar + depth * (uNear - uFar));
}

void main() {
  vec2 screenUV = gl_FragCoord.xy / uResolution.xy;

  // Displacement
  vec2 displacement = texture2D(tDisplacement, vUv + uTime / 16.0).rg;
  displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

  // Foam depth
  float zDepth = linearize(texture2D(tRealDepth, screenUV).r);
  float zPos = linearize(gl_FragCoord.z);
  float zDiff = clamp(zDepth - zPos, 0.0, 1.0);
  zDiff += displacement.x;

  // Reflection
  vec4 textureUV = vTextureUV;
  textureUV.xy = vTextureUV.xy + displacement.xy / 30.0 * vTextureUV.w;

  float centerDepth = texture2D(tDepth, textureUV.xy / textureUV.w).r;
  vec3 centerNormal =
      texture2D(tNormal, textureUV.xy / textureUV.w).xyz * 2.0 - 1.0;

  vec2 uvs[4];
  uvs[0] = textureUV.xy / textureUV.w + vec2(0.0, uResolution.w);
  uvs[1] = textureUV.xy / textureUV.w + vec2(0.0, -uResolution.w);
  uvs[2] = textureUV.xy / textureUV.w + vec2(uResolution.z, 0.0);
  uvs[3] = textureUV.xy / textureUV.w + vec2(-uResolution.z, 0.0);

  float depthDiff = 0.0;
  float nearestDepth = centerDepth;
  vec2 nearestUV = textureUV.xy / textureUV.w;

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

  vec3 texel = texture2D(tDiffuse, textureUV.xy / textureUV.w).rgb;
  vec3 edgeTexel = texture2D(tDiffuse, nearestUV).rgb;

  // TODO: Fix light edge outlining
  mat3 viewToWorldNormalMat =
      mat3(uInverseViewMatrix[0].xyz, uInverseViewMatrix[1].xyz,
           uInverseViewMatrix[2].xyz);
  float ld =
      dot((viewToWorldNormalMat * centerNormal), -normalize(uDirectionalLight));

  vec3 reflectionColor;
  if ((texture2D(tGrassDepth, nearestUV).r + 0.01) < nearestDepth) {
    reflectionColor = texture2D(tGrassDiffuse, nearestUV).rgb;
  } else if (depthEdge > 0.0) {
    reflectionColor = mix(texel, edgeTexel * darkenAmount, depthEdge);
  } else {
    reflectionColor = mix(
        texel, texel * (ld > 0.0 ? darkenAmount : lightenAmount), normalEdge);
  }

  vec3 waterColor =
      mix(texture2D(tRealDiffuse, screenUV).rgb, vec3(0.0, 0.0, 1.0), 0.5);

  vec3 foamColor = vec3(1.0, 1.0, 1.0);

  vec3 color = mix(waterColor, reflectionColor, 0.4);
  color = mix(foamColor, color, step(0.25, zDiff));

  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = vec4(0.0, 0.0, 0.5, 1.0);
}