<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/Addons.js";

  let canvas: HTMLCanvasElement;

  onMount(() => {
    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
    camera.position.y = 4;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 4, 3);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const directionalLightHelper = new THREE.DirectionalLightHelper(
      directionalLight,
      1
    );
    scene.add(directionalLightHelper);

    const pointLight = new THREE.PointLight(0xffff00, 10);
    pointLight.position.set(2, 2, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.1);
    scene.add(pointLightHelper);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xceb1be });
    // const groundMaterial = createToonMaterial(new THREE.Color(0xceb1be));
    const ground = new THREE.Mesh<any, any, any>(
      groundGeometry,
      groundMaterial
    );
    ground.receiveShadow = true;
    ground.rotateX(THREE.MathUtils.degToRad(-90));
    scene.add(ground);

    // Cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff773d,
    });
    // const cubeMaterial = createToonMaterial(new THREE.Color(0xff773d));
    const cube = new THREE.Mesh<any, any, any>(cubeGeometry, cubeMaterial);
    cube.position.x = 1;
    cube.position.y = 0.5;
    cube.castShadow = true;

    scene.add(cube);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry(0.5);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x777da7,
    });
    // const sphereMaterial = createToonMaterial(
    //   new THREE.Color(color || 0x777da7)
    // );
    const sphere = new THREE.Mesh<any, any, any>(
      sphereGeometry,
      sphereMaterial
    );
    sphere.position.x = -1;
    sphere.position.y = 0.5;
    sphere.castShadow = true;

    scene.add(sphere);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      canvas,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.shadowMap.enabled = true;

    // Controls
    new OrbitControls(camera, renderer.domElement);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    resize();
  });
</script>

<canvas bind:this={canvas} />
