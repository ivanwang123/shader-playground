#include <common>
#include <lights_pars_begin>
#include <packing>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform float uGlossiness;
uniform vec3 uColor;

varying vec2 vUv;
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

void main() {
  ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
  float ditherOffset =
      getDitherValue(pixelCoord) * ditheringLevels; // Scale dithering

  vec3 pointLight = vec3(0.0, 0.0, 0.0);
  vec3 directionalLight = vec3(0.0, 0.0, 0.0);
  vec3 specular = vec3(0.0, 0.0, 0.0);
  vec3 rim = vec3(0.0, 0.0, 0.0);

  // Directional light
  DirectionalLightShadow directionalShadow0 = directionalLightShadows[0];

  float directionalShadowIntensity0 =
      getShadow(directionalShadowMap[0], directionalShadow0.shadowMapSize,
                directionalShadow0.shadowBias, directionalShadow0.shadowRadius,
                vDirectionalShadowCoord[0]);

  float NdotD0 = dot(vNormal, directionalLights[0].direction);

  float directionalLightIntensity0 = max(NdotD0 + ditherOffset, 0.0);
  float directionalLevel0 = floor(directionalLightIntensity0 * levels);
  directionalLightIntensity0 = directionalLevel0 / levels;

  directionalLight += directionalLights[0].color * directionalLightIntensity0 *
                      directionalShadowIntensity0;

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

  // Point light
  PointLightShadow pointShadow0 = pointLightShadows[0];

  float pointShadowIntensity0 = getPointShadow(
      pointShadowMap[0], pointShadow0.shadowMapSize, pointShadow0.shadowBias,
      pointShadow0.shadowRadius, vPointShadowCoord[0],
      pointShadow0.shadowCameraNear, pointShadow0.shadowCameraFar);

  vec3 pointLightDirection0 = pointLights[0].position - vViewPosition;
  float pointLightDistance0 =
      sqrt(dot(pointLightDirection0, pointLightDirection0));

  float NdotP0 = dot(vNormal, normalize(pointLightDirection0));
  float pointLightIntensity0 = max(NdotP0 + ditherOffset, 0.0);
  float pLevel0 = floor(pointLightIntensity0 * levels);
  pointLightIntensity0 = pLevel0 / levels;

  pointLight += pointLights[0].color * pointLightIntensity0 *
                pointShadowIntensity0 / pow(pointLightDistance0, 2.0);

  gl_FragColor = vec4(uColor * (ambientLightColor + directionalLight +
                                pointLight + specular + rim),
                      1.0);
}