var t=1,a="surface",o={schema:2,compiler:"0.1.0",wgsl:`struct FontUniforms {
  pixelRatio: f32,
}

struct NumberFormat {
  value: f32,
  negative: bool,
  scientific: bool,
  decimals: i32,
  digits: i32,
  exponent: i32,
  length: i32,
}

struct PlotViewport {
  resolution: vec2<f32>,
  plotCenter: vec2<f32>,
  plotSpan: vec2<f32>,
  plotRotation: vec2<f32>,
  rotationBasis: vec4<f32>,
  plotPan: vec2<f32>,
  plotBlend: f32,
  appearance: vec4<f32>,
  decorations: u32,
  labelStyle: vec4<f32>,
  decorationOpacity: vec3<f32>,
}

struct PlotUniforms {
  resolution: vec2<f32>,
  plotCenter: vec2<f32>,
  plotSpan: vec2<f32>,
  plotRotation: vec2<f32>,
  rotationBasis: vec4<f32>,
  plotPan: vec2<f32>,
  plotBlend: f32,
  appearance: vec4<f32>,
  decorations: u32,
  labelStyle: vec4<f32>,
  decorationOpacity: vec3<f32>,
  model: mat4x4<f32>,
  inverseModel: mat4x4<f32>,
  axesModel: mat4x4<f32>,
  inverseAxesModel: mat4x4<f32>,
  sceneOpacity: vec2<f32>,
  cameraLens: vec2<f32>,
  plotCenterZ: f32,
  probe: f32,
  view3d: u32,
  parameterBounds: vec2<f32>,
  parameterMode: u32,
  curveQuality: vec2<u32>,
  curvePattern: vec4<f32>,
  curveTiles: vec4<u32>,
  surfaceBounds: vec4<f32>,
  surfaceDomainMode: u32,
  surfaceRange: vec2<f32>,
  surfaceDepth: vec2<f32>,
  surfaceRender: vec4<f32>,
  surfaceFlags: u32,
}

struct PickUniforms {
  pixel: vec2<f32>,
  radius: f32,
}

struct ViewRay {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

struct SpatialDecor {
  color: vec3<f32>,
  labels: vec3<f32>,
}

struct SurfaceHit {
  point: vec3<f32>,
  depth: f32,
  valid: bool,
}

struct SceneLayer {
  @location(0) color: vec4<f32>,
  @location(1) depth: vec4<f32>,
}

struct SceneMaterial {
  ink: vec4<f32>,
  bias: f32,
}

struct Uniforms {
  resolution: vec2<f32>,
  plotCenter: vec2<f32>,
  plotSpan: vec2<f32>,
  plotRotation: vec2<f32>,
  rotationBasis: vec4<f32>,
  plotPan: vec2<f32>,
  plotBlend: f32,
  appearance: vec4<f32>,
  decorations: u32,
  labelStyle: vec4<f32>,
  decorationOpacity: vec3<f32>,
  model: mat4x4<f32>,
  inverseModel: mat4x4<f32>,
  axesModel: mat4x4<f32>,
  inverseAxesModel: mat4x4<f32>,
  sceneOpacity: vec2<f32>,
  cameraLens: vec2<f32>,
  plotCenterZ: f32,
  probe: f32,
  view3d: u32,
  parameterBounds: vec2<f32>,
  parameterMode: u32,
  curveQuality: vec2<u32>,
  curvePattern: vec4<f32>,
  curveTiles: vec4<u32>,
  surfaceBounds: vec4<f32>,
  surfaceDomainMode: u32,
  surfaceRange: vec2<f32>,
  surfaceDepth: vec2<f32>,
  surfaceRender: vec4<f32>,
  surfaceFlags: u32,
  gridXMin: f32,
  gridXMax: f32,
  gridZMin: f32,
  gridZMax: f32,
  gridRows: f32,
  gridColumns: f32,
  gridCount: f32,
  heightScale: f32,
  heightOffset: f32,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> heights: array<f32>;
@group(0) @binding(2) var spatialLabels: texture_2d<f32>;
@group(0) @binding(3) var<uniform> query: PickUniforms;
@group(0) @binding(4) var<uniform> sceneMaterial: SceneMaterial;
@group(0) @binding(5) var glyphAtlas: texture_2d<f32>;
@group(0) @binding(6) var<uniform> font: FontUniforms;

fn heightAt(column: u32, row: u32, columns: u32) -> f32 {
  return heights[((row * columns) + column)];
}

fn sample(x: f32, z: f32, gridXMin: f32, gridXMax: f32, gridZMin: f32, gridZMax: f32, gridRows: f32, gridColumns: f32, gridCount: f32, heightScale: f32, heightOffset: f32) -> f32 {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  let columns = u32(gridColumns);
  let rows = u32(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > (u32(gridCount) / rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  let fraction = vec2<f32>(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any((fraction < vec2<f32>(0.0, 0.0))) || any((fraction > vec2<f32>(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  let _gv0 = (columns - 1u);
  let _gv1 = (rows - 1u);
  let coordinate = (fraction * vec2<f32>(f32(_gv0), f32(_gv1)));
  let low = vec2<u32>(floor(coordinate));
  let high = min((low + vec2<u32>(1u, 1u)), vec2<u32>(_gv0, _gv1));
  let t = fract(coordinate);
  let a = heightAt(low.x, low.y, columns);
  let b = heightAt(high.x, low.y, columns);
  let c = heightAt(low.x, high.y, columns);
  let d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

fn pixelWidth() -> f32 {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

fn tickMark(pixel: vec2<f32>, center: vec2<f32>, tangent: vec2<f32>, halfLength: f32, width: f32) -> f32 {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  let delta = (pixel - center);
  let normal = vec2<f32>((-tangent.y), tangent.x);
  let q = (abs(vec2<f32>(dot(delta, tangent), dot(delta, normal))) - vec2<f32>((width * 0.5), halfLength));
  let distance = (length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  let aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

fn glyphIndex(code: i32) -> i32 {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

fn glyphLayers(p: vec2<f32>, code: i32, fontSize: f32, halo: f32) -> vec2<f32> {
  let index = glyphIndex(code);
  let _cse0 = (fontSize * font.pixelRatio);
  var referenceSize: f32 = 24.0;
  var cell: vec2<f32> = vec2<f32>(30.0, 36.0);
  var origin: vec2<i32> = vec2<i32>(((index % 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    let _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2<f32>(15.0, 18.0);
      origin = vec2<i32>((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2<f32>(60.0, 72.0);
      origin = vec2<i32>(((_cse1 % 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  let q = ((p * (referenceSize / fontSize)) - vec2<f32>(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2<f32>(0.0, 0.0);
  }
  let base = vec2<i32>(floor(q));
  let t = fract(q);
  let _gv0 = (origin + base);
  let a = textureLoad(glyphAtlas, _gv0, 0u).r;
  let b = textureLoad(glyphAtlas, (_gv0 + vec2<i32>(1, 0)), 0u).r;
  let c = textureLoad(glyphAtlas, (_gv0 + vec2<i32>(0, 1)), 0u).r;
  let d = textureLoad(glyphAtlas, (_gv0 + vec2<i32>(1, 1)), 0u).r;
  let distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  let width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  let fill = smoothstep((0.75 - width), (0.75 + width), distance);
  let outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2<f32>(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

fn numberFormat(input: f32, spacing: f32) -> NumberFormat {
  let _cse2 = abs(spacing);
  let value = select(input, 0.0, (abs(input) < (_cse2 * 0.0001)));
  var magnitude: f32 = abs(value);
  let _cse0 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  let scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  let _cse1 = log2(max(_cse2, 1e-30));
  var decimals: i32 = i32(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  var digits: i32 = 1;
  if (scientific) {
    let _gv0 = f32(exponent);
    decimals = i32(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    let scale = pow(10.0, f32(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    let _gv1 = pow(10.0, f32(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (i32(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (var i: i32 = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  let negative = (value < 0.0);
  let length = select(((digits + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), ((5 + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), scientific);
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

fn numberGlyph(n: NumberFormat, column: i32) -> i32 {
  var i: i32 = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - select(0, 1, n.negative));
  let _cse0 = (n.decimals > 0);
  if (n.scientific) {
    let mantissaLength = (1 + select(0, (1 + n.decimals), _cse0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      let digit = (i - select(0, 1, (i > 1)));
      return (48 + (i32(floor((n.value / pow(10.0, f32((n.decimals - digit)))))) % 10));
    }
    let suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return select(43, 45, (n.exponent < 0));
    }
    let _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + (_cse1 % 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  let digit_1 = (i - select(0, 1, (i > n.digits)));
  return (48 + (i32(floor((n.value / pow(10.0, f32((((n.digits + n.decimals) - digit_1) - 1)))))) % 10));
}

fn tickNumberLayers(p: vec2<f32>, value: f32, spacing: f32, align: f32, fontSize: f32, halo: f32) -> vec2<f32> {
  let n = numberFormat(value, spacing);
  let advance = (fontSize * 0.625);
  let offset = (p + vec2<f32>(((f32(n.length) * advance) * align), 0.0));
  let _cse0 = vec2<f32>(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  let column = i32(floor((offset.x / advance)));
  let atlasBearing = (fontSize * 0.125);
  var coverage: vec2<f32> = _cse0;
  for (var neighbor: i32 = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    let index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      let local = vec2<f32>(((offset.x - (f32(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

fn numberWidth(value: f32, spacing: f32, size: f32) -> f32 {
  return ((f32(numberFormat(value, spacing).length) * size) * 0.625);
}

fn tickLevels(raw: f32) -> vec3<f32> {
  let safe = max(raw, 1e-25);
  let unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  let _gv0 = (safe < (unit * 2.0));
  let fine = select(select((unit * 5.0), (unit * 2.0), (safe < (unit * 5.0))), unit, _gv0);
  let coarse = select(select((unit * 10.0), (unit * 5.0), (safe < (unit * 5.0))), (unit * 2.0), _gv0);
  let phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3<f32>(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

fn tickOpacity(value: f32, levels: vec3<f32>) -> f32 {
  let multiple = (value / levels.y);
  return select(levels.z, 1.0, (abs((multiple - floor((multiple + 0.5)))) < 0.001));
}

fn numberPlate(p: vec2<f32>, value: f32, spacing: f32, align: f32, size: f32) -> f32 {
  let width = numberWidth(value, spacing, size);
  let center = vec2<f32>((width * (0.5 - align)), (size * 0.76));
  let half = vec2<f32>(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  let q = ((abs((p - center)) - half) + vec2<f32>(3.0, 3.0));
  let distance = ((length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  let _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

fn coarseTickOpacity(value: f32, levels: vec3<f32>) -> f32 {
  let multiple = (value / levels.x);
  return select((1.0 - levels.z), 1.0, (abs((multiple - floor((multiple + 0.5)))) < 0.001));
}

fn colorMap(value: f32, palette: u32) -> vec3<f32> {
  let t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3<f32>(t, t, t);
  }
  if ((palette == 2u)) {
    let _cse0 = vec3<f32>(0.87, 0.87, 0.87);
    return select(mix(_cse0, vec3<f32>(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)), mix(vec3<f32>(0.23, 0.3, 0.75), _cse0, (t * 2.0)), (t < 0.5));
  }
  var a: vec3<f32> = vec3<f32>(0.267, 0.005, 0.329);
  var b: vec3<f32> = vec3<f32>(0.23, 0.322, 0.546);
  var c: vec3<f32> = vec3<f32>(0.128, 0.567, 0.551);
  var d: vec3<f32> = vec3<f32>(0.369, 0.789, 0.383);
  var e: vec3<f32> = vec3<f32>(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3<f32>(0.05, 0.03, 0.528);
    b = vec3<f32>(0.495, 0.012, 0.658);
    c = vec3<f32>(0.798, 0.28, 0.47);
    d = vec3<f32>(0.973, 0.586, 0.252);
    e = vec3<f32>(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

fn axesUniforms(typeplot_shared_u: PlotUniforms) -> PlotUniforms {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

fn axisLabel(pixel: vec2<f32>, at: vec2<f32>, code: i32, typeplot_shared_u_2: PlotViewport) -> vec3<f32> {
  let _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any((abs((pixel - at)) > vec2<f32>(_cse0, _cse0)))) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  let local = vec2<f32>((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3<f32>(glyphLayers((local + vec2<f32>((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

fn plotSize(resolution: vec2<f32>) -> vec2<f32> {
  return max(resolution, vec2<f32>(1.0, 1.0));
}

fn distanceCoverage(distance: f32, width: f32) -> f32 {
  if ((width <= 0.0)) {
    return 0.0;
  }
  let aa = (pixelWidth() * 0.5);
  let _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

fn stroke(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, width: f32) -> f32 {
  let radius = (width * 0.5);
  if ((((width <= 0.0) || any((p < (min(a, b) - vec2<f32>((radius + 1.0), (radius + 1.0)))))) || any((p > (max(a, b) + vec2<f32>((radius + 1.0), (radius + 1.0))))))) {
    return 0.0;
  }
  let ab = (b - a);
  let _cse0 = (p - a);
  let t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

fn axisLevels(center: f32, span: f32, pixels: f32, horizontal: bool, typeplot_shared_u_3: PlotViewport) -> vec3<f32> {
  let size = typeplot_shared_u_3.appearance.w;
  let rough = (((span * size) * 4.0) / max(pixels, 1.0));
  let _cse0 = (span * 0.5);
  let width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  let gap = select((size * 2.6), max((size * 3.5), (width + (size * 1.3))), horizontal);
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

fn numberAt(pixel: vec2<f32>, anchor: vec2<f32>, value: f32, spacing: f32, align: f32, size: f32, halo: f32, plate: f32) -> vec3<f32> {
  let delta = vec2<f32>((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  return vec3<f32>(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

fn labelColor(color: vec3<f32>, labels: vec3<f32>) -> vec3<f32> {
  let plated = mix(color, vec3<f32>(0.995, 0.995, 0.995), (labels.z * 0.94));
  return mix(mix(plated, vec3<f32>(0.965, 0.973, 0.985), labels.y), vec3<f32>(0.25, 0.29, 0.35), labels.x);
}

fn axes2D(uv: vec2<f32>, typeplot_shared_u_4: PlotViewport, vertical: i32) -> vec4<f32> {
  let _licm0 = vec2<f32>(1.0, 0.0);
  let _licm1 = typeplot_shared_u_4.appearance.x;
  let _licm2 = vec2<f32>(0.0, 1.0);
  let _licm3 = typeplot_shared_u_4.appearance.y;
  let _licm4 = typeplot_shared_u_4.appearance.w;
  let _licm5 = (typeplot_shared_u_4.appearance.w * 1.6);
  let _licm6 = (typeplot_shared_u_4.appearance.w * 2.2);
  let _licm7 = (typeplot_shared_u_4.appearance.w * 0.65);
  let _licm8 = typeplot_shared_u_4.labelStyle.y;
  let _licm9 = typeplot_shared_u_4.labelStyle.z;
  let _licm10 = (typeplot_shared_u_4.appearance.w * 0.75);
  let size = plotSize(typeplot_shared_u_4.resolution);
  let span = max(typeplot_shared_u_4.plotSpan, vec2<f32>(0.00001, 0.00001));
  let lo = (typeplot_shared_u_4.plotCenter - (span * 0.5));
  let p = (lo + (uv * span));
  let pixel = (uv * size);
  let _cse0 = vec2<f32>(14.0, 14.0);
  let origin = clamp((((-lo) / span) * size), _cse0, (size - _cse0));
  let _gv0 = (size.x - 12.0);
  var axes: f32 = max(stroke(pixel, vec2<f32>(12.0, origin.y), vec2<f32>(_gv0, origin.y), _licm1), stroke(pixel, vec2<f32>(origin.x, 12.0), vec2<f32>(origin.x, (size.y - 12.0)), _licm1));
  let xLevels = axisLevels(typeplot_shared_u_4.plotCenter.x, span.x, size.x, true, typeplot_shared_u_4);
  let yLevels = axisLevels(typeplot_shared_u_4.plotCenter.y, span.y, size.y, false, typeplot_shared_u_4);
  var labels: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  var backgroundGrid: f32 = 0.0;
  let _cse1 = ((typeplot_shared_u_4.decorations & 2u) != 0u);
  let _cse2 = (_licm4 * 2.0);
  let _cse3 = (_licm4 * 6.0);
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let _gv1 = (level == 0);
    let tickStep = select(vec2<f32>(xLevels.y, yLevels.y), vec2<f32>(xLevels.x, yLevels.x), _gv1);
    let nearest = (floor(((p / tickStep) + 0.5)) * tickStep);
    let weights = select(vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels)), vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)), _gv1);
    let grid = ((abs((p - nearest)) / span) * size);
    let at = (((nearest - lo) / span) * size);
    axes = max(axes, max((tickMark(pixel, vec2<f32>(at.x, origin.y), _licm0, 4.0, _licm1) * weights.x), (tickMark(pixel, vec2<f32>(origin.x, at.y), _licm2, 4.0, _licm1) * weights.y)));
    backgroundGrid = max(backgroundGrid, max((distanceCoverage(grid.x, _licm3) * weights.x), (distanceCoverage(grid.y, _licm3) * weights.y)));
    let width = numberWidth(nearest.x, xLevels.x, _licm4);
    let xFit = smoothstep((width + 6.0), (width + 14.0), ((tickStep.x / span.x) * size.x));
    let yFit = smoothstep(_licm5, _licm6, ((tickStep.y / span.y) * size.y));
    if (((_cse1 && (at.x > ((width * 0.5) + 6.0))) && (at.x < ((size.x - (width * 0.5)) - 6.0)))) {
      labels = max(labels, ((numberAt(pixel, vec2<f32>(at.x, select((origin.y - _licm7), (origin.y + _cse2), (origin.y < _cse2))), nearest.x, xLevels.x, 0.5, _licm4, _licm8, _licm9) * weights.x) * xFit));
    }
    if ((((_cse1 && (at.y > 25.0)) && (at.y < (size.y - 25.0))) && (abs(nearest.y) > (yLevels.x * 0.001)))) {
      let _lc0 = (origin.x < _cse3);
      labels = max(labels, ((numberAt(pixel, vec2<f32>(select((origin.x - 8.0), (origin.x + 8.0), _lc0), (at.y + _licm10)), nearest.y, yLevels.x, select(1.0, 0.0, _lc0), _licm4, _licm8, _licm9) * weights.y) * yFit));
    }
  }
  labels *= typeplot_shared_u_4.decorationOpacity.y;
  let _cse4 = ((typeplot_shared_u_4.decorations & 4u) != 0u);
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2<f32>(_gv0, clamp((origin.y + 30.0), 40.0, (size.y - 40.0))), 120, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2<f32>(clamp((origin.x + 14.0), 28.0, (size.x - 28.0)), (size.y - 40.0)), vertical, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  return vec4<f32>(max(axes, select(0.0, ((backgroundGrid * 0.2) * typeplot_shared_u_4.decorationOpacity.x), ((typeplot_shared_u_4.decorations & 1u) != 0u))), labels);
}

fn basisVector(p: vec3<f32>, typeplot_shared_u_5: PlotUniforms) -> vec3<f32> {
  let span = max(typeplot_shared_u_5.plotSpan, vec2<f32>(0.00001, 0.00001));
  let q = (p / vec3<f32>(span, max(span.x, span.y)));
  let basis = typeplot_shared_u_5.rotationBasis;
  let horizontal = ((q.x * basis.y) + (q.z * basis.x));
  let depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3<f32>(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

fn cameraPoint(p: vec3<f32>, typeplot_shared_u_6: PlotUniforms) -> vec3<f32> {
  return basisVector(((typeplot_shared_u_6.model * vec4<f32>(p, 1.0)).xyz - vec3<f32>(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

fn cameraVector(p: vec3<f32>, typeplot_shared_u_7: PlotUniforms) -> vec3<f32> {
  return basisVector((typeplot_shared_u_7.model * vec4<f32>(p, 0.0)).xyz, typeplot_shared_u_7);
}

fn sceneCenter(typeplot_shared_u_8: PlotUniforms) -> vec3<f32> {
  return (typeplot_shared_u_8.inverseModel * vec4<f32>(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

fn inverseCamera(p: vec3<f32>, typeplot_shared_u_9: PlotUniforms) -> vec3<f32> {
  let basis = typeplot_shared_u_9.rotationBasis;
  let y = ((p.y * basis.w) + (p.z * basis.z));
  let depth = (((-p.y) * basis.z) + (p.z * basis.w));
  let q = vec3<f32>(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4<f32>((q * vec3<f32>(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

fn homogeneous(p: vec3<f32>, typeplot_shared_u_10: PlotUniforms, direction: bool) -> vec3<f32> {
  let size = plotSize(typeplot_shared_u_10.resolution);
  let camera = select(cameraPoint(p, typeplot_shared_u_10), cameraVector(p, typeplot_shared_u_10), direction);
  let w = select(select(typeplot_shared_u_10.cameraLens.y, 0.0, direction), select((typeplot_shared_u_10.cameraLens.y - camera.z), (-camera.z), direction), (typeplot_shared_u_10.view3d == 2u));
  let focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3<f32>((((vec2<f32>((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2<f32>(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

fn project(p: vec3<f32>, typeplot_shared_u_11: PlotUniforms) -> vec2<f32> {
  let h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

fn cameraDistance(p: vec3<f32>, typeplot_shared_u_12: PlotUniforms) -> f32 {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

fn inFront(p: vec3<f32>, typeplot_shared_u_13: PlotUniforms) -> bool {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

fn viewRay(uv: vec2<f32>, typeplot_shared_u_14: PlotUniforms) -> ViewRay {
  let screen = ((uv - vec2<f32>(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  let size = plotSize(typeplot_shared_u_14.resolution);
  let cameraXY = (vec2<f32>((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  let _cse0 = (typeplot_shared_u_14.view3d == 2u);
  let origin = select(vec3<f32>((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y), vec3<f32>(0.0, 0.0, typeplot_shared_u_14.cameraLens.y), _cse0);
  let direction = select(vec3<f32>(0.0, 0.0, -1.0), vec3<f32>(cameraXY, -1.0), _cse0);
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

fn axisField(pixel: vec2<f32>, axis: vec3<f32>, ray: ViewRay, typeplot_shared_u_15: PlotUniforms) -> f32 {
  let _cse0 = vec3<f32>(0.0, 0.0, 0.0);
  let origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  let direction = homogeneous(axis, typeplot_shared_u_15, true);
  let coefficients = cross(origin, direction);
  let magnitude = length(coefficients.xy);
  var distance: f32 = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3<f32>(pixel, 1.0))) / magnitude);
  }
  let transverse = (vec3<f32>(1.0, 1.0, 1.0) - axis);
  let a = (ray.origin * transverse);
  let b = (ray.direction * transverse);
  let depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return select(0.0, distanceCoverage(distance, typeplot_shared_u_15.appearance.x), ((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)));
}

fn groundField(ray: ViewRay, typeplot_shared_u_16: PlotUniforms, xLevels: vec3<f32>, zLevels: vec3<f32>) -> f32 {
  let _licm0 = vec2<f32>(xLevels.x, zLevels.x);
  let _licm1 = vec2<f32>(xLevels.y, zLevels.y);
  let _licm2 = vec2<f32>(2.0, 2.0);
  let _licm3 = vec2<f32>(6.0, 6.0);
  let _licm4 = typeplot_shared_u_16.appearance.y;
  let _cse0 = abs(ray.direction.y);
  let denominator = select(ray.direction.y, select(1e-8, -1e-8, (ray.direction.y < 0.0)), (_cse0 < 1e-8));
  let depth = ((-ray.origin.y) / denominator);
  let ground = (ray.origin + (ray.direction * depth)).xz;
  let gradient = max(vec2<f32>(length(vec2<f32>(dpdx(ground.x), dpdy(ground.x))), length(vec2<f32>(dpdx(ground.y), dpdy(ground.y)))), vec2<f32>(1e-20, 1e-20));
  var field: f32 = 0.0;
  let _cse1 = pixelWidth();
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let _gv0 = (level == 0);
    let spacing = select(_licm1, _licm0, _gv0);
    let _gv1 = ((ground / spacing) + 0.5);
    let distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    let separation = ((spacing / gradient) * _cse1);
    let fade = smoothstep(_licm2, _licm3, separation);
    let nearest = (floor(_gv1) * spacing);
    let weights = select(vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)), vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)), _gv0);
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return select(0.0, (field * typeplot_shared_u_16.decorationOpacity.x), ((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)));
}

fn axisParameter(pixel: vec2<f32>, axis: vec3<f32>, typeplot_shared_u_17: PlotUniforms) -> f32 {
  let origin = homogeneous(vec3<f32>(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  let direction = homogeneous(axis, typeplot_shared_u_17, true);
  let line = cross(origin, direction);
  let foot = (pixel - ((line.xy * dot(line, vec3<f32>(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  let slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

fn PlotUniforms_as_PlotViewport(value: PlotUniforms) -> PlotViewport {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

fn spatialLevels(axis: vec3<f32>, typeplot_shared_u_18: PlotUniforms) -> vec3<f32> {
  let center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  let span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  let h = (span * 0.001);
  let tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  let pixels = max((length(tangent) * span), 1.0);
  let horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

fn spatialTicks(pixel: vec2<f32>, axis: vec3<f32>, levels: vec3<f32>, priority: f32, typeplot_shared_u_19: PlotUniforms) -> vec4<f32> {
  let _licm0 = levels.x;
  let _licm1 = levels.y;
  let _licm2 = (typeplot_shared_u_19.appearance.x > 0.0);
  let _licm3 = typeplot_shared_u_19.appearance.x;
  let _licm4 = (levels.x * 0.001);
  let _licm5 = select(0.0, 1.0, (axis.x > 0.0));
  let _licm6 = typeplot_shared_u_19.labelStyle.y;
  let _licm7 = typeplot_shared_u_19.labelStyle.z;
  let _licm8 = typeplot_shared_u_19.decorationOpacity.y;
  let size = plotSize(typeplot_shared_u_19.resolution);
  let fontSize = typeplot_shared_u_19.appearance.w;
  let _cse0 = vec3<f32>(0.0, 0.0, 0.0);
  let originH = homogeneous(_cse0, typeplot_shared_u_19, false);
  let directionH = homogeneous(axis, typeplot_shared_u_19, true);
  let axisLine = cross(originH, directionH);
  let magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3<f32>(pixel, 1.0))) / magnitude) > ((fontSize * 6.0) + 12.0)))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let normal = (axisLine.xy / magnitude);
  let tangent = vec2<f32>(normal.y, (-normal.x));
  let sign = select(select(1.0, -1.0, (normal.y > 0.0)), select(1.0, -1.0, (normal.x > 0.0)), (axis.y > 0.0));
  let outward = (normal * sign);
  let value = axisParameter(pixel, axis, typeplot_shared_u_19);
  var labels: vec3<f32> = _cse0;
  var ticks: f32 = 0.0;
  let _cse1 = ((typeplot_shared_u_19.decorations & 2u) != 0u);
  let _cse2 = (((_licm3 * 0.5) + 4.0) + pixelWidth());
  for (var index: i32 = 0; (index < 6); index = (index + 1)) {
    let _gv0 = (index < 3);
    let stride = select(_licm1, _licm0, _gv0);
    let nearest = (floor(((value / stride) + 0.5)) * stride);
    let t = (nearest + (f32(((index % 3) - 1)) * stride));
    let world = (axis * t);
    if (inFront(world, typeplot_shared_u_19)) {
      let at = project(world, typeplot_shared_u_19);
      let anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2<f32>(0.0, (fontSize * 0.65)));
      let delta = (pixel - anchor);
      let nearLabel = (((_cse1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= (((-fontSize) * 1.5) - 3.0))) && (delta.y <= 3.0));
      let nearTick = (_licm2 && all((abs((pixel - at)) <= vec2<f32>(_cse2, _cse2))));
      if (((nearLabel == false) && (nearTick == false))) {
        continue;
      }
      let before = project((axis * (t - stride)), typeplot_shared_u_19);
      let after = project((axis * (t + stride)), typeplot_shared_u_19);
      let width = numberWidth(t, _licm0, fontSize);
      let _lc0 = (width * 0.5);
      let room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
      let separation = min(abs((at - before)), abs((after - at)));
      let box = vec2<f32>((width + fontSize), ((fontSize * 1.8) + 6.0));
      let fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
      let visibility = (select(coarseTickOpacity(t, levels), tickOpacity(t, levels), _gv0) * fit);
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm3) * visibility));
      let zero = (abs(t) <= _licm4);
      let originDistance = length((at - project(_cse0, typeplot_shared_u_19)));
      let crossing = select(smoothstep((fontSize * 2.0), (fontSize * 4.0), originDistance), _licm5, zero);
      if (_cse1) {
        labels = max(labels, (((((numberAt(pixel, anchor, t, _licm0, 0.5, fontSize, _licm6, _licm7) * _licm8) * visibility) * smoothstep(0.0, 6.0, room)) * crossing) * priority));
      }
    }
  }
  return vec4<f32>(ticks, labels);
}

fn spatialBackground(uv: vec2<f32>, typeplot_shared_u_20: PlotUniforms) -> SpatialDecor {
  let _licm0 = vec2<f32>(10.0, 18.0);
  let _licm1 = PlotUniforms_as_PlotViewport(typeplot_shared_u_20);
  let _licm2 = typeplot_shared_u_20.decorationOpacity.z;
  let size = plotSize(typeplot_shared_u_20.resolution);
  let pixel = (uv * size);
  let _cse0 = vec3<f32>(1.0, 0.0, 0.0);
  let xLevels = spatialLevels(_cse0, typeplot_shared_u_20);
  let _cse1 = vec3<f32>(0.0, 1.0, 0.0);
  let yLevels = spatialLevels(_cse1, typeplot_shared_u_20);
  let _cse2 = vec3<f32>(0.0, 0.0, 1.0);
  let zLevels = spatialLevels(_cse2, typeplot_shared_u_20);
  let ray = viewRay(uv, typeplot_shared_u_20);
  let grid = groundField(ray, typeplot_shared_u_20, xLevels, zLevels);
  let xTicks = spatialTicks(pixel, _cse0, xLevels, 1.0, typeplot_shared_u_20);
  let yTicks = spatialTicks(pixel, _cse1, yLevels, 1.0, typeplot_shared_u_20);
  let origin = project(vec3<f32>(0.0, 0.0, 0.0), typeplot_shared_u_20);
  let xDirection = homogeneous(_cse0, typeplot_shared_u_20, true);
  let zDirection = homogeneous(_cse2, typeplot_shared_u_20, true);
  let _cse3 = vec2<f32>(1e-12, 1e-12);
  let xTangent = normalize(((xDirection.xy - (origin * xDirection.z)) + _cse3));
  let zTangent = normalize(((zDirection.xy - (origin * zDirection.z)) + _cse3));
  let angle = abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x)));
  let zTicks = spatialTicks(pixel, _cse2, zLevels, smoothstep(0.08, 0.25, angle), typeplot_shared_u_20);
  var labels: vec3<f32> = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  let _cse4 = vec3<f32>(0.965, 0.973, 0.985);
  var color: vec3<f32> = mix(_cse4, vec3<f32>(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3<f32>(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_20));
  color = mix(color, vec3<f32>(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_20));
  color = mix(color, vec3<f32>(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_20));
  color = mix(color, vec3<f32>(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_20.decorations & 4u) != 0u)) {
    let _cse5 = vec2<f32>(18.0, 18.0);
    for (var index: i32 = 0; (index < 3); index = (index + 1)) {
      let axis = select(select(_cse2, _cse1, (index == 1)), _cse0, (index == 0));
      let edge = select(vec2<f32>((size.x - 30.0), (size.y * 0.5)), vec2<f32>((size.x * 0.5), (size.y - 30.0)), (index == 1));
      let world = (axis * axisParameter(edge, axis, typeplot_shared_u_20));
      if (inFront(world, typeplot_shared_u_20)) {
        let at = clamp((project(world, typeplot_shared_u_20) + _licm0), _cse5, (size - _cse5));
        labels = max(labels, (axisLabel(pixel, at, (120 + index), _licm1) * _licm2));
      }
    }
  }
  return SpatialDecor(mix(_cse4, color, typeplot_shared_u_20.sceneOpacity.x), (labels * typeplot_shared_u_20.sceneOpacity.x));
}

fn prepareSpatialLabels(position: vec4<f32>, typeplot_shared_u_21: PlotUniforms) -> vec4<f32> {
  let row = i32(position.y);
  let column = i32(position.x);
  let size = plotSize(typeplot_shared_u_21.resolution);
  let _cse0 = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  let _cse1 = vec3<f32>(1.0, 0.0, 0.0);
  let _cse2 = vec3<f32>(0.0, 1.0, 0.0);
  let _cse3 = vec3<f32>(0.0, 0.0, 1.0);
  if ((row >= 36)) {
    if ((column >= 3)) {
      return _cse0;
    }
    let axis = select(select(_cse3, _cse2, (column == 1)), _cse1, (column == 0));
    if ((row == 37)) {
      return vec4<f32>(spatialLevels(axis, typeplot_shared_u_21), 1.0);
    }
    let edge = select(vec2<f32>((size.x - 30.0), (size.y * 0.5)), vec2<f32>((size.x * 0.5), (size.y - 30.0)), (column == 1));
    let world = (axis * axisParameter(edge, axis, typeplot_shared_u_21));
    let _cse4 = vec2<f32>(18.0, 18.0);
    let at = clamp((project(world, typeplot_shared_u_21) + vec2<f32>(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4<f32>(at, f32((120 + column)), select(0.0, 1.0, inFront(world, typeplot_shared_u_21)));
  }
  let axisIndex = (row / 12);
  let candidate = ((row / 2) % 6);
  let axis_1 = select(select(_cse3, _cse2, (axisIndex == 1)), _cse1, (axisIndex == 0));
  let _cse7 = vec3<f32>(0.0, 0.0, 0.0);
  let originH = homogeneous(_cse7, typeplot_shared_u_21, false);
  let axisLine = cross(originH, homogeneous(axis_1, typeplot_shared_u_21, true));
  let magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  let normal = (axisLine.xy / magnitude);
  let tangent = vec2<f32>(normal.y, (-normal.x));
  let extent = dot(abs(tangent), size);
  let low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  let along = (low + ((position.x / f32(typeplot_shared_u_21.curveTiles.w)) * extent));
  let foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  let levels = spatialLevels(axis_1, typeplot_shared_u_21);
  let _gv0 = (candidate < 3);
  let stride = select(levels.y, levels.x, _gv0);
  let nearest = (floor(((axisParameter(foot, axis_1, typeplot_shared_u_21) / stride) + 0.5)) * stride);
  let t = (nearest + (f32(((candidate % 3) - 1)) * stride));
  let world_1 = (axis_1 * t);
  if ((inFront(world_1, typeplot_shared_u_21) == false)) {
    return _cse0;
  }
  let at_1 = project(world_1, typeplot_shared_u_21);
  let fontSize = typeplot_shared_u_21.appearance.w;
  let sign = select(select(1.0, -1.0, (normal.y > 0.0)), select(1.0, -1.0, (normal.x > 0.0)), (axis_1.y > 0.0));
  let outward = (normal * sign);
  if (((row % 2) == 0)) {
    return vec4<f32>(at_1, outward);
  }
  let anchor = ((at_1 + (outward * ((fontSize * 0.95) + 6.0))) + vec2<f32>(0.0, (fontSize * 0.65)));
  let width = numberWidth(t, levels.x, fontSize);
  let before = project((axis_1 * (t - stride)), typeplot_shared_u_21);
  let after = project((axis_1 * (t + stride)), typeplot_shared_u_21);
  let separation = min(abs((at_1 - before)), abs((after - at_1)));
  let box = vec2<f32>((width + fontSize), ((fontSize * 1.8) + 6.0));
  let fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
  let visibility = (select(coarseTickOpacity(t, levels), tickOpacity(t, levels), _gv0) * fit);
  let _lc0 = (width * 0.5);
  let room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
  let zero = (abs(t) <= (levels.x * 0.001));
  let _cse5 = project(_cse7, typeplot_shared_u_21);
  let crossing = select(smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse5))), select(0.0, 1.0, (axis_1.x > 0.0)), zero);
  var priority: f32 = 1.0;
  if ((axisIndex == 2)) {
    let xDirection = homogeneous(_cse1, typeplot_shared_u_21, true);
    let zDirection = homogeneous(_cse3, typeplot_shared_u_21, true);
    let _cse6 = vec2<f32>(1e-12, 1e-12);
    let xTangent = normalize(((xDirection.xy - (_cse5 * xDirection.z)) + _cse6));
    let zTangent = normalize(((zDirection.xy - (_cse5 * zDirection.z)) + _cse6));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4<f32>(t, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}

fn cachedSpatialTicks(pixel: vec2<f32>, axis: vec3<f32>, index: i32, typeplot_shared_u_22: PlotUniforms) -> vec4<f32> {
  let _licm0 = (index * 12);
  let _licm1 = ((typeplot_shared_u_22.decorations & 2u) != 0u);
  let _cse2 = pixelWidth();
  let _licm3 = (3.0 + _cse2);
  let _licm4 = (typeplot_shared_u_22.appearance.x > 0.0);
  let _licm5 = typeplot_shared_u_22.appearance.x;
  let _licm6 = typeplot_shared_u_22.labelStyle.y;
  let _licm7 = typeplot_shared_u_22.labelStyle.z;
  let _licm8 = typeplot_shared_u_22.decorationOpacity.y;
  let size = plotSize(typeplot_shared_u_22.resolution);
  let fontSize = typeplot_shared_u_22.appearance.w;
  let _cse0 = vec3<f32>(0.0, 0.0, 0.0);
  let axisLine = cross(homogeneous(_cse0, typeplot_shared_u_22, false), homogeneous(axis, typeplot_shared_u_22, true));
  let magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3<f32>(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse2)))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let normal = (axisLine.xy / magnitude);
  let tangent = vec2<f32>(normal.y, (-normal.x));
  let low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  let coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  let column = clamp(i32(floor((coordinate * f32(typeplot_shared_u_22.curveTiles.w)))), 0, (i32(typeplot_shared_u_22.curveTiles.w) - 1));
  var labels: vec3<f32> = _cse0;
  var ticks: f32 = 0.0;
  let _cse1 = (((_licm5 * 0.5) + 4.0) + _cse2);
  for (var candidate: i32 = 0; (candidate < 6); candidate = (candidate + 1)) {
    let row = (_licm0 + (candidate * 2));
    let location = textureLoad(spatialLabels, vec2<i32>(column, row), 0u);
    let at = location.xy;
    let outward = location.zw;
    let anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2<f32>(0.0, (fontSize * 0.65)));
    let delta = (pixel - anchor);
    let nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse2))) && (delta.y <= _licm3));
    let nearTick = (_licm4 && all((abs((pixel - at)) <= vec2<f32>(_cse1, _cse1))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    let style = textureLoad(spatialLabels, vec2<i32>(column, (row + 1)), 0u);
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4<f32>(ticks, labels);
}

fn cachedSpatialBackground(uv: vec2<f32>, typeplot_shared_u_23: PlotUniforms) -> SpatialDecor {
  let _licm0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_23);
  let _licm1 = typeplot_shared_u_23.decorationOpacity.z;
  let size = plotSize(typeplot_shared_u_23.resolution);
  let pixel = (uv * size);
  let ray = viewRay(uv, typeplot_shared_u_23);
  let xLevels = textureLoad(spatialLabels, vec2<i32>(0, 37), 0u).xyz;
  let zLevels = textureLoad(spatialLabels, vec2<i32>(2, 37), 0u).xyz;
  let grid = groundField(ray, typeplot_shared_u_23, xLevels, zLevels);
  let _cse0 = vec3<f32>(1.0, 0.0, 0.0);
  let xTicks = cachedSpatialTicks(pixel, _cse0, 0, typeplot_shared_u_23);
  let _cse1 = vec3<f32>(0.0, 1.0, 0.0);
  let yTicks = cachedSpatialTicks(pixel, _cse1, 1, typeplot_shared_u_23);
  let _cse2 = vec3<f32>(0.0, 0.0, 1.0);
  let zTicks = cachedSpatialTicks(pixel, _cse2, 2, typeplot_shared_u_23);
  var labels: vec3<f32> = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  let _cse3 = vec3<f32>(0.965, 0.973, 0.985);
  var color: vec3<f32> = mix(_cse3, vec3<f32>(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3<f32>(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_23));
  color = mix(color, vec3<f32>(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_23));
  color = mix(color, vec3<f32>(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_23));
  color = mix(color, vec3<f32>(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_23.decorations & 4u) != 0u)) {
    for (var index: i32 = 0; (index < 3); index = (index + 1)) {
      let name = textureLoad(spatialLabels, vec2<i32>(index, 36), 0u);
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, i32(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, typeplot_shared_u_23.sceneOpacity.x), (labels * typeplot_shared_u_23.sceneOpacity.x));
}

fn surfaceInside(p: vec2<f32>, typeplot_shared_u_24: PlotUniforms) -> bool {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

fn surfaceColorBar(color: vec3<f32>, uv: vec2<f32>, typeplot_shared_u_26: PlotUniforms) -> vec3<f32> {
  let _licm0 = typeplot_shared_u_26.surfaceRange.x;
  let _licm1 = typeplot_shared_u_26.surfaceRange.y;
  let _licm2 = (typeplot_shared_u_26.appearance.w * 0.7);
  let _licm3 = ((typeplot_shared_u_26.surfaceRange.y - typeplot_shared_u_26.surfaceRange.x) * 0.5);
  let _licm4 = typeplot_shared_u_26.appearance.w;
  let _licm5 = typeplot_shared_u_26.labelStyle.y;
  if (((typeplot_shared_u_26.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  let size = plotSize(typeplot_shared_u_26.resolution);
  let pixel = (uv * size);
  let height = min(160.0, (size.y * 0.36));
  let lower = vec2<f32>((size.x - 25.0), ((size.y - 70.0) - height));
  let upper = (lower + vec2<f32>(10.0, height));
  let q = max((lower - pixel), (pixel - upper));
  let distance = max(q.x, q.y);
  let coverage = distanceCoverage(max(0.0, distance), 1.2);
  let t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  var result: vec3<f32> = mix(color, colorMap(t, u32(typeplot_shared_u_26.surfaceRender.x)), coverage);
  let border = max(stroke(pixel, lower, vec2<f32>(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2<f32>(upper.x, lower.y), 0.7));
  result = mix(result, vec3<f32>(0.3, 0.3, 0.3), border);
  var labels: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  for (var index: i32 = 0; (index < 3); index = (index + 1)) {
    let fraction = (f32(index) * 0.5);
    let value = mix(_licm0, _licm1, fraction);
    let at = vec2<f32>((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    labels = max(labels, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, labels);
}

fn packedDepth(depth: f32) -> vec4<f32> {
  let bits = bitcast<u32>(depth);
  return (vec4<f32>(f32((bits & 255u)), f32(((bits >> 8u) & 255u)), f32(((bits >> 16u) & 255u)), f32((bits >> 24u))) / 255.0);
}

fn sceneLayer(color: vec4<f32>, depth: f32) -> SceneLayer {
  return SceneLayer(color, packedDepth((depth + sceneMaterial.bias)));
}

fn sceneBackdrop(uv: vec2<f32>, typeplot_shared_u_31: PlotUniforms) -> vec4<f32> {
  return vec4<f32>(cachedSpatialBackground(uv, axesUniforms(typeplot_shared_u_31)).color, 1.0);
}

fn sceneBackdropReference(uv: vec2<f32>, typeplot_shared_u_32: PlotUniforms) -> vec4<f32> {
  return vec4<f32>(spatialBackground(uv, axesUniforms(typeplot_shared_u_32)).color, 1.0);
}

fn sceneDecorLabels(uv: vec2<f32>, typeplot_shared_u_33: PlotUniforms, decor: SpatialDecor, surface: bool) -> vec4<f32> {
  let _cse0 = vec3<f32>(0.0, 0.0, 0.0);
  var black: vec3<f32> = labelColor(_cse0, decor.labels);
  var white: vec3<f32> = labelColor(vec3<f32>(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    black = mix(black, surfaceColorBar(black, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
  }
  let alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4<f32>(select(_cse0, (black / alpha), (alpha > 0.0)), alpha);
}

fn sceneLabels(uv: vec2<f32>, typeplot_shared_u_34: PlotUniforms, surface: bool) -> vec4<f32> {
  return sceneDecorLabels(uv, typeplot_shared_u_34, cachedSpatialBackground(uv, axesUniforms(typeplot_shared_u_34)), surface);
}

fn sceneLabelsReference(uv: vec2<f32>, typeplot_shared_u_35: PlotUniforms, surface: bool) -> vec4<f32> {
  return sceneDecorLabels(uv, typeplot_shared_u_35, spatialBackground(uv, axesUniforms(typeplot_shared_u_35)), surface);
}

fn heightField(x: f32, z: f32) -> f32 {
  return sample(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

@vertex
fn fullscreen(@builtin(vertex_index) i: u32) -> VertexOutput {
  let x = select(-1.0, 3.0, (i == 1u));
  let y = select(-1.0, 3.0, (i == 2u));
  return VertexOutput(vec4<f32>(x, y, 0.0, 1.0), vec2<f32>(((x * 0.5) + 0.5), ((y * 0.5) + 0.5)));
}

fn surfaceHit_heightField(uv: vec2<f32>, typeplot_shared_u_25: PlotUniforms) -> SurfaceHit {
  let _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  let _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  let _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  let _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  let _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  let _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  let _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  let ray = viewRay(uv, typeplot_shared_u_25);
  var near: f32 = typeplot_shared_u_25.surfaceDepth.x;
  var far: f32 = typeplot_shared_u_25.surfaceDepth.y;
  let _cse0 = SurfaceHit(vec3<f32>(0.0, 0.0, 0.0), 0.0, false);
  for (var axis: i32 = 0; (axis < 2); axis = (axis + 1)) {
    let _gv0 = (axis == 0);
    let origin = select(ray.origin.z, ray.origin.x, _gv0);
    let direction = select(ray.direction.z, ray.direction.x, _gv0);
    let lower = select(_licm1, _licm0, _gv0);
    let upper = select(_licm3, _licm2, _gv0);
    let lowerFlag = select(4u, 1u, _gv0);
    let upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        let at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        let at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  var previous: f32 = near;
  let first = (ray.origin + (ray.direction * near));
  var before: f32 = (first.y - heightField(first.x, first.z));
  let count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (var i: u32 = 1u; (i <= count); i = (i + 1u)) {
    let at_2 = mix(near, far, (f32(i) / f32(count)));
    let p = (ray.origin + (ray.direction * at_2));
    let value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      var low: f32 = previous;
      var high: f32 = at_2;
      var residual: f32 = before;
      for (var iteration: u32 = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        let middle = ((low + high) * 0.5);
        let point = (ray.origin + (ray.direction * middle));
        let typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      let depth = ((low + high) * 0.5);
      let point_1 = (ray.origin + (ray.direction * depth));
      let typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3<f32>(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

fn surfaceMaterial_heightField(hit: SurfaceHit, typeplot_shared_u_27: PlotUniforms) -> vec4<f32> {
  let footprint = max(vec2<f32>(length(vec2<f32>(dpdx(hit.point.x), dpdy(hit.point.x))), length(vec2<f32>(dpdx(hit.point.z), dpdy(hit.point.z)))), vec2<f32>(1e-20, 1e-20));
  let valueRate = max(length(vec2<f32>(dpdx(hit.point.y), dpdy(hit.point.y))), 1e-20);
  let _cse0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_27);
  let xLevels = axisLevels(typeplot_shared_u_27.plotCenter.x, typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.resolution.x, true, _cse0);
  let zLevels = axisLevels(0.0, max(typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.plotSpan.y), typeplot_shared_u_27.resolution.y, false, _cse0);
  let spacing = vec2<f32>(xLevels.x, zLevels.x);
  let _cse1 = vec2<f32>(0.5, 0.5);
  let _cse2 = pixelWidth();
  let wireDistance = (((abs((fract(((hit.point.xz / spacing) + _cse1)) - _cse1)) * spacing) / footprint) * _cse2);
  let separation = ((spacing / footprint) * _cse2);
  let wire = max((distanceCoverage(wireDistance.x, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.x)), (distanceCoverage(wireDistance.y, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.y)));
  let contourDistance = (((abs((fract(((hit.point.y / typeplot_shared_u_27.surfaceRender.z) + 0.5)) - 0.5)) * typeplot_shared_u_27.surfaceRender.z) / valueRate) * _cse2);
  let contours = (distanceCoverage(contourDistance, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, ((typeplot_shared_u_27.surfaceRender.z / valueRate) * _cse2)));
  var result: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  if (hit.valid) {
    let t = ((hit.point.y - typeplot_shared_u_27.surfaceRange.x) / (typeplot_shared_u_27.surfaceRange.y - typeplot_shared_u_27.surfaceRange.x));
    var ink: vec3<f32> = colorMap(t, u32(typeplot_shared_u_27.surfaceRender.x));
    if (((typeplot_shared_u_27.view3d != 0u) && ((typeplot_shared_u_27.surfaceFlags & 1u) != 0u))) {
      let h = max(0.00001, (max(footprint.x, footprint.y) * 0.25));
      let left = heightField((hit.point.x - h), hit.point.z);
      let right = heightField((hit.point.x + h), hit.point.z);
      let before = heightField(hit.point.x, (hit.point.z - h));
      let after = heightField(hit.point.x, (hit.point.z + h));
      let dx = select(select(select(0.0, ((hit.point.y - left) / h), (abs(left) < 1000000000000000000.0)), ((right - hit.point.y) / h), (abs(right) < 1000000000000000000.0)), ((right - left) / (2.0 * h)), ((abs(left) < 1000000000000000000.0) && (abs(right) < 1000000000000000000.0)));
      let dz = select(select(select(0.0, ((hit.point.y - before) / h), (abs(before) < 1000000000000000000.0)), ((after - hit.point.y) / h), (abs(after) < 1000000000000000000.0)), ((after - before) / (2.0 * h)), ((abs(before) < 1000000000000000000.0) && (abs(after) < 1000000000000000000.0)));
      let tx = cameraVector(vec3<f32>(1.0, dx, 0.0), typeplot_shared_u_27);
      let tz = cameraVector(vec3<f32>(0.0, dz, 1.0), typeplot_shared_u_27);
      let crossNormal = cross((tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20)), (tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20)));
      let normalLength = length(crossNormal);
      var normal: vec3<f32> = select(vec3<f32>(0.0, 0.0, 1.0), (crossNormal / normalLength), (normalLength > 1e-12));
      if ((normal.z < 0.0)) {
        normal = (-normal);
      }
      let diffuse = max(0.0, dot(normal, normalize(vec3<f32>(-0.4, 0.7, 1.0))));
      let specular = (pow(max(0.0, dot(normal, normalize(vec3<f32>(-0.2, 0.35, 1.0)))), 32.0) * 0.16);
      ink = ((ink * (0.4 + (diffuse * 0.6))) + vec3<f32>(specular, specular, specular));
    }
    let lines = max(select(0.0, wire, ((typeplot_shared_u_27.surfaceFlags & 2u) != 0u)), select(0.0, contours, ((typeplot_shared_u_27.surfaceFlags & 4u) != 0u)));
    let filled = ((typeplot_shared_u_27.surfaceFlags & 16u) != 0u);
    if (filled) {
      ink = mix(ink, vec3<f32>(0.12, 0.16, 0.22), (lines * 0.65));
    }
    result = vec4<f32>(ink, (typeplot_shared_u_27.surfaceRender.y * select(lines, 1.0, filled)));
  }
  return result;
}

fn plotSurface_heightField(uv: vec2<f32>, typeplot_shared_u_28: PlotUniforms, cached: bool) -> vec4<f32> {
  let flat = (typeplot_shared_u_28.plotCenter + ((uv - vec2<f32>(0.5, 0.5)) * typeplot_shared_u_28.plotSpan));
  var hit: SurfaceHit = SurfaceHit(vec3<f32>(flat.x, heightField(flat.x, flat.y), flat.y), 0.0, false);
  let _cse0 = (typeplot_shared_u_28.view3d != 0u);
  if (_cse0) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_28);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(flat, typeplot_shared_u_28));
  }
  let material = surfaceMaterial_heightField(hit, typeplot_shared_u_28);
  var color: vec3<f32> = vec3<f32>(0.965, 0.973, 0.985);
  var labels: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  var decor: vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  if (_cse0) {
    var _sel0: SpatialDecor;
    let _cse1 = axesUniforms(typeplot_shared_u_28);
    if (cached) {
      _sel0 = cachedSpatialBackground(uv, _cse1);
    } else {
      _sel0 = spatialBackground(uv, _cse1);
    }
    let background = _sel0;
    color = background.color;
    labels = background.labels;
  } else {
    decor = (axes2D(uv, PlotUniforms_as_PlotViewport(typeplot_shared_u_28), 122) * typeplot_shared_u_28.sceneOpacity.x);
  }
  color = mix(color, material.xyz, (material.w * typeplot_shared_u_28.sceneOpacity.y));
  if ((typeplot_shared_u_28.view3d == 0u)) {
    color = mix(color, vec3<f32>(0.39, 0.43, 0.49), decor.x);
    labels = decor.yzw;
  }
  let decorated = labelColor(color, labels);
  return vec4<f32>(mix(decorated, surfaceColorBar(decorated, uv, typeplot_shared_u_28), typeplot_shared_u_28.sceneOpacity.y), 1.0);
}

fn Uniforms_as_PlotUniforms(value: Uniforms) -> PlotUniforms {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

@fragment
fn draw(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return plotSurface_heightField(uv, Uniforms_as_PlotUniforms(u), true);
}

@fragment
fn drawReference(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return plotSurface_heightField(uv, Uniforms_as_PlotUniforms(u), false);
}

@fragment
fn buildSpatialLabels(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
  return prepareSpatialLabels(position, axesUniforms(Uniforms_as_PlotUniforms(u)));
}

fn sceneSurface_heightField(uv: vec2<f32>, typeplot_shared_u_30: PlotUniforms) -> SceneLayer {
  if ((typeplot_shared_u_30.sceneOpacity.y <= 0.0)) {
    return sceneLayer(vec4<f32>(0.0, 0.0, 0.0, 0.0), 0.0);
  }
  let hit = surfaceHit_heightField(uv, typeplot_shared_u_30);
  let ink = surfaceMaterial_heightField(hit, typeplot_shared_u_30);
  return sceneLayer(vec4<f32>(ink.xyz, (ink.w * typeplot_shared_u_30.sceneOpacity.y)), select(0.0, cameraDistance(hit.point, typeplot_shared_u_30), hit.valid));
}

@fragment
fn drawLayer(@location(0) uv: vec2<f32>) -> SceneLayer {
  return sceneSurface_heightField(uv, Uniforms_as_PlotUniforms(u));
}

@fragment
fn drawLayerReference(@location(0) uv: vec2<f32>) -> SceneLayer {
  return sceneSurface_heightField(uv, Uniforms_as_PlotUniforms(u));
}

@fragment
fn drawBackdrop(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return sceneBackdrop(uv, Uniforms_as_PlotUniforms(u));
}

@fragment
fn drawBackdropReference(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return sceneBackdropReference(uv, Uniforms_as_PlotUniforms(u));
}

@fragment
fn drawLabels(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return sceneLabels(uv, Uniforms_as_PlotUniforms(u), true);
}

@fragment
fn drawLabelsReference(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return sceneLabelsReference(uv, Uniforms_as_PlotUniforms(u), true);
}

fn pickSurface_heightField(position: vec4<f32>, typeplot_shared_u_29: PlotUniforms) -> vec4<u32> {
  let uv = (query.pixel / plotSize(typeplot_shared_u_29.resolution));
  let p = (typeplot_shared_u_29.plotCenter + ((uv - vec2<f32>(0.5, 0.5)) * typeplot_shared_u_29.plotSpan));
  var hit: SurfaceHit = SurfaceHit(vec3<f32>(p.x, heightField(p.x, p.y), p.y), 0.0, false);
  if ((typeplot_shared_u_29.view3d != 0u)) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_29);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(p, typeplot_shared_u_29));
  }
  if ((hit.valid == false)) {
    return vec4<u32>(0u, 0u, 0u, 0u);
  }
  return select(vec4<u32>(bitcast<u32>(hit.point.y), 0u, 0u, 1u), vec4<u32>(bitcast<vec3<u32>>(hit.point), 1u), (position.x < 1.0));
}

@fragment
fn queryLayer(@builtin(position) position: vec4<f32>) -> @location(0) vec4<u32> {
  return pickSurface_heightField(position, Uniforms_as_PlotUniforms(u));
}

@fragment
fn queryLayerReference(@builtin(position) position: vec4<f32>) -> @location(0) vec4<u32> {
  return pickSurface_heightField(position, Uniforms_as_PlotUniforms(u));
}

@fragment
fn pick(@builtin(position) position: vec4<f32>) -> @location(0) vec4<u32> {
  return pickSurface_heightField(position, Uniforms_as_PlotUniforms(u));
}
`,bindings:[{name:"u",emitted:"u",space:"uniform",group:0,binding:0,type:"struct:Uniforms",resource:{resourceKind:"uniform-buffer",structName:"Uniforms",structEmitted:"Uniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:592,fields:[{name:"resolution",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenter",offset:8,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotSpan",offset:16,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotRotation",offset:24,layout:{kind:"vector",size:2,type:"f32"}},{name:"rotationBasis",offset:32,layout:{kind:"vector",size:4,type:"f32"}},{name:"plotPan",offset:48,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotBlend",offset:56,layout:{kind:"scalar",type:"f32"}},{name:"appearance",offset:64,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorations",offset:80,layout:{kind:"scalar",type:"u32"}},{name:"labelStyle",offset:96,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorationOpacity",offset:112,layout:{kind:"vector",size:3,type:"f32"}},{name:"model",offset:128,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseModel",offset:192,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"axesModel",offset:256,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseAxesModel",offset:320,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"sceneOpacity",offset:384,layout:{kind:"vector",size:2,type:"f32"}},{name:"cameraLens",offset:392,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenterZ",offset:400,layout:{kind:"scalar",type:"f32"}},{name:"probe",offset:404,layout:{kind:"scalar",type:"f32"}},{name:"view3d",offset:408,layout:{kind:"scalar",type:"u32"}},{name:"parameterBounds",offset:416,layout:{kind:"vector",size:2,type:"f32"}},{name:"parameterMode",offset:424,layout:{kind:"scalar",type:"u32"}},{name:"curveQuality",offset:432,layout:{kind:"vector",size:2,type:"u32"}},{name:"curvePattern",offset:448,layout:{kind:"vector",size:4,type:"f32"}},{name:"curveTiles",offset:464,layout:{kind:"vector",size:4,type:"u32"}},{name:"surfaceBounds",offset:480,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceDomainMode",offset:496,layout:{kind:"scalar",type:"u32"}},{name:"surfaceRange",offset:504,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceDepth",offset:512,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceRender",offset:528,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceFlags",offset:544,layout:{kind:"scalar",type:"u32"}},{name:"gridXMin",offset:548,layout:{kind:"scalar",type:"f32"}},{name:"gridXMax",offset:552,layout:{kind:"scalar",type:"f32"}},{name:"gridZMin",offset:556,layout:{kind:"scalar",type:"f32"}},{name:"gridZMax",offset:560,layout:{kind:"scalar",type:"f32"}},{name:"gridRows",offset:564,layout:{kind:"scalar",type:"f32"}},{name:"gridColumns",offset:568,layout:{kind:"scalar",type:"f32"}},{name:"gridCount",offset:572,layout:{kind:"scalar",type:"f32"}},{name:"heightScale",offset:576,layout:{kind:"scalar",type:"f32"}},{name:"heightOffset",offset:580,layout:{kind:"scalar",type:"f32"}}]}},{name:"heights",emitted:"heights",space:"storage",group:0,binding:1,access:"read",type:"array<f32>",resource:{resourceKind:"storage-buffer",glslDataTexture:"r32f"},stages:["fragment"],rule:"std430",layout:{kind:"array",length:null,stride:4,element:{kind:"scalar",type:"f32"}},dataTexture:{format:"r32float",lanes:1}},{name:"spatialLabels",emitted:"spatialLabels",space:"uniform",group:0,binding:2,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"query",emitted:"query",space:"uniform",group:0,binding:3,type:"struct:PickUniforms",resource:{resourceKind:"uniform-buffer",structName:"PickUniforms",structEmitted:"PickUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixel",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"radius",offset:8,layout:{kind:"scalar",type:"f32"}}]}},{name:"sceneMaterial",emitted:"sceneMaterial",space:"uniform",group:0,binding:4,type:"struct:SceneMaterial",resource:{resourceKind:"uniform-buffer",structName:"SceneMaterial",structEmitted:"SceneMaterial"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:32,fields:[{name:"ink",offset:0,layout:{kind:"vector",size:4,type:"f32"}},{name:"bias",offset:16,layout:{kind:"scalar",type:"f32"}}]}},{name:"glyphAtlas",emitted:"glyphAtlas",space:"uniform",group:0,binding:5,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"font",emitted:"font",space:"uniform",group:0,binding:6,type:"struct:FontUniforms",resource:{resourceKind:"uniform-buffer",structName:"FontUniforms",structEmitted:"FontUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixelRatio",offset:0,layout:{kind:"scalar",type:"f32"}}]}}],entries:[{name:"fullscreen",emitted:"fullscreen",stage:"vertex",inputs:[{name:"i",emitted:"i",type:"u32",builtin:"vertex_index"}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],bindings:[],line:{file:"__typeplot-entry.shade.ts",line:8}},{name:"draw",emitted:"draw",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:12}},{name:"drawReference",emitted:"drawReference",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:16}},{name:"buildSpatialLabels",emitted:"buildSpatialLabels",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:19}},{name:"drawLayer",emitted:"drawLayer",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"color",emitted:"color",type:"vec4<f32>",location:0},{name:"depth",emitted:"depth",type:"vec4<f32>",location:1}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"sceneMaterial",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:24}},{name:"drawLayerReference",emitted:"drawLayerReference",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"color",emitted:"color",type:"vec4<f32>",location:0},{name:"depth",emitted:"depth",type:"vec4<f32>",location:1}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"sceneMaterial",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:27}},{name:"drawBackdrop",emitted:"drawBackdrop",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:30}},{name:"drawBackdropReference",emitted:"drawBackdropReference",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:31}},{name:"drawLabels",emitted:"drawLabels",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:32}},{name:"drawLabelsReference",emitted:"drawLabelsReference",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:33}},{name:"queryLayer",emitted:"queryLayer",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"query",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:34}},{name:"queryLayerReference",emitted:"queryLayerReference",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"query",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:37}},{name:"pick",emitted:"pick",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"heights",writes:!1},{name:"query",writes:!1}],line:{file:"__typeplot-entry.shade.ts",line:42}}],structs:[{name:"FontUniforms",emitted:"FontUniforms",fields:[{name:"pixelRatio",emitted:"pixelRatio",type:"f32"}]},{name:"NumberFormat",emitted:"NumberFormat",fields:[{name:"value",emitted:"value",type:"f32"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"PlotViewport",emitted:"PlotViewport",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"}]},{name:"PlotUniforms",emitted:"PlotUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"}]},{name:"PickUniforms",emitted:"PickUniforms",fields:[{name:"pixel",emitted:"pixel",type:"vec2<f32>"},{name:"radius",emitted:"radius",type:"f32"}]},{name:"ViewRay",emitted:"ViewRay",fields:[{name:"origin",emitted:"origin",type:"vec3<f32>"},{name:"direction",emitted:"direction",type:"vec3<f32>"}]},{name:"SpatialDecor",emitted:"SpatialDecor",fields:[{name:"color",emitted:"color",type:"vec3<f32>"},{name:"labels",emitted:"labels",type:"vec3<f32>"}]},{name:"SurfaceHit",emitted:"SurfaceHit",fields:[{name:"point",emitted:"point",type:"vec3<f32>"},{name:"depth",emitted:"depth",type:"f32"},{name:"valid",emitted:"valid",type:"bool"}]},{name:"SceneLayer",emitted:"SceneLayer",fields:[{name:"color",emitted:"color",type:"vec4<f32>"},{name:"depth",emitted:"depth",type:"vec4<f32>"}]},{name:"SceneMaterial",emitted:"SceneMaterial",fields:[{name:"ink",emitted:"ink",type:"vec4<f32>"},{name:"bias",emitted:"bias",type:"f32"}]},{name:"Uniforms",emitted:"Uniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"},{name:"gridXMin",emitted:"gridXMin",type:"f32"},{name:"gridXMax",emitted:"gridXMax",type:"f32"},{name:"gridZMin",emitted:"gridZMin",type:"f32"},{name:"gridZMax",emitted:"gridZMax",type:"f32"},{name:"gridRows",emitted:"gridRows",type:"f32"},{name:"gridColumns",emitted:"gridColumns",type:"f32"},{name:"gridCount",emitted:"gridCount",type:"f32"},{name:"heightScale",emitted:"heightScale",type:"f32"},{name:"heightOffset",emitted:"heightOffset",type:"f32"}]},{name:"VertexOutput",emitted:"VertexOutput",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"uv",emitted:"uv",type:"vec2<f32>"}]}],overrides:[],features:[],gl:{vertices:{fullscreen:{vertex:`#version 300 es
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
`,blocks:{},samplers:{}}},draws:{draw:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

uniform sampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
}

uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
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

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

float stroke(vec2 p, vec2 a, vec2 b, float width) {
  float radius = (width * 0.5);
  if ((((width <= 0.0) || any(lessThan(p, (min(a, b) - vec2((radius + 1.0), (radius + 1.0)))))) || any(greaterThan(p, (max(a, b) + vec2((radius + 1.0), (radius + 1.0))))))) {
    return 0.0;
  }
  vec2 ab = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 labelColor(vec3 color, vec3 labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), labels.y), vec3(0.25, 0.29, 0.35), labels.x);
}

vec4 axes2D(vec2 uv, PlotViewport typeplot_shared_u_4, int vertical) {
  vec2 _licm0 = vec2(1.0, 0.0);
  float _licm1 = typeplot_shared_u_4.appearance.x;
  vec2 _licm2 = vec2(0.0, 1.0);
  float _licm3 = typeplot_shared_u_4.appearance.y;
  float _licm4 = typeplot_shared_u_4.appearance.w;
  float _licm5 = (typeplot_shared_u_4.appearance.w * 1.6);
  float _licm6 = (typeplot_shared_u_4.appearance.w * 2.2);
  float _licm7 = (typeplot_shared_u_4.appearance.w * 0.65);
  float _licm8 = typeplot_shared_u_4.labelStyle.y;
  float _licm9 = typeplot_shared_u_4.labelStyle.z;
  float _licm10 = (typeplot_shared_u_4.appearance.w * 0.75);
  vec2 size = plotSize(typeplot_shared_u_4.resolution);
  vec2 span = max(typeplot_shared_u_4.plotSpan, vec2(0.00001, 0.00001));
  vec2 lo = (typeplot_shared_u_4.plotCenter - (span * 0.5));
  vec2 p = (lo + (uv * span));
  vec2 pixel = (uv * size);
  vec2 _cse0 = vec2(14.0, 14.0);
  vec2 origin = clamp((((-lo) / span) * size), _cse0, (size - _cse0));
  float _gv0 = (size.x - 12.0);
  float axes = max(stroke(pixel, vec2(12.0, origin.y), vec2(_gv0, origin.y), _licm1), stroke(pixel, vec2(origin.x, 12.0), vec2(origin.x, (size.y - 12.0)), _licm1));
  vec3 xLevels = axisLevels(typeplot_shared_u_4.plotCenter.x, span.x, size.x, true, typeplot_shared_u_4);
  vec3 yLevels = axisLevels(typeplot_shared_u_4.plotCenter.y, span.y, size.y, false, typeplot_shared_u_4);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  float backgroundGrid = 0.0;
  bool _cse1 = ((typeplot_shared_u_4.decorations & 2u) != 0u);
  float _cse2 = (_licm4 * 2.0);
  float _cse3 = (_licm4 * 6.0);
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv1 = (level == 0);
    vec2 tickStep = (_gv1 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y));
    vec2 nearest = (floor(((p / tickStep) + 0.5)) * tickStep);
    vec2 weights = (_gv1 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels)));
    vec2 grid = ((abs((p - nearest)) / span) * size);
    vec2 at = (((nearest - lo) / span) * size);
    axes = max(axes, max((tickMark(pixel, vec2(at.x, origin.y), _licm0, 4.0, _licm1) * weights.x), (tickMark(pixel, vec2(origin.x, at.y), _licm2, 4.0, _licm1) * weights.y)));
    backgroundGrid = max(backgroundGrid, max((distanceCoverage(grid.x, _licm3) * weights.x), (distanceCoverage(grid.y, _licm3) * weights.y)));
    float width = numberWidth(nearest.x, xLevels.x, _licm4);
    float xFit = smoothstep((width + 6.0), (width + 14.0), ((tickStep.x / span.x) * size.x));
    float yFit = smoothstep(_licm5, _licm6, ((tickStep.y / span.y) * size.y));
    if (((_cse1 && (at.x > ((width * 0.5) + 6.0))) && (at.x < ((size.x - (width * 0.5)) - 6.0)))) {
      labels = max(labels, ((numberAt(pixel, vec2(at.x, ((origin.y < _cse2) ? (origin.y + _cse2) : (origin.y - _licm7))), nearest.x, xLevels.x, 0.5, _licm4, _licm8, _licm9) * weights.x) * xFit));
    }
    if ((((_cse1 && (at.y > 25.0)) && (at.y < (size.y - 25.0))) && (abs(nearest.y) > (yLevels.x * 0.001)))) {
      bool _lc0 = (origin.x < _cse3);
      labels = max(labels, ((numberAt(pixel, vec2((_lc0 ? (origin.x + 8.0) : (origin.x - 8.0)), (at.y + _licm10)), nearest.y, yLevels.x, (_lc0 ? 0.0 : 1.0), _licm4, _licm8, _licm9) * weights.y) * yFit));
    }
  }
  labels *= typeplot_shared_u_4.decorationOpacity.y;
  bool _cse4 = ((typeplot_shared_u_4.decorations & 4u) != 0u);
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2(_gv0, clamp((origin.y + 30.0), 40.0, (size.y - 40.0))), 120, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2(clamp((origin.x + 14.0), 28.0, (size.x - 28.0)), (size.y - 40.0)), vertical, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  return vec4(max(axes, (((typeplot_shared_u_4.decorations & 1u) != 0u) ? ((backgroundGrid * 0.2) * typeplot_shared_u_4.decorationOpacity.x) : 0.0)), labels);
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

bool inFront(vec3 p, PlotUniforms typeplot_shared_u_13) {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

float axisParameter(vec2 pixel, vec3 axis, PlotUniforms typeplot_shared_u_17) {
  vec3 origin = homogeneous(vec3(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_17, true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec3 spatialLevels(vec3 axis, PlotUniforms typeplot_shared_u_18) {
  float center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  float span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  float h = (span * 0.001);
  vec2 tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

vec4 spatialTicks(vec2 pixel, vec3 axis, vec3 levels, float priority, PlotUniforms typeplot_shared_u_19) {
  float _licm0 = levels.x;
  float _licm1 = levels.y;
  bool _licm2 = (typeplot_shared_u_19.appearance.x > 0.0);
  float _licm3 = typeplot_shared_u_19.appearance.x;
  float _licm4 = (levels.x * 0.001);
  float _licm5 = ((axis.x > 0.0) ? 1.0 : 0.0);
  float _licm6 = typeplot_shared_u_19.labelStyle.y;
  float _licm7 = typeplot_shared_u_19.labelStyle.z;
  float _licm8 = typeplot_shared_u_19.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_19.resolution);
  float fontSize = typeplot_shared_u_19.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 originH = homogeneous(_cse0, typeplot_shared_u_19, false);
  vec3 directionH = homogeneous(axis, typeplot_shared_u_19, true);
  vec3 axisLine = cross(originH, directionH);
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > ((fontSize * 6.0) + 12.0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float sign = ((axis.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  float value = axisParameter(pixel, axis, typeplot_shared_u_19);
  vec3 labels = _cse0;
  float ticks = 0.0;
  bool _cse1 = ((typeplot_shared_u_19.decorations & 2u) != 0u);
  float _cse2 = (((_licm3 * 0.5) + 4.0) + pixelWidth());
  for (int index = 0; (index < 6); index = (index + 1)) {
    bool _gv0 = (index < 3);
    float stride = (_gv0 ? _licm0 : _licm1);
    float nearest = (floor(((value / stride) + 0.5)) * stride);
    float t = (nearest + (float((_irem(index, 3) - 1)) * stride));
    vec3 world = (axis * t);
    if (inFront(world, typeplot_shared_u_19)) {
      vec2 at = project(world, typeplot_shared_u_19);
      vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
      vec2 delta = (pixel - anchor);
      bool nearLabel = (((_cse1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= (((-fontSize) * 1.5) - 3.0))) && (delta.y <= 3.0));
      bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2(_cse2, _cse2))));
      if (((nearLabel == false) && (nearTick == false))) {
        continue;
      }
      vec2 before = project((axis * (t - stride)), typeplot_shared_u_19);
      vec2 after = project((axis * (t + stride)), typeplot_shared_u_19);
      float width = numberWidth(t, _licm0, fontSize);
      float _lc0 = (width * 0.5);
      float room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
      vec2 separation = min(abs((at - before)), abs((after - at)));
      vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
      float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
      float visibility = ((_gv0 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit);
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm3) * visibility));
      bool zero = (abs(t) <= _licm4);
      float originDistance = length((at - project(_cse0, typeplot_shared_u_19)));
      float crossing = (zero ? _licm5 : smoothstep((fontSize * 2.0), (fontSize * 4.0), originDistance));
      if (_cse1) {
        labels = max(labels, (((((numberAt(pixel, anchor, t, _licm0, 0.5, fontSize, _licm6, _licm7) * _licm8) * visibility) * smoothstep(0.0, 6.0, room)) * crossing) * priority));
      }
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor spatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_20) {
  vec2 _licm0 = vec2(10.0, 18.0);
  PlotViewport _licm1 = PlotUniforms_as_PlotViewport(typeplot_shared_u_20);
  float _licm2 = typeplot_shared_u_20.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_20.resolution);
  vec2 pixel = (uv * size);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec3 xLevels = spatialLevels(_cse0, typeplot_shared_u_20);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec3 yLevels = spatialLevels(_cse1, typeplot_shared_u_20);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec3 zLevels = spatialLevels(_cse2, typeplot_shared_u_20);
  ViewRay ray = viewRay(uv, typeplot_shared_u_20);
  float grid = groundField(ray, typeplot_shared_u_20, xLevels, zLevels);
  vec4 xTicks = spatialTicks(pixel, _cse0, xLevels, 1.0, typeplot_shared_u_20);
  vec4 yTicks = spatialTicks(pixel, _cse1, yLevels, 1.0, typeplot_shared_u_20);
  vec2 origin = project(vec3(0.0, 0.0, 0.0), typeplot_shared_u_20);
  vec3 xDirection = homogeneous(_cse0, typeplot_shared_u_20, true);
  vec3 zDirection = homogeneous(_cse2, typeplot_shared_u_20, true);
  vec2 _cse3 = vec2(1e-12, 1e-12);
  vec2 xTangent = normalize(((xDirection.xy - (origin * xDirection.z)) + _cse3));
  vec2 zTangent = normalize(((zDirection.xy - (origin * zDirection.z)) + _cse3));
  float angle = abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x)));
  vec4 zTicks = spatialTicks(pixel, _cse2, zLevels, smoothstep(0.08, 0.25, angle), typeplot_shared_u_20);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse4 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse4, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_20.decorations & 4u) != 0u)) {
    vec2 _cse5 = vec2(18.0, 18.0);
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec3 axis = ((index == 0) ? _cse0 : ((index == 1) ? _cse1 : _cse2));
      vec2 edge = ((index == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
      vec3 world = (axis * axisParameter(edge, axis, typeplot_shared_u_20));
      if (inFront(world, typeplot_shared_u_20)) {
        vec2 at = clamp((project(world, typeplot_shared_u_20) + _licm0), _cse5, (size - _cse5));
        labels = max(labels, (axisLabel(pixel, at, (120 + index), _licm1) * _licm2));
      }
    }
  }
  return SpatialDecor(mix(_cse4, color, typeplot_shared_u_20.sceneOpacity.x), (labels * typeplot_shared_u_20.sceneOpacity.x));
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, PlotUniforms typeplot_shared_u_22) {
  int _licm0 = (index * 12);
  bool _licm1 = ((typeplot_shared_u_22.decorations & 2u) != 0u);
  float _cse2 = pixelWidth();
  float _licm3 = (3.0 + _cse2);
  bool _licm4 = (typeplot_shared_u_22.appearance.x > 0.0);
  float _licm5 = typeplot_shared_u_22.appearance.x;
  float _licm6 = typeplot_shared_u_22.labelStyle.y;
  float _licm7 = typeplot_shared_u_22.labelStyle.z;
  float _licm8 = typeplot_shared_u_22.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_22.resolution);
  float fontSize = typeplot_shared_u_22.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 axisLine = cross(homogeneous(_cse0, typeplot_shared_u_22, false), homogeneous(axis, typeplot_shared_u_22, true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse2)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(typeplot_shared_u_22.curveTiles.w)))), 0, (int(typeplot_shared_u_22.curveTiles.w) - 1));
  vec3 labels = _cse0;
  float ticks = 0.0;
  float _cse1 = (((_licm5 * 0.5) + 4.0) + _cse2);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = texelFetch(spatialLabels, ivec2(column, row), int(0u));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse2))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse1, _cse1))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = texelFetch(spatialLabels, ivec2(column, (row + 1)), int(0u));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor cachedSpatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_23) {
  PlotViewport _licm0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_23);
  float _licm1 = typeplot_shared_u_23.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_23.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, typeplot_shared_u_23);
  vec3 xLevels = texelFetch(spatialLabels, ivec2(0, 37), int(0u)).xyz;
  vec3 zLevels = texelFetch(spatialLabels, ivec2(2, 37), int(0u)).xyz;
  float grid = groundField(ray, typeplot_shared_u_23, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, typeplot_shared_u_23);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, typeplot_shared_u_23);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, typeplot_shared_u_23);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_23.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = texelFetch(spatialLabels, ivec2(index, 36), int(0u));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, typeplot_shared_u_23.sceneOpacity.x), (labels * typeplot_shared_u_23.sceneOpacity.x));
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms typeplot_shared_u_26) {
  float _licm0 = typeplot_shared_u_26.surfaceRange.x;
  float _licm1 = typeplot_shared_u_26.surfaceRange.y;
  float _licm2 = (typeplot_shared_u_26.appearance.w * 0.7);
  float _licm3 = ((typeplot_shared_u_26.surfaceRange.y - typeplot_shared_u_26.surfaceRange.x) * 0.5);
  float _licm4 = typeplot_shared_u_26.appearance.w;
  float _licm5 = typeplot_shared_u_26.labelStyle.y;
  if (((typeplot_shared_u_26.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(typeplot_shared_u_26.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(typeplot_shared_u_26.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    labels = max(labels, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, labels);
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

vec4 surfaceMaterial_heightField(SurfaceHit hit, PlotUniforms typeplot_shared_u_27) {
  vec2 footprint = max(vec2(length(vec2(dFdx(hit.point.x), dFdy(hit.point.x))), length(vec2(dFdx(hit.point.z), dFdy(hit.point.z)))), vec2(1e-20, 1e-20));
  float valueRate = max(length(vec2(dFdx(hit.point.y), dFdy(hit.point.y))), 1e-20);
  PlotViewport _cse0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_27);
  vec3 xLevels = axisLevels(typeplot_shared_u_27.plotCenter.x, typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.resolution.x, true, _cse0);
  vec3 zLevels = axisLevels(0.0, max(typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.plotSpan.y), typeplot_shared_u_27.resolution.y, false, _cse0);
  vec2 spacing = vec2(xLevels.x, zLevels.x);
  vec2 _cse1 = vec2(0.5, 0.5);
  float _cse2 = pixelWidth();
  vec2 wireDistance = (((abs((fract(((hit.point.xz / spacing) + _cse1)) - _cse1)) * spacing) / footprint) * _cse2);
  vec2 separation = ((spacing / footprint) * _cse2);
  float wire = max((distanceCoverage(wireDistance.x, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.x)), (distanceCoverage(wireDistance.y, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.y)));
  float contourDistance = (((abs((fract(((hit.point.y / typeplot_shared_u_27.surfaceRender.z) + 0.5)) - 0.5)) * typeplot_shared_u_27.surfaceRender.z) / valueRate) * _cse2);
  float contours = (distanceCoverage(contourDistance, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, ((typeplot_shared_u_27.surfaceRender.z / valueRate) * _cse2)));
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  if (hit.valid) {
    float t = ((hit.point.y - typeplot_shared_u_27.surfaceRange.x) / (typeplot_shared_u_27.surfaceRange.y - typeplot_shared_u_27.surfaceRange.x));
    vec3 ink = colorMap(t, _f2u(typeplot_shared_u_27.surfaceRender.x));
    if (((typeplot_shared_u_27.view3d != 0u) && ((typeplot_shared_u_27.surfaceFlags & 1u) != 0u))) {
      float h = max(0.00001, (max(footprint.x, footprint.y) * 0.25));
      float left = heightField((hit.point.x - h), hit.point.z);
      float right = heightField((hit.point.x + h), hit.point.z);
      float before = heightField(hit.point.x, (hit.point.z - h));
      float after = heightField(hit.point.x, (hit.point.z + h));
      float dx = (((abs(left) < 1000000000000000000.0) && (abs(right) < 1000000000000000000.0)) ? ((right - left) / (2.0 * h)) : ((abs(right) < 1000000000000000000.0) ? ((right - hit.point.y) / h) : ((abs(left) < 1000000000000000000.0) ? ((hit.point.y - left) / h) : 0.0)));
      float dz = (((abs(before) < 1000000000000000000.0) && (abs(after) < 1000000000000000000.0)) ? ((after - before) / (2.0 * h)) : ((abs(after) < 1000000000000000000.0) ? ((after - hit.point.y) / h) : ((abs(before) < 1000000000000000000.0) ? ((hit.point.y - before) / h) : 0.0)));
      vec3 tx = cameraVector(vec3(1.0, dx, 0.0), typeplot_shared_u_27);
      vec3 tz = cameraVector(vec3(0.0, dz, 1.0), typeplot_shared_u_27);
      vec3 crossNormal = cross((tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20)), (tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20)));
      float normalLength = length(crossNormal);
      vec3 normal = ((normalLength > 1e-12) ? (crossNormal / normalLength) : vec3(0.0, 0.0, 1.0));
      if ((normal.z < 0.0)) {
        normal = (-normal);
      }
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.4, 0.7, 1.0))));
      float specular = (pow(max(0.0, dot(normal, normalize(vec3(-0.2, 0.35, 1.0)))), 32.0) * 0.16);
      ink = ((ink * (0.4 + (diffuse * 0.6))) + vec3(specular, specular, specular));
    }
    float lines = max((((typeplot_shared_u_27.surfaceFlags & 2u) != 0u) ? wire : 0.0), (((typeplot_shared_u_27.surfaceFlags & 4u) != 0u) ? contours : 0.0));
    bool filled = ((typeplot_shared_u_27.surfaceFlags & 16u) != 0u);
    if (filled) {
      ink = mix(ink, vec3(0.12, 0.16, 0.22), (lines * 0.65));
    }
    result = vec4(ink, (typeplot_shared_u_27.surfaceRender.y * (filled ? 1.0 : lines)));
  }
  return result;
}

vec4 plotSurface_heightField(vec2 uv, PlotUniforms typeplot_shared_u_28, bool cached) {
  vec2 flat_ = (typeplot_shared_u_28.plotCenter + ((uv - vec2(0.5, 0.5)) * typeplot_shared_u_28.plotSpan));
  SurfaceHit hit = SurfaceHit(vec3(flat_.x, heightField(flat_.x, flat_.y), flat_.y), 0.0, false);
  bool _cse0 = (typeplot_shared_u_28.view3d != 0u);
  if (_cse0) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_28);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(flat_, typeplot_shared_u_28));
  }
  vec4 material = surfaceMaterial_heightField(hit, typeplot_shared_u_28);
  vec3 color = vec3(0.965, 0.973, 0.985);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  vec4 decor = vec4(0.0, 0.0, 0.0, 0.0);
  if (_cse0) {
    SpatialDecor _sel0 = SpatialDecor(vec3(0.0), vec3(0.0));
    PlotUniforms _cse1 = axesUniforms(typeplot_shared_u_28);
    if (cached) {
      _sel0 = cachedSpatialBackground(uv, _cse1);
    } else {
      _sel0 = spatialBackground(uv, _cse1);
    }
    SpatialDecor background = _sel0;
    color = background.color;
    labels = background.labels;
  } else {
    decor = (axes2D(uv, PlotUniforms_as_PlotViewport(typeplot_shared_u_28), 122) * typeplot_shared_u_28.sceneOpacity.x);
  }
  color = mix(color, material.xyz, (material.w * typeplot_shared_u_28.sceneOpacity.y));
  if ((typeplot_shared_u_28.view3d == 0u)) {
    color = mix(color, vec3(0.39, 0.43, 0.49), decor.x);
    labels = decor.yzw;
  }
  vec3 decorated = labelColor(color, labels);
  return vec4(mix(decorated, surfaceColorBar(decorated, uv, typeplot_shared_u_28), typeplot_shared_u_28.sceneOpacity.y), 1.0);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = plotSurface_heightField(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)), true);
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null},data:["heights"]},drawReference:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

uniform sampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
}

uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
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

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

float stroke(vec2 p, vec2 a, vec2 b, float width) {
  float radius = (width * 0.5);
  if ((((width <= 0.0) || any(lessThan(p, (min(a, b) - vec2((radius + 1.0), (radius + 1.0)))))) || any(greaterThan(p, (max(a, b) + vec2((radius + 1.0), (radius + 1.0))))))) {
    return 0.0;
  }
  vec2 ab = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 labelColor(vec3 color, vec3 labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), labels.y), vec3(0.25, 0.29, 0.35), labels.x);
}

vec4 axes2D(vec2 uv, PlotViewport typeplot_shared_u_4, int vertical) {
  vec2 _licm0 = vec2(1.0, 0.0);
  float _licm1 = typeplot_shared_u_4.appearance.x;
  vec2 _licm2 = vec2(0.0, 1.0);
  float _licm3 = typeplot_shared_u_4.appearance.y;
  float _licm4 = typeplot_shared_u_4.appearance.w;
  float _licm5 = (typeplot_shared_u_4.appearance.w * 1.6);
  float _licm6 = (typeplot_shared_u_4.appearance.w * 2.2);
  float _licm7 = (typeplot_shared_u_4.appearance.w * 0.65);
  float _licm8 = typeplot_shared_u_4.labelStyle.y;
  float _licm9 = typeplot_shared_u_4.labelStyle.z;
  float _licm10 = (typeplot_shared_u_4.appearance.w * 0.75);
  vec2 size = plotSize(typeplot_shared_u_4.resolution);
  vec2 span = max(typeplot_shared_u_4.plotSpan, vec2(0.00001, 0.00001));
  vec2 lo = (typeplot_shared_u_4.plotCenter - (span * 0.5));
  vec2 p = (lo + (uv * span));
  vec2 pixel = (uv * size);
  vec2 _cse0 = vec2(14.0, 14.0);
  vec2 origin = clamp((((-lo) / span) * size), _cse0, (size - _cse0));
  float _gv0 = (size.x - 12.0);
  float axes = max(stroke(pixel, vec2(12.0, origin.y), vec2(_gv0, origin.y), _licm1), stroke(pixel, vec2(origin.x, 12.0), vec2(origin.x, (size.y - 12.0)), _licm1));
  vec3 xLevels = axisLevels(typeplot_shared_u_4.plotCenter.x, span.x, size.x, true, typeplot_shared_u_4);
  vec3 yLevels = axisLevels(typeplot_shared_u_4.plotCenter.y, span.y, size.y, false, typeplot_shared_u_4);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  float backgroundGrid = 0.0;
  bool _cse1 = ((typeplot_shared_u_4.decorations & 2u) != 0u);
  float _cse2 = (_licm4 * 2.0);
  float _cse3 = (_licm4 * 6.0);
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv1 = (level == 0);
    vec2 tickStep = (_gv1 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y));
    vec2 nearest = (floor(((p / tickStep) + 0.5)) * tickStep);
    vec2 weights = (_gv1 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels)));
    vec2 grid = ((abs((p - nearest)) / span) * size);
    vec2 at = (((nearest - lo) / span) * size);
    axes = max(axes, max((tickMark(pixel, vec2(at.x, origin.y), _licm0, 4.0, _licm1) * weights.x), (tickMark(pixel, vec2(origin.x, at.y), _licm2, 4.0, _licm1) * weights.y)));
    backgroundGrid = max(backgroundGrid, max((distanceCoverage(grid.x, _licm3) * weights.x), (distanceCoverage(grid.y, _licm3) * weights.y)));
    float width = numberWidth(nearest.x, xLevels.x, _licm4);
    float xFit = smoothstep((width + 6.0), (width + 14.0), ((tickStep.x / span.x) * size.x));
    float yFit = smoothstep(_licm5, _licm6, ((tickStep.y / span.y) * size.y));
    if (((_cse1 && (at.x > ((width * 0.5) + 6.0))) && (at.x < ((size.x - (width * 0.5)) - 6.0)))) {
      labels = max(labels, ((numberAt(pixel, vec2(at.x, ((origin.y < _cse2) ? (origin.y + _cse2) : (origin.y - _licm7))), nearest.x, xLevels.x, 0.5, _licm4, _licm8, _licm9) * weights.x) * xFit));
    }
    if ((((_cse1 && (at.y > 25.0)) && (at.y < (size.y - 25.0))) && (abs(nearest.y) > (yLevels.x * 0.001)))) {
      bool _lc0 = (origin.x < _cse3);
      labels = max(labels, ((numberAt(pixel, vec2((_lc0 ? (origin.x + 8.0) : (origin.x - 8.0)), (at.y + _licm10)), nearest.y, yLevels.x, (_lc0 ? 0.0 : 1.0), _licm4, _licm8, _licm9) * weights.y) * yFit));
    }
  }
  labels *= typeplot_shared_u_4.decorationOpacity.y;
  bool _cse4 = ((typeplot_shared_u_4.decorations & 4u) != 0u);
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2(_gv0, clamp((origin.y + 30.0), 40.0, (size.y - 40.0))), 120, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  if (_cse4) {
    labels = max(labels, (axisLabel(pixel, vec2(clamp((origin.x + 14.0), 28.0, (size.x - 28.0)), (size.y - 40.0)), vertical, typeplot_shared_u_4) * typeplot_shared_u_4.decorationOpacity.z));
  }
  return vec4(max(axes, (((typeplot_shared_u_4.decorations & 1u) != 0u) ? ((backgroundGrid * 0.2) * typeplot_shared_u_4.decorationOpacity.x) : 0.0)), labels);
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

bool inFront(vec3 p, PlotUniforms typeplot_shared_u_13) {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

float axisParameter(vec2 pixel, vec3 axis, PlotUniforms typeplot_shared_u_17) {
  vec3 origin = homogeneous(vec3(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_17, true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec3 spatialLevels(vec3 axis, PlotUniforms typeplot_shared_u_18) {
  float center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  float span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  float h = (span * 0.001);
  vec2 tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

vec4 spatialTicks(vec2 pixel, vec3 axis, vec3 levels, float priority, PlotUniforms typeplot_shared_u_19) {
  float _licm0 = levels.x;
  float _licm1 = levels.y;
  bool _licm2 = (typeplot_shared_u_19.appearance.x > 0.0);
  float _licm3 = typeplot_shared_u_19.appearance.x;
  float _licm4 = (levels.x * 0.001);
  float _licm5 = ((axis.x > 0.0) ? 1.0 : 0.0);
  float _licm6 = typeplot_shared_u_19.labelStyle.y;
  float _licm7 = typeplot_shared_u_19.labelStyle.z;
  float _licm8 = typeplot_shared_u_19.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_19.resolution);
  float fontSize = typeplot_shared_u_19.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 originH = homogeneous(_cse0, typeplot_shared_u_19, false);
  vec3 directionH = homogeneous(axis, typeplot_shared_u_19, true);
  vec3 axisLine = cross(originH, directionH);
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > ((fontSize * 6.0) + 12.0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float sign = ((axis.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  float value = axisParameter(pixel, axis, typeplot_shared_u_19);
  vec3 labels = _cse0;
  float ticks = 0.0;
  bool _cse1 = ((typeplot_shared_u_19.decorations & 2u) != 0u);
  float _cse2 = (((_licm3 * 0.5) + 4.0) + pixelWidth());
  for (int index = 0; (index < 6); index = (index + 1)) {
    bool _gv0 = (index < 3);
    float stride = (_gv0 ? _licm0 : _licm1);
    float nearest = (floor(((value / stride) + 0.5)) * stride);
    float t = (nearest + (float((_irem(index, 3) - 1)) * stride));
    vec3 world = (axis * t);
    if (inFront(world, typeplot_shared_u_19)) {
      vec2 at = project(world, typeplot_shared_u_19);
      vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
      vec2 delta = (pixel - anchor);
      bool nearLabel = (((_cse1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= (((-fontSize) * 1.5) - 3.0))) && (delta.y <= 3.0));
      bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2(_cse2, _cse2))));
      if (((nearLabel == false) && (nearTick == false))) {
        continue;
      }
      vec2 before = project((axis * (t - stride)), typeplot_shared_u_19);
      vec2 after = project((axis * (t + stride)), typeplot_shared_u_19);
      float width = numberWidth(t, _licm0, fontSize);
      float _lc0 = (width * 0.5);
      float room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
      vec2 separation = min(abs((at - before)), abs((after - at)));
      vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
      float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
      float visibility = ((_gv0 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit);
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm3) * visibility));
      bool zero = (abs(t) <= _licm4);
      float originDistance = length((at - project(_cse0, typeplot_shared_u_19)));
      float crossing = (zero ? _licm5 : smoothstep((fontSize * 2.0), (fontSize * 4.0), originDistance));
      if (_cse1) {
        labels = max(labels, (((((numberAt(pixel, anchor, t, _licm0, 0.5, fontSize, _licm6, _licm7) * _licm8) * visibility) * smoothstep(0.0, 6.0, room)) * crossing) * priority));
      }
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor spatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_20) {
  vec2 _licm0 = vec2(10.0, 18.0);
  PlotViewport _licm1 = PlotUniforms_as_PlotViewport(typeplot_shared_u_20);
  float _licm2 = typeplot_shared_u_20.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_20.resolution);
  vec2 pixel = (uv * size);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec3 xLevels = spatialLevels(_cse0, typeplot_shared_u_20);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec3 yLevels = spatialLevels(_cse1, typeplot_shared_u_20);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec3 zLevels = spatialLevels(_cse2, typeplot_shared_u_20);
  ViewRay ray = viewRay(uv, typeplot_shared_u_20);
  float grid = groundField(ray, typeplot_shared_u_20, xLevels, zLevels);
  vec4 xTicks = spatialTicks(pixel, _cse0, xLevels, 1.0, typeplot_shared_u_20);
  vec4 yTicks = spatialTicks(pixel, _cse1, yLevels, 1.0, typeplot_shared_u_20);
  vec2 origin = project(vec3(0.0, 0.0, 0.0), typeplot_shared_u_20);
  vec3 xDirection = homogeneous(_cse0, typeplot_shared_u_20, true);
  vec3 zDirection = homogeneous(_cse2, typeplot_shared_u_20, true);
  vec2 _cse3 = vec2(1e-12, 1e-12);
  vec2 xTangent = normalize(((xDirection.xy - (origin * xDirection.z)) + _cse3));
  vec2 zTangent = normalize(((zDirection.xy - (origin * zDirection.z)) + _cse3));
  float angle = abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x)));
  vec4 zTicks = spatialTicks(pixel, _cse2, zLevels, smoothstep(0.08, 0.25, angle), typeplot_shared_u_20);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse4 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse4, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_20.decorations & 4u) != 0u)) {
    vec2 _cse5 = vec2(18.0, 18.0);
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec3 axis = ((index == 0) ? _cse0 : ((index == 1) ? _cse1 : _cse2));
      vec2 edge = ((index == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
      vec3 world = (axis * axisParameter(edge, axis, typeplot_shared_u_20));
      if (inFront(world, typeplot_shared_u_20)) {
        vec2 at = clamp((project(world, typeplot_shared_u_20) + _licm0), _cse5, (size - _cse5));
        labels = max(labels, (axisLabel(pixel, at, (120 + index), _licm1) * _licm2));
      }
    }
  }
  return SpatialDecor(mix(_cse4, color, typeplot_shared_u_20.sceneOpacity.x), (labels * typeplot_shared_u_20.sceneOpacity.x));
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, PlotUniforms typeplot_shared_u_22) {
  int _licm0 = (index * 12);
  bool _licm1 = ((typeplot_shared_u_22.decorations & 2u) != 0u);
  float _cse2 = pixelWidth();
  float _licm3 = (3.0 + _cse2);
  bool _licm4 = (typeplot_shared_u_22.appearance.x > 0.0);
  float _licm5 = typeplot_shared_u_22.appearance.x;
  float _licm6 = typeplot_shared_u_22.labelStyle.y;
  float _licm7 = typeplot_shared_u_22.labelStyle.z;
  float _licm8 = typeplot_shared_u_22.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_22.resolution);
  float fontSize = typeplot_shared_u_22.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 axisLine = cross(homogeneous(_cse0, typeplot_shared_u_22, false), homogeneous(axis, typeplot_shared_u_22, true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse2)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(typeplot_shared_u_22.curveTiles.w)))), 0, (int(typeplot_shared_u_22.curveTiles.w) - 1));
  vec3 labels = _cse0;
  float ticks = 0.0;
  float _cse1 = (((_licm5 * 0.5) + 4.0) + _cse2);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = texelFetch(spatialLabels, ivec2(column, row), int(0u));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse2))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse1, _cse1))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = texelFetch(spatialLabels, ivec2(column, (row + 1)), int(0u));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor cachedSpatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_23) {
  PlotViewport _licm0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_23);
  float _licm1 = typeplot_shared_u_23.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_23.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, typeplot_shared_u_23);
  vec3 xLevels = texelFetch(spatialLabels, ivec2(0, 37), int(0u)).xyz;
  vec3 zLevels = texelFetch(spatialLabels, ivec2(2, 37), int(0u)).xyz;
  float grid = groundField(ray, typeplot_shared_u_23, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, typeplot_shared_u_23);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, typeplot_shared_u_23);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, typeplot_shared_u_23);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_23.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = texelFetch(spatialLabels, ivec2(index, 36), int(0u));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, typeplot_shared_u_23.sceneOpacity.x), (labels * typeplot_shared_u_23.sceneOpacity.x));
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms typeplot_shared_u_26) {
  float _licm0 = typeplot_shared_u_26.surfaceRange.x;
  float _licm1 = typeplot_shared_u_26.surfaceRange.y;
  float _licm2 = (typeplot_shared_u_26.appearance.w * 0.7);
  float _licm3 = ((typeplot_shared_u_26.surfaceRange.y - typeplot_shared_u_26.surfaceRange.x) * 0.5);
  float _licm4 = typeplot_shared_u_26.appearance.w;
  float _licm5 = typeplot_shared_u_26.labelStyle.y;
  if (((typeplot_shared_u_26.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(typeplot_shared_u_26.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(typeplot_shared_u_26.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    labels = max(labels, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, labels);
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

vec4 surfaceMaterial_heightField(SurfaceHit hit, PlotUniforms typeplot_shared_u_27) {
  vec2 footprint = max(vec2(length(vec2(dFdx(hit.point.x), dFdy(hit.point.x))), length(vec2(dFdx(hit.point.z), dFdy(hit.point.z)))), vec2(1e-20, 1e-20));
  float valueRate = max(length(vec2(dFdx(hit.point.y), dFdy(hit.point.y))), 1e-20);
  PlotViewport _cse0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_27);
  vec3 xLevels = axisLevels(typeplot_shared_u_27.plotCenter.x, typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.resolution.x, true, _cse0);
  vec3 zLevels = axisLevels(0.0, max(typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.plotSpan.y), typeplot_shared_u_27.resolution.y, false, _cse0);
  vec2 spacing = vec2(xLevels.x, zLevels.x);
  vec2 _cse1 = vec2(0.5, 0.5);
  float _cse2 = pixelWidth();
  vec2 wireDistance = (((abs((fract(((hit.point.xz / spacing) + _cse1)) - _cse1)) * spacing) / footprint) * _cse2);
  vec2 separation = ((spacing / footprint) * _cse2);
  float wire = max((distanceCoverage(wireDistance.x, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.x)), (distanceCoverage(wireDistance.y, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.y)));
  float contourDistance = (((abs((fract(((hit.point.y / typeplot_shared_u_27.surfaceRender.z) + 0.5)) - 0.5)) * typeplot_shared_u_27.surfaceRender.z) / valueRate) * _cse2);
  float contours = (distanceCoverage(contourDistance, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, ((typeplot_shared_u_27.surfaceRender.z / valueRate) * _cse2)));
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  if (hit.valid) {
    float t = ((hit.point.y - typeplot_shared_u_27.surfaceRange.x) / (typeplot_shared_u_27.surfaceRange.y - typeplot_shared_u_27.surfaceRange.x));
    vec3 ink = colorMap(t, _f2u(typeplot_shared_u_27.surfaceRender.x));
    if (((typeplot_shared_u_27.view3d != 0u) && ((typeplot_shared_u_27.surfaceFlags & 1u) != 0u))) {
      float h = max(0.00001, (max(footprint.x, footprint.y) * 0.25));
      float left = heightField((hit.point.x - h), hit.point.z);
      float right = heightField((hit.point.x + h), hit.point.z);
      float before = heightField(hit.point.x, (hit.point.z - h));
      float after = heightField(hit.point.x, (hit.point.z + h));
      float dx = (((abs(left) < 1000000000000000000.0) && (abs(right) < 1000000000000000000.0)) ? ((right - left) / (2.0 * h)) : ((abs(right) < 1000000000000000000.0) ? ((right - hit.point.y) / h) : ((abs(left) < 1000000000000000000.0) ? ((hit.point.y - left) / h) : 0.0)));
      float dz = (((abs(before) < 1000000000000000000.0) && (abs(after) < 1000000000000000000.0)) ? ((after - before) / (2.0 * h)) : ((abs(after) < 1000000000000000000.0) ? ((after - hit.point.y) / h) : ((abs(before) < 1000000000000000000.0) ? ((hit.point.y - before) / h) : 0.0)));
      vec3 tx = cameraVector(vec3(1.0, dx, 0.0), typeplot_shared_u_27);
      vec3 tz = cameraVector(vec3(0.0, dz, 1.0), typeplot_shared_u_27);
      vec3 crossNormal = cross((tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20)), (tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20)));
      float normalLength = length(crossNormal);
      vec3 normal = ((normalLength > 1e-12) ? (crossNormal / normalLength) : vec3(0.0, 0.0, 1.0));
      if ((normal.z < 0.0)) {
        normal = (-normal);
      }
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.4, 0.7, 1.0))));
      float specular = (pow(max(0.0, dot(normal, normalize(vec3(-0.2, 0.35, 1.0)))), 32.0) * 0.16);
      ink = ((ink * (0.4 + (diffuse * 0.6))) + vec3(specular, specular, specular));
    }
    float lines = max((((typeplot_shared_u_27.surfaceFlags & 2u) != 0u) ? wire : 0.0), (((typeplot_shared_u_27.surfaceFlags & 4u) != 0u) ? contours : 0.0));
    bool filled = ((typeplot_shared_u_27.surfaceFlags & 16u) != 0u);
    if (filled) {
      ink = mix(ink, vec3(0.12, 0.16, 0.22), (lines * 0.65));
    }
    result = vec4(ink, (typeplot_shared_u_27.surfaceRender.y * (filled ? 1.0 : lines)));
  }
  return result;
}

vec4 plotSurface_heightField(vec2 uv, PlotUniforms typeplot_shared_u_28, bool cached) {
  vec2 flat_ = (typeplot_shared_u_28.plotCenter + ((uv - vec2(0.5, 0.5)) * typeplot_shared_u_28.plotSpan));
  SurfaceHit hit = SurfaceHit(vec3(flat_.x, heightField(flat_.x, flat_.y), flat_.y), 0.0, false);
  bool _cse0 = (typeplot_shared_u_28.view3d != 0u);
  if (_cse0) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_28);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(flat_, typeplot_shared_u_28));
  }
  vec4 material = surfaceMaterial_heightField(hit, typeplot_shared_u_28);
  vec3 color = vec3(0.965, 0.973, 0.985);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  vec4 decor = vec4(0.0, 0.0, 0.0, 0.0);
  if (_cse0) {
    SpatialDecor _sel0 = SpatialDecor(vec3(0.0), vec3(0.0));
    PlotUniforms _cse1 = axesUniforms(typeplot_shared_u_28);
    if (cached) {
      _sel0 = cachedSpatialBackground(uv, _cse1);
    } else {
      _sel0 = spatialBackground(uv, _cse1);
    }
    SpatialDecor background = _sel0;
    color = background.color;
    labels = background.labels;
  } else {
    decor = (axes2D(uv, PlotUniforms_as_PlotViewport(typeplot_shared_u_28), 122) * typeplot_shared_u_28.sceneOpacity.x);
  }
  color = mix(color, material.xyz, (material.w * typeplot_shared_u_28.sceneOpacity.y));
  if ((typeplot_shared_u_28.view3d == 0u)) {
    color = mix(color, vec3(0.39, 0.43, 0.49), decor.x);
    labels = decor.yzw;
  }
  vec3 decorated = labelColor(color, labels);
  return vec4(mix(decorated, surfaceColorBar(decorated, uv, typeplot_shared_u_28), typeplot_shared_u_28.sceneOpacity.y), 1.0);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = plotSurface_heightField(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)), false);
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null},data:["heights"]},buildSpatialLabels:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}
NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

bool inFront(vec3 p, PlotUniforms typeplot_shared_u_13) {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

float axisParameter(vec2 pixel, vec3 axis, PlotUniforms typeplot_shared_u_17) {
  vec3 origin = homogeneous(vec3(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_17, true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec3 spatialLevels(vec3 axis, PlotUniforms typeplot_shared_u_18) {
  float center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  float span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  float h = (span * 0.001);
  vec2 tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

vec4 prepareSpatialLabels(vec4 position, PlotUniforms typeplot_shared_u_21) {
  int row = _f2i(position.y);
  int column = _f2i(position.x);
  vec2 size = plotSize(typeplot_shared_u_21.resolution);
  vec4 _cse0 = vec4(0.0, 0.0, 0.0, 0.0);
  vec3 _cse1 = vec3(1.0, 0.0, 0.0);
  vec3 _cse2 = vec3(0.0, 1.0, 0.0);
  vec3 _cse3 = vec3(0.0, 0.0, 1.0);
  if ((row >= 36)) {
    if ((column >= 3)) {
      return _cse0;
    }
    vec3 axis = ((column == 0) ? _cse1 : ((column == 1) ? _cse2 : _cse3));
    if ((row == 37)) {
      return vec4(spatialLevels(axis, typeplot_shared_u_21), 1.0);
    }
    vec2 edge = ((column == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
    vec3 world = (axis * axisParameter(edge, axis, typeplot_shared_u_21));
    vec2 _cse4 = vec2(18.0, 18.0);
    vec2 at = clamp((project(world, typeplot_shared_u_21) + vec2(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4(at, float((120 + column)), (inFront(world, typeplot_shared_u_21) ? 1.0 : 0.0));
  }
  int axisIndex = (row / 12);
  int candidate = _irem((row / 2), 6);
  vec3 axis_1 = ((axisIndex == 0) ? _cse1 : ((axisIndex == 1) ? _cse2 : _cse3));
  vec3 _cse7 = vec3(0.0, 0.0, 0.0);
  vec3 originH = homogeneous(_cse7, typeplot_shared_u_21, false);
  vec3 axisLine = cross(originH, homogeneous(axis_1, typeplot_shared_u_21, true));
  float magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float extent = dot(abs(tangent), size);
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float along = (low + ((position.x / float(typeplot_shared_u_21.curveTiles.w)) * extent));
  vec2 foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  vec3 levels = spatialLevels(axis_1, typeplot_shared_u_21);
  bool _gv0 = (candidate < 3);
  float stride = (_gv0 ? levels.x : levels.y);
  float nearest = (floor(((axisParameter(foot, axis_1, typeplot_shared_u_21) / stride) + 0.5)) * stride);
  float t = (nearest + (float((_irem(candidate, 3) - 1)) * stride));
  vec3 world_1 = (axis_1 * t);
  if ((inFront(world_1, typeplot_shared_u_21) == false)) {
    return _cse0;
  }
  vec2 at_1 = project(world_1, typeplot_shared_u_21);
  float fontSize = typeplot_shared_u_21.appearance.w;
  float sign = ((axis_1.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  if ((_irem(row, 2) == 0)) {
    return vec4(at_1, outward);
  }
  vec2 anchor = ((at_1 + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
  float width = numberWidth(t, levels.x, fontSize);
  vec2 before = project((axis_1 * (t - stride)), typeplot_shared_u_21);
  vec2 after = project((axis_1 * (t + stride)), typeplot_shared_u_21);
  vec2 separation = min(abs((at_1 - before)), abs((after - at_1)));
  vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
  float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
  float visibility = ((_gv0 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit);
  float _lc0 = (width * 0.5);
  float room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
  bool zero = (abs(t) <= (levels.x * 0.001));
  vec2 _cse5 = project(_cse7, typeplot_shared_u_21);
  float crossing = (zero ? ((axis_1.x > 0.0) ? 1.0 : 0.0) : smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse5))));
  float priority = 1.0;
  if ((axisIndex == 2)) {
    vec3 xDirection = homogeneous(_cse1, typeplot_shared_u_21, true);
    vec3 zDirection = homogeneous(_cse3, typeplot_shared_u_21, true);
    vec2 _cse6 = vec2(1e-12, 1e-12);
    vec2 xTangent = normalize(((xDirection.xy - (_cse5 * xDirection.z)) + _cse6));
    vec2 zTangent = normalize(((zDirection.xy - (_cse5 * zDirection.z)) + _cse6));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4(t, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
layout(location = 0) out vec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = prepareSpatialLabels(position, axesUniforms(Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset))));
}
`,blocks:{u:"Uniforms"},samplers:{}},drawLayer:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct SceneLayer {
  vec4 color;
  vec4 depth;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

layout(std140) uniform SceneMaterial {
  vec4 ink;
  float bias;
} sceneMaterial;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

vec4 packedDepth(float depth) {
  uint bits = floatBitsToUint(depth);
  return (vec4(float((bits & 255u)), float(((bits >> 8u) & 255u)), float(((bits >> 16u) & 255u)), float((bits >> 24u))) / 255.0);
}

SceneLayer sceneLayer(vec4 color, float depth) {
  return SceneLayer(color, packedDepth((depth + sceneMaterial.bias)));
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

vec4 surfaceMaterial_heightField(SurfaceHit hit, PlotUniforms typeplot_shared_u_27) {
  vec2 footprint = max(vec2(length(vec2(dFdx(hit.point.x), dFdy(hit.point.x))), length(vec2(dFdx(hit.point.z), dFdy(hit.point.z)))), vec2(1e-20, 1e-20));
  float valueRate = max(length(vec2(dFdx(hit.point.y), dFdy(hit.point.y))), 1e-20);
  PlotViewport _cse0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_27);
  vec3 xLevels = axisLevels(typeplot_shared_u_27.plotCenter.x, typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.resolution.x, true, _cse0);
  vec3 zLevels = axisLevels(0.0, max(typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.plotSpan.y), typeplot_shared_u_27.resolution.y, false, _cse0);
  vec2 spacing = vec2(xLevels.x, zLevels.x);
  vec2 _cse1 = vec2(0.5, 0.5);
  float _cse2 = pixelWidth();
  vec2 wireDistance = (((abs((fract(((hit.point.xz / spacing) + _cse1)) - _cse1)) * spacing) / footprint) * _cse2);
  vec2 separation = ((spacing / footprint) * _cse2);
  float wire = max((distanceCoverage(wireDistance.x, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.x)), (distanceCoverage(wireDistance.y, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.y)));
  float contourDistance = (((abs((fract(((hit.point.y / typeplot_shared_u_27.surfaceRender.z) + 0.5)) - 0.5)) * typeplot_shared_u_27.surfaceRender.z) / valueRate) * _cse2);
  float contours = (distanceCoverage(contourDistance, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, ((typeplot_shared_u_27.surfaceRender.z / valueRate) * _cse2)));
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  if (hit.valid) {
    float t = ((hit.point.y - typeplot_shared_u_27.surfaceRange.x) / (typeplot_shared_u_27.surfaceRange.y - typeplot_shared_u_27.surfaceRange.x));
    vec3 ink = colorMap(t, _f2u(typeplot_shared_u_27.surfaceRender.x));
    if (((typeplot_shared_u_27.view3d != 0u) && ((typeplot_shared_u_27.surfaceFlags & 1u) != 0u))) {
      float h = max(0.00001, (max(footprint.x, footprint.y) * 0.25));
      float left = heightField((hit.point.x - h), hit.point.z);
      float right = heightField((hit.point.x + h), hit.point.z);
      float before = heightField(hit.point.x, (hit.point.z - h));
      float after = heightField(hit.point.x, (hit.point.z + h));
      float dx = (((abs(left) < 1000000000000000000.0) && (abs(right) < 1000000000000000000.0)) ? ((right - left) / (2.0 * h)) : ((abs(right) < 1000000000000000000.0) ? ((right - hit.point.y) / h) : ((abs(left) < 1000000000000000000.0) ? ((hit.point.y - left) / h) : 0.0)));
      float dz = (((abs(before) < 1000000000000000000.0) && (abs(after) < 1000000000000000000.0)) ? ((after - before) / (2.0 * h)) : ((abs(after) < 1000000000000000000.0) ? ((after - hit.point.y) / h) : ((abs(before) < 1000000000000000000.0) ? ((hit.point.y - before) / h) : 0.0)));
      vec3 tx = cameraVector(vec3(1.0, dx, 0.0), typeplot_shared_u_27);
      vec3 tz = cameraVector(vec3(0.0, dz, 1.0), typeplot_shared_u_27);
      vec3 crossNormal = cross((tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20)), (tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20)));
      float normalLength = length(crossNormal);
      vec3 normal = ((normalLength > 1e-12) ? (crossNormal / normalLength) : vec3(0.0, 0.0, 1.0));
      if ((normal.z < 0.0)) {
        normal = (-normal);
      }
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.4, 0.7, 1.0))));
      float specular = (pow(max(0.0, dot(normal, normalize(vec3(-0.2, 0.35, 1.0)))), 32.0) * 0.16);
      ink = ((ink * (0.4 + (diffuse * 0.6))) + vec3(specular, specular, specular));
    }
    float lines = max((((typeplot_shared_u_27.surfaceFlags & 2u) != 0u) ? wire : 0.0), (((typeplot_shared_u_27.surfaceFlags & 4u) != 0u) ? contours : 0.0));
    bool filled = ((typeplot_shared_u_27.surfaceFlags & 16u) != 0u);
    if (filled) {
      ink = mix(ink, vec3(0.12, 0.16, 0.22), (lines * 0.65));
    }
    result = vec4(ink, (typeplot_shared_u_27.surfaceRender.y * (filled ? 1.0 : lines)));
  }
  return result;
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

