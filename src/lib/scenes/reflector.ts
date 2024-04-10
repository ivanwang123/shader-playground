import * as THREE from "three";
import { RenderedTextures } from "../../routes/pixel-shader-3/RenderedTextures";

class Reflector extends THREE.Mesh {
  isReflector: boolean;
  type: string;
  camera: THREE.PerspectiveCamera;
  getRenderTarget: () => THREE.WebGLRenderTarget;
  dispose: () => void;

  static ReflectorShader: any;

  constructor(
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    options: any = {}
  ) {
    super(geometry);

    this.isReflector = true;

    this.type = "Reflector";
    this.camera = new THREE.PerspectiveCamera();

    const scope = this;

    const color =
      options.color !== undefined
        ? new THREE.Color(options.color)
        : new THREE.Color(0x7f7f7f);
    const textureWidth = options.textureWidth || 512;
    const textureHeight = options.textureHeight || 512;
    const clipBias = options.clipBias || 0;
    const shader = options.shader || Reflector.ReflectorShader;
    const multisample =
      options.multisample !== undefined ? options.multisample : 4;

    //

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
    const virtualCamera = this.camera;

    // const renderTarget = new THREE.WebGLRenderTarget(
    //   textureWidth,
    //   textureHeight,
    //   {
    //     samples: multisample,
    //     type: THREE.HalfFloatType,
    //   }
    // );

    const material = new THREE.ShaderMaterial({
      name: shader.name !== undefined ? shader.name : "unspecified",
      uniforms: THREE.UniformsUtils.clone(shader.uniforms),
      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
    });

    // material.uniforms["tDiffuse"].value = renderTarget.texture;
    material.uniforms["color"].value = color;
    material.uniforms["textureMatrix"].value = textureMatrix;

    this.material = material;

    let reflectorRenderedTextures: RenderedTextures | null = null;

    this.onBeforeRender = function (renderer, scene, camera) {
      // texture.material.uniforms.tDiffuse.value =
      //   reflectorRenderedTextures.diffuseDepthlessTexture;
      // texture.material.uniforms.tDepth.value =
      //   reflectorRenderedTextures.depthDepthlessTexture;

      // texture.material.uniforms.tNormal.value =
      //   reflectorRenderedTextures.normalDepthlessTexture;

      // texture.material.uniforms.tGrassDiffuse.value =
      //   reflectorRenderedTextures.diffuseTexture;
      // texture.material.uniforms.tGrassDepth.value =
      //   reflectorRenderedTextures.depthTexture;

      reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld);

      rotationMatrix.extractRotation(scope.matrixWorld);

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
      textureMatrix.multiply(scope.matrixWorld);

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
      q.w =
        (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];

      // Calculate the scaled plane vector
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));

      // Replacing the third row of the projection matrix
      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias;
      projectionMatrix.elements[14] = clipPlane.w;

      if (reflectorRenderedTextures === null) {
        reflectorRenderedTextures = new RenderedTextures(
          renderer,
          scene,
          virtualCamera,
          new THREE.OrthographicCamera(),
          new THREE.Vector2(window.innerWidth / 3, window.innerHeight / 3)
        );
      }

      reflectorRenderedTextures.resetTextures();

      material.uniforms["uInverseProjectionMatrix"].value =
        virtualCamera.projectionMatrixInverse;
      material.uniforms["uInverseViewMatrix"].value = virtualCamera.matrixWorld;

      material.uniforms["tDiffuse"].value =
        reflectorRenderedTextures.diffuseDepthlessTexture;
      material.uniforms["tDepth"].value =
        reflectorRenderedTextures.depthDepthlessTexture;
      material.uniforms["tNormal"].value =
        reflectorRenderedTextures.normalDepthlessTexture;
      material.uniforms["tGrassDiffuse"].value =
        reflectorRenderedTextures.diffuseTexture;
      material.uniforms["tGrassDepth"].value =
        reflectorRenderedTextures.depthTexture;
      // Render
      scope.visible = false;

      const currentRenderTarget = renderer.getRenderTarget();

      const currentXrEnabled = renderer.xr.enabled;
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

      renderer.xr.enabled = false; // Avoid camera modification
      renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

      renderer.setRenderTarget(renderTarget);

      renderer.state.buffers.depth.setMask(true); // make sure the depth buffer is writable so it can be properly cleared, see #18897

      if (renderer.autoClear === false) renderer.clear();
      renderer.render(scene, virtualCamera);

      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

      renderer.setRenderTarget(currentRenderTarget);

      // TODO: Restore viewport

      // const viewport = (camera as THREE.PerspectiveCamera).viewport;

      // if (viewport !== undefined) {
      //   renderer.state.viewport(viewport);
      // }

      scope.visible = true;
    };

    this.getRenderTarget = function () {
      return renderTarget;
    };

    this.dispose = function () {
      renderTarget.dispose();
      if (scope.material instanceof THREE.Material) {
        scope.material.dispose();
      } else {
        scope.material.forEach((material) => material.dispose());
      }
    };
  }
}

Reflector.ReflectorShader = {
  name: "ReflectorShader",

  uniforms: {
    color: {
      value: null,
    },

    // tDiffuse: {
    //   value: null,
    // },

    textureMatrix: {
      value: null,
    },

    tDiffuse: {
      value: null,
    },
    tDepth: {
      value: null,
    },
    tNormal: {
      value: null,
    },
    tGrassDiffuse: {
      value: null,
    },
    tGrassDepth: {
      value: null,
    },

    uDirectionalLight: {
      value: new THREE.Vector3(5, 4, 3),
    },
    uInverseProjectionMatrix: {
      value: null,
    },
    uInverseViewMatrix: {
      value: null,
    },
    uResolution: {
      value: new THREE.Vector4(
        window.innerWidth / 3,
        window.innerHeight / 3,
        3 / window.innerWidth,
        3 / window.innerHeight
      ),
    },
  },

  vertexShader: /* glsl */ `
		uniform mat4 textureMatrix;
		// varying vec4 vUv;
		varying vec2 vUv;

		// #include <common>
		// #include <logdepthbuf_pars_vertex>

		void main() {

			// vUv = textureMatrix * vec4( position, 1.0 );
			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			// #include <logdepthbuf_vertex>

		}`,

  fragmentShader: /* glsl */ `
	 // #include <common>
// #include <lights_pars_begin>

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

  gl_FragColor = vec4(vec3(1.0), 1.0);
}

		// uniform vec3 color;
		// uniform sampler2D tDiffuse;
		// varying vec4 vUv;

		// #include <logdepthbuf_pars_fragment>

		// float blendOverlay( float base, float blend ) {

		// 	return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		// }

		// vec3 blendOverlay( vec3 base, vec3 blend ) {

		// 	return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		// }

		// void main() {

		// 	#include <logdepthbuf_fragment>

		// 	vec4 base = texture2DProj( tDiffuse, vUv );
		// 	gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

		// 	#include <tonemapping_fragment>
		// 	#include <colorspace_fragment>

		// }
		`,
};

export { Reflector };
