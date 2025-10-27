import * as THREE from "three";

import waterVert from "./water.vert";
import waterFrag from "./water.frag";
import { DEPTHLESS_LAYER } from "../../constants";
import { RenderedTextures } from "../../RenderedTextures";
import { createToonMaterial } from "../../materials/toon/createToonMaterial";

export function addWater(camera: THREE.Camera) {
  // const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const wallMaterial = createToonMaterial(new THREE.Color(0xaaaaaa));
  const wallGeometry = new THREE.BoxGeometry(5, 1, 0.5);
  const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
  const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
  wall1.position.z -= 2.5;
  wall2.position.z += 2.5;
  wall3.position.x -= 2.5;
  wall4.position.x += 2.5;
  wall1.position.y -= 0.4;
  wall2.position.y -= 0.4;
  wall3.position.y -= 0.4;
  wall4.position.y -= 0.4;
  wall3.rotation.y = (Math.PI * 90) / 180;
  wall4.rotation.y = (Math.PI * 90) / 180;

  const floorGeometry = new THREE.PlaneGeometry(5, 5);
  const floor = new THREE.Mesh(floorGeometry, wallMaterial);
  floor.position.y = -0.9;
  floor.rotation.x = -(Math.PI * 90) / 180;

  const displacementTexture = new THREE.TextureLoader().load(
    "/textures/DisplacementTexture.png"
  );
  displacementTexture.flipY = false;
  displacementTexture.wrapS = THREE.RepeatWrapping;
  displacementTexture.wrapT = THREE.RepeatWrapping;

  const resolution = new THREE.Vector4(
    window.innerWidth / 3,
    window.innerHeight / 3,
    3 / window.innerWidth,
    3 / window.innerHeight
  );

  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    uniforms: {
      ...THREE.UniformsLib.lights,
      tRealDiffuse: { value: null },
      tRealDepth: { value: null },
      tDisplacement: { value: displacementTexture },
      tDiffuse: { value: null },
      tDepth: { value: null },
      tNormal: { value: null },
      tGrassDiffuse: { value: null },
      tGrassDepth: { value: null },
      uNear: { value: (camera as THREE.PerspectiveCamera).near },
      uFar: { value: (camera as THREE.PerspectiveCamera).far },
      uTime: { value: 0 },
      uDisplacementAmount: { value: 0.2 },
      uDirectionalLight: {
        value: new THREE.Vector3(5, 4, 3),
      },
      uInverseViewMatrix: { value: null },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uResolution: {
        value: resolution,
      },
      uGlossiness: { value: 5 },
    },
    lights: true,
  });
  const waterGeometry = new THREE.PlaneGeometry(5, 5, 20, 20);

  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.layers.set(DEPTHLESS_LAYER);
  water.rotation.x = -(Math.PI * 90) / 180;

  water.attach(wall1);
  water.attach(wall2);
  water.attach(wall3);
  water.attach(wall4);
  water.attach(floor);
  water.position.set(0, 0.5, 0);

  // Reflection
  const clipBias = 0;

  const reflectorPlane = new THREE.Plane();
  const normal = new THREE.Vector3();
  const reflectorWorldPosition = new THREE.Vector3();
  const cameraWorldPosition = new THREE.Vector3();
  const rotationMatrix = new THREE.Matrix4();
  const lookAtPosition = new THREE.Vector3(0, 0, -1);
  const clipPlane = new THREE.Vector4();

  const view = new THREE.Vector3();
  const target = new THREE.Vector3();
  const q = new THREE.Vector4();

  const textureMatrix = new THREE.Matrix4();
  const virtualCamera = new THREE.PerspectiveCamera();
  virtualCamera.layers.enableAll();

  waterMaterial.uniforms["uTextureMatrix"].value = textureMatrix;
  waterMaterial.uniforms["uInverseViewMatrix"].value =
    virtualCamera.matrixWorld;

  let reflectorRenderedTextures: RenderedTextures | null = null;

  waterMaterial.onBeforeCompile = (shader) => {
    shader.fragmentShader = generateFragmentShader(shader);
  };

  water.onBeforeRender = function (renderer, scene, camera) {
    reflectorWorldPosition.setFromMatrixPosition(water.matrixWorld);
    cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

    rotationMatrix.extractRotation(water.matrixWorld);

    normal.set(0, 0, 1);
    normal.applyMatrix4(rotationMatrix);

    view.subVectors(reflectorWorldPosition, cameraWorldPosition);

    // Avoid rendering when reflector is facing away
    if (view.dot(normal) > 0) return;

    view.reflect(normal).negate();
    view.add(reflectorWorldPosition);

    rotationMatrix.extractRotation(camera.matrixWorld);

    lookAtPosition.set(0, 0, -1);
    lookAtPosition.applyMatrix4(rotationMatrix);
    lookAtPosition.add(cameraWorldPosition);

    target.subVectors(reflectorWorldPosition, lookAtPosition);
    target.reflect(normal).negate();
    target.add(reflectorWorldPosition);

    virtualCamera.position.copy(view);
    virtualCamera.up.set(0, 1, 0);
    virtualCamera.up.applyMatrix4(rotationMatrix);
    virtualCamera.up.reflect(normal);
    virtualCamera.lookAt(target);

    virtualCamera.far = (camera as THREE.PerspectiveCamera).far; // Used in WebGLBackground

    virtualCamera.updateMatrixWorld();
    virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

    // Update the texture matrix
    textureMatrix.set(
      0.5,
      0.0,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.5,
      0.0,
      0.0,
      0.5,
      0.5,
      0.0,
      0.0,
      0.0,
      1.0
    );
    textureMatrix.multiply(virtualCamera.projectionMatrix);
    textureMatrix.multiply(virtualCamera.matrixWorldInverse);
    textureMatrix.multiply(water.matrixWorld);

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    reflectorPlane.setFromNormalAndCoplanarPoint(
      normal,
      reflectorWorldPosition
    );
    reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);

    clipPlane.set(
      reflectorPlane.normal.x,
      reflectorPlane.normal.y,
      reflectorPlane.normal.z,
      reflectorPlane.constant
    );

    const projectionMatrix = virtualCamera.projectionMatrix;

    q.x =
      (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) /
      projectionMatrix.elements[0];
    q.y =
      (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) /
      projectionMatrix.elements[5];
    q.z = -1.0;
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x;
    projectionMatrix.elements[6] = clipPlane.y;
    projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
    projectionMatrix.elements[14] = clipPlane.w;

    water.visible = false;

    if (reflectorRenderedTextures === null) {
      reflectorRenderedTextures = new RenderedTextures(
        renderer,
        scene,
        virtualCamera,
        new THREE.OrthographicCamera(),
        new THREE.Vector2(resolution.x, resolution.y)
      );
    }

    reflectorRenderedTextures.resetTextures();

    // Render
    const currentRenderTarget = renderer.getRenderTarget();

    const currentXrEnabled = renderer.xr.enabled;
    const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

    renderer.xr.enabled = false; // Avoid camera modification
    renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    waterMaterial.uniforms["tDiffuse"].value =
      reflectorRenderedTextures.diffuseDepthlessTexture;
    waterMaterial.uniforms["tDepth"].value =
      reflectorRenderedTextures.depthDepthlessTexture;
    waterMaterial.uniforms["tNormal"].value =
      reflectorRenderedTextures.normalDepthlessTexture;
    waterMaterial.uniforms["tGrassDiffuse"].value =
      reflectorRenderedTextures.diffuseTexture;
    waterMaterial.uniforms["tGrassDepth"].value =
      reflectorRenderedTextures.depthTexture;

    renderer.xr.enabled = currentXrEnabled;
    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

    renderer.setRenderTarget(currentRenderTarget);

    // TODO: Restore viewport

    // const viewport = (camera as THREE.PerspectiveCamera).viewport;

    // if (viewport !== undefined) {
    //   renderer.state.viewport(viewport);
    // }

    water.visible = true;
  };

  return water;
}