SceneLayer sceneSurface_heightField(vec2 uv, PlotUniforms typeplot_shared_u_30) {
  if ((typeplot_shared_u_30.sceneOpacity.y <= 0.0)) {
    return sceneLayer(vec4(0.0, 0.0, 0.0, 0.0), 0.0);
  }
  SurfaceHit hit = surfaceHit_heightField(uv, typeplot_shared_u_30);
  vec4 ink = surfaceMaterial_heightField(hit, typeplot_shared_u_30);
  return sceneLayer(vec4(ink.xyz, (ink.w * typeplot_shared_u_30.sceneOpacity.y)), (hit.valid ? cameraDistance(hit.point, typeplot_shared_u_30) : 0.0));
}
in vec2 uv;
layout(location = 0) out vec4 color;
layout(location = 1) out vec4 depth;

void main() {
  SceneLayer _out = sceneSurface_heightField(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
  color = _out.color;
  depth = _out.depth;
}
`,blocks:{u:"Uniforms",sceneMaterial:"SceneMaterial",font:"FontUniforms"},samplers:{},data:["heights"]},drawLayerReference:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct SceneLayer {
  vec4 color;
  vec4 depth;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

layout(std140) uniform SceneMaterial {
  vec4 ink;
  float bias;
} sceneMaterial;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

vec4 packedDepth(float depth) {
  uint bits = floatBitsToUint(depth);
  return (vec4(float((bits & 255u)), float(((bits >> 8u) & 255u)), float(((bits >> 16u) & 255u)), float((bits >> 24u))) / 255.0);
}

SceneLayer sceneLayer(vec4 color, float depth) {
  return SceneLayer(color, packedDepth((depth + sceneMaterial.bias)));
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

vec4 surfaceMaterial_heightField(SurfaceHit hit, PlotUniforms typeplot_shared_u_27) {
  vec2 footprint = max(vec2(length(vec2(dFdx(hit.point.x), dFdy(hit.point.x))), length(vec2(dFdx(hit.point.z), dFdy(hit.point.z)))), vec2(1e-20, 1e-20));
  float valueRate = max(length(vec2(dFdx(hit.point.y), dFdy(hit.point.y))), 1e-20);
  PlotViewport _cse0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_27);
  vec3 xLevels = axisLevels(typeplot_shared_u_27.plotCenter.x, typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.resolution.x, true, _cse0);
  vec3 zLevels = axisLevels(0.0, max(typeplot_shared_u_27.plotSpan.x, typeplot_shared_u_27.plotSpan.y), typeplot_shared_u_27.resolution.y, false, _cse0);
  vec2 spacing = vec2(xLevels.x, zLevels.x);
  vec2 _cse1 = vec2(0.5, 0.5);
  float _cse2 = pixelWidth();
  vec2 wireDistance = (((abs((fract(((hit.point.xz / spacing) + _cse1)) - _cse1)) * spacing) / footprint) * _cse2);
  vec2 separation = ((spacing / footprint) * _cse2);
  float wire = max((distanceCoverage(wireDistance.x, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.x)), (distanceCoverage(wireDistance.y, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, separation.y)));
  float contourDistance = (((abs((fract(((hit.point.y / typeplot_shared_u_27.surfaceRender.z) + 0.5)) - 0.5)) * typeplot_shared_u_27.surfaceRender.z) / valueRate) * _cse2);
  float contours = (distanceCoverage(contourDistance, typeplot_shared_u_27.appearance.z) * smoothstep(2.0, 6.0, ((typeplot_shared_u_27.surfaceRender.z / valueRate) * _cse2)));
  vec4 result = vec4(0.0, 0.0, 0.0, 0.0);
  if (hit.valid) {
    float t = ((hit.point.y - typeplot_shared_u_27.surfaceRange.x) / (typeplot_shared_u_27.surfaceRange.y - typeplot_shared_u_27.surfaceRange.x));
    vec3 ink = colorMap(t, _f2u(typeplot_shared_u_27.surfaceRender.x));
    if (((typeplot_shared_u_27.view3d != 0u) && ((typeplot_shared_u_27.surfaceFlags & 1u) != 0u))) {
      float h = max(0.00001, (max(footprint.x, footprint.y) * 0.25));
      float left = heightField((hit.point.x - h), hit.point.z);
      float right = heightField((hit.point.x + h), hit.point.z);
      float before = heightField(hit.point.x, (hit.point.z - h));
      float after = heightField(hit.point.x, (hit.point.z + h));
      float dx = (((abs(left) < 1000000000000000000.0) && (abs(right) < 1000000000000000000.0)) ? ((right - left) / (2.0 * h)) : ((abs(right) < 1000000000000000000.0) ? ((right - hit.point.y) / h) : ((abs(left) < 1000000000000000000.0) ? ((hit.point.y - left) / h) : 0.0)));
      float dz = (((abs(before) < 1000000000000000000.0) && (abs(after) < 1000000000000000000.0)) ? ((after - before) / (2.0 * h)) : ((abs(after) < 1000000000000000000.0) ? ((after - hit.point.y) / h) : ((abs(before) < 1000000000000000000.0) ? ((hit.point.y - before) / h) : 0.0)));
      vec3 tx = cameraVector(vec3(1.0, dx, 0.0), typeplot_shared_u_27);
      vec3 tz = cameraVector(vec3(0.0, dz, 1.0), typeplot_shared_u_27);
      vec3 crossNormal = cross((tz / max(max(max(abs(tz.x), abs(tz.y)), abs(tz.z)), 1e-20)), (tx / max(max(max(abs(tx.x), abs(tx.y)), abs(tx.z)), 1e-20)));
      float normalLength = length(crossNormal);
      vec3 normal = ((normalLength > 1e-12) ? (crossNormal / normalLength) : vec3(0.0, 0.0, 1.0));
      if ((normal.z < 0.0)) {
        normal = (-normal);
      }
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.4, 0.7, 1.0))));
      float specular = (pow(max(0.0, dot(normal, normalize(vec3(-0.2, 0.35, 1.0)))), 32.0) * 0.16);
      ink = ((ink * (0.4 + (diffuse * 0.6))) + vec3(specular, specular, specular));
    }
    float lines = max((((typeplot_shared_u_27.surfaceFlags & 2u) != 0u) ? wire : 0.0), (((typeplot_shared_u_27.surfaceFlags & 4u) != 0u) ? contours : 0.0));
    bool filled = ((typeplot_shared_u_27.surfaceFlags & 16u) != 0u);
    if (filled) {
      ink = mix(ink, vec3(0.12, 0.16, 0.22), (lines * 0.65));
    }
    result = vec4(ink, (typeplot_shared_u_27.surfaceRender.y * (filled ? 1.0 : lines)));
  }
  return result;
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

SceneLayer sceneSurface_heightField(vec2 uv, PlotUniforms typeplot_shared_u_30) {
  if ((typeplot_shared_u_30.sceneOpacity.y <= 0.0)) {
    return sceneLayer(vec4(0.0, 0.0, 0.0, 0.0), 0.0);
  }
  SurfaceHit hit = surfaceHit_heightField(uv, typeplot_shared_u_30);
  vec4 ink = surfaceMaterial_heightField(hit, typeplot_shared_u_30);
  return sceneLayer(vec4(ink.xyz, (ink.w * typeplot_shared_u_30.sceneOpacity.y)), (hit.valid ? cameraDistance(hit.point, typeplot_shared_u_30) : 0.0));
}
in vec2 uv;
layout(location = 0) out vec4 color;
layout(location = 1) out vec4 depth;

void main() {
  SceneLayer _out = sceneSurface_heightField(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
  color = _out.color;
  depth = _out.depth;
}
`,blocks:{u:"Uniforms",sceneMaterial:"SceneMaterial",font:"FontUniforms"},samplers:{},data:["heights"]},drawBackdrop:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

