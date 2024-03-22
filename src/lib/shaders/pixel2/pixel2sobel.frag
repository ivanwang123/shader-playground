uniform vec4 uResolution;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;

varying vec2 vUv;

vec2 getUV(vec2 uv, float offsetX, float offsetY) {
  return vec2(uv.x + (offsetX / 2.0) / uResolution.x,
              uv.y + (offsetY / 2.0) / uResolution.y);
}

float yGradient(vec2 coord) {
  float tlValue = texture2D(tDepth, getUV(coord, -1.0, -1.0)).r * -1.0;
  float tmValue = texture2D(tDepth, getUV(coord, 0.0, -1.0)).r * -2.0;
  float trValue = texture2D(tDepth, getUV(coord, 1.0, -1.0)).r * -1.0;

  float blValue = texture2D(tDepth, getUV(coord, -1.0, 1.0)).r * 1.0;
  float bmValue = texture2D(tDepth, getUV(coord, 0.0, 1.0)).r * 2.0;
  float brValue = texture2D(tDepth, getUV(coord, 1.0, 1.0)).r * 1.0;

  return tlValue + tmValue + trValue + blValue + bmValue + brValue;
}

float xGradient(vec2 coord) {
  float tlValue = texture2D(tDepth, getUV(coord, -1.0, -1.0)).r * -1.0;
  float mlValue = texture2D(tDepth, getUV(coord, -1.0, 0.0)).r * -2.0;
  float blValue = texture2D(tDepth, getUV(coord, -1.0, 1.0)).r * -1.0;

  float trValue = texture2D(tDepth, getUV(coord, 1.0, -1.0)).r * 1.0;
  float mrValue = texture2D(tDepth, getUV(coord, 1.0, 0.0)).r * 2.0;
  float brValue = texture2D(tDepth, getUV(coord, 1.0, 1.0)).r * 1.0;

  return tlValue + mlValue + blValue + trValue + mrValue + brValue;
}

float depthSobel(vec2 coord) {
  float center = texture2D(tDepth, coord).r;
  float left = texture2D(tDepth, getUV(coord, -1.0, 0.0)).r;
  float right = texture2D(tDepth, getUV(coord, 1.0, 0.0)).r;
  float top = texture2D(tDepth, getUV(coord, 0.0, -1.0)).r;
  float bottom = texture2D(tDepth, getUV(coord, 0.0, 1.0)).r;

  return abs(left - center) + abs(right - center) + abs(top - center) +
         abs(bottom - center);
}

vec4 normalSobel(vec2 coord) {
  vec4 center = texture2D(tNormal, coord);
  vec4 left = texture2D(tNormal, getUV(coord, -1.0, 0.0));
  vec4 right = texture2D(tNormal, getUV(coord, 1.0, 0.0));
  vec4 top = texture2D(tNormal, getUV(coord, 0.0, -1.0));
  vec4 bottom = texture2D(tNormal, getUV(coord, 0.0, 1.0));

  return abs(left - center) + abs(right - center) + abs(top - center) +
         abs(bottom - center);
}

void main() {
  vec4 texel = texture2D(tDiffuse, vUv);

  float gradient = xGradient(vUv) + yGradient(vUv);
  gradient = pow(clamp(gradient, 0.0, 1.0) * 100.0, 1.0);

  float sobelDepth = depthSobel(vUv);
  sobelDepth = pow(clamp(sobelDepth, 0.0, 1.0) * 1000.0, 1.0);

  vec3 sobelNormalVec = normalSobel(vUv).rgb;
  float sobelNormal = sobelNormalVec.x + sobelNormalVec.y + sobelNormalVec.z;
  sobelNormal = pow(sobelNormal * 1.0, 1.0);

  float sobelOutline = clamp(max(sobelDepth, sobelNormal), 0.0, 1.0);

  vec3 outlineColor = mix(texel.rgb, vec3(0.0, 0.0, 0.0), 1.0);

  // vec4 color = gradient > 0.01 ? vec4(0.0, 0.0, 0.0, 1.0) : texel;
  // vec4 color = sobelDepth > 0.10 ? vec4(0.0, 0.0, 0.0, 1.0) : texel;
  vec3 color = mix(texel.rgb, outlineColor, sobelOutline);
  // color = color == outlineColor ? outlineColor : texel.rgb;

  gl_FragColor = vec4(color, 1.0);
  // gl_FragColor = color;
  // Convert uv to 0-1
  // gl_FragColor = vec4(vec3(1.0 - texture2D(tDepth, vUv).r), 1.0);
}