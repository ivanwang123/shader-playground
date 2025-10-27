import * as THREE from "three";

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
  };
  console.log(uniforms);

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
    fragmentShader: toonColorFrag,
    uniforms,
    lights: true,
  });
  // toonMaterial.onBeforeCompile = (shader) => {
  //   shader.fragmentShader = generateFragmentShader(shader);
  // };

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
			float pointLightIntensity${i} = max(NdotP${i} + ditherOffset, 0.0);
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

			float directionalLightIntensity${i} = max(NdotD${i} + ditherOffset, 0.0);
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

		varying vec2 vUv;
		varying vec3 vNormal;
		varying vec3 vViewDir;
		varying vec3 vViewPosition;

		const float levels = 3.0;
    const float ditheringLevels = 1.0 / 10.0;

    // Bayer 4x4 dithering matrix
    // const float ditherMatrix[64] = float[](
    //     0.0 / 64.0,  48.0 / 64.0, 12.0 / 64.0, 60.0 / 64.0,  3.0 / 64.0, 51.0 / 64.0, 15.0 / 64.0, 63.0 / 64.0,
    //   32.0 / 64.0,  16.0 / 64.0, 44.0 / 64.0, 28.0 / 64.0, 35.0 / 64.0, 19.0 / 64.0, 47.0 / 64.0, 31.0 / 64.0,
    //     8.0 / 64.0,  56.0 / 64.0,  4.0 / 64.0, 52.0 / 64.0, 11.0 / 64.0, 59.0 / 64.0,  7.0 / 64.0, 55.0 / 64.0,
    //   40.0 / 64.0,  24.0 / 64.0, 36.0 / 64.0, 20.0 / 64.0, 43.0 / 64.0, 27.0 / 64.0, 39.0 / 64.0, 23.0 / 64.0,
    //     2.0 / 64.0,  50.0 / 64.0, 14.0 / 64.0, 62.0 / 64.0,  1.0 / 64.0, 49.0 / 64.0, 13.0 / 64.0, 61.0 / 64.0,
    //   34.0 / 64.0,  18.0 / 64.0, 46.0 / 64.0, 30.0 / 64.0, 33.0 / 64.0, 17.0 / 64.0, 45.0 / 64.0, 29.0 / 64.0,
    //   10.0 / 64.0,  58.0 / 64.0,  6.0 / 64.0, 54.0 / 64.0,  9.0 / 64.0, 57.0 / 64.0,  5.0 / 64.0, 53.0 / 64.0,
    //   42.0 / 64.0,  26.0 / 64.0, 38.0 / 64.0, 22.0 / 64.0, 41.0 / 64.0, 25.0 / 64.0, 37.0 / 64.0, 21.0 / 64.0
    // );

    const float ditherMatrix[16] = float[](
        0.0,  0.5,  0.125, 0.625,
        0.75, 0.25, 0.875, 0.375,
        0.1875, 0.6875, 0.0625, 0.5625,
        0.9375, 0.4375, 0.8125, 0.3125
    );

    // const float ditherMatrix[9] = float[](
    //     0.0 / 9.0, 7.0 / 9.0, 3.0 / 9.0,
    //     6.0 / 9.0, 5.0 / 9.0, 2.0 / 9.0,
    //     4.0 / 9.0, 1.0 / 9.0, 8.0 / 9.0
    // );

    // const float bayer2x2[4] = float[](
    //     0.0 / 4.0,  2.0 / 4.0,
    //     3.0 / 4.0,  1.0 / 4.0
    // );

    float getDitherValue(ivec2 pixelCoord) {
        int index = (pixelCoord.x % 4) + (pixelCoord.y % 4) * 4;
        return ditherMatrix[index] - 0.5; // Center around zero
    }

		void main() {
      ivec2 pixelCoord = ivec2(gl_FragCoord.xy);
      float ditherOffset = getDitherValue(pixelCoord) * ditheringLevels; // Scale dithering

			vec3 pointLight = vec3(0.0, 0.0, 0.0);
			vec3 directionalLight = vec3(0.0, 0.0, 0.0);
			vec3 specular = vec3(0.0, 0.0, 0.0);
			vec3 rim = vec3(0.0, 0.0, 0.0);
	`;

  const remaining = `
			gl_FragColor = vec4(uColor * (ambientLightColor + directionalLight + pointLight + specular + rim), 1.0);
		}
	`;

  const fragmentShader =
    heading + directionalLighting + pointLighting + remaining;
  return fragmentShader;
}