function generateFragmentShader(
  shader: THREE.WebGLProgramParametersWithUniforms
) {
  let pointLighting = ``;
  for (let i = 0; i < shader.numPointLights; i++) {
    pointLighting += `
      // Point
      PointLightShadow pointShadow${i} = pointLightShadows[${i}];

      float pointShadowIntensity${i} = getPointShadow(
          pointShadowMap[${i}], pointShadow${i}.shadowMapSize, pointShadow${i}.shadowBias,
          pointShadow${i}.shadowRadius, vPointShadowCoord[${i}],
          pointShadow${i}.shadowCameraNear, pointShadow${i}.shadowCameraFar);

      vec3 pointLightDirection${i} =
          pointLights[${i}].position -
          vec3(-vViewPosition.x, vViewPosition.y, vViewPosition.z);
      float pointLightDistance${i} =
          sqrt(dot(pointLightDirection${i}, pointLightDirection${i}));

      float NdotP${i} = dot(vNormal, normalize(pointLightDirection${i}));
      float pointLightIntensity${i} = max(-NdotP${i} + ditherOffset, 0.0);
      float pLevel${i} = floor(pointLightIntensity${i} * levels);
      pointLightIntensity${i} = pLevel${i} / levels;

      pointLight += pointLights[${i}].color * pointLightIntensity${i} /
                    pow(pointLightDistance${i}, 2.0);
    `;
  }

  let directionalLighting = ``;
  for (let i = 0; i < shader.numDirLights; i++) {
    directionalLighting += `
      // Directional
      DirectionalLightShadow directionalShadow${i} = directionalLightShadows[${i}];

      float directionalShadowIntensity${i} =
          getShadow(directionalShadowMap[${i}], directionalShadow${i}.shadowMapSize,
                    directionalShadow${i}.shadowBias, directionalShadow${i}.shadowRadius,
                    vDirectionalShadowCoord[${i}]);

      float NdotD${i} = dot(vNormal, directionalLights[${i}].direction);
      float directionalLightIntensity${i} = max(-NdotD${i} + ditherOffset, 0.0);
      float directionalLevel${i} = floor(directionalLightIntensity${i} * levels);
      directionalLightIntensity${i} = directionalLevel${i} / levels;

      // directionalLight += directionalLights[${i}].color * directionalLightIntensity${i}
      // *
      //                     directionalShadowIntensity${i};
      directionalLight += directionalLights[${i}].color * directionalLightIntensity${i};
    `;
  }

  const heading = `
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
    `;

  const remaining = `
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

    gl_FragColor = vec4(
        color * (ambientLightColor + directionalLight + pointLight + specular),
        1.0);
    }
  `;

  const fragmentShader =
    heading + directionalLighting + pointLighting + remaining;
  return fragmentShader;
}
