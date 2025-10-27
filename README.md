# How to run

1. Run `npm run dev`
2. Go to http://localhost:5173
3. Change url to /pixel-shader-3
4. Open ShaderGlass and select sonkun/aperture-grille/curved-screen/1080p/35-pal-normal-rgb

# Features

- [x] Water
  - [x] Transparency
  - [x] Distortion
  - [x] Edge foam
  - [x] Reflection
  - [x] Waves
  - [x] Dynamic lighting
- [x] Grass
  - [x] Color and shadow
  - [x] Dynamic lighting
  - [x] Wind movement
  - [x] Spawn on grass terrain only
- [-] Lights
  - [x] Directional light
  - [x] Point light
  - [ ] Spot light
  - [ ] Area light
  - [ ] Godray
  - [ ] Bloom
- [ ] Weather and elements
  - [ ] Fire
  - [ ] Rain
  - [ ] Particles
  - [ ] Day/night cycle
- [ ] Structures
  - [ ] Tree
- [ ] Toon material
  - [ ] Customizable lighting (specular, rim)

# Bugs

- [ ] Multiple lights and colors do not mix correctly
- [ ] Pixel pass uses hard coded light direction
  - [ ] Reflection shader normal edge detection is not correct
- [ ] Water does not react to lighting
- [ ] Prevent grass from spawning in water

# Resources

- [Grass-Demo] https://jsfiddle.net/felixmariotto/hvrg721n/
- [Water-Slides] https://29a.ch/slides/2012/webglwater/#title
- [Foam-Demo] https://codesandbox.io/p/sandbox/eager-ganguly-x4fl4?file=%2Findex.html
- [Waterfall-Tutorial] https://www.youtube.com/watch?v=PLCGL3RW548&ab_channel=Miziziziz
- [Reflectance-Sourcecode] https://github.com/mrdoob/three.js/blob/dev/examples/jsm/objects/Reflector.js
- [Pixel-Shader-Sourcecode] https://github.com/KodyJKing/hello-threejs
- [Orthographic-Tutorial] https://halisavakis.com/shader-bits-world-space-reconstruction-orthographic-camera-texture-projection-fake-perspective-uvs/
- [Outline-Tutorial] https://www.youtube.com/watch?v=WBoApONC7bM&ab_channel=CrigzVsGameDev
