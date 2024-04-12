import * as THREE from "three";
import { RenderedTextures } from "../../RenderedTextures";
import reflectorVert from "./reflector.vert";
import reflectorFrag from "./reflector.frag";

class Reflector extends THREE.Mesh {
  renderTarget: THREE.WebGLRenderTarget;
  textureMatrix: THREE.Matrix4;

  constructor(geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>) {
    super(geometry);

    const scope = this;

    const resolution = new THREE.Vector4(
      window.innerWidth / 3,
      window.innerHeight / 3,
      3 / window.innerWidth,
      3 / window.innerHeight
    );

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

    this.textureMatrix = new THREE.Matrix4();
    const virtualCamera = new THREE.PerspectiveCamera();
    virtualCamera.layers.enableAll();

    const material = new THREE.ShaderMaterial({
      uniforms: {
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
        uTextureMatrix: {
          value: null,
        },
        uDirectionalLight: {
          value: new THREE.Vector3(5, 4, 3),
        },
        uInverseViewMatrix: {
          value: null,
        },
        uResolution: {
          value: resolution,
        },
      },
      vertexShader: reflectorVert,
      fragmentShader: reflectorFrag,
    });

    material.uniforms["uTextureMatrix"].value = this.textureMatrix;
    material.uniforms["uInverseViewMatrix"].value = virtualCamera.matrixWorld;

    this.material = material;

    let reflectorRenderedTextures: RenderedTextures | null = null;

    this.renderTarget = new THREE.WebGLRenderTarget(512, 512);
    this.renderTarget.texture.format = THREE.RGBAFormat;
    this.renderTarget.texture.minFilter = THREE.NearestFilter;
    this.renderTarget.texture.magFilter = THREE.NearestFilter;
    this.renderTarget.texture.generateMipmaps = false;
    this.renderTarget.stencilBuffer = false;

    this.onBeforeRender = function (renderer, scene, camera) {
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
      scope.textureMatrix.set(
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
      scope.textureMatrix.multiply(virtualCamera.projectionMatrix);
      scope.textureMatrix.multiply(virtualCamera.matrixWorldInverse);
      scope.textureMatrix.multiply(scope.matrixWorld);

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

      scope.visible = false;

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

      renderer.xr.enabled = currentXrEnabled;
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

      renderer.setRenderTarget(scope.renderTarget);
      renderer.render(scene, virtualCamera);

      renderer.setRenderTarget(currentRenderTarget);

      // TODO: Restore viewport

      // const viewport = (camera as THREE.PerspectiveCamera).viewport;

      // if (viewport !== undefined) {
      //   renderer.state.viewport(viewport);
      // }

      scope.visible = true;
    };
  }
}

export { Reflector };
