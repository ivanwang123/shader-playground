import { createToonMaterial } from "$lib/materials/toon/createToonMaterial";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export function addGround(scene: THREE.Scene) {
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  // const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xceb1be });
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  // const groundMaterial = createToonMaterial(new THREE.Color(0x999999));
  const ground = new THREE.Mesh<any, any, any>(groundGeometry, groundMaterial);
  ground.receiveShadow = true;
  ground.rotateX(THREE.MathUtils.degToRad(-90));
  ground.layers.set(1);
  scene.add(ground);
}

let numModels = 0;

export async function addMonkey(scene: THREE.Scene) {
  const monkeyTexture = new THREE.TextureLoader().load(
    "/textures/MonkeyTexture.png"
  );
  monkeyTexture.flipY = false;
  monkeyTexture.colorSpace = THREE.SRGBColorSpace;
  const monkeyMaterial = createToonMaterial(monkeyTexture);
  const whiteMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Pure white color
    side: THREE.DoubleSide, // Important for some models
  });

  let monkey = await new GLTFLoader().loadAsync("/models/Monkey.glb");
  monkey.scene.position.set(1, 1, 0);

  monkey.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // child.material = new THREE.MeshStandardMaterial({
      //   color: child.material.color,
      // });
      // texture = texture.convertLinearToSRGB();
      child.material = whiteMaterial;
      // child.material = createToonMaterial(child.material.color);

      child.castShadow = true;
    }
  });

  scene.add(monkey.scene);
  numModels++;

  return monkey;
}

export function addCube(scene: THREE.Scene, color?: THREE.ColorRepresentation) {
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshStandardMaterial({
    color: color || 0xff773d,
  });
  // const cubeMaterial = createToonMaterial(new THREE.Color(0xff773d));
  const cube = new THREE.Mesh<any, any, any>(cubeGeometry, cubeMaterial);
  cube.position.x = calcModelPosition();
  cube.position.y = 0.5;
  cube.castShadow = true;

  scene.add(cube);
  numModels++;

  return cube;
}

export function addSphere(
  scene: THREE.Scene,
  color?: THREE.ColorRepresentation
) {
  const sphereGeometry = new THREE.SphereGeometry(0.5);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: color || 0x777da7,
  });
  // const sphereMaterial = createToonMaterial(new THREE.Color(color || 0x777da7));
  const sphere = new THREE.Mesh<any, any, any>(sphereGeometry, sphereMaterial);
  sphere.position.x = calcModelPosition();
  sphere.position.y = 0.5;
  sphere.castShadow = true;

  scene.add(sphere);
  numModels++;

  return sphere;
}

