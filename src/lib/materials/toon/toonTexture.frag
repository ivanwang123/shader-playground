#include <common>
#include <lights_pars_begin>

uniform float uGlossiness;
uniform sampler2D uTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

const float levels = 3.0;

void main() {
  // Directional lighting
  float NdotL = dot(vNormal, directionalLights[0].direction);

  float lightIntensity = max(NdotL, 0.0);
  float level = floor(lightIntensity * levels);
  lightIntensity = level / levels;

  // float lightIntensity = smoothstep(0.0, 0.01, NdotL);
  vec3 directionalLight = directionalLights[0].color * lightIntensity;

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
  float rimIntensity = rimDot * pow(NdotL, rimThreshold);
  rimIntensity = smoothstep(rimAmount - 0.01, rimAmount + 0.01, rimIntensity);

  vec3 rim = rimIntensity * directionalLights[0].color;

  vec3 color = texture2D(uTexture, vUv).rgb;
  gl_FragColor = vec4(
      color * (ambientLightColor + directionalLight + specular + rim), 1.0);
}