ivec2 _f2i(vec2 x) {
  return ivec2(_f2i(x.x), _f2i(x.y));
}
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, PlotUniforms typeplot_shared_u_22) {
  int _licm0 = (index * 12);
  bool _licm1 = ((typeplot_shared_u_22.decorations & 2u) != 0u);
  float _cse2 = pixelWidth();
  float _licm3 = (3.0 + _cse2);
  bool _licm4 = (typeplot_shared_u_22.appearance.x > 0.0);
  float _licm5 = typeplot_shared_u_22.appearance.x;
  float _licm6 = typeplot_shared_u_22.labelStyle.y;
  float _licm7 = typeplot_shared_u_22.labelStyle.z;
  float _licm8 = typeplot_shared_u_22.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_22.resolution);
  float fontSize = typeplot_shared_u_22.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 axisLine = cross(homogeneous(_cse0, typeplot_shared_u_22, false), homogeneous(axis, typeplot_shared_u_22, true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse2)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(typeplot_shared_u_22.curveTiles.w)))), 0, (int(typeplot_shared_u_22.curveTiles.w) - 1));
  vec3 labels = _cse0;
  float ticks = 0.0;
  float _cse1 = (((_licm5 * 0.5) + 4.0) + _cse2);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = texelFetch(spatialLabels, ivec2(column, row), int(0u));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse2))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse1, _cse1))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = texelFetch(spatialLabels, ivec2(column, (row + 1)), int(0u));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor cachedSpatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_23) {
  PlotViewport _licm0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_23);
  float _licm1 = typeplot_shared_u_23.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_23.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, typeplot_shared_u_23);
  vec3 xLevels = texelFetch(spatialLabels, ivec2(0, 37), int(0u)).xyz;
  vec3 zLevels = texelFetch(spatialLabels, ivec2(2, 37), int(0u)).xyz;
  float grid = groundField(ray, typeplot_shared_u_23, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, typeplot_shared_u_23);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, typeplot_shared_u_23);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, typeplot_shared_u_23);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_23.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = texelFetch(spatialLabels, ivec2(index, 36), int(0u));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, typeplot_shared_u_23.sceneOpacity.x), (labels * typeplot_shared_u_23.sceneOpacity.x));
}

