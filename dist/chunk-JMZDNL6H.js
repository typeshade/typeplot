import{a as C,b as D,c as O,e as z}from"./chunk-H56GTA5X.js";import{a as j,c as S,d as R,e as F,g as x}from"./chunk-ZLOTGWYT.js";import"./chunk-3HN33SFP.js";import"./chunk-3T5N3NYN.js";import"./chunk-P75B37MV.js";var E={schema:2,compiler:"0.1.0",wgsl:`struct CompositeUniforms {
  size: vec2<u32>,
  columns: u32,
  count: u32,
  css: vec2<f32>,
}

struct Query {
  pixel: vec2<f32>,
  radius: f32,
}

struct Vertex {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@group(0) @binding(0) var<uniform> composite: CompositeUniforms;
@group(0) @binding(1) var layerColor: texture_2d<f32>;
@group(0) @binding(2) var layerDepth: texture_2d<f32>;
@group(0) @binding(3) var backdrop: texture_2d<f32>;
@group(0) @binding(4) var<uniform> query: Query;

@vertex
fn fullscreen(@builtin(vertex_index) i: u32) -> Vertex {
  let x = select(-1.0, 3.0, (i == 1u));
  let y = select(-1.0, 3.0, (i == 2u));
  return Vertex(vec4<f32>(x, y, 0.0, 1.0), vec2<f32>(((x * 0.5) + 0.5), ((y * 0.5) + 0.5)));
}

fn atlasPixel(pixel: vec2<i32>, index: u32) -> vec2<i32> {
  return (pixel + (vec2<i32>(i32((index % composite.columns)), i32((index / composite.columns))) * vec2<i32>(composite.size)));
}

fn decodedDepth(value: vec4<f32>) -> f32 {
  let bytes = vec4<u32>(round((value * 255.0)));
  return bitcast<f32>((((bytes.x | (bytes.y << 8u)) | (bytes.z << 16u)) | (bytes.w << 24u)));
}

fn physicalPixel(uv: vec2<f32>) -> vec2<i32> {
  var pixel: vec2<i32> = clamp(vec2<i32>(floor((uv * vec2<f32>(composite.size)))), vec2<i32>(0, 0), (vec2<i32>(composite.size) - vec2<i32>(1, 1)));
  pixel.y = ((i32(composite.size.y) - 1) - pixel.y);
  return pixel;
}

@fragment
fn compose(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let _licm0 = composite.count;
  let pixel = physicalPixel(uv);
  let _cse0 = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  var result: vec4<f32> = _cse0;
  var previous: f32 = -1e+30;
  var previousIndex: i32 = -1;
  for (var layer: u32 = 0u; (layer < _licm0); layer = (layer + 1u)) {
    var nearest: f32 = 1e+30;
    var chosen: i32 = -1;
    var ink: vec4<f32> = _cse0;
    for (var index: u32 = 0u; (index < _licm0); index = (index + 1u)) {
      let at = atlasPixel(pixel, index);
      let color = textureLoad(layerColor, at, 0u);
      if ((color.w <= 0.0)) {
        continue;
      }
      let depth = decodedDepth(textureLoad(layerDepth, at, 0u));
      let after = ((depth > previous) || ((depth == previous) && (i32(index) > previousIndex)));
      if ((after && (depth < nearest))) {
        nearest = depth;
        chosen = i32(index);
        ink = color;
      }
    }
    if ((chosen < 0)) {
      break;
    }
    let alpha = ((1.0 - result.w) * ink.w);
    result = vec4<f32>((result.xyz + (ink.xyz * alpha)), (result.w + alpha));
    if ((result.w >= 1.0)) {
      break;
    }
    previous = nearest;
    previousIndex = chosen;
  }
  let ground = textureLoad(backdrop, pixel, 0u);
  return vec4<f32>((result.xyz + (ground.xyz * (1.0 - result.w))), 1.0);
}

fn front(pixel: vec2<i32>) -> u32 {
  let _licm0 = composite.count;
  var nearest: f32 = 1e+30;
  var chosen: u32 = 0u;
  for (var index: u32 = 0u; (index < _licm0); index = (index + 1u)) {
    let at = atlasPixel(pixel, index);
    if ((textureLoad(layerColor, at, 0u).w <= 0.0)) {
      continue;
    }
    let depth = decodedDepth(textureLoad(layerDepth, at, 0u));
    if ((depth < nearest)) {
      nearest = depth;
      chosen = (index + 1u);
    }
  }
  return chosen;
}

@fragment
fn pick() -> @location(0) vec4<u32> {
  let _licm0 = query.pixel;
  let _licm1 = query.radius;
  let _licm2 = vec2<f32>(0.0, 0.0);
  let _licm3 = composite.css;
  let scale = (vec2<f32>(composite.size) / _licm3);
  let center = (_licm0 * scale);
  let at = physicalPixel((_licm0 / _licm3));
  let immediate = front(at);
  if ((immediate != 0u)) {
    let uv = vec2<f32>(((f32(at.x) + 0.5) / f32(composite.size.x)), (1.0 - ((f32(at.y) + 0.5) / f32(composite.size.y))));
    return vec4<u32>(immediate, bitcast<vec2<u32>>((uv * _licm3)), 0u);
  }
  let radius = vec2<i32>(ceil((vec2<f32>(_licm1, _licm1) * scale)));
  var distance: f32 = (_licm1 + 1.0);
  var chosen: u32 = 0u;
  var point: vec2<f32> = _licm0;
  for (var y: i32 = (-radius.y); (y <= radius.y); y = (y + 1)) {
    for (var x: i32 = (-radius.x); (x <= radius.x); x = (x + 1)) {
      let local = ((floor(center) + vec2<f32>((f32(x) + 0.5), (f32(y) + 0.5))) / scale);
      let delta = length((local - _licm0));
      if (((((delta > _licm1) || (delta >= distance)) || any((local < _licm2))) || any((local >= _licm3)))) {
        continue;
      }
      let hit = front(physicalPixel((local / _licm3)));
      if ((hit != 0u)) {
        distance = delta;
        chosen = hit;
        point = local;
      }
    }
  }
  return select(vec4<u32>(chosen, bitcast<vec2<u32>>(point), bitcast<u32>(distance)), vec4<u32>(0u, 0u, 0u, 0u), (chosen == 0u));
}
`,bindings:[{name:"composite",emitted:"composite",space:"uniform",group:0,binding:0,type:"struct:CompositeUniforms",resource:{resourceKind:"uniform-buffer",structName:"CompositeUniforms",structEmitted:"CompositeUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:32,fields:[{name:"size",offset:0,layout:{kind:"vector",size:2,type:"u32"}},{name:"columns",offset:8,layout:{kind:"scalar",type:"u32"}},{name:"count",offset:12,layout:{kind:"scalar",type:"u32"}},{name:"css",offset:16,layout:{kind:"vector",size:2,type:"f32"}}]}},{name:"layerColor",emitted:"layerColor",space:"uniform",group:0,binding:1,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"layerDepth",emitted:"layerDepth",space:"uniform",group:0,binding:2,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"backdrop",emitted:"backdrop",space:"uniform",group:0,binding:3,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"query",emitted:"query",space:"uniform",group:0,binding:4,type:"struct:Query",resource:{resourceKind:"uniform-buffer",structName:"Query",structEmitted:"Query"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixel",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"radius",offset:8,layout:{kind:"scalar",type:"f32"}}]}}],entries:[{name:"fullscreen",emitted:"fullscreen",stage:"vertex",inputs:[{name:"i",emitted:"i",type:"u32",builtin:"vertex_index"}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],bindings:[],line:{file:"shaders/scene-composite.shade.ts",line:16}},{name:"compose",emitted:"compose",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"composite",writes:!1},{name:"layerColor",writes:!1},{name:"layerDepth",writes:!1},{name:"backdrop",writes:!1}],line:{file:"shaders/scene-composite.shade.ts",line:36}},{name:"pick",emitted:"pick",stage:"fragment",inputs:[],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"composite",writes:!1},{name:"layerColor",writes:!1},{name:"layerDepth",writes:!1},{name:"query",writes:!1}],line:{file:"shaders/scene-composite.shade.ts",line:72}}],structs:[{name:"CompositeUniforms",emitted:"CompositeUniforms",fields:[{name:"size",emitted:"size",type:"vec2<u32>"},{name:"columns",emitted:"columns",type:"u32"},{name:"count",emitted:"count",type:"u32"},{name:"css",emitted:"css",type:"vec2<f32>"}]},{name:"Query",emitted:"Query",fields:[{name:"pixel",emitted:"pixel",type:"vec2<f32>"},{name:"radius",emitted:"radius",type:"f32"}]},{name:"Vertex",emitted:"Vertex",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"uv",emitted:"uv",type:"vec2<f32>"}]}],overrides:[],features:[],gl:{vertices:{fullscreen:{vertex:`#version 300 es
precision highp float;
precision highp int;

out vec2 uv;

void main() {
  uint i = uint(gl_VertexID);
  float x = ((i == 1u) ? 3.0 : -1.0);
  float y = ((i == 2u) ? 3.0 : -1.0);
  gl_Position = vec4(x, y, 0.0, 1.0);
  uv = vec2(((x * 0.5) + 0.5), ((y * 0.5) + 0.5));
}
`,blocks:{},samplers:{}}},draws:{compose:{fragment:`#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform CompositeUniforms {
  uvec2 size;
  uint columns;
  uint count;
  vec2 css;
} composite;

uniform sampler2D layerColor;

uniform sampler2D layerDepth;

uniform sampler2D backdrop;
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

uint _urem(uint a, uint b) {
  return b == 0u ? 0u : a % b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

ivec2 _f2i(vec2 x) {
  return ivec2(_f2i(x.x), _f2i(x.y));
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec4 _f2u(vec4 x) {
  return uvec4(_f2u(x.x), _f2u(x.y), _f2u(x.z), _f2u(x.w));
}
ivec2 atlasPixel(ivec2 pixel, uint index) {
  return (pixel + (ivec2(int(_urem(index, composite.columns)), int(_udiv(index, composite.columns))) * ivec2(composite.size)));
}

float decodedDepth(vec4 value) {
  uvec4 bytes = _f2u(roundEven((value * 255.0)));
  return uintBitsToFloat((((bytes.x | (bytes.y << 8u)) | (bytes.z << 16u)) | (bytes.w << 24u)));
}

ivec2 physicalPixel(vec2 uv) {
  ivec2 pixel = clamp(_f2i(floor((uv * vec2(composite.size)))), ivec2(0, 0), (ivec2(composite.size) - ivec2(1, 1)));
  pixel.y = ((int(composite.size.y) - 1) - pixel.y);
  return pixel;
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  uint _licm0 = composite.count;
  ivec2 pixel = physicalPixel(uv);
  vec4 _cse0 = vec4(0.0, 0.0, 0.0, 0.0);
  vec4 result = _cse0;
  float previous = -1e+30;
  int previousIndex = -1;
  for (uint layer = 0u; (layer < _licm0); layer = (layer + 1u)) {
    float nearest = 1e+30;
    int chosen = -1;
    vec4 ink = _cse0;
    for (uint index = 0u; (index < _licm0); index = (index + 1u)) {
      ivec2 at = atlasPixel(pixel, index);
      vec4 color = texelFetch(layerColor, at, int(0u));
      if ((color.w <= 0.0)) {
        continue;
      }
      float depth = decodedDepth(texelFetch(layerDepth, at, int(0u)));
      bool after = ((depth > previous) || ((depth == previous) && (int(index) > previousIndex)));
      if ((after && (depth < nearest))) {
        nearest = depth;
        chosen = int(index);
        ink = color;
      }
    }
    if ((chosen < 0)) {
      break;
    }
    float alpha = ((1.0 - result.w) * ink.w);
    result = vec4((result.xyz + (ink.xyz * alpha)), (result.w + alpha));
    if ((result.w >= 1.0)) {
      break;
    }
    previous = nearest;
    previousIndex = chosen;
  }
  vec4 ground = texelFetch(backdrop, pixel, int(0u));
  _ret = vec4((result.xyz + (ground.xyz * (1.0 - result.w))), 1.0);
}
`,blocks:{composite:"CompositeUniforms"},samplers:{layerColor:null,layerDepth:null,backdrop:null}},pick:{fragment:`#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform CompositeUniforms {
  uvec2 size;
  uint columns;
  uint count;
  vec2 css;
} composite;

uniform sampler2D layerColor;

uniform sampler2D layerDepth;

layout(std140) uniform Query {
  vec2 pixel;
  float radius;
} query;
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

uint _urem(uint a, uint b) {
  return b == 0u ? 0u : a % b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

ivec2 _f2i(vec2 x) {
  return ivec2(_f2i(x.x), _f2i(x.y));
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec4 _f2u(vec4 x) {
  return uvec4(_f2u(x.x), _f2u(x.y), _f2u(x.z), _f2u(x.w));
}
ivec2 atlasPixel(ivec2 pixel, uint index) {
  return (pixel + (ivec2(int(_urem(index, composite.columns)), int(_udiv(index, composite.columns))) * ivec2(composite.size)));
}

float decodedDepth(vec4 value) {
  uvec4 bytes = _f2u(roundEven((value * 255.0)));
  return uintBitsToFloat((((bytes.x | (bytes.y << 8u)) | (bytes.z << 16u)) | (bytes.w << 24u)));
}

ivec2 physicalPixel(vec2 uv) {
  ivec2 pixel = clamp(_f2i(floor((uv * vec2(composite.size)))), ivec2(0, 0), (ivec2(composite.size) - ivec2(1, 1)));
  pixel.y = ((int(composite.size.y) - 1) - pixel.y);
  return pixel;
}

uint front(ivec2 pixel) {
  uint _licm0 = composite.count;
  float nearest = 1e+30;
  uint chosen = 0u;
  for (uint index = 0u; (index < _licm0); index = (index + 1u)) {
    ivec2 at = atlasPixel(pixel, index);
    if ((texelFetch(layerColor, at, int(0u)).w <= 0.0)) {
      continue;
    }
    float depth = decodedDepth(texelFetch(layerDepth, at, int(0u)));
    if ((depth < nearest)) {
      nearest = depth;
      chosen = (index + 1u);
    }
  }
  return chosen;
}
layout(location = 0) out uvec4 _ret;

uvec4 pick_impl() {
  vec2 _licm0 = query.pixel;
  float _licm1 = query.radius;
  vec2 _licm2 = vec2(0.0, 0.0);
  vec2 _licm3 = composite.css;
  vec2 scale = (vec2(composite.size) / _licm3);
  vec2 center = (_licm0 * scale);
  ivec2 at = physicalPixel((_licm0 / _licm3));
  uint immediate = front(at);
  if ((immediate != 0u)) {
    vec2 uv = vec2(((float(at.x) + 0.5) / float(composite.size.x)), (1.0 - ((float(at.y) + 0.5) / float(composite.size.y))));
    return uvec4(immediate, floatBitsToUint((uv * _licm3)), 0u);
  }
  ivec2 radius = _f2i(ceil((vec2(_licm1, _licm1) * scale)));
  float distance = (_licm1 + 1.0);
  uint chosen = 0u;
  vec2 point = _licm0;
  for (int y = (-radius.y); (y <= radius.y); y = (y + 1)) {
    for (int x = (-radius.x); (x <= radius.x); x = (x + 1)) {
      vec2 local = ((floor(center) + vec2((float(x) + 0.5), (float(y) + 0.5))) / scale);
      float delta = length((local - _licm0));
      if (((((delta > _licm1) || (delta >= distance)) || any(lessThan(local, _licm2))) || any(greaterThanEqual(local, _licm3)))) {
        continue;
      }
      uint hit = front(physicalPixel((local / _licm3)));
      if ((hit != 0u)) {
        distance = delta;
        chosen = hit;
        point = local;
      }
    }
  }
  return ((chosen == 0u) ? uvec4(0u, 0u, 0u, 0u) : uvec4(chosen, floatBitsToUint(point), floatBitsToUint(distance)));
}

void main() {
  _ret = pick_impl();
}
`,blocks:{composite:"CompositeUniforms",query:"Query"},samplers:{layerColor:null,layerDepth:null}}}}};var P=(m,e)=>{if(!Number.isFinite(m)||Math.abs(m)>3402823466e29)throw new RangeError(`${e} must be finite within the f32 range.`);return m};function T(m){if(!Array.isArray(m)||m.length!==2||m.some(e=>typeof e!="number"||Number.isNaN(e)||Number.isFinite(e)&&Math.abs(e)>3402823466e29)||!(m[1]>m[0])||m.every(Number.isFinite)&&m[1]-m[0]>3402823466e29)throw new RangeError("Curve domains need increasing f32 endpoints or infinities.");return[m[0],m[1]]}function q(m,e={samples:128,refinements:5}){let t={...e,...m};for(let[i,s,n]of[["samples",16,512],["refinements",1,8]])if(!Number.isSafeInteger(t[i])||t[i]<s||t[i]>n)throw new RangeError(`quality.${i} must be an integer from ${s} to ${n}.`);return t}var B={color:"#ff7f0e",curveWidth:2,lineStyle:"-",dashPeriod:.2,dashOffset:0,depthBias:0};function M(m,e=B){for(let i of Object.keys(m))if(!(i in B))throw new TypeError(`Unknown scene style '${i}'.`);let t={...e,...m};if(typeof t.color!="string"||!t.color.trim()||!["-","--",":"].includes(t.lineStyle))throw new TypeError("Invalid scene curve appearance.");if(!Number.isFinite(t.curveWidth)||t.curveWidth<0||t.curveWidth>32||!Number.isFinite(t.dashPeriod)||t.dashPeriod<=0)throw new RangeError("Curve width must be 0\u201332 CSS px and dashPeriod must be positive.");return P(t.dashOffset,"dashOffset"),P(t.depthBias,"depthBias"),t}var g=class{constructor(e,t,i,s,n,c,d,r,l,p,h){this.id=e;this.node=t;this.program=i;this.loaded=s;this.owner=n;this.scene=c;this.doc=d;this.invalidate=r;this.primary=p;if(i.version!==1||i.composition!=="layers-v1"||!["scalar","parametric","surface"].includes(i.kind))throw new Error("Recompile this mathematical program for scene composition.");this.manifest=i.manifest,this.inputNames=this.manifest.bindings.filter(o=>o.space==="storage"&&o.access==="read"&&o.type==="array<f32>").map(o=>o.name),this.values={...i.parameters};for(let[o,u]of Object.entries(this.values))P(u,o);if(this.checkParameters(l.parameters??{}),Object.assign(this.values,l.parameters),this.curveDomain=T(l.domain??[-1/0,1/0]),this.search=q(l.quality??{}),this.appearance=M(l.style??{}),this.ink=x(this.appearance.color,d),this.surface=S({...l.surface,colorBar:!1}),"colorBar"in(l.surface??{}))throw new TypeError("Additional objects use the primary plot's color-bar controls.");if(this.bounds=R(l.surfaceDomain??{x:[-1/0,1/0],z:[-1/0,1/0]}),this.automaticDepth=l.surface?.depthRange===void 0,i.kind!=="surface"&&(l.surface||l.surfaceDomain))throw new TypeError("Surface settings need a surface callback.");if(!p){for(let[o,u]of Object.entries(l.data??{})){if(!this.inputNames.includes(o)||!(u instanceof Float32Array)||!u.length)throw new TypeError(`data.${o} needs a declared nonempty Float32Array.`);this.data.set(o,u)}for(let o of this.inputNames)if(!this.data.has(o))throw new TypeError(`Missing scene input '${o}'.`)}this.accelerated=i.kind!=="surface"&&h,this.initial={parameters:{...this.values},domain:this.curveDomain,quality:this.search,style:this.appearance,surface:this.surface,bounds:this.bounds,automaticDepth:this.automaticDepth}}work=new j;manifest;inputNames;data=new Map;inputs=Object.create(null);retired=new Set;values;curveDomain;search;appearance;ink;surface;bounds;automaticDepth;initial;drawPipeline;intervalPipeline;candidatePipeline;queryPipeline;displayCache;generation=0;closed=!1;retirement;accelerated;originResources;alive(){if(this.closed)throw new Error("This scene object has been removed.")}initialize(e=!1){return this.work.run(async()=>{!this.primary&&this.program.parameterOrigin&&(this.originResources=new C(this.owner,this.loaded,this.manifest,Object.keys(this.values)));let t=[this.originResources?.initialize()??Promise.resolve(),this.owner.run(()=>this.loaded.render({vertex:"fullscreen",fragment:this.accelerated||this.program.kind==="surface"?"drawLayer":"drawLayerReference",targets:["rgba8unorm","rgba8unorm"]})).then(n=>{this.drawPipeline=n})];this.accelerated&&!e&&(t.push(this.owner.run(()=>this.loaded.render({vertex:"fullscreen",fragment:"buildCurveIntervals",targets:["rgba32float"]})).then(n=>{this.intervalPipeline=n})),t.push(this.owner.run(()=>this.loaded.render({vertex:"fullscreen",fragment:"buildCurveCandidates",targets:["rgba32uint"]})).then(n=>{this.candidatePipeline=n}))),this.data.size&&t.push(this.owner.prepareData().then(()=>{for(let[n,c]of this.data)this.inputs[n]=this.owner.array(c);this.data.clear()}));let i=await Promise.allSettled(t),s=i.find(n=>n.status==="rejected");if(s?.status==="rejected")throw s.reason})}createCache(){return{intervals:this.owner.runtime.texture({size:[1024,6],format:"rgba32float"}),candidates:this.owner.runtime.texture({size:[1,1],format:"rgba32uint"}),key:""}}packet(e,t,i){this.alive(),!this.primary&&(this.appearance.color.includes("var(")||this.appearance.color==="currentColor")&&(this.ink=x(this.appearance.color,this.doc));let s=this.scene.nodeSnapshot(this.node),n=e.u,c=this.accelerated?this.primary&&e.cache?e.cache:i?this.createCache():this.displayCache??=this.createCache():void 0,d=!!(this.primary&&e.cache),r=D(s.transform,n,this.program.parameterOrigin),l=n.resolution,p=n.cameraLens,h=Math.max(4,Math.ceil(16/t)),o=Math.ceil(l[0]/h),u=Math.ceil(l[1]/h),a;this.primary?a={...n,...c&&!d?{curveTiles:[o,u,h,0]}:{}}:a={...n,...this.values,model:r.model,inverseModel:r.inverse,parameterBase:r.base,probe:this.program.parameterOrigin?n.probe+n.parameterBase-r.base:n.probe,parameterFocusSeed:this.program.parameterOrigin?0:n.parameterFocusSeed,sceneOpacity:[0,s.opacity],appearance:[0,0,this.appearance.curveWidth,n.appearance[3]],curveQuality:[this.search.samples,this.search.refinements],curvePattern:[this.appearance.lineStyle==="-"?0:1,this.appearance.dashPeriod,this.appearance.dashOffset+r.base%this.appearance.dashPeriod,this.appearance.lineStyle===":"?.12:.55],parameterBounds:this.curveDomain.map(w=>Number.isFinite(w)?w-r.base:0),parameterMode:(Number.isFinite(this.curveDomain[0])?0:1)|(Number.isFinite(this.curveDomain[1])?0:2),curveTiles:[o,u,h,0],...F(this.automaticDepth?{...this.surface,depthRange:[this.surface.depthRange[0],Math.max(this.surface.depthRange[1],p[1]*4)]}:this.surface,this.bounds)};let v=this.originResources?.packet(a,i,this.generation),f=Object.keys(this.program.parameters).map(w=>a[w]),y=JSON.stringify([a.resolution,a.plotCenter,a.plotSpan,a.rotationBasis,a.plotRotation,a.plotPan,a.view3d,a.cameraLens,a.plotCenterZ,a.model,a.parameterBase,a.parameterBounds,a.parameterMode,a.curveQuality,a.curvePattern,a.appearance[2],t,f,this.primary?e.generation:this.generation]),b=this.primary?{ink:[.09,.42,.92,1],bias:0}:{ink:this.ink,bias:this.appearance.depthBias},k={...this.primary?e.bindings:this.inputs,u:a,font:{pixelRatio:t},sceneMaterial:b,...v?{parameterOrigin:v.cache.texture}:{},...c?{curveIntervals:c.intervals,curveCandidates:c.candidates}:{}},_=JSON.stringify([y,a.surfaceBounds,a.surfaceDomainMode,a.surfaceRange,a.surfaceDepth,a.surfaceRender,a.surfaceFlags,a.appearance[3],a.labelStyle,a.sceneOpacity[1],b]);return{field:this,u:a,bindings:k,key:_,cache:c,external:d,origin:v,geometry:y}}draw(e,t,i){let s=new Set(this.manifest.entries.filter(n=>n.name===t.vertex||n.name===t.fragment).flatMap(n=>(n.bindings??[]).map(c=>c.name)));e.draw(t,Object.fromEntries(Object.entries(i).filter(([n])=>s.has(n))),{count:3})}prepare(e,t){t.origin&&this.originResources.record(e,t.origin,t.bindings);let i=t.cache;if(!i||t.external)return;let s=t.u.curveTiles;(i.candidates.width!==s[0]*8||i.candidates.height!==s[1])&&(i.candidates.resize(s[0]*8,s[1]),i.key="");let c=t.geometry;i.key!==c&&(e.pass({color:[i.intervals]},d=>this.draw(d,this.intervalPipeline,t.bindings)),e.pass({color:[i.candidates]},d=>this.draw(d,this.candidatePipeline,t.bindings)),i.key=c)}layer(e,t,i,s,n,c,d,r){this.prepare(e,t),e.pass({color:[{target:i,load:"load"},{target:s,load:"load"}]},l=>{l.setViewport(n,c,d,r),l.setScissorRect(n,c,d,r),this.draw(l,this.drawPipeline,t.bindings)})}query(e,t){return this.work.run(async()=>{this.queryPipeline??=this.owner.run(()=>this.loaded.render({vertex:"fullscreen",fragment:this.accelerated||this.program.kind==="surface"?"queryLayer":"queryLayerReference",targets:["rgba32uint"]}));let i=await this.queryPipeline;this.alive();let s=this.owner.runtime.texture({size:[2,1],format:"rgba32uint"});try{let n=this.owner.runtime.frame();n.pass({color:[s]},l=>this.draw(l,i,{...e.bindings,query:{pixel:t,radius:0}})),await n.submit();let c=await s.read();if(this.alive(),!new Uint32Array(c.buffer,c.byteOffset,8)[3])return null;let r=new Float32Array(c.buffer,c.byteOffset,8);return{point:[r[0],r[1],r[2]],...this.program.kind==="surface"?{}:{parameter:r[4]}}}finally{s.destroy()}})}parameters(){return this.alive(),{...this.values}}checkParameters(e){this.alive();for(let[t,i]of Object.entries(e)){if(!Object.hasOwn(this.values,t))throw new TypeError(`Unknown object parameter '${t}'.`);P(i,t)}}setParameters(e){this.checkParameters(e),Object.assign(this.values,e),this.invalidate()}setData(e,t){if(this.alive(),!this.inputNames.includes(e)||!(t instanceof Float32Array)||!t.length)throw new TypeError("Scene data needs a declared nonempty Float32Array.");let i=t.slice(),s=this.owner.array(i);this.retired.add(this.inputs[e]),this.inputs[e]=s,this.generation++,this.invalidate()}setStyle(e){this.alive();let t=M(e,this.appearance),i=x(t.color,this.doc);this.appearance=t,this.ink=i,this.invalidate()}setDomain(e){if(this.alive(),this.program.kind==="surface")throw new TypeError("Use setSurfaceDomain for surfaces.");this.curveDomain=T(e),this.invalidate()}setQuality(e){this.alive(),this.search=q(e,this.search),this.invalidate()}setSurface(e){if(this.alive(),this.program.kind!=="surface")throw new TypeError("Surface settings need a surface callback.");if("colorBar"in e)throw new TypeError("Color bars belong to the plot frame.");this.surface=S(e,this.surface),e.depthRange!==void 0&&(this.automaticDepth=!1),this.invalidate()}setSurfaceDomain(e){if(this.alive(),this.program.kind!=="surface")throw new TypeError("Surface domains need a surface callback.");this.bounds=R(e),this.invalidate()}reset(){this.alive(),this.values={...this.initial.parameters},this.curveDomain=this.initial.domain,this.search=this.initial.quality,this.appearance=this.initial.style,this.ink=x(this.appearance.color,this.doc),this.surface=this.initial.surface,this.bounds=this.initial.bounds,this.automaticDepth=this.initial.automaticDepth,this.invalidate()}afterFrame(){for(let e of this.retired)this.owner.release(e);this.retired.clear()}releasePacket(e){e.origin&&this.originResources.finish(e.origin),e.cache&&!e.external&&e.cache!==this.displayCache&&(e.cache.intervals.destroy(),e.cache.candidates.destroy())}close(){return this.closed=!0,this.work.close()}dispose(e=Promise.resolve()){return this.retirement||(this.retirement=Promise.allSettled([this.close(),e]).then(()=>{this.originResources?.dispose(),this.displayCache?.intervals.destroy(),this.displayCache?.candidates.destroy();for(let t of Object.values(this.inputs))this.owner.release(t);this.afterFrame(),this.data.clear();for(let t of Object.keys(this.inputs))delete this.inputs[t]})),this.retirement}};var N={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}},L=class{constructor(e,t,i,s,n,c,d,r,l,p,h){this.owner=e;this.scene=t;this.source=i;this.sourceProgram=s;this.format=n;this.doc=c;this.invalidateHost=d;this.idle=r;this.accelerate=l;this.primaryCache=p;this.labelsCached=h;this.programs.set(i,s),this.compositeProgram=e.runtime.load(E),this.primary=new g("primary",t.content,i,s,e,t,c,d,{},!0,l);let o=e.runtime.device;this.maxDimension=e.runtime.tier==="webgpu"?e.runtime.limits.maxTextureDimension2D??8192:Math.min(o.getParameter(o.MAX_TEXTURE_SIZE),o.getParameter(o.MAX_RENDERBUFFER_SIZE))}fields=new Map;active=new Set;programs=new Map;primary;compositeProgram;composePipeline;backdropPipeline;labelsPipeline;pickPipeline;display;closed=!1;revision=0;disposing;maxDimension;coordinates;coordinatePreparation;coordinatesEnabled=!1;get usesLayers(){return this.hasObjects||this.coordinatesEnabled}async setCoordinates(e){this.alive(),e&&!this.coordinates&&(this.coordinatePreparation??=this.owner.run(async()=>{let{CoordinatesRenderer:t}=await import("./chunk-LIQNNAJZ.js");this.alive();let i=new t(this.owner,this.format,this.source.kind==="surface",this.maxDimension);return this.coordinates=i,await i.initialize(),this.alive(),i}),await this.coordinatePreparation),this.coordinatesEnabled=e}isActive(e){return this.active.has(e)}get hasObjects(){return this.active.size>0}invalidate(){this.revision++}alive(){if(this.closed)throw new Error("This plot has been destroyed.")}async initialize(){let t=(await Promise.allSettled([this.primary.initialize(this.primaryCache),this.owner.run(()=>this.compositeProgram.render({vertex:"fullscreen",fragment:"compose",targets:[this.format]})).then(i=>{this.composePipeline=i}),this.owner.run(()=>this.sourceProgram.render({vertex:"fullscreen",fragment:this.labelsCached?"drawBackdrop":"drawBackdropReference",targets:[this.format]})).then(i=>{this.backdropPipeline=i}),this.owner.run(()=>this.sourceProgram.render({vertex:"fullscreen",fragment:this.labelsCached?"drawLabels":"drawLabelsReference",targets:[{format:this.format,blend:N}]})).then(i=>{this.labelsPipeline=i})])).find(i=>i.status==="rejected");if(t?.status==="rejected")throw t.reason}async attach(e,t,i){if(this.alive(),this.fields.size>=z-1)throw new RangeError("The scene is full.");let s=this.programs.get(t);s||(s=this.owner.runtime.load(t.manifest),this.programs.set(t,s));let n=new g(e.id,e,t,s,this.owner,this.scene,this.doc,this.invalidateHost,i,!1,this.accelerate);this.fields.set(e,n);try{return await n.initialize(),this.alive(),this.active.add(e),n}catch(c){throw this.fields.delete(e),await n.dispose(),c}}async detach(e){let t=this.fields.get(e);this.fields.delete(e),this.active.delete(e),this.invalidate(),t&&(await t.dispose(this.idle()),!this.usesLayers&&this.display&&(this.retire(this.display),this.display=void 0))}arrangement(e,t,i,s){let n={columns:1,rows:i,scale:0},c=1/0;for(let d=1;d<=i;d++){let r=Math.ceil(i/d),l=Math.min(1,this.maxDimension/(e*d),this.maxDimension/(t*r),Math.sqrt(s/(e*t*d*r))),p=Math.abs(Math.log(e*d/(t*r)));(l>n.scale||l===n.scale&&p<c)&&(n={columns:d,rows:r,scale:l},c=p)}return n}displayScale(e,t){return this.arrangement(e,t,this.active.size+1,8388608).scale}checkExportSize(e,t){if(this.usesLayers&&this.arrangement(e,t,this.active.size+1,16777216).scale<1-1e-9)throw new RangeError("PNG scene attachments exceed the device dimension or total 16-megapixel budget.")}bundle(e,t,i){let s=this.active.size+1,n=this.arrangement(e,t,s,i?16777216:8388608);if(n.scale<1-1e-9)throw new RangeError("The requested scene exceeds its attachment pixel budget or device dimensions. Lower the output size or pixel ratio.");let c=i?void 0:this.display;if(!c||c.width!==e||c.height!==t||c.columns!==n.columns||c.rows!==n.rows){c&&this.retire(c);let d=(r,l,p)=>this.owner.runtime.texture({size:[r,l],format:p});c={color:d(e*n.columns,t*n.rows,"rgba8unorm"),depth:d(e*n.columns,t*n.rows,"rgba8unorm"),backdrop:d(e,t,this.format),width:e,height:t,columns:n.columns,rows:n.rows,uniforms:{},packets:[],keys:[],owners:[],backdropKey:"",readers:0,retired:!1},i||(this.display=c)}return c}baseDraw(e,t,i,s,n="clear"){let c=this.source.manifest,d=new Set(c.entries.filter(r=>r.name===t.vertex||r.name===t.fragment).flatMap(r=>(r.bindings??[]).map(l=>l.name)));e.pass({color:[{target:s,load:n}]},r=>r.draw(t,Object.fromEntries(Object.entries(i).filter(([l])=>d.has(l))),{count:3}))}record(e,t,i,s,n,c,d=!1){this.alive();let r=this.bundle(i,s,d),l=[this.primary,...[...this.active].map(o=>this.fields.get(o))].sort((o,u)=>o.id<u.id?-1:o.id>u.id?1:0),p=[],h;try{for(let a=0;a<l.length;a++){let v=l[a],f=v.packet(t,n,d);p.push(f);let y=v.id+":"+f.key;(r.owners[a]!==v||r.keys[a]!==y)&&(v.layer(e,f,r.color,r.depth,a%r.columns*i,Math.floor(a/r.columns)*s,i,s),r.keys[a]=y,r.owners[a]=v)}let o=t.u;this.coordinatesEnabled&&(h=this.coordinates.prepare(e,t,n,d));let u=JSON.stringify([this.coordinatesEnabled,o.axesOrigin,o.resolution,o.axesModel,o.inverseAxesModel,o.plotCenter,o.plotSpan,o.rotationBasis,o.plotRotation,o.plotPan,o.cameraLens,o.plotCenterZ,o.view3d,o.appearance,o.labelStyle,o.decorations,o.decorationOpacity,o.sceneOpacity[0],n]);r.backdropKey!==u&&(h?this.coordinates.background(e,h,r.backdrop):this.baseDraw(e,this.backdropPipeline,t.bindings,r.backdrop),r.backdropKey=u),r.uniforms={size:[i,s],columns:r.columns,count:l.length,css:o.resolution},e.pass({color:[c]},a=>a.draw(this.composePipeline,{composite:r.uniforms,layerColor:r.color,layerDepth:r.depth,backdrop:r.backdrop},{count:3})),h?this.coordinates.foreground(e,h,c):this.baseDraw(e,this.labelsPipeline,t.bindings,c,"load"),r.packets=p}catch(o){h?.finish(!1),r.keys=[],r.backdropKey="";for(let u of p)u.cache&&!u.external&&(u.cache.key=""),u.origin&&(u.origin.cache.key="");for(let u of p)u.field.releasePacket(u);throw d&&this.retire(r),o}return(o=!0)=>{if(h?.finish(o),!o){r.keys=[],r.backdropKey="";for(let u of p)u.cache&&!u.external&&(u.cache.key=""),u.origin&&(u.origin.cache.key="")}if(d){for(let u of p)u.field.releasePacket(u);this.retire(r)}else for(let u of l)u.afterFrame()}}async pick(e,t){this.alive(),this.pickPipeline??=this.owner.run(()=>this.compositeProgram.render({vertex:"fullscreen",fragment:"pick",targets:["rgba32uint"]}));let i=await this.pickPipeline;this.alive();let s=this.display;if(!s)return null;let n=this.revision,c=[...s.packets],d={...s.uniforms},r=d.css;s.readers++;let l=this.owner.runtime.texture({size:[1,1],format:"rgba32uint"});try{let p=this.owner.runtime.frame();p.pass({color:[l]},_=>_.draw(i,{composite:d,layerColor:s.color,layerDepth:s.depth,query:{pixel:[e[0],r[1]-e[1]],radius:t}},{count:3})),await p.submit();let h=await l.read();if(this.closed||n!==this.revision)return null;let o=new Uint32Array(h.buffer,h.byteOffset,4),u=new Float32Array(h.buffer,h.byteOffset,4),a=c[o[0]-1];if(!a)return null;let v=await a.field.query(a,[u[1],u[2]]);if(!v||this.closed||n!==this.revision)return null;let f=a.u.model,y=v.point,b=a.u.worldCenter??[0,0,0],k=[b[0]+f[0]*y[0]+f[4]*y[1]+f[8]*y[2]+f[12],b[1]+f[1]*y[0]+f[5]*y[1]+f[9]*y[2]+f[13],b[2]+f[2]*y[0]+f[6]*y[1]+f[10]*y[2]+f[14]];return{kind:a.field.program.kind,point:O(y,a.field.program.parameterOrigin,a.u.parameterBase??0),...v.parameter===void 0?{}:{parameter:v.parameter+(a.u.parameterBase??0)},distance:u[3],objectId:a.field.id,object:a.field.node,worldPoint:k}}catch(p){if(this.closed||n!==this.revision)return null;throw p}finally{l.destroy(),s.readers--,s.retired&&this.retire(s)}}retire(e){e.retired=!0,!e.readers&&(e.color.destroy(),e.depth.destroy(),e.backdrop.destroy())}close(){this.closed=!0,this.invalidate(),this.primary.close();for(let e of this.fields.values())e.close()}dispose(){return this.close(),this.disposing??=Promise.all([this.primary.dispose(),...[...this.fields.values()].map(e=>e.dispose())]).then(()=>{this.coordinates?.dispose(),this.display&&this.retire(this.display),this.display=void 0,this.fields.clear(),this.active.clear(),this.programs.clear()}),this.disposing}};export{L as SceneComposer};
