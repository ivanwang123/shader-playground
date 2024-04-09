#include <common>
#include <lights_pars_begin>
#include <packing>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>

uniform float uGlossiness;
uniform vec3 uColor;

uniform bool hasPointLights;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vViewPosition;

const float levels = 3.0;

void main() {
  // Point shadow map
  float pointShadowIntensity = 0.0;
  if (hasPointLights) {
    for (int i = 0; i < pointLightShadows.length(); i++) {
      PointLightShadow pointShadow = pointLightShadows[i];

      pointShadowIntensity = getPointShadow(
          pointShadowMap[i], pointShadow.shadowMapSize, pointShadow.shadowBias,
          pointShadow.shadowRadius, vPointShadowCoord[i],
          pointShadow.shadowCameraNear, pointShadow.shadowCameraFar);
    }
  }

  // Directional shadow map
  DirectionalLightShadow directionalShadow = directionalLightShadows[0];

  float directionalShadowIntensity =
      getShadow(directionalShadowMap[0], directionalShadow.shadowMapSize,
                directionalShadow.shadowBias, directionalShadow.shadowRadius,
                vDirectionalShadowCoord[0]);

  // Point lighting
  vec3 pointLightDirection = pointLights[0].position - vViewPosition;
  float pointLightDistance =
      sqrt(dot(pointLightDirection, pointLightDirection));

  float NdotP = dot(vNormal, normalize(pointLightDirection));
  float pointLightIntensity = max(NdotP, 0.0);
  float pLevel = floor(pointLightIntensity * levels);
  pointLightIntensity = pLevel / levels;

  vec3 pointLight = pointLights[0].color * pointLightIntensity *
                    pointShadowIntensity / pow(pointLightDistance, 2.0);

  // Directional lighting
  float NdotD = dot(vNormal, directionalLights[0].direction);

  float directionalLightIntensity = max(NdotD, 0.0);
  float directionalLevel = floor(directionalLightIntensity * levels);
  directionalLightIntensity = directionalLevel / levels;

  vec3 directionalLight = directionalLights[0].color *
                          directionalLightIntensity *
                          directionalShadowIntensity;

  // Specular lighting
  vec3 halfVector = normalize(directionalLights[0].direction * 1.5 + vViewDir);
  float NdotH = dot(vNormal, halfVector);

  float specularIntensity = pow(NdotH, 1000.0 / uGlossiness);
  float specularIntensitySmooth = smoothstep(0.05, 0.1, specularIntensity);

  vec3 specular = specularIntensitySmooth * directionalLights[0].color;

  // Rim lighting
  float rimDot = 1.0 - dot(vViewDir, vNormal);
  float rimAmount = 0.7;

  float rimThreshold = 0.7;
  float rimIntensity = rimDot * pow(NdotD, rimThreshold);
  rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);

  vec3 rim = rimIntensity * directionalLights[0].color;

  gl_FragColor = vec4(uColor * (ambientLightColor + directionalLight +
                                pointLight + specular + rim),
                      1.0);
  // gl_FragColor = vec4(vec3(pointShadowIntensity), 1.0);
}