vec4 sceneBackdrop(vec2 uv, PlotUniforms typeplot_shared_u_31) {
  return vec4(cachedSpatialBackground(uv, axesUniforms(typeplot_shared_u_31)).color, 1.0);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = sceneBackdrop(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null}},drawBackdropReference:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
}

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

ivec2 _f2i(vec2 x) {
  return ivec2(_f2i(x.x), _f2i(x.y));
}
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

bool inFront(vec3 p, PlotUniforms typeplot_shared_u_13) {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

float axisParameter(vec2 pixel, vec3 axis, PlotUniforms typeplot_shared_u_17) {
  vec3 origin = homogeneous(vec3(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_17, true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec3 spatialLevels(vec3 axis, PlotUniforms typeplot_shared_u_18) {
  float center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  float span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  float h = (span * 0.001);
  vec2 tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

vec4 spatialTicks(vec2 pixel, vec3 axis, vec3 levels, float priority, PlotUniforms typeplot_shared_u_19) {
  float _licm0 = levels.x;
  float _licm1 = levels.y;
  bool _licm2 = (typeplot_shared_u_19.appearance.x > 0.0);
  float _licm3 = typeplot_shared_u_19.appearance.x;
  float _licm4 = (levels.x * 0.001);
  float _licm5 = ((axis.x > 0.0) ? 1.0 : 0.0);
  float _licm6 = typeplot_shared_u_19.labelStyle.y;
  float _licm7 = typeplot_shared_u_19.labelStyle.z;
  float _licm8 = typeplot_shared_u_19.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_19.resolution);
  float fontSize = typeplot_shared_u_19.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 originH = homogeneous(_cse0, typeplot_shared_u_19, false);
  vec3 directionH = homogeneous(axis, typeplot_shared_u_19, true);
  vec3 axisLine = cross(originH, directionH);
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > ((fontSize * 6.0) + 12.0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float sign = ((axis.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  float value = axisParameter(pixel, axis, typeplot_shared_u_19);
  vec3 labels = _cse0;
  float ticks = 0.0;
  bool _cse1 = ((typeplot_shared_u_19.decorations & 2u) != 0u);
  float _cse2 = (((_licm3 * 0.5) + 4.0) + pixelWidth());
  for (int index = 0; (index < 6); index = (index + 1)) {
    bool _gv0 = (index < 3);
    float stride = (_gv0 ? _licm0 : _licm1);
    float nearest = (floor(((value / stride) + 0.5)) * stride);
    float t = (nearest + (float((_irem(index, 3) - 1)) * stride));
    vec3 world = (axis * t);
    if (inFront(world, typeplot_shared_u_19)) {
      vec2 at = project(world, typeplot_shared_u_19);
      vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
      vec2 delta = (pixel - anchor);
      bool nearLabel = (((_cse1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= (((-fontSize) * 1.5) - 3.0))) && (delta.y <= 3.0));
      bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2(_cse2, _cse2))));
      if (((nearLabel == false) && (nearTick == false))) {
        continue;
      }
      vec2 before = project((axis * (t - stride)), typeplot_shared_u_19);
      vec2 after = project((axis * (t + stride)), typeplot_shared_u_19);
      float width = numberWidth(t, _licm0, fontSize);
      float _lc0 = (width * 0.5);
      float room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
      vec2 separation = min(abs((at - before)), abs((after - at)));
      vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
      float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
      float visibility = ((_gv0 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit);
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm3) * visibility));
      bool zero = (abs(t) <= _licm4);
      float originDistance = length((at - project(_cse0, typeplot_shared_u_19)));
      float crossing = (zero ? _licm5 : smoothstep((fontSize * 2.0), (fontSize * 4.0), originDistance));
      if (_cse1) {
        labels = max(labels, (((((numberAt(pixel, anchor, t, _licm0, 0.5, fontSize, _licm6, _licm7) * _licm8) * visibility) * smoothstep(0.0, 6.0, room)) * crossing) * priority));
      }
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor spatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_20) {
  vec2 _licm0 = vec2(10.0, 18.0);
  PlotViewport _licm1 = PlotUniforms_as_PlotViewport(typeplot_shared_u_20);
  float _licm2 = typeplot_shared_u_20.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_20.resolution);
  vec2 pixel = (uv * size);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec3 xLevels = spatialLevels(_cse0, typeplot_shared_u_20);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec3 yLevels = spatialLevels(_cse1, typeplot_shared_u_20);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec3 zLevels = spatialLevels(_cse2, typeplot_shared_u_20);
  ViewRay ray = viewRay(uv, typeplot_shared_u_20);
  float grid = groundField(ray, typeplot_shared_u_20, xLevels, zLevels);
  vec4 xTicks = spatialTicks(pixel, _cse0, xLevels, 1.0, typeplot_shared_u_20);
  vec4 yTicks = spatialTicks(pixel, _cse1, yLevels, 1.0, typeplot_shared_u_20);
  vec2 origin = project(vec3(0.0, 0.0, 0.0), typeplot_shared_u_20);
  vec3 xDirection = homogeneous(_cse0, typeplot_shared_u_20, true);
  vec3 zDirection = homogeneous(_cse2, typeplot_shared_u_20, true);
  vec2 _cse3 = vec2(1e-12, 1e-12);
  vec2 xTangent = normalize(((xDirection.xy - (origin * xDirection.z)) + _cse3));
  vec2 zTangent = normalize(((zDirection.xy - (origin * zDirection.z)) + _cse3));
  float angle = abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x)));
  vec4 zTicks = spatialTicks(pixel, _cse2, zLevels, smoothstep(0.08, 0.25, angle), typeplot_shared_u_20);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse4 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse4, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_20.decorations & 4u) != 0u)) {
    vec2 _cse5 = vec2(18.0, 18.0);
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec3 axis = ((index == 0) ? _cse0 : ((index == 1) ? _cse1 : _cse2));
      vec2 edge = ((index == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
      vec3 world = (axis * axisParameter(edge, axis, typeplot_shared_u_20));
      if (inFront(world, typeplot_shared_u_20)) {
        vec2 at = clamp((project(world, typeplot_shared_u_20) + _licm0), _cse5, (size - _cse5));
        labels = max(labels, (axisLabel(pixel, at, (120 + index), _licm1) * _licm2));
      }
    }
  }
  return SpatialDecor(mix(_cse4, color, typeplot_shared_u_20.sceneOpacity.x), (labels * typeplot_shared_u_20.sceneOpacity.x));
}