export function addWaterfall(scene: THREE.Scene) {
  const noiseTexture = new THREE.TextureLoader().load(
    "/textures/NoiseTexture.png"
  );
  noiseTexture.flipY = false;
  noiseTexture.wrapS = THREE.RepeatWrapping;
  noiseTexture.wrapT = THREE.RepeatWrapping;

  const displacementTexture = new THREE.TextureLoader().load(
    "/textures/DisplacementTexture.png"
  );
  displacementTexture.flipY = false;
  displacementTexture.wrapS = THREE.RepeatWrapping;
  displacementTexture.wrapT = THREE.RepeatWrapping;

  const waterfallGeometry = new THREE.CylinderGeometry(1, 1, 10);
  const waterfallMaterial = new THREE.ShaderMaterial({
    vertexShader: `
		 varying vec2 vUv;

			void main() {
				vUv = uv;

				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
    fragmentShader: `
			uniform sampler2D uNoiseTexture;
			uniform sampler2D uDisplacementTexture;
			uniform float uTime;
			uniform float uSpeed;
			uniform float uDisplacementAmount;
			uniform float uBottomFoamThreshold;

			uniform vec3 uTopLightColor;
			uniform vec3 uTopDarkColor;
			uniform vec3 uBottomLightColor;
			uniform vec3 uBottomDarkColor;

			varying vec2 vUv;

			void main() {
				vec2 displacement = texture2D(uDisplacementTexture, vUv / 2.0 + uTime / 8.0).rg;
				displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

				float noise = texture2D(uNoiseTexture, vec2(vUv.x, vUv.y / 3.0 + uTime * uSpeed) + displacement).r;
				noise = round(noise * 3.0) / 3.0;

				vec3 color = mix(mix(uBottomDarkColor, uTopDarkColor, vUv.y), mix(uBottomLightColor, uTopLightColor, vUv.y), noise);
				color = mix(color, vec3(1.0, 1.0, 1.0), step(vUv.y + displacement.y, uBottomFoamThreshold));

				gl_FragColor = vec4(color, 1.0);
				// gl_FragColor = vec4(vec3(noise), 1.0);
			}
		`,
    uniforms: {
      uNoiseTexture: { value: noiseTexture },
      uDisplacementTexture: { value: displacementTexture },
      uTime: { value: 0 },
      uSpeed: { value: 0.25 },
      uDisplacementAmount: { value: 0.02 },
      uBottomFoamThreshold: { value: 0.05 },
      uTopLightColor: {
        value: new THREE.Vector3(140, 227, 250).divideScalar(255),
      },
      uTopDarkColor: { value: new THREE.Vector3(24, 40, 44).divideScalar(255) },
      uBottomLightColor: {
        value: new THREE.Vector3(201, 234, 243).divideScalar(255),
      },
      uBottomDarkColor: {
        value: new THREE.Vector3(24, 28, 29).divideScalar(255),
      },
    },
  });

  const waterfall = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
  waterfall.position.set(calcModelPosition(), 5.0, 0);
  scene.add(waterfall);
  numModels++;

  return waterfall;
}

export function addPuddle(scene: THREE.Scene, camera: THREE.Camera) {
  const pool = new THREE.Object3D();
  const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
  const wall1Geometry = new THREE.BoxGeometry(5, 1, 0.5);
  const wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
  const wall2 = new THREE.Mesh(wall1Geometry, wallMaterial);
  const wall3 = new THREE.Mesh(wall1Geometry, wallMaterial);
  const wall4 = new THREE.Mesh(wall1Geometry, wallMaterial);
  wall1.position.z -= 2.5;
  wall2.position.z += 2.5;
  wall3.rotation.y = (Math.PI * 90) / 180;
  wall4.rotation.y = (Math.PI * 90) / 180;
  wall3.position.x -= 2.5;
  wall4.position.x += 2.5;
  wall1.layers.set(1);
  wall2.layers.set(1);
  wall3.layers.set(1);
  wall4.layers.set(1);

  const floorGeometry = new THREE.PlaneGeometry(5, 5);
  const floor = new THREE.Mesh(floorGeometry, wallMaterial);
  floor.position.y = -0.5;
  floor.rotation.x = -(Math.PI * 90) / 180;
  // pool.add(floor);

  const displacementTexture = new THREE.TextureLoader().load(
    "/textures/DisplacementTexture.png"
  );
  displacementTexture.flipY = false;
  displacementTexture.wrapS = THREE.RepeatWrapping;
  displacementTexture.wrapT = THREE.RepeatWrapping;

  const waterMaterial2 = new THREE.MeshBasicMaterial({
    color: 0x8ce3fa,
    opacity: 0.5,
    blending: THREE.CustomBlending,
  });
  const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: `
			varying vec2 vUv;
			varying vec4 vClipPosition;
			varying vec4 vPosition;

			void main() {
				vUv = uv;
				vPosition = vec4(position, 1.0);

				vClipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				gl_Position = vClipPosition;
			}
		`,
    fragmentShader: `
			uniform sampler2D tDepth;
			uniform sampler2D tDiffuse;
			uniform sampler2D tDisplacement;
			uniform float uDisplacementAmount;
			uniform float uTime;
			uniform mat4 uInverseProjectionMatrix;

			varying vec2 vUv;
			varying vec4 vPosition;
			varying vec4 vClipPosition;

			float linearize(float depth) {
				float near = 0.01;
				float far = 1000.0;
				// depth = 2.0 * depth - 1.0;

				return near * far / (far + depth * (near - far));
			}

			float getDepth(sampler2D depthTexture, vec2 uv) {
				float depth = texture2D(depthTexture, uv).r;
				vec3 ndc = vec3(uv * 2.0 - 1.0, depth);
				vec4 view = uInverseProjectionMatrix * vec4(ndc, 1.0);
				view.xyz /= view.w;
				return -view.z;
			}

			void main() {
				vec2 ndc = vClipPosition.xy / vClipPosition.w;
				vec2 screenUV = ndc * 0.5 + 0.5;

				float depth = texture2D(tDepth, screenUV).r;
				float zDepth = linearize(depth);

				float zPos = 1.0-linearize(vClipPosition.z / vClipPosition.w);

				float diff = zDepth - zPos;

				// gl_FragColor = vec4(vec3(pow(zDepth, 4.0)), 1.0);
				
				vec2 displacement = texture2D(tDisplacement, vUv + uTime / 16.0).rg;
				displacement = ((displacement * 2.0) - 1.0) * uDisplacementAmount;

				// vec3 color = mix(mix(uBottomDarkColor, uTopDarkColor, vUv.y), mix(uBottomLightColor, uTopLightColor, vUv.y), noise);
				// color = mix(color, vec3(1.0, 1.0, 1.0), step(vUv.y + displacement.y, uBottomFoamThreshold));

				// gl_FragColor = vec4(vec3(0.0, 0.0, 1.0), 0.9);
				gl_FragColor = vec4(mix(texture2D(tDiffuse, screenUV+displacement).rgb, vec3(0.0, 0.0, 1.0), 0.5), 1.0);
			}
		`,
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      tDisplacement: { value: displacementTexture },
      uDisplacementAmount: { value: 0.01 },
      uTime: { value: 0 },
      uInverseProjectionMatrix: {
        value: camera.projectionMatrixInverse,
      },
    },
    blending: THREE.CustomBlending,
    // depthWrite: false,
  });
  const waterGeometry = new THREE.PlaneGeometry(5, 5);
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -(Math.PI * 90) / 180;
  water.layers.set(3);

  pool.add(wall1);
  pool.add(wall2);
  pool.add(wall3);
  pool.add(wall4);
  pool.add(water);
  pool.position.set(7.5, 0.5, 0);

  scene.add(pool);

  return { pool, water };
}

function calcModelPosition() {
  const dir = numModels % 2 === 0 ? -1 : 1;
  const xPos = dir * (Math.ceil(numModels / 2) * 2);
  return xPos;
}
