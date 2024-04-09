import * as THREE from "three";

import lightsParsBeginOverride from "./lights_pars_begin_override.glsl";
import shadowmapParsFragmentOverride from "./shadowmap_pars_fragment_override.glsl";
import toonVert from "./toon.vert";
import toonTextureFrag from "./toonTexture.frag";
import toonColorFrag from "./toonColor.frag";

export function createToonMaterial(texture: THREE.Texture | THREE.Color) {
  let isTexture = true;
  if (texture instanceof THREE.Color) {
    isTexture = false;
  }

  let fragmentShader = toonTextureFrag;

  let uniforms: { [uniform: string]: THREE.IUniform<any> } = {
    ...THREE.UniformsLib.lights,
    uGlossiness: { value: 5 },
    // hasPointLights: {
    //   value: THREE.UniformsLib.lights.pointLights.value.length > 0,
    // },
  };
  // console.log(uniforms.pointlights);

  // THREE.ShaderChunk.lights_pars_begin = lightsParsBeginOverride;
  // THREE.ShaderChunk.shadowmap_pars_fragment = shadowmapParsFragmentOverride;

  if (isTexture) {
    fragmentShader = toonTextureFrag;
    uniforms["uTexture"] = { value: texture };
  } else {
    fragmentShader = toonColorFrag;
    uniforms["uColor"] = { value: texture };
  }

  const toonMaterial = new THREE.ShaderMaterial({
    vertexShader: toonVert,
    fragmentShader: ``,
    uniforms,
    lights: true,
  });
  toonMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = generateFragmentShader(shader);
  };

  return toonMaterial;
}

function generateFragmentShader(
  shader: THREE.WebGLProgramParametersWithUniforms
) {
  let pointLighting = ``;
  for (let i = 0; i < shader.numPointLights; i++) {
    pointLighting += `
			PointLightShadow pointShadow${i} = pointLightShadows[${i}];
			
			float pointShadowIntensity${i} = getPointShadow(
					pointShadowMap[${i}], pointShadow${i}.shadowMapSize, pointShadow${i}.shadowBias,
					pointShadow${i}.shadowRadius, vPointShadowCoord[${i}],
					pointShadow${i}.shadowCameraNear, pointShadow${i}.shadowCameraFar);

			vec3 pointLightDirection${i} = pointLights[${i}].position - vViewPosition;
			float pointLightDistance${i} =
					sqrt(dot(pointLightDirection${i}, pointLightDirection${i}));

			float NdotP${i} = dot(vNormal, normalize(pointLightDirection${i}));
			float pointLightIntensity${i} = max(NdotP${i}, 0.0);
			float pLevel${i} = floor(pointLightIntensity${i} * levels);
			pointLightIntensity${i} = pLevel${i} / levels;

			pointLight += pointLights[${i}].color * pointLightIntensity${i} *
										pointShadowIntensity${i} / pow(pointLightDistance${i}, 2.0);
		`;
  }

  let directionalLighting = ``;
  for (let i = 0; i < shader.numDirLights; i++) {
    directionalLighting += `
			DirectionalLightShadow directionalShadow${i} = directionalLightShadows[${i}];

			float directionalShadowIntensity${i} =
					getShadow(directionalShadowMap[${i}], directionalShadow${i}.shadowMapSize,
										directionalShadow${i}.shadowBias, directionalShadow${i}.shadowRadius,
										vDirectionalShadowCoord[${i}]);
				
			float NdotD${i} = dot(vNormal, directionalLights[${i}].direction);

			float directionalLightIntensity${i} = max(NdotD${i}, 0.0);
			float directionalLevel${i} = floor(directionalLightIntensity${i} * levels);
			directionalLightIntensity${i} = directionalLevel${i} / levels;

			directionalLight += directionalLights[${i}].color *
													directionalLightIntensity${i} *
													directionalShadowIntensity${i};

			// Specular lighting
			vec3 halfVector${i} = normalize(directionalLights[${i}].direction * 1.5 + vViewDir);
			float NdotH${i} = dot(vNormal, halfVector${i});

			float specularIntensity${i} = pow(NdotH${i}, 1000.0 / uGlossiness);
			float specularIntensitySmooth${i} = smoothstep(0.05, 0.1, specularIntensity${i});

			specular += specularIntensitySmooth${i} * directionalLights[${i}].color;

			// Rim lighting
			float rimDot${i} = 1.0 - dot(vViewDir, vNormal);
			float rimAmount${i} = 0.7;

			float rimThreshold${i} = 0.7;
			float rimIntensity${i} = rimDot${i} * pow(NdotD${i}, rimThreshold${i});
			rimIntensity${i} = smoothstep(rimAmount${i} - 0.01, rimAmount${i} + 0.01, rimIntensity${i});

			rim += rimIntensity${i} * directionalLights[${i}].color;
		`;
  }

  const heading = `
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
			vec3 pointLight = vec3(0.0, 0.0, 0.0);
			vec3 directionalLight = vec3(0.0, 0.0, 0.0);
			vec3 specular = vec3(0.0, 0.0, 0.0);
			vec3 rim = vec3(0.0, 0.0, 0.0);
	`;

  const remaining = `
			gl_FragColor = vec4(uColor * (ambientLightColor + directionalLight +
																		pointLight + specular + rim),
													1.0);
		}
	`;

  const fragmentShader =
    heading + directionalLighting + pointLighting + remaining;
  return fragmentShader;
}