vec4 sceneBackdropReference(vec2 uv, PlotUniforms typeplot_shared_u_32) {
  return vec4(spatialBackground(uv, axesUniforms(typeplot_shared_u_32)).color, 1.0);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = sceneBackdropReference(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{glyphAtlas:null}},drawLabels:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
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
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

float stroke(vec2 p, vec2 a, vec2 b, float width) {
  float radius = (width * 0.5);
  if ((((width <= 0.0) || any(lessThan(p, (min(a, b) - vec2((radius + 1.0), (radius + 1.0)))))) || any(greaterThan(p, (max(a, b) + vec2((radius + 1.0), (radius + 1.0))))))) {
    return 0.0;
  }
  vec2 ab = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 labelColor(vec3 color, vec3 labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), labels.y), vec3(0.25, 0.29, 0.35), labels.x);
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, PlotUniforms typeplot_shared_u_22) {
  int _licm0 = (index * 12);
  bool _licm1 = ((typeplot_shared_u_22.decorations & 2u) != 0u);
  float _cse2 = pixelWidth();
  float _licm3 = (3.0 + _cse2);
  bool _licm4 = (typeplot_shared_u_22.appearance.x > 0.0);
  float _licm5 = typeplot_shared_u_22.appearance.x;
  float _licm6 = typeplot_shared_u_22.labelStyle.y;
  float _licm7 = typeplot_shared_u_22.labelStyle.z;
  float _licm8 = typeplot_shared_u_22.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_22.resolution);
  float fontSize = typeplot_shared_u_22.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 axisLine = cross(homogeneous(_cse0, typeplot_shared_u_22, false), homogeneous(axis, typeplot_shared_u_22, true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse2)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(typeplot_shared_u_22.curveTiles.w)))), 0, (int(typeplot_shared_u_22.curveTiles.w) - 1));
  vec3 labels = _cse0;
  float ticks = 0.0;
  float _cse1 = (((_licm5 * 0.5) + 4.0) + _cse2);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = texelFetch(spatialLabels, ivec2(column, row), int(0u));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse2))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse1, _cse1))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = texelFetch(spatialLabels, ivec2(column, (row + 1)), int(0u));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((numberAt(pixel, anchor, style.x, style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor cachedSpatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_23) {
  PlotViewport _licm0 = PlotUniforms_as_PlotViewport(typeplot_shared_u_23);
  float _licm1 = typeplot_shared_u_23.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_23.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, typeplot_shared_u_23);
  vec3 xLevels = texelFetch(spatialLabels, ivec2(0, 37), int(0u)).xyz;
  vec3 zLevels = texelFetch(spatialLabels, ivec2(2, 37), int(0u)).xyz;
  float grid = groundField(ray, typeplot_shared_u_23, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, typeplot_shared_u_23);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, typeplot_shared_u_23);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, typeplot_shared_u_23);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_23));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_23.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = texelFetch(spatialLabels, ivec2(index, 36), int(0u));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, typeplot_shared_u_23.sceneOpacity.x), (labels * typeplot_shared_u_23.sceneOpacity.x));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms typeplot_shared_u_26) {
  float _licm0 = typeplot_shared_u_26.surfaceRange.x;
  float _licm1 = typeplot_shared_u_26.surfaceRange.y;
  float _licm2 = (typeplot_shared_u_26.appearance.w * 0.7);
  float _licm3 = ((typeplot_shared_u_26.surfaceRange.y - typeplot_shared_u_26.surfaceRange.x) * 0.5);
  float _licm4 = typeplot_shared_u_26.appearance.w;
  float _licm5 = typeplot_shared_u_26.labelStyle.y;
  if (((typeplot_shared_u_26.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(typeplot_shared_u_26.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(typeplot_shared_u_26.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    labels = max(labels, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, labels);
}

vec4 sceneDecorLabels(vec2 uv, PlotUniforms typeplot_shared_u_33, SpatialDecor decor, bool surface) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 black = labelColor(_cse0, decor.labels);
  vec3 white = labelColor(vec3(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    black = mix(black, surfaceColorBar(black, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
  }
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}

vec4 sceneLabels(vec2 uv, PlotUniforms typeplot_shared_u_34, bool surface) {
  return sceneDecorLabels(uv, typeplot_shared_u_34, cachedSpatialBackground(uv, axesUniforms(typeplot_shared_u_34)), surface);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = sceneLabels(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)), true);
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null}},drawLabelsReference:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct NumberFormat {
  float value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct PlotViewport {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
};

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
int _irem(int a, int b) {
  return (b == 0 || (a == int(0x80000000u) && b == -1)) ? 0 : a - (a / b) * b;
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
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

float tickMark(vec2 pixel, vec2 center, vec2 tangent, float halfLength, float width) {
  if (((width <= 0.0) || (halfLength <= 0.0))) {
    return 0.0;
  }
  vec2 delta = (pixel - center);
  vec2 normal = vec2((-tangent.y), tangent.x);
  vec2 q = (abs(vec2(dot(delta, tangent), dot(delta, normal))) - vec2((width * 0.5), halfLength));
  float distance = (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

int glyphIndex(int code) {
  if (((code >= 32) && (code < 256))) {
    return (code - 32);
  }
  if (((code >= 880) && (code < 1024))) {
    return ((224 + code) - 880);
  }
  if (((code >= 12592) && (code < 12688))) {
    return ((368 + code) - 12592);
  }
  if (((code >= 44032) && (code <= 55203))) {
    return ((464 + code) - 44032);
  }
  if (((code >= 8192) && (code < 8960))) {
    return ((11636 + code) - 8192);
  }
  return 12404;
}

vec2 glyphLayers(vec2 p, int code, float fontSize, float halo) {
  int index = glyphIndex(code);
  float _cse0 = (fontSize * font.pixelRatio);
  float referenceSize = 24.0;
  vec2 cell = vec2(30.0, 36.0);
  ivec2 origin = ivec2((_irem(index, 132) * 30), ((index / 132) * 36));
  if (((code >= 32) && (code < 128))) {
    int _cse1 = (code - 32);
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2((_cse1 * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5, 0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0, 0.0);
  }
  ivec2 base = _f2i(floor(q));
  vec2 t = fract(q);
  ivec2 _gv0 = (origin + base);
  float a = texelFetch(glyphAtlas, _gv0, int(0u)).r;
  float b = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 0)), int(0u)).r;
  float c = texelFetch(glyphAtlas, (_gv0 + ivec2(0, 1)), int(0u)).r;
  float d = texelFetch(glyphAtlas, (_gv0 + ivec2(1, 1)), int(0u)).r;
  float distance = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
  float width = max((2.52 / max(_cse0, 1.0)), 0.00392156862745098);
  float fill = smoothstep((0.75 - width), (0.75 + width), distance);
  float outerEdge = (0.75 - ((min(halo, (fontSize * 0.1)) * 3.0) / fontSize));
  return vec2(fill, smoothstep((outerEdge - width), (outerEdge + width), distance));
}

NumberFormat numberFormat(float input_, float spacing) {
  float _cse2 = abs(spacing);
  float value = ((abs(input_) < (_cse2 * 0.0001)) ? 0.0 : input_);
  float magnitude = abs(value);
  float _cse0 = log2(10.0);
  int exponent = _f2i(floor((log2(max(magnitude, 1e-30)) / _cse0)));
  bool scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  float _cse1 = log2(max(_cse2, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse1) / _cse0)), 0.0, 6.0));
  int digits = 1;
  if (scientific) {
    float _gv0 = float(exponent);
    decimals = _f2i(clamp(ceil((_gv0 - (_cse1 / _cse0))), 0.0, 6.0));
    float scale = pow(10.0, float(decimals));
    magnitude = floor((((magnitude / pow(10.0, _gv0)) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    float _gv1 = pow(10.0, float(decimals));
    magnitude = floor(((magnitude * _gv1) + 0.5));
    digits = (_f2i(floor((log2(max(floor((magnitude / _gv1)), 1.0)) / _cse0))) + 1);
  }
  for (int i = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  bool negative = (value < 0.0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int numberGlyph(NumberFormat n, int column) {
  int i = column;
  if ((n.negative && (i == 0))) {
    return 45;
  }
  i = (i - (n.negative ? 1 : 0));
  bool _cse0 = (n.decimals > 0);
  if (n.scientific) {
    int mantissaLength = (1 + (_cse0 ? (1 + n.decimals) : 0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      int digit = (i - ((i > 1) ? 1 : 0));
      return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((n.decimals - digit)))))), 10));
    }
    int suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return ((n.exponent < 0) ? 45 : 43);
    }
    int _cse1 = abs(n.exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + _irem(_cse1, 10));
  }
  if ((_cse0 && (i == n.digits))) {
    return 46;
  }
  int digit_1 = (i - ((i > n.digits) ? 1 : 0));
  return (48 + _irem(_f2i(floor((n.value / pow(10.0, float((((n.digits + n.decimals) - digit_1) - 1)))))), 10));
}

vec2 tickNumberLayers(vec2 p, float value, float spacing, float align, float fontSize, float halo) {
  NumberFormat n = numberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse0 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse0;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, numberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float numberWidth(float value, float spacing, float size) {
  return ((float(numberFormat(value, spacing).length) * size) * 0.625);
}

vec3 tickLevels(float raw) {
  float safe = max(raw, 1e-25);
  float unit = pow(10.0, floor((log2(safe) / log2(10.0))));
  bool _gv0 = (safe < (unit * 2.0));
  float fine = (_gv0 ? unit : ((safe < (unit * 5.0)) ? (unit * 2.0) : (unit * 5.0)));
  float coarse = (_gv0 ? (unit * 2.0) : ((safe < (unit * 5.0)) ? (unit * 5.0) : (unit * 10.0)));
  float phase = (log2((safe / fine)) / log2((coarse / fine)));
  return vec3(fine, coarse, (1.0 - smoothstep(0.0, 1.0, phase)));
}

float tickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.y);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : levels.z);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 colorMap(float value, uint palette) {
  float t = clamp(value, 0.0, 1.0);
  if ((palette == 3u)) {
    return vec3(t, t, t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87, 0.87, 0.87);
    return ((t < 0.5) ? mix(vec3(0.23, 0.3, 0.75), _cse0, (t * 2.0)) : mix(_cse0, vec3(0.71, 0.02, 0.15), ((t * 2.0) - 1.0)));
  }
  vec3 a = vec3(0.267, 0.005, 0.329);
  vec3 b = vec3(0.23, 0.322, 0.546);
  vec3 c = vec3(0.128, 0.567, 0.551);
  vec3 d = vec3(0.369, 0.789, 0.383);
  vec3 e = vec3(0.993, 0.906, 0.144);
  if ((palette == 1u)) {
    a = vec3(0.05, 0.03, 0.528);
    b = vec3(0.495, 0.012, 0.658);
    c = vec3(0.798, 0.28, 0.47);
    d = vec3(0.973, 0.586, 0.252);
    e = vec3(0.94, 0.975, 0.131);
  }
  if ((t < 0.25)) {
    return mix(a, b, (t * 4.0));
  }
  if ((t < 0.5)) {
    return mix(b, c, ((t * 4.0) - 1.0));
  }
  if ((t < 0.75)) {
    return mix(c, d, ((t * 4.0) - 2.0));
  }
  return mix(d, e, ((t * 4.0) - 3.0));
}

PlotUniforms axesUniforms(PlotUniforms typeplot_shared_u) {
  return PlotUniforms(typeplot_shared_u.resolution, typeplot_shared_u.plotCenter, typeplot_shared_u.plotSpan, typeplot_shared_u.plotRotation, typeplot_shared_u.rotationBasis, typeplot_shared_u.plotPan, typeplot_shared_u.plotBlend, typeplot_shared_u.appearance, typeplot_shared_u.decorations, typeplot_shared_u.labelStyle, typeplot_shared_u.decorationOpacity, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.axesModel, typeplot_shared_u.inverseAxesModel, typeplot_shared_u.sceneOpacity, typeplot_shared_u.cameraLens, typeplot_shared_u.plotCenterZ, typeplot_shared_u.probe, typeplot_shared_u.view3d, typeplot_shared_u.parameterBounds, typeplot_shared_u.parameterMode, typeplot_shared_u.curveQuality, typeplot_shared_u.curvePattern, typeplot_shared_u.curveTiles, typeplot_shared_u.surfaceBounds, typeplot_shared_u.surfaceDomainMode, typeplot_shared_u.surfaceRange, typeplot_shared_u.surfaceDepth, typeplot_shared_u.surfaceRender, typeplot_shared_u.surfaceFlags);
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport typeplot_shared_u_2) {
  float _cse0 = (((typeplot_shared_u_2.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (typeplot_shared_u_2.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((typeplot_shared_u_2.appearance.w * 0.42), 0.0)), code, typeplot_shared_u_2.appearance.w, typeplot_shared_u_2.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, typeplot_shared_u_2.appearance.w) * typeplot_shared_u_2.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

float distanceCoverage(float distance, float width) {
  if ((width <= 0.0)) {
    return 0.0;
  }
  float aa = (pixelWidth() * 0.5);
  float _cse0 = (width * 0.5);
  return (1.0 - smoothstep(max(0.0, (_cse0 - aa)), (_cse0 + aa), distance));
}

float stroke(vec2 p, vec2 a, vec2 b, float width) {
  float radius = (width * 0.5);
  if ((((width <= 0.0) || any(lessThan(p, (min(a, b) - vec2((radius + 1.0), (radius + 1.0)))))) || any(greaterThan(p, (max(a, b) + vec2((radius + 1.0), (radius + 1.0))))))) {
    return 0.0;
  }
  vec2 ab = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

vec3 axisLevels(float center, float span, float pixels, bool horizontal, PlotViewport typeplot_shared_u_3) {
  float size = typeplot_shared_u_3.appearance.w;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float _cse0 = (span * 0.5);
  float width = max(numberWidth((center - _cse0), rough, size), numberWidth((center + _cse0), rough, size));
  float gap = (horizontal ? max((size * 3.5), (width + (size * 1.3))) : (size * 2.6));
  return tickLevels(((span * gap) / max((pixels * typeplot_shared_u_3.labelStyle.x), 1.0)));
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 labelColor(vec3 color, vec3 labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), labels.y), vec3(0.25, 0.29, 0.35), labels.x);
}

vec3 basisVector(vec3 p, PlotUniforms typeplot_shared_u_5) {
  vec2 span = max(typeplot_shared_u_5.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = typeplot_shared_u_5.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms typeplot_shared_u_6) {
  return basisVector(((typeplot_shared_u_6.model * vec4(p, 1.0)).xyz - vec3(typeplot_shared_u_6.plotCenter, typeplot_shared_u_6.plotCenterZ)), typeplot_shared_u_6);
}

vec3 cameraVector(vec3 p, PlotUniforms typeplot_shared_u_7) {
  return basisVector((typeplot_shared_u_7.model * vec4(p, 0.0)).xyz, typeplot_shared_u_7);
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms typeplot_shared_u_10, bool direction) {
  vec2 size = plotSize(typeplot_shared_u_10.resolution);
  vec3 camera = (direction ? cameraVector(p, typeplot_shared_u_10) : cameraPoint(p, typeplot_shared_u_10));
  float w = ((typeplot_shared_u_10.view3d == 2u) ? (direction ? (-camera.z) : (typeplot_shared_u_10.cameraLens.y - camera.z)) : (direction ? 0.0 : typeplot_shared_u_10.cameraLens.y));
  float focal = (1.0 / typeplot_shared_u_10.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + typeplot_shared_u_10.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms typeplot_shared_u_11) {
  vec3 h = homogeneous(p, typeplot_shared_u_11, false);
  return (h.xy / max(h.z, 0.101));
}

float cameraDistance(vec3 p, PlotUniforms typeplot_shared_u_12) {
  return (typeplot_shared_u_12.cameraLens.y - cameraPoint(p, typeplot_shared_u_12).z);
}

bool inFront(vec3 p, PlotUniforms typeplot_shared_u_13) {
  return ((typeplot_shared_u_13.view3d != 2u) || (cameraDistance(p, typeplot_shared_u_13) >= 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, PlotUniforms typeplot_shared_u_15) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 origin = homogeneous(_cse0, typeplot_shared_u_15, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_15, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(_cse0, typeplot_shared_u_15)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  vec3 transverse = (vec3(1.0, 1.0, 1.0) - axis);
  vec3 a = (ray.origin * transverse);
  vec3 b = (ray.direction * transverse);
  float depth = ((-dot(a, b)) / max(dot(b, b), 1e-20));
  return (((typeplot_shared_u_15.view3d != 2u) || (depth >= 0.101)) ? distanceCoverage(distance, typeplot_shared_u_15.appearance.x) : 0.0);
}

float groundField(ViewRay ray, PlotUniforms typeplot_shared_u_16, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  vec2 _licm2 = vec2(2.0, 2.0);
  vec2 _licm3 = vec2(6.0, 6.0);
  float _licm4 = typeplot_shared_u_16.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = max(vec2(length(vec2(dFdx(ground.x), dFdy(ground.x))), length(vec2(dFdx(ground.y), dFdy(ground.y)))), vec2(1e-20, 1e-20));
  float field = 0.0;
  float _cse1 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm2, _licm3, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm4) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm4) * fade.y) * weights.y)));
  }
  return (((((typeplot_shared_u_16.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((typeplot_shared_u_16.decorations & 1u) != 0u)) ? (field * typeplot_shared_u_16.decorationOpacity.x) : 0.0);
}

float axisParameter(vec2 pixel, vec3 axis, PlotUniforms typeplot_shared_u_17) {
  vec3 origin = homogeneous(vec3(0.0, 0.0, 0.0), typeplot_shared_u_17, false);
  vec3 direction = homogeneous(axis, typeplot_shared_u_17, true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

PlotViewport PlotUniforms_as_PlotViewport(PlotUniforms value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

vec3 spatialLevels(vec3 axis, PlotUniforms typeplot_shared_u_18) {
  float center = axisParameter((plotSize(typeplot_shared_u_18.resolution) * 0.5), axis, typeplot_shared_u_18);
  float span = max(typeplot_shared_u_18.plotSpan.x, typeplot_shared_u_18.plotSpan.y);
  float h = (span * 0.001);
  vec2 tangent = ((project((axis * (center + h)), typeplot_shared_u_18) - project((axis * (center - h)), typeplot_shared_u_18)) / (2.0 * h));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  return axisLevels(center, span, pixels, horizontal, PlotUniforms_as_PlotViewport(typeplot_shared_u_18));
}

vec4 spatialTicks(vec2 pixel, vec3 axis, vec3 levels, float priority, PlotUniforms typeplot_shared_u_19) {
  float _licm0 = levels.x;
  float _licm1 = levels.y;
  bool _licm2 = (typeplot_shared_u_19.appearance.x > 0.0);
  float _licm3 = typeplot_shared_u_19.appearance.x;
  float _licm4 = (levels.x * 0.001);
  float _licm5 = ((axis.x > 0.0) ? 1.0 : 0.0);
  float _licm6 = typeplot_shared_u_19.labelStyle.y;
  float _licm7 = typeplot_shared_u_19.labelStyle.z;
  float _licm8 = typeplot_shared_u_19.decorationOpacity.y;
  vec2 size = plotSize(typeplot_shared_u_19.resolution);
  float fontSize = typeplot_shared_u_19.appearance.w;
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 originH = homogeneous(_cse0, typeplot_shared_u_19, false);
  vec3 directionH = homogeneous(axis, typeplot_shared_u_19, true);
  vec3 axisLine = cross(originH, directionH);
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > ((fontSize * 6.0) + 12.0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float sign = ((axis.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  float value = axisParameter(pixel, axis, typeplot_shared_u_19);
  vec3 labels = _cse0;
  float ticks = 0.0;
  bool _cse1 = ((typeplot_shared_u_19.decorations & 2u) != 0u);
  float _cse2 = (((_licm3 * 0.5) + 4.0) + pixelWidth());
  for (int index = 0; (index < 6); index = (index + 1)) {
    bool _gv0 = (index < 3);
    float stride = (_gv0 ? _licm0 : _licm1);
    float nearest = (floor(((value / stride) + 0.5)) * stride);
    float t = (nearest + (float((_irem(index, 3) - 1)) * stride));
    vec3 world = (axis * t);
    if (inFront(world, typeplot_shared_u_19)) {
      vec2 at = project(world, typeplot_shared_u_19);
      vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
      vec2 delta = (pixel - anchor);
      bool nearLabel = (((_cse1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= (((-fontSize) * 1.5) - 3.0))) && (delta.y <= 3.0));
      bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2(_cse2, _cse2))));
      if (((nearLabel == false) && (nearTick == false))) {
        continue;
      }
      vec2 before = project((axis * (t - stride)), typeplot_shared_u_19);
      vec2 after = project((axis * (t + stride)), typeplot_shared_u_19);
      float width = numberWidth(t, _licm0, fontSize);
      float _lc0 = (width * 0.5);
      float room = min(min(((anchor.x - _lc0) - 3.0), (((size.x - anchor.x) - _lc0) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
      vec2 separation = min(abs((at - before)), abs((after - at)));
      vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
      float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
      float visibility = ((_gv0 ? tickOpacity(t, levels) : coarseTickOpacity(t, levels)) * fit);
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm3) * visibility));
      bool zero = (abs(t) <= _licm4);
      float originDistance = length((at - project(_cse0, typeplot_shared_u_19)));
      float crossing = (zero ? _licm5 : smoothstep((fontSize * 2.0), (fontSize * 4.0), originDistance));
      if (_cse1) {
        labels = max(labels, (((((numberAt(pixel, anchor, t, _licm0, 0.5, fontSize, _licm6, _licm7) * _licm8) * visibility) * smoothstep(0.0, 6.0, room)) * crossing) * priority));
      }
    }
  }
  return vec4(ticks, labels);
}

SpatialDecor spatialBackground(vec2 uv, PlotUniforms typeplot_shared_u_20) {
  vec2 _licm0 = vec2(10.0, 18.0);
  PlotViewport _licm1 = PlotUniforms_as_PlotViewport(typeplot_shared_u_20);
  float _licm2 = typeplot_shared_u_20.decorationOpacity.z;
  vec2 size = plotSize(typeplot_shared_u_20.resolution);
  vec2 pixel = (uv * size);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec3 xLevels = spatialLevels(_cse0, typeplot_shared_u_20);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec3 yLevels = spatialLevels(_cse1, typeplot_shared_u_20);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec3 zLevels = spatialLevels(_cse2, typeplot_shared_u_20);
  ViewRay ray = viewRay(uv, typeplot_shared_u_20);
  float grid = groundField(ray, typeplot_shared_u_20, xLevels, zLevels);
  vec4 xTicks = spatialTicks(pixel, _cse0, xLevels, 1.0, typeplot_shared_u_20);
  vec4 yTicks = spatialTicks(pixel, _cse1, yLevels, 1.0, typeplot_shared_u_20);
  vec2 origin = project(vec3(0.0, 0.0, 0.0), typeplot_shared_u_20);
  vec3 xDirection = homogeneous(_cse0, typeplot_shared_u_20, true);
  vec3 zDirection = homogeneous(_cse2, typeplot_shared_u_20, true);
  vec2 _cse3 = vec2(1e-12, 1e-12);
  vec2 xTangent = normalize(((xDirection.xy - (origin * xDirection.z)) + _cse3));
  vec2 zTangent = normalize(((zDirection.xy - (origin * zDirection.z)) + _cse3));
  float angle = abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x)));
  vec4 zTicks = spatialTicks(pixel, _cse2, zLevels, smoothstep(0.08, 0.25, angle), typeplot_shared_u_20);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse4 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse4, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, typeplot_shared_u_20));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((typeplot_shared_u_20.decorations & 4u) != 0u)) {
    vec2 _cse5 = vec2(18.0, 18.0);
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec3 axis = ((index == 0) ? _cse0 : ((index == 1) ? _cse1 : _cse2));
      vec2 edge = ((index == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
      vec3 world = (axis * axisParameter(edge, axis, typeplot_shared_u_20));
      if (inFront(world, typeplot_shared_u_20)) {
        vec2 at = clamp((project(world, typeplot_shared_u_20) + _licm0), _cse5, (size - _cse5));
        labels = max(labels, (axisLabel(pixel, at, (120 + index), _licm1) * _licm2));
      }
    }
  }
  return SpatialDecor(mix(_cse4, color, typeplot_shared_u_20.sceneOpacity.x), (labels * typeplot_shared_u_20.sceneOpacity.x));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms typeplot_shared_u_26) {
  float _licm0 = typeplot_shared_u_26.surfaceRange.x;
  float _licm1 = typeplot_shared_u_26.surfaceRange.y;
  float _licm2 = (typeplot_shared_u_26.appearance.w * 0.7);
  float _licm3 = ((typeplot_shared_u_26.surfaceRange.y - typeplot_shared_u_26.surfaceRange.x) * 0.5);
  float _licm4 = typeplot_shared_u_26.appearance.w;
  float _licm5 = typeplot_shared_u_26.labelStyle.y;
  if (((typeplot_shared_u_26.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(typeplot_shared_u_26.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(typeplot_shared_u_26.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 labels = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    labels = max(labels, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, labels);
}

vec4 sceneDecorLabels(vec2 uv, PlotUniforms typeplot_shared_u_33, SpatialDecor decor, bool surface) {
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 black = labelColor(_cse0, decor.labels);
  vec3 white = labelColor(vec3(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    black = mix(black, surfaceColorBar(black, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, typeplot_shared_u_33), typeplot_shared_u_33.sceneOpacity.y);
  }
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}

vec4 sceneLabelsReference(vec2 uv, PlotUniforms typeplot_shared_u_35, bool surface) {
  return sceneDecorLabels(uv, typeplot_shared_u_35, spatialBackground(uv, axesUniforms(typeplot_shared_u_35)), surface);
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = sceneLabelsReference(uv, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)), true);
}
`,blocks:{u:"Uniforms",font:"FontUniforms"},samplers:{glyphAtlas:null}},queryLayer:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

layout(std140) uniform PickUniforms {
  vec2 pixel;
  float radius;
} query;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

uvec4 pickSurface_heightField(vec4 position, PlotUniforms typeplot_shared_u_29) {
  vec2 uv = (query.pixel / plotSize(typeplot_shared_u_29.resolution));
  vec2 p = (typeplot_shared_u_29.plotCenter + ((uv - vec2(0.5, 0.5)) * typeplot_shared_u_29.plotSpan));
  SurfaceHit hit = SurfaceHit(vec3(p.x, heightField(p.x, p.y), p.y), 0.0, false);
  if ((typeplot_shared_u_29.view3d != 0u)) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_29);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(p, typeplot_shared_u_29));
  }
  if ((hit.valid == false)) {
    return uvec4(0u, 0u, 0u, 0u);
  }
  return ((position.x < 1.0) ? uvec4(floatBitsToUint(hit.point), 1u) : uvec4(floatBitsToUint(hit.point.y), 0u, 0u, 1u));
}
layout(location = 0) out uvec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = pickSurface_heightField(position, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
}
`,blocks:{u:"Uniforms",query:"PickUniforms"},samplers:{},data:["heights"]},queryLayerReference:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

layout(std140) uniform PickUniforms {
  vec2 pixel;
  float radius;
} query;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

uvec4 pickSurface_heightField(vec4 position, PlotUniforms typeplot_shared_u_29) {
  vec2 uv = (query.pixel / plotSize(typeplot_shared_u_29.resolution));
  vec2 p = (typeplot_shared_u_29.plotCenter + ((uv - vec2(0.5, 0.5)) * typeplot_shared_u_29.plotSpan));
  SurfaceHit hit = SurfaceHit(vec3(p.x, heightField(p.x, p.y), p.y), 0.0, false);
  if ((typeplot_shared_u_29.view3d != 0u)) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_29);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(p, typeplot_shared_u_29));
  }
  if ((hit.valid == false)) {
    return uvec4(0u, 0u, 0u, 0u);
  }
  return ((position.x < 1.0) ? uvec4(floatBitsToUint(hit.point), 1u) : uvec4(floatBitsToUint(hit.point.y), 0u, 0u, 1u));
}
layout(location = 0) out uvec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = pickSurface_heightField(position, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
}
`,blocks:{u:"Uniforms",query:"PickUniforms"},samplers:{},data:["heights"]},pick:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct PlotUniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
};

struct ViewRay {
  vec3 origin;
  vec3 direction;
};

struct SurfaceHit {
  vec3 point;
  float depth;
  bool valid;
};

struct Uniforms_value {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
};
layout(std140) uniform Uniforms {
  vec2 resolution;
  vec2 plotCenter;
  vec2 plotSpan;
  vec2 plotRotation;
  vec4 rotationBasis;
  vec2 plotPan;
  float plotBlend;
  vec4 appearance;
  uint decorations;
  vec4 labelStyle;
  vec3 decorationOpacity;
  mat4 model;
  mat4 inverseModel;
  mat4 axesModel;
  mat4 inverseAxesModel;
  vec2 sceneOpacity;
  vec2 cameraLens;
  float plotCenterZ;
  float probe;
  uint view3d;
  vec2 parameterBounds;
  uint parameterMode;
  uvec2 curveQuality;
  vec4 curvePattern;
  uvec4 curveTiles;
  vec4 surfaceBounds;
  uint surfaceDomainMode;
  vec2 surfaceRange;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  float gridXMin;
  float gridXMax;
  float gridZMin;
  float gridZMax;
  float gridRows;
  float gridColumns;
  float gridCount;
  float heightScale;
  float heightOffset;
} u;

uniform sampler2D heights;

layout(std140) uniform PickUniforms {
  vec2 pixel;
  float radius;
} query;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
uint _udiv(uint a, uint b) {
  return b == 0u ? a : a / b;
}

uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}

uvec2 _f2u(vec2 x) {
  return uvec2(_f2u(x.x), _f2u(x.y));
}
float heightAt(uint column, uint row, uint columns) {
  return _sfetch(heights, int(((row * columns) + column)));
}

float sample_(float x, float z, float gridXMin, float gridXMax, float gridZMin, float gridZMax, float gridRows, float gridColumns, float gridCount, float heightScale, float heightOffset) {
  if ((((((((gridColumns >= 2.0) && (gridColumns <= 4194304.0)) && (gridRows >= 2.0)) && (gridRows <= 4194304.0)) && (gridCount >= 4.0)) && (gridCount <= 4194304.0)) == false)) {
    return 100000000000000000000.0;
  }
  uint columns = _f2u(gridColumns);
  uint rows = _f2u(gridRows);
  if (((((((columns < 2u) || (rows < 2u)) || (columns > 4194304u)) || (rows > 4194304u)) || (columns > _udiv(_f2u(gridCount), rows))) || (((gridXMax > gridXMin) && (gridZMax > gridZMin)) == false))) {
    return 100000000000000000000.0;
  }
  vec2 fraction = vec2(((x - gridXMin) / (gridXMax - gridXMin)), ((z - gridZMin) / (gridZMax - gridZMin)));
  if ((any(lessThan(fraction, vec2(0.0, 0.0))) || any(greaterThan(fraction, vec2(1.0, 1.0))))) {
    return 100000000000000000000.0;
  }
  uint _gv0 = (columns - 1u);
  uint _gv1 = (rows - 1u);
  vec2 coordinate = (fraction * vec2(float(_gv0), float(_gv1)));
  uvec2 low = _f2u(floor(coordinate));
  uvec2 high = min((low + uvec2(1u, 1u)), uvec2(_gv0, _gv1));
  vec2 t = fract(coordinate);
  float a = heightAt(low.x, low.y, columns);
  float b = heightAt(high.x, low.y, columns);
  float c = heightAt(low.x, high.y, columns);
  float d = heightAt(high.x, high.y, columns);
  if ((((((abs(a) < 1000000000000000000.0) && (abs(b) < 1000000000000000000.0)) && (abs(c) < 1000000000000000000.0)) && (abs(d) < 1000000000000000000.0)) == false)) {
    return 100000000000000000000.0;
  }
  return ((mix(mix(a, b, t.x), mix(c, d, t.x), t.y) * heightScale) + heightOffset);
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

vec3 sceneCenter(PlotUniforms typeplot_shared_u_8) {
  return (typeplot_shared_u_8.inverseModel * vec4(typeplot_shared_u_8.plotCenter, typeplot_shared_u_8.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms typeplot_shared_u_9) {
  vec4 basis = typeplot_shared_u_9.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (typeplot_shared_u_9.inverseModel * vec4((q * vec3(typeplot_shared_u_9.plotSpan, max(typeplot_shared_u_9.plotSpan.x, typeplot_shared_u_9.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms typeplot_shared_u_14) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - typeplot_shared_u_14.plotPan);
  vec2 size = plotSize(typeplot_shared_u_14.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * typeplot_shared_u_14.cameraLens.x);
  bool _cse0 = (typeplot_shared_u_14.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, typeplot_shared_u_14.cameraLens.y) : vec3((cameraXY * typeplot_shared_u_14.cameraLens.y), typeplot_shared_u_14.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, typeplot_shared_u_14) + sceneCenter(typeplot_shared_u_14)), inverseCamera(direction, typeplot_shared_u_14));
}

bool surfaceInside(vec2 p, PlotUniforms typeplot_shared_u_24) {
  return ((((((typeplot_shared_u_24.surfaceDomainMode & 1u) == 0u) || (p.x >= typeplot_shared_u_24.surfaceBounds.x)) && (((typeplot_shared_u_24.surfaceDomainMode & 2u) == 0u) || (p.x <= typeplot_shared_u_24.surfaceBounds.z))) && (((typeplot_shared_u_24.surfaceDomainMode & 4u) == 0u) || (p.y >= typeplot_shared_u_24.surfaceBounds.y))) && (((typeplot_shared_u_24.surfaceDomainMode & 8u) == 0u) || (p.y <= typeplot_shared_u_24.surfaceBounds.w)));
}

float heightField(float x, float z) {
  return sample_(x, z, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset);
}

SurfaceHit surfaceHit_heightField(vec2 uv, PlotUniforms typeplot_shared_u_25) {
  float _licm0 = typeplot_shared_u_25.surfaceBounds.x;
  float _licm1 = typeplot_shared_u_25.surfaceBounds.y;
  float _licm2 = typeplot_shared_u_25.surfaceBounds.z;
  float _licm3 = typeplot_shared_u_25.surfaceBounds.w;
  uint _licm4 = typeplot_shared_u_25.surfaceDomainMode;
  uint _licm5 = ((typeplot_shared_u_25.curveQuality.y * 2u) + 8u);
  float _licm6 = max(0.00001, (max(typeplot_shared_u_25.plotSpan.x, typeplot_shared_u_25.plotSpan.y) * 0.0001));
  ViewRay ray = viewRay(uv, typeplot_shared_u_25);
  float near = typeplot_shared_u_25.surfaceDepth.x;
  float far = typeplot_shared_u_25.surfaceDepth.y;
  SurfaceHit _cse0 = SurfaceHit(vec3(0.0, 0.0, 0.0), 0.0, false);
  for (int axis = 0; (axis < 2); axis = (axis + 1)) {
    bool _gv0 = (axis == 0);
    float origin = (_gv0 ? ray.origin.x : ray.origin.z);
    float direction = (_gv0 ? ray.direction.x : ray.direction.z);
    float lower = (_gv0 ? _licm0 : _licm1);
    float upper = (_gv0 ? _licm2 : _licm3);
    uint lowerFlag = (_gv0 ? 1u : 4u);
    uint upperFlag = (lowerFlag * 2u);
    if ((abs(direction) < 1e-20)) {
      if (((((_licm4 & lowerFlag) != 0u) && (origin < lower)) || (((_licm4 & upperFlag) != 0u) && (origin > upper)))) {
        return _cse0;
      }
    } else {
      if (((_licm4 & lowerFlag) != 0u)) {
        float at = ((lower - origin) / direction);
        if ((direction > 0.0)) {
          near = max(near, at);
        } else {
          far = min(far, at);
        }
      }
      if (((_licm4 & upperFlag) != 0u)) {
        float at_1 = ((upper - origin) / direction);
        if ((direction > 0.0)) {
          far = min(far, at_1);
        } else {
          near = max(near, at_1);
        }
      }
    }
  }
  if ((far < near)) {
    return _cse0;
  }
  float previous = near;
  vec3 first = (ray.origin + (ray.direction * near));
  float before = (first.y - heightField(first.x, first.z));
  uint count = max(16u, typeplot_shared_u_25.curveQuality.x);
  for (uint i = 1u; (i <= count); i = (i + 1u)) {
    float at_2 = mix(near, far, (float(i) / float(count)));
    vec3 p = (ray.origin + (ray.direction * at_2));
    float value = (p.y - heightField(p.x, p.z));
    if ((((abs(value) < 1000000000000000000.0) && (abs(before) < 1000000000000000000.0)) && ((((value >= 0.0) != (before >= 0.0)) || (value == 0.0)) || (before == 0.0)))) {
      float low = previous;
      float high = at_2;
      float residual = before;
      for (uint iteration = 0u; (iteration < _licm5); iteration = (iteration + 1u)) {
        float middle = ((low + high) * 0.5);
        vec3 point = (ray.origin + (ray.direction * middle));
        float typeplot_shared_sample = (point.y - heightField(point.x, point.z));
        if (((abs(typeplot_shared_sample) < 1000000000000000000.0) == false)) {
          break;
        }
        if (((typeplot_shared_sample >= 0.0) == (residual >= 0.0))) {
          low = middle;
          residual = typeplot_shared_sample;
        } else {
          high = middle;
        }
      }
      float depth = ((low + high) * 0.5);
      vec3 point_1 = (ray.origin + (ray.direction * depth));
      float typeplot_shared_sample_2 = heightField(point_1.x, point_1.z);
      if ((((abs(typeplot_shared_sample_2) < 1000000000000000000.0) && (abs((point_1.y - typeplot_shared_sample_2)) <= _licm6)) && surfaceInside(point_1.xz, typeplot_shared_u_25))) {
        return SurfaceHit(vec3(point_1.x, typeplot_shared_sample_2, point_1.z), depth, true);
      }
    }
    before = value;
    previous = at_2;
  }
  return _cse0;
}

PlotUniforms Uniforms_as_PlotUniforms(Uniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

uvec4 pickSurface_heightField(vec4 position, PlotUniforms typeplot_shared_u_29) {
  vec2 uv = (query.pixel / plotSize(typeplot_shared_u_29.resolution));
  vec2 p = (typeplot_shared_u_29.plotCenter + ((uv - vec2(0.5, 0.5)) * typeplot_shared_u_29.plotSpan));
  SurfaceHit hit = SurfaceHit(vec3(p.x, heightField(p.x, p.y), p.y), 0.0, false);
  if ((typeplot_shared_u_29.view3d != 0u)) {
    hit = surfaceHit_heightField(uv, typeplot_shared_u_29);
  } else {
    hit.valid = ((abs(hit.point.y) < 1000000000000000000.0) && surfaceInside(p, typeplot_shared_u_29));
  }
  if ((hit.valid == false)) {
    return uvec4(0u, 0u, 0u, 0u);
  }
  return ((position.x < 1.0) ? uvec4(floatBitsToUint(hit.point), 1u) : uvec4(floatBitsToUint(hit.point.y), 0u, 0u, 1u));
}
layout(location = 0) out uvec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = pickSurface_heightField(position, Uniforms_as_PlotUniforms(Uniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.gridXMin, u.gridXMax, u.gridZMin, u.gridZMax, u.gridRows, u.gridColumns, u.gridCount, u.heightScale, u.heightOffset)));
}
`,blocks:{u:"Uniforms",query:"PickUniforms"},samplers:{},data:["heights"]}}}},i={gridXMin:0,gridXMax:1,gridZMin:0,gridZMax:1,gridRows:2,gridColumns:2,gridCount:4,heightScale:1,heightOffset:0},l="projective",r="transform-v1",s="layers-v1",c="surface-v1",p="point-v1",u={version:t,kind:a,manifest:o,parameters:i,camera:l,scene:r,composition:s,acceleration:c,picking:p};export{c as acceleration,l as camera,s as composition,u as default,a as kind,o as manifest,i as parameters,p as picking,r as scene,t as version};
