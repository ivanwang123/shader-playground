#include <common>
#include <lights_pars_begin>
#include <packing>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform float uGlossiness;
// uniform vec3 uColor;

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
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vViewPosition;

const float levels = 3.0;
const float ditheringLevels = 1.0 / 10.0;

// Bayer 4x4 dithering matrix
const float ditherMatrix[16] =
    float[](0.0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875,
            0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125);

float getDitherValue(ivec2 pixelCoord) {
  int index = (pixelCoord.x % 4) + (pixelCoord.y % 4) * 4;
  return ditherMatrix[index] - 0.5; // Center around zero
}

float linearize(float depth) {
  return uNear * uFar / (uFar + depth * (uNear - uFar));
}

void main() {
  ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
  float ditherOffset =
      getDitherValue(pixelCoord) * ditheringLevels; // Scale dithering

  vec3 pointLight = vec3(0.0, 0.0, 0.0);
  vec3 directionalLight = vec3(0.0, 0.0, 0.0);
  vec3 specular = vec3(0.0, 0.0, 0.0);
  vec3 rim = vec3(0.0, 0.0, 0.0);

  // Point
  PointLightShadow pointShadow0 = pointLightShadows[0];

  float pointShadowIntensity0 = getPointShadow(
      pointShadowMap[0], pointShadow0.shadowMapSize, pointShadow0.shadowBias,
      pointShadow0.shadowRadius, vPointShadowCoord[0],
      pointShadow0.shadowCameraNear, pointShadow0.shadowCameraFar);

  vec3 pointLightDirection0 =
      pointLights[0].position -
      vec3(-vViewPosition.x, vViewPosition.y, vViewPosition.z);
  float pointLightDistance0 =
      sqrt(dot(pointLightDirection0, pointLightDirection0));

  float NdotP0 = dot(vNormal, normalize(pointLightDirection0));
  float pointLightIntensity0 = max(-NdotP0 + ditherOffset, 0.0);
  float pLevel0 = floor(pointLightIntensity0 * levels);
  pointLightIntensity0 = pLevel0 / levels;

  pointLight += pointLights[0].color * pointLightIntensity0 /
                pow(pointLightDistance0, 2.0);

  // PointLightShadow pointShadow1 = pointLightShadows[1];

  // float pointShadowIntensity1 = getPointShadow(
  //     pointShadowMap[1], pointShadow1.shadowMapSize, pointShadow1.shadowBias,
  //     pointShadow1.shadowRadius, vPointShadowCoord[1],
  //     pointShadow1.shadowCameraNear, pointShadow1.shadowCameraFar);

  // vec3 pointLightDirection1 =
  //     pointLights[1].position -
  //     vec3(-vViewPosition.x, vViewPosition.y, vViewPosition.z);
  // float pointLightDistance1 =
  //     sqrt(dot(pointLightDirection1, pointLightDirection1));

  // float NdotP1 = dot(vNormal, normalize(pointLightDirection1));
  // float pointLightIntensity1 = max(-NdotP1 + ditherOffset, 0.0);
  // float pLevel1 = floor(pointLightIntensity1 * levels);
  // pointLightIntensity1 = pLevel1 / levels;

  // pointLight += pointLights[1].color * pointLightIntensity1 *
  //               pointShadowIntensity1 / pow(pointLightDistance1, 2.0);

  // Directional
  DirectionalLightShadow directionalShadow0 = directionalLightShadows[0];

  float directionalShadowIntensity0 =
      getShadow(directionalShadowMap[0], directionalShadow0.shadowMapSize,
                directionalShadow0.shadowBias, directionalShadow0.shadowRadius,
                vDirectionalShadowCoord[0]);

  float NdotD0 = dot(vNormal, directionalLights[0].direction);
  float directionalLightIntensity0 = max(-NdotD0 + ditherOffset, 0.0);
  float directionalLevel0 = floor(directionalLightIntensity0 * levels);
  directionalLightIntensity0 = directionalLevel0 / levels;

  // directionalLight += directionalLights[0].color * directionalLightIntensity0
  // *
  //                     directionalShadowIntensity0;
  directionalLight += directionalLights[0].color * directionalLightIntensity0;

  // Specular lighting
  vec3 halfVector0 = normalize(directionalLights[0].direction * 1.5 + vViewDir);
  float NdotH0 = dot(vNormal, halfVector0);
  float specularIntensity0 = pow(NdotH0, 1000.0 / uGlossiness);
  float specularIntensitySmooth0 = smoothstep(0.05, 0.1, specularIntensity0);

  specular += specularIntensitySmooth0 * directionalLights[0].color;

  // Rim lighting
  float rimDot0 = 1.0 - dot(vViewDir, vNormal);
  float rimAmount0 = 0.7;

  float rimThreshold0 = 0.7;
  float rimIntensity0 = rimDot0 * pow(NdotD0, rimThreshold0);
  rimIntensity0 =
      smoothstep(rimAmount0 - 0.01, rimAmount0 + 0.01, rimIntensity0);

  rim += rimIntensity0 * directionalLights[0].color;

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
      mix(texture2D(tRealDiffuse, screenUV + displacement / 16.0).rgb,
          vec3(0.0, 0.0, 1.0), 0.5);

  vec3 foamColor = vec3(1.0, 1.0, 1.0);

  vec3 color = mix(waterColor, reflectionColor, 0.4);
  color = mix(foamColor, color, step(0.25, zDiff - ditherOffset));

  // gl_FragColor =
  //     vec4(vec3(1.0, 1.0, 1.0) * (ambientLightColor + directionalLight +
  //                                 pointLight + specular + rim),
  //          1.0);
  // gl_FragColor = vec4(color, 1.0);
  gl_FragColor = vec4(
      color * (ambientLightColor + directionalLight + pointLight + specular),
      1.0);
}