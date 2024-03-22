uniform vec4 uResolution;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;

varying vec2 vUv;
varying vec3 viewSpaceDir;

void main() {
  float scale = 1.0;
  float halfScaleFloor = floor(scale * 0.5);
  float halfScaleCeil = ceil(scale * 0.5);

  vec2 blUV = vUv + vec2(-halfScaleFloor / uResolution.x,
                         -halfScaleFloor / uResolution.y);
  vec2 brUV = vUv + vec2(halfScaleFloor / uResolution.x,
                         -halfScaleFloor / uResolution.y);
  vec2 tlUV =
      vUv + vec2(-halfScaleCeil / uResolution.x, halfScaleCeil / uResolution.y);
  vec2 trUV =
      vUv + vec2(halfScaleCeil / uResolution.x, halfScaleCeil / uResolution.y);

  // Depth
  float blDepth = texture2D(tDepth, blUV).r;
  float brDepth = texture2D(tDepth, brUV).r;
  float tlDepth = texture2D(tDepth, tlUV).r;
  float trDepth = texture2D(tDepth, trUV).r;

  float depthDiff0 = trDepth - blDepth;
  float depthDiff1 = tlDepth - brDepth;

  //  Normal
  vec3 blNormal = texture2D(tNormal, blUV).rgb;
  vec3 brNormal = texture2D(tNormal, brUV).rgb;
  vec3 tlNormal = texture2D(tNormal, tlUV).rgb;
  vec3 trNormal = texture2D(tNormal, trUV).rgb;

  vec3 normalDiff0 = trNormal - blNormal;
  vec3 normalDiff1 = tlNormal - brNormal;

  vec3 viewNormal = blNormal * 2.0 - 1.0;
  float NdotV = 1.0 - dot(viewNormal, -viewSpaceDir);

  // Thresholds
  float normalThreshold = 0.4;
  float normalThreshold2 = clamp((NdotV - 0.5) / (1.0 - 0.5), 0.0, 1.0);
  normalThreshold2 = normalThreshold2 * 2.0 + 1.0;

  // float depthThreshold = 0.2 * blDepth;
  float depthThreshold = 0.1 * blDepth * normalThreshold2;

  float edgeDepth = sqrt(pow(depthDiff0, 2.0) + pow(depthDiff1, 2.0)) * 100.0;
  edgeDepth = edgeDepth > depthThreshold ? 1.0 : 0.0;

  float edgeNormal =
      sqrt(dot(normalDiff0, normalDiff0) + dot(normalDiff1, normalDiff1));
  edgeNormal = edgeNormal > normalThreshold ? 1.0 : 0.0;

  float edge = max(edgeDepth, edgeNormal);

  vec4 texel = texture2D(tDiffuse, vUv);

  vec4 edgeColor = vec4(0.0, 0.0, 0.0, edge);

  gl_FragColor = vec4(mix(texel.rgb, edgeColor.rgb, edgeColor.a), 1.0);
  gl_FragColor = texel;
  // gl_FragColor = vec4(vec3(edge), 1.0);
}