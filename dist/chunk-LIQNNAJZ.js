var d={schema:2,compiler:"0.1.0",wgsl:`struct FontUniforms {
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
  parameterFocusSeed: f32,
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

struct ViewRay {
  origin: vec3<f32>,
  direction: vec3<f32>,
}

struct WideNumberFormat {
  value: vec2<f32>,
  negative: bool,
  scientific: bool,
  decimals: i32,
  digits: i32,
  exponent: i32,
  length: i32,
}

struct CoordinateUniforms {
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
  parameterFocusSeed: f32,
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
  axesOrigin: DF64Vec3,
}

struct SpatialDecor {
  color: vec3<f32>,
  labels: vec3<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

struct DF64Vec3 {
  hi: vec3<f32>,
  lo: vec3<f32>,
}

@group(0) @binding(0) var<uniform> u: CoordinateUniforms;
@group(0) @binding(1) var spatialLabels: texture_2d<u32>;
@group(0) @binding(2) var glyphAtlas: texture_2d<f32>;
@group(0) @binding(3) var<uniform> font: FontUniforms;
@group(0) @binding(4) var _fp64: texture_2d<f32>;

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

fn axisLabel(pixel: vec2<f32>, at: vec2<f32>, code: i32, plot_u: PlotViewport) -> vec3<f32> {
  let _cse0 = (((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any((abs((pixel - at)) > vec2<f32>(_cse0, _cse0)))) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  let local = vec2<f32>((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3<f32>(glyphLayers((local + vec2<f32>((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
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

fn numberAt(pixel: vec2<f32>, anchor: vec2<f32>, value: f32, spacing: f32, align: f32, size: f32, halo: f32, plate: f32) -> vec3<f32> {
  let delta = vec2<f32>((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  return vec3<f32>(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

fn labelColor(color: vec3<f32>, plot_labels: vec3<f32>) -> vec3<f32> {
  let plated = mix(color, vec3<f32>(0.995, 0.995, 0.995), (plot_labels.z * 0.94));
  return mix(mix(plated, vec3<f32>(0.965, 0.973, 0.985), plot_labels.y), vec3<f32>(0.25, 0.29, 0.35), plot_labels.x);
}

fn basisVector(p: vec3<f32>, plot_u_2: PlotUniforms) -> vec3<f32> {
  let span = max(plot_u_2.plotSpan, vec2<f32>(0.00001, 0.00001));
  let q = (p / vec3<f32>(span, max(span.x, span.y)));
  let basis = plot_u_2.rotationBasis;
  let horizontal = ((q.x * basis.y) + (q.z * basis.x));
  let depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3<f32>(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

fn cameraPoint(p: vec3<f32>, plot_u_3: PlotUniforms) -> vec3<f32> {
  return basisVector(((plot_u_3.model * vec4<f32>(p, 1.0)).xyz - vec3<f32>(plot_u_3.plotCenter, plot_u_3.plotCenterZ)), plot_u_3);
}

fn cameraVector(p: vec3<f32>, plot_u_4: PlotUniforms) -> vec3<f32> {
  return basisVector((plot_u_4.model * vec4<f32>(p, 0.0)).xyz, plot_u_4);
}

fn sceneCenter(plot_u_5: PlotUniforms) -> vec3<f32> {
  return (plot_u_5.inverseModel * vec4<f32>(plot_u_5.plotCenter, plot_u_5.plotCenterZ, 1.0)).xyz;
}

fn inverseCamera(p: vec3<f32>, plot_u_6: PlotUniforms) -> vec3<f32> {
  let basis = plot_u_6.rotationBasis;
  let y = ((p.y * basis.w) + (p.z * basis.z));
  let depth = (((-p.y) * basis.z) + (p.z * basis.w));
  let q = vec3<f32>(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (plot_u_6.inverseModel * vec4<f32>((q * vec3<f32>(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

fn homogeneous(p: vec3<f32>, plot_u_7: PlotUniforms, direction: bool) -> vec3<f32> {
  let size = plotSize(plot_u_7.resolution);
  let camera = select(cameraPoint(p, plot_u_7), cameraVector(p, plot_u_7), direction);
  let w = select(select(plot_u_7.cameraLens.y, 0.0, direction), select((plot_u_7.cameraLens.y - camera.z), (-camera.z), direction), (plot_u_7.view3d == 2u));
  let focal = (1.0 / plot_u_7.cameraLens.x);
  return vec3<f32>((((vec2<f32>((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2<f32>(0.5, 0.5) + plot_u_7.plotPan) * w)) * size), w);
}

fn project(p: vec3<f32>, plot_u_8: PlotUniforms) -> vec2<f32> {
  let h = homogeneous(p, plot_u_8, false);
  return (h.xy / max(h.z, 0.101));
}

fn viewRay(uv: vec2<f32>, plot_u_9: PlotUniforms) -> ViewRay {
  let screen = ((uv - vec2<f32>(0.5, 0.5)) - plot_u_9.plotPan);
  let size = plotSize(plot_u_9.resolution);
  let cameraXY = (vec2<f32>((screen.x * (size.x / size.y)), screen.y) * plot_u_9.cameraLens.x);
  let _cse0 = (plot_u_9.view3d == 2u);
  let origin = select(vec3<f32>((cameraXY * plot_u_9.cameraLens.y), plot_u_9.cameraLens.y), vec3<f32>(0.0, 0.0, plot_u_9.cameraLens.y), _cse0);
  let direction = select(vec3<f32>(0.0, 0.0, -1.0), vec3<f32>(cameraXY, -1.0), _cse0);
  return ViewRay((inverseCamera(origin, plot_u_9) + sceneCenter(plot_u_9)), inverseCamera(direction, plot_u_9));
}

fn surfaceColorBar(color: vec3<f32>, uv: vec2<f32>, plot_u_10: PlotUniforms) -> vec3<f32> {
  let _licm0 = plot_u_10.surfaceRange.x;
  let _licm1 = plot_u_10.surfaceRange.y;
  let _licm2 = (plot_u_10.appearance.w * 0.7);
  let _licm3 = ((plot_u_10.surfaceRange.y - plot_u_10.surfaceRange.x) * 0.5);
  let _licm4 = plot_u_10.appearance.w;
  let _licm5 = plot_u_10.labelStyle.y;
  if (((plot_u_10.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  let size = plotSize(plot_u_10.resolution);
  let pixel = (uv * size);
  let height = min(160.0, (size.y * 0.36));
  let lower = vec2<f32>((size.x - 25.0), ((size.y - 70.0) - height));
  let upper = (lower + vec2<f32>(10.0, height));
  let q = max((lower - pixel), (pixel - upper));
  let distance = max(q.x, q.y);
  let coverage = distanceCoverage(max(0.0, distance), 1.2);
  let t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  var result: vec3<f32> = mix(color, colorMap(t, u32(plot_u_10.surfaceRender.x)), coverage);
  let border = max(stroke(pixel, lower, vec2<f32>(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2<f32>(upper.x, lower.y), 0.7));
  result = mix(result, vec3<f32>(0.3, 0.3, 0.3), border);
  var plot_labels_2: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  for (var index: i32 = 0; (index < 3); index = (index + 1)) {
    let fraction = (f32(index) * 0.5);
    let value = mix(_licm0, _licm1, fraction);
    let at = vec2<f32>((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    plot_labels_2 = max(plot_labels_2, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, plot_labels_2);
}

fn widePower(exponent: i32) -> vec2<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _licm0 = min(abs(exponent), 32);
  let _licm1 = vec2<f32>(10.0, 0.0);
  let _cse0 = vec2<f32>(1.0, 0.0);
  var value: vec2<f32> = _cse0;
  for (var i: i32 = 0; (i < _licm0); i = (i + 1)) {
    value = df64_mul(value, _licm1, _fp64_g);
  }
  let _cse2 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse1 = vec2<f32>(_cse2, _cse2);
  return select(value, df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g), (exponent < 0));
}

fn wideGridSpacing(step: f32) -> vec2<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let exponent = i32(floor((log2(max(step, 1e-30)) / log2(10.0))));
  let multiplier = round((step / pow(10.0, f32(exponent))));
  return df64_mul(vec2<f32>(multiplier, 0.0), widePower(exponent), _fp64_g);
}

fn wideDigit(value: vec2<f32>, exponent: i32) -> i32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse0 = vec2<f32>(0.25, 0.0);
  let _cse3 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse1 = vec2<f32>(_cse3, _cse3);
  let integer = df64_floor(df64_div(df64_add(value, _cse0, _fp64_g), df64_add(widePower(exponent), _cse1, _fp64_g), _fp64_g), _fp64_g);
  let _cse2 = vec2<f32>(10.0, 0.0);
  return i32(df64_narrow(df64_sub(df64_add(integer, _cse1, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(integer, _cse0, _fp64_g), df64_add(_cse2, _cse1, _fp64_g), _fp64_g), _fp64_g), _cse2, _fp64_g), _fp64_g)));
}

fn wideNumberFormat(input: vec2<f32>, spacing: f32) -> WideNumberFormat {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse6 = bitcast<f32>(bitcast<u32>(0.0));
  let _licm0 = vec2<f32>(_cse6, _cse6);
  let _licm1 = vec2<f32>(10.0, 0.0);
  let _licm2 = vec2<f32>(0.009999999776482582, 2.2351741291171123e-10);
  let _cse0 = vec2<f32>(0.0, 0.0);
  let _cse7 = abs(spacing);
  let value = select(input, _cse0, df64_lt(df64_abs(input), vec2<f32>((_cse7 * 0.0001), 0.0)));
  var magnitude: vec2<f32> = df64_abs(value);
  let _cse1 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse1)));
  let _gv0 = df64_gt(magnitude, _cse0);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  let scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  let _cse2 = log2(max(_cse7, 1e-30));
  var decimals: i32 = i32(clamp(ceil(((-_cse2) / _cse1)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  var digits: i32 = 1;
  let _cse3 = vec2<f32>(0.5, 0.0);
  let _cse4 = vec2<f32>(0.25, 0.0);
  if (scientific) {
    decimals = i32(clamp(ceil((f32(exponent) - (_cse2 / _cse1))), 0.0, 12.0));
    let scale = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(df64_div(df64_add(magnitude, _licm0, _fp64_g), df64_add(widePower(exponent), _licm0, _fp64_g), _fp64_g), scale, _fp64_g), _cse3, _fp64_g), _fp64_g);
    if (df64_ge(magnitude, df64_mul(_licm1, scale, _fp64_g))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    let _gv1 = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(magnitude, _gv1, _fp64_g), _cse3, _fp64_g), _fp64_g);
    let integral = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), df64_add(_gv1, _licm0, _fp64_g), _fp64_g), _fp64_g);
    digits = max(1, (exponent + 1));
    if (df64_ge(integral, widePower(digits))) {
      digits += 1;
    }
    if (((digits > 1) && df64_lt(integral, widePower((digits - 1))))) {
      digits -= 1;
    }
  }
  let _cse5 = df64_add(_licm1, _licm0, _fp64_g);
  for (var i: i32 = 0; (i < 13); i = (i + 1)) {
    if (((decimals > 0) && df64_lt(df64_abs(df64_sub(df64_add(magnitude, _licm0, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g), _licm1, _fp64_g), _fp64_g)), _licm2))) {
      magnitude = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g);
      decimals -= 1;
    }
  }
  let negative = df64_lt(value, _cse0);
  let length = select(((digits + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), ((5 + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), scientific);
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

fn wideNumberGlyph(n: WideNumberFormat, column: i32) -> i32 {
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
      return (48 + wideDigit(n.value, (n.decimals - digit)));
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
  return (48 + wideDigit(n.value, (((n.digits + n.decimals) - digit_1) - 1)));
}

fn wideTickNumberLayers(p: vec2<f32>, value: vec2<f32>, spacing: f32, align: f32, fontSize: f32, halo: f32) -> vec2<f32> {
  let _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2<f32>((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2<f32>(100000.0, 0.0)))) {
    return tickNumberLayers(p, df64_narrow(value), spacing, align, fontSize, halo);
  }
  let n = wideNumberFormat(value, spacing);
  let advance = (fontSize * 0.625);
  let offset = (p + vec2<f32>(((f32(n.length) * advance) * align), 0.0));
  let _cse1 = vec2<f32>(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse1;
  }
  let column = i32(floor((offset.x / advance)));
  let atlasBearing = (fontSize * 0.125);
  var coverage: vec2<f32> = _cse1;
  for (var neighbor: i32 = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    let index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      let local = vec2<f32>(((offset.x - (f32(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

fn wideNumberWidth(value: vec2<f32>, spacing: f32, size: f32) -> f32 {
  let _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2<f32>((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2<f32>(100000.0, 0.0)))) {
    return numberWidth(df64_narrow(value), spacing, size);
  }
  return ((f32(wideNumberFormat(value, spacing).length) * size) * 0.625);
}

fn wideNumberPlate(p: vec2<f32>, value: vec2<f32>, spacing: f32, align: f32, size: f32) -> f32 {
  let _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2<f32>((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2<f32>(100000.0, 0.0)))) {
    return numberPlate(p, df64_narrow(value), spacing, align, size);
  }
  let width = wideNumberWidth(value, spacing, size);
  let center = vec2<f32>((width * (0.5 - align)), (size * 0.76));
  let half = vec2<f32>(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  let q = ((abs((p - center)) - half) + vec2<f32>(3.0, 3.0));
  let distance = ((length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  let aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

fn loadLabels(at: vec2<i32>) -> vec4<f32> {
  return bitcast<vec4<f32>>(textureLoad(spatialLabels, at, 0u));
}

fn axisBase(axis: vec3<f32>, u: CoordinateUniforms) -> vec2<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2<f32>(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2<f32>(axis.x, 0.0), _fp64_g), df64_mul(vec2<f32>(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2<f32>(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2<f32>(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2<f32>(axis.z, 0.0), _fp64_g), _fp64_g);
}

fn CoordinateUniforms_as_PlotUniforms(value: CoordinateUniforms) -> PlotUniforms {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

fn axisOriginH(axis: vec3<f32>, u: CoordinateUniforms) -> vec3<f32> {
  let local = vec3<f32>((df64_narrow((-vec2<f32>(u.axesOrigin.hi.x, u.axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2<f32>(u.axesOrigin.hi.y, u.axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2<f32>(u.axesOrigin.hi.z, u.axesOrigin.lo.z))) * (1.0 - axis.z)));
  let camera = cameraVector(local, CoordinateUniforms_as_PlotUniforms(u));
  let size = plotSize(u.resolution);
  let w = select(u.cameraLens.y, (u.cameraLens.y - camera.z), (u.view3d == 2u));
  return vec3<f32>((((vec2<f32>((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2<f32>(0.5, 0.5) + u.plotPan) * w)) * size), w);
}

fn axisH(value: f32, axis: vec3<f32>, u: CoordinateUniforms) -> vec3<f32> {
  return (axisOriginH(axis, u) + (homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true) * value));
}

fn projectAxis(value: f32, axis: vec3<f32>, u: CoordinateUniforms) -> vec2<f32> {
  let at = axisH(value, axis, u);
  return (at.xy / max(at.z, 0.101));
}

fn axisVisible(value: f32, axis: vec3<f32>, u: CoordinateUniforms) -> bool {
  return ((u.view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
}

fn wideWeight(value: vec2<f32>, levels: vec3<f32>, coarse: bool) -> f32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse1 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse0 = vec2<f32>(_cse1, _cse1);
  let multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing(select(levels.y, levels.x, coarse)), _cse0, _fp64_g), _fp64_g);
  let shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2<f32>(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2<f32>(0.0010000000474974513, -4.7497450417210985e-11));
  return select(select(levels.z, (1.0 - levels.z), coarse), 1.0, shared_);
}

fn wideNumberAt(pixel: vec2<f32>, anchor: vec2<f32>, value: vec2<f32>, spacing: f32, align: f32, size: f32, halo: f32, plate: f32) -> vec3<f32> {
  let delta = vec2<f32>((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3<f32>(0.0, 0.0, 0.0);
  }
  return vec3<f32>(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

fn axisField(pixel: vec2<f32>, axis: vec3<f32>, ray: ViewRay, u: CoordinateUniforms) -> f32 {
  let origin = axisOriginH(axis, u);
  let _cse0 = CoordinateUniforms_as_PlotUniforms(u);
  let direction = homogeneous(axis, _cse0, true);
  let coefficients = cross(origin, direction);
  let magnitude = length(coefficients.xy);
  var distance: f32 = length((pixel - project(vec3<f32>(0.0, 0.0, 0.0), _cse0)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3<f32>(pixel, 1.0))) / magnitude);
  }
  return select(0.0, distanceCoverage(distance, u.appearance.x), axisVisible(axisParameter(pixel, axis, u), axis, u));
}

fn groundFieldNarrow(ray: ViewRay, u: CoordinateUniforms, xLevels: vec3<f32>, zLevels: vec3<f32>) -> f32 {
  let _licm0 = vec2<f32>(xLevels.x, zLevels.x);
  let _licm1 = vec2<f32>(xLevels.y, zLevels.y);
  let _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  let _licm3 = u.appearance.y;
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
    let _lc0 = (12.0 / _licm2);
    let _lc1 = (28.0 / _licm2);
    let fade = smoothstep(vec2<f32>(_lc0, _lc0), vec2<f32>(_lc1, _lc1), separation);
    let nearest = (floor(_gv1) * spacing);
    let weights = select(vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)), vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)), _gv0);
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return select(0.0, (field * u.decorationOpacity.x), ((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)));
}

fn groundField(uv: vec2<f32>, ray: ViewRay, u: CoordinateUniforms, xLevels: vec3<f32>, zLevels: vec3<f32>) -> f32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _licm0 = vec2<f32>(xLevels.x, zLevels.x);
  let _licm1 = vec2<f32>(xLevels.y, zLevels.y);
  let _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  let _licm3 = u.appearance.y;
  let _cse0 = vec2<f32>(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  let _cse1 = vec2<f32>(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  let _cse2 = vec2<f32>(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2<f32>((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow(ray, u, xLevels, zLevels);
  }
  let screen = ((uv - vec2<f32>(0.5, 0.5)) - u.plotPan);
  let size = plotSize(u.resolution);
  let xy = (vec2<f32>((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  let eye = select(vec3<f32>((xy * u.cameraLens.y), u.cameraLens.y), vec3<f32>(0.0, 0.0, u.cameraLens.y), (u.view3d == 2u));
  let offset = inverseCamera(eye, CoordinateUniforms_as_PlotUniforms(u));
  let _cse3 = abs(ray.direction.y);
  let denominator = select(ray.direction.y, select(1e-8, -1e-8, (ray.direction.y < 0.0)), (_cse3 < 1e-8));
  let _cse7 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse4 = vec2<f32>(_cse7, _cse7);
  let depth = df64_div(df64_add((-df64_add(_cse1, vec2<f32>(offset.y, 0.0), _fp64_g)), _cse4, _fp64_g), df64_add(vec2<f32>(denominator, 0.0), _cse4, _fp64_g), _fp64_g);
  let gx = df64_add(df64_add(_cse0, vec2<f32>(offset.x, 0.0), _fp64_g), df64_mul(vec2<f32>(ray.direction.x, 0.0), depth, _fp64_g), _fp64_g);
  let gz = df64_add(df64_add(_cse2, vec2<f32>(offset.z, 0.0), _fp64_g), df64_mul(vec2<f32>(ray.direction.z, 0.0), depth, _fp64_g), _fp64_g);
  let high = vec2<f32>(df64_narrow(gx), df64_narrow(gz));
  let _gv0 = df64_add(gx, _cse4, _fp64_g);
  let _gv1 = df64_add(gz, _cse4, _fp64_g);
  let low = vec2<f32>(df64_narrow(df64_sub(_gv0, df64_add(vec2<f32>(high.x, 0.0), _cse4, _fp64_g), _fp64_g)), df64_narrow(df64_sub(_gv1, df64_add(vec2<f32>(high.y, 0.0), _cse4, _fp64_g), _fp64_g)));
  let dx = (dpdx(high) + dpdx(low));
  let dy = (dpdy(high) + dpdy(low));
  let gradient = max(vec2<f32>(length(vec2<f32>(dx.x, dy.x)), length(vec2<f32>(dx.y, dy.y))), vec2<f32>(1e-20, 1e-20));
  var field: f32 = 0.0;
  let _cse5 = vec2<f32>(0.5, 0.0);
  let _cse6 = pixelWidth();
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let spacing = select(_licm1, _licm0, (level == 0));
    let sx = wideGridSpacing(spacing.x);
    let sz = wideGridSpacing(spacing.y);
    let _gv2 = df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    let _gv3 = df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    let phase = (vec2<f32>(df64_narrow(df64_fract(_gv2, _fp64_g)), df64_narrow(df64_fract(_gv3, _fp64_g))) - 0.5);
    let distance = (((abs(phase) * spacing) / gradient) * _cse6);
    let separation = ((spacing / gradient) * _cse6);
    let _lc0 = (12.0 / _licm2);
    let _lc1 = (28.0 / _licm2);
    let fade = smoothstep(vec2<f32>(_lc0, _lc0), vec2<f32>(_lc1, _lc1), separation);
    let nx = df64_mul(df64_floor(_gv2, _fp64_g), sx, _fp64_g);
    let nz = df64_mul(df64_floor(_gv3, _fp64_g), sz, _fp64_g);
    let _lc2 = (level != 0);
    let weights = vec2<f32>(wideWeight(nx, xLevels, _lc2), wideWeight(nz, zLevels, _lc2));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return select(0.0, (field * u.decorationOpacity.x), ((((u.view3d != 2u) || df64_ge(depth, vec2<f32>(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)));
}

fn axisParameter(pixel: vec2<f32>, axis: vec3<f32>, u: CoordinateUniforms) -> f32 {
  let origin = axisOriginH(axis, u);
  let direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  let line = cross(origin, direction);
  let foot = (pixel - ((line.xy * dot(line, vec3<f32>(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  let slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

fn spatialLevels(axis: vec3<f32>, u: CoordinateUniforms) -> vec3<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let center = axisParameter((plotSize(u.resolution) * 0.5), axis, u);
  let span = max(u.plotSpan.x, u.plotSpan.y);
  let at = axisH(center, axis, u);
  let direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  let tangent = (((direction.xy * at.z) - (at.xy * direction.z)) / max((at.z * at.z), 1e-20));
  let pixels = max((length(tangent) * span), 1.0);
  let horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  let absolute = df64_add(axisBase(axis, u), vec2<f32>(center, 0.0), _fp64_g);
  let rough = (((span * u.appearance.w) * 4.0) / pixels);
  let _cse1 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse0 = vec2<f32>(_cse1, _cse1);
  let _lc0 = vec2<f32>((span * 0.5), 0.0);
  let width = max(wideNumberWidth(df64_sub(df64_add(absolute, _cse0, _fp64_g), df64_add(_lc0, _cse0, _fp64_g), _fp64_g), rough, u.appearance.w), wideNumberWidth(df64_add(absolute, _lc0, _fp64_g), rough, u.appearance.w));
  let gap = select((u.appearance.w * 2.6), max((u.appearance.w * 3.5), (width + (u.appearance.w * 1.3))), horizontal);
  return tickLevels(((span * gap) / max((pixels * u.labelStyle.x), 1.0)));
}

fn prepareSpatialLabels(position: vec4<f32>, u: CoordinateUniforms) -> vec4<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let row = i32(position.y);
  let column = i32(position.x);
  let size = plotSize(u.resolution);
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
      return vec4<f32>(spatialLevels(axis, u), 1.0);
    }
    let edge = select(vec2<f32>((size.x - 30.0), (size.y * 0.5)), vec2<f32>((size.x * 0.5), (size.y - 30.0)), (column == 1));
    let t = axisParameter(edge, axis, u);
    let _cse4 = vec2<f32>(18.0, 18.0);
    let at = clamp((projectAxis(t, axis, u) + vec2<f32>(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4<f32>(at, f32((120 + column)), select(0.0, 1.0, axisVisible(t, axis, u)));
  }
  let axisIndex = (row / 12);
  let candidate = ((row / 2) % 6);
  let axis_1 = select(select(_cse3, _cse2, (axisIndex == 1)), _cse1, (axisIndex == 0));
  let originH = axisOriginH(axis_1, u);
  let _cse8 = CoordinateUniforms_as_PlotUniforms(u);
  let axisLine = cross(originH, homogeneous(axis_1, _cse8, true));
  let magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  let normal = (axisLine.xy / magnitude);
  let tangent = vec2<f32>(normal.y, (-normal.x));
  let extent = dot(abs(tangent), size);
  let low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  let along = (low + ((position.x / f32(u.curveTiles.w)) * extent));
  let foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  let levels = spatialLevels(axis_1, u);
  let _gv0 = (candidate < 3);
  let stride = select(levels.y, levels.x, _gv0);
  let _gv1 = axisBase(axis_1, u);
  let absolute = df64_add(_gv1, vec2<f32>(axisParameter(foot, axis_1, u), 0.0), _fp64_g);
  let _cse9 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse5 = vec2<f32>(_cse9, _cse9);
  let _lc0 = wideGridSpacing(stride);
  let number = df64_mul(df64_add(df64_floor(df64_add(df64_div(df64_add(absolute, _cse5, _fp64_g), df64_add(_lc0, _cse5, _fp64_g), _fp64_g), vec2<f32>(0.5, 0.0), _fp64_g), _fp64_g), vec2<f32>(f32(((candidate % 3) - 1)), 0.0), _fp64_g), _lc0, _fp64_g);
  let t_1 = df64_narrow(df64_sub(df64_add(number, _cse5, _fp64_g), df64_add(_gv1, _cse5, _fp64_g), _fp64_g));
  if ((axisVisible(t_1, axis_1, u) == false)) {
    return _cse0;
  }
  let at_1 = projectAxis(t_1, axis_1, u);
  let fontSize = u.appearance.w;
  let sign = select(select(1.0, -1.0, (normal.y > 0.0)), select(1.0, -1.0, (normal.x > 0.0)), (axis_1.y > 0.0));
  let outward = (normal * sign);
  if (((row % 2) == 0)) {
    return vec4<f32>(at_1, outward);
  }
  let anchor = ((at_1 + (outward * ((fontSize * 0.95) + 6.0))) + vec2<f32>(0.0, (fontSize * 0.65)));
  let width = wideNumberWidth(number, levels.x, fontSize);
  let before = projectAxis((t_1 - stride), axis_1, u);
  let after = projectAxis((t_1 + stride), axis_1, u);
  let separation = min(abs((at_1 - before)), abs((after - at_1)));
  let box = vec2<f32>((width + fontSize), ((fontSize * 1.8) + 6.0));
  let fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
  let visibility = (select(wideWeight(number, levels, true), wideWeight(number, levels, false), _gv0) * fit);
  let _lc1 = (width * 0.5);
  let room = min(min(((anchor.x - _lc1) - 3.0), (((size.x - anchor.x) - _lc1) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
  let zero = df64_le(df64_abs(number), vec2<f32>((levels.x * 0.001), 0.0));
  let _cse6 = project(vec3<f32>(0.0, 0.0, 0.0), _cse8);
  let crossing = select(smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse6))), select(0.0, 1.0, (axis_1.x > 0.0)), zero);
  var priority: f32 = 1.0;
  if ((axisIndex == 2)) {
    let xDirection = homogeneous(_cse1, _cse8, true);
    let zDirection = homogeneous(_cse3, _cse8, true);
    let _cse7 = vec2<f32>(1e-12, 1e-12);
    let xTangent = normalize(((xDirection.xy - (_cse6 * xDirection.z)) + _cse7));
    let zTangent = normalize(((zDirection.xy - (_cse6 * zDirection.z)) + _cse7));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4<f32>(t_1, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}

fn cachedSpatialTicks(pixel: vec2<f32>, axis: vec3<f32>, index: i32, u: CoordinateUniforms) -> vec4<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _licm0 = (index * 12);
  let _licm1 = ((u.decorations & 2u) != 0u);
  let _cse1 = pixelWidth();
  let _licm3 = (3.0 + _cse1);
  let _licm4 = (u.appearance.x > 0.0);
  let _licm5 = u.appearance.x;
  let _licm6 = axisBase(axis, u);
  let _licm7 = u.labelStyle.y;
  let _licm8 = u.labelStyle.z;
  let _licm9 = u.decorationOpacity.y;
  let size = plotSize(u.resolution);
  let fontSize = u.appearance.w;
  let axisLine = cross(axisOriginH(axis, u), homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true));
  let magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3<f32>(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse1)))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let normal = (axisLine.xy / magnitude);
  let tangent = vec2<f32>(normal.y, (-normal.x));
  let low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  let coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  let column = clamp(i32(floor((coordinate * f32(u.curveTiles.w)))), 0, (i32(u.curveTiles.w) - 1));
  var labels: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  var ticks: f32 = 0.0;
  let _cse0 = (((_licm5 * 0.5) + 4.0) + _cse1);
  for (var candidate: i32 = 0; (candidate < 6); candidate = (candidate + 1)) {
    let row = (_licm0 + (candidate * 2));
    let location = loadLabels(vec2<i32>(column, row));
    let at = location.xy;
    let outward = location.zw;
    let anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2<f32>(0.0, (fontSize * 0.65)));
    let delta = (pixel - anchor);
    let nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse1))) && (delta.y <= _licm3));
    let nearTick = (_licm4 && all((abs((pixel - at)) <= vec2<f32>(_cse0, _cse0))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    let style = loadLabels(vec2<i32>(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm6, vec2<f32>(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm7, _licm8) * style.w) * _licm9));
    }
  }
  return vec4<f32>(ticks, labels);
}

fn CoordinateUniforms_as_PlotViewport(value: CoordinateUniforms) -> PlotViewport {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

fn cachedSpatialBackground(uv: vec2<f32>, u: CoordinateUniforms) -> SpatialDecor {
  let _licm0 = CoordinateUniforms_as_PlotViewport(u);
  let _licm1 = u.decorationOpacity.z;
  let size = plotSize(u.resolution);
  let pixel = (uv * size);
  let ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms(u));
  let xLevels = loadLabels(vec2<i32>(0, 37)).xyz;
  let zLevels = loadLabels(vec2<i32>(2, 37)).xyz;
  let grid = groundField(uv, ray, u, xLevels, zLevels);
  let _cse0 = vec3<f32>(1.0, 0.0, 0.0);
  let xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  let _cse1 = vec3<f32>(0.0, 1.0, 0.0);
  let yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  let _cse2 = vec3<f32>(0.0, 0.0, 1.0);
  let zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  var labels: vec3<f32> = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  let _cse3 = vec3<f32>(0.965, 0.973, 0.985);
  var color: vec3<f32> = mix(_cse3, vec3<f32>(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3<f32>(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, u));
  color = mix(color, vec3<f32>(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, u));
  color = mix(color, vec3<f32>(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, u));
  color = mix(color, vec3<f32>(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    for (var index: i32 = 0; (index < 3); index = (index + 1)) {
      let name = loadLabels(vec2<i32>(index, 36));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, i32(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, u.sceneOpacity.x), (labels * u.sceneOpacity.x));
}

@vertex
fn fullscreen(@builtin(vertex_index) i: u32) -> VertexOutput {
  let x = select(-1.0, 3.0, (i == 1u));
  let y = select(-1.0, 3.0, (i == 2u));
  return VertexOutput(vec4<f32>(x, y, 0.0, 1.0), vec2<f32>(((x * 0.5) + 0.5), ((y * 0.5) + 0.5)));
}

@fragment
fn buildSpatialLabels(@builtin(position) position: vec4<f32>) -> @location(0) vec4<u32> {
  return bitcast<vec4<u32>>(prepareSpatialLabels(position, u));
}

@fragment
fn drawBackdrop(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(cachedSpatialBackground(uv, u).color, 1.0);
}

fn labels(uv: vec2<f32>, surface: bool) -> vec4<f32> {
  let decor = cachedSpatialBackground(uv, u);
  let _cse0 = vec3<f32>(0.0, 0.0, 0.0);
  var black: vec3<f32> = labelColorWide(_cse0, decor.labels);
  var white: vec3<f32> = labelColorWide(vec3<f32>(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    let _cse1 = CoordinateUniforms_as_PlotUniforms(u);
    black = mix(black, surfaceColorBar(black, uv, _cse1), u.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, _cse1), u.sceneOpacity.y);
  }
  let alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4<f32>(select(_cse0, (black / alpha), (alpha > 0.0)), alpha);
}

fn labelColorWide(color: vec3<f32>, layers: vec3<f32>) -> vec3<f32> {
  let plated = mix(color, vec3<f32>(0.995, 0.995, 0.995), (layers.z * 0.94));
  return mix(mix(plated, vec3<f32>(0.965, 0.973, 0.985), layers.y), vec3<f32>(0.25, 0.29, 0.35), layers.x);
}

@fragment
fn drawLabels(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return labels(uv, false);
}

@fragment
fn drawSurfaceLabels(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return labels(uv, true);
}

fn df64_twoSum(a: f32, b: f32, _fp64_g: f32) -> vec2<f32> {
  let _v0 = (a + b);
  let _v1 = (((_v0 * _fp64_g) - a) * _fp64_g);
  let _v2 = (((a - ((_v0 - _v1) * _fp64_g)) * _fp64_g) + (b - _v1));
  return vec2<f32>(_v0, _v2);
}

fn df64_quickTwoSum(a: f32, b: f32, _fp64_g: f32) -> vec2<f32> {
  let _v0 = ((a + b) * _fp64_g);
  let _v1 = (b - ((_v0 - a) * _fp64_g));
  return vec2<f32>(_v0, _v1);
}

fn df64_split(a: f32, _fp64_g: f32) -> vec2<f32> {
  let _v0 = (a * (_fp64_g * 4097.0));
  let _v1 = ((_v0 * _fp64_g) - (_v0 - a));
  let _v2 = ((a * _fp64_g) - _v1);
  return vec2<f32>(_v1, _v2);
}

fn df64_twoProd(a: f32, b: f32, _fp64_g: f32) -> vec2<f32> {
  let _v0 = (a * b);
  let _v1 = df64_split(a, _fp64_g);
  let _v2 = df64_split(b, _fp64_g);
  let _v3 = (((((_v1.x * _v2.x) - _v0) + (_v1.x * _v2.y)) + (_v1.y * _v2.x)) + (_v1.y * _v2.y));
  return vec2<f32>(_v0, _v3);
}

fn df64_add(a: vec2<f32>, b: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  var _v0: vec2<f32> = df64_twoSum(a.x, b.x, _fp64_g);
  let _v1 = df64_twoSum(a.y, b.y, _fp64_g);
  _v0.y = (_v0.y + _v1.x);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + _v1.y);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  return _v0;
}

fn df64_sub(a: vec2<f32>, b: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  return df64_add(a, (-b), _fp64_g);
}

fn df64_mul(a: vec2<f32>, b: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  var _v0: vec2<f32> = df64_twoProd(a.x, b.x, _fp64_g);
  _v0.y = (_v0.y + (a.x * b.y));
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + (a.y * b.x));
  return df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
}

fn df64_div(a: vec2<f32>, b: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  let _v0 = (_fp64_g / b.x);
  let _v1 = (a * _v0);
  let _v2 = df64_sub(a, df64_mul(b, _v1, _fp64_g), _fp64_g).x;
  let _v3 = df64_twoProd(_v0, _v2, _fp64_g);
  return df64_add(_v1, _v3, _fp64_g);
}

fn df64_lt(a: vec2<f32>, b: vec2<f32>) -> bool {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y < b.y)));
}

fn df64_gt(a: vec2<f32>, b: vec2<f32>) -> bool {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y > b.y)));
}

fn df64_le(a: vec2<f32>, b: vec2<f32>) -> bool {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y <= b.y)));
}

fn df64_ge(a: vec2<f32>, b: vec2<f32>) -> bool {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y >= b.y)));
}

fn df64_abs(a: vec2<f32>) -> vec2<f32> {
  return select(a, (-a), (a.x < 0.0));
}

fn df64_max(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
  return select(b, a, df64_gt(a, b));
}

fn df64_floor(a: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  let _v0 = floor(a.x);
  return select(vec2<f32>(_v0, 0.0), df64_quickTwoSum(_v0, floor(a.y), _fp64_g), (_v0 == a.x));
}

fn df64_fract(a: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

fn df64_narrow(a: vec2<f32>) -> f32 {
  return (a.x + a.y);
}
`,bindings:[{name:"u",emitted:"u",space:"uniform",group:0,binding:0,type:"struct:CoordinateUniforms",resource:{resourceKind:"uniform-buffer",structName:"CoordinateUniforms",structEmitted:"CoordinateUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:592,fields:[{name:"resolution",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenter",offset:8,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotSpan",offset:16,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotRotation",offset:24,layout:{kind:"vector",size:2,type:"f32"}},{name:"rotationBasis",offset:32,layout:{kind:"vector",size:4,type:"f32"}},{name:"plotPan",offset:48,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotBlend",offset:56,layout:{kind:"scalar",type:"f32"}},{name:"appearance",offset:64,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorations",offset:80,layout:{kind:"scalar",type:"u32"}},{name:"labelStyle",offset:96,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorationOpacity",offset:112,layout:{kind:"vector",size:3,type:"f32"}},{name:"model",offset:128,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseModel",offset:192,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"axesModel",offset:256,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseAxesModel",offset:320,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"sceneOpacity",offset:384,layout:{kind:"vector",size:2,type:"f32"}},{name:"cameraLens",offset:392,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenterZ",offset:400,layout:{kind:"scalar",type:"f32"}},{name:"probe",offset:404,layout:{kind:"scalar",type:"f32"}},{name:"parameterFocusSeed",offset:408,layout:{kind:"scalar",type:"f32"}},{name:"view3d",offset:412,layout:{kind:"scalar",type:"u32"}},{name:"parameterBounds",offset:416,layout:{kind:"vector",size:2,type:"f32"}},{name:"parameterMode",offset:424,layout:{kind:"scalar",type:"u32"}},{name:"curveQuality",offset:432,layout:{kind:"vector",size:2,type:"u32"}},{name:"curvePattern",offset:448,layout:{kind:"vector",size:4,type:"f32"}},{name:"curveTiles",offset:464,layout:{kind:"vector",size:4,type:"u32"}},{name:"surfaceBounds",offset:480,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceDomainMode",offset:496,layout:{kind:"scalar",type:"u32"}},{name:"surfaceRange",offset:504,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceDepth",offset:512,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceRender",offset:528,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceFlags",offset:544,layout:{kind:"scalar",type:"u32"}},{name:"axesOrigin",offset:560,layout:{kind:"vector",size:3,type:"f64",lo:16}}]}},{name:"spatialLabels",emitted:"spatialLabels",space:"uniform",group:0,binding:1,type:"texture_2d<u32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"u32",sampleType:"uint"},stages:["fragment"]},{name:"glyphAtlas",emitted:"glyphAtlas",space:"uniform",group:0,binding:2,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"font",emitted:"font",space:"uniform",group:0,binding:3,type:"struct:FontUniforms",resource:{resourceKind:"uniform-buffer",structName:"FontUniforms",structEmitted:"FontUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixelRatio",offset:0,layout:{kind:"scalar",type:"f32"}}]}},{name:"_fp64",emitted:"_fp64",space:"uniform",group:0,binding:4,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"],injected:!0}],entries:[{name:"fullscreen",emitted:"fullscreen",stage:"vertex",inputs:[{name:"i",emitted:"i",type:"u32",builtin:"vertex_index"}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],bindings:[{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:235}},{name:"buildSpatialLabels",emitted:"buildSpatialLabels",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:238}},{name:"drawBackdrop",emitted:"drawBackdrop",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:239}},{name:"drawLabels",emitted:"drawLabels",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:249}},{name:"drawSurfaceLabels",emitted:"drawSurfaceLabels",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:250}}],structs:[{name:"FontUniforms",emitted:"FontUniforms",fields:[{name:"pixelRatio",emitted:"pixelRatio",type:"f32"}]},{name:"NumberFormat",emitted:"NumberFormat",fields:[{name:"value",emitted:"value",type:"f32"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"PlotViewport",emitted:"PlotViewport",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"}]},{name:"PlotUniforms",emitted:"PlotUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"parameterFocusSeed",emitted:"parameterFocusSeed",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"}]},{name:"ViewRay",emitted:"ViewRay",fields:[{name:"origin",emitted:"origin",type:"vec3<f32>"},{name:"direction",emitted:"direction",type:"vec3<f32>"}]},{name:"WideNumberFormat",emitted:"WideNumberFormat",fields:[{name:"value",emitted:"value",type:"f64"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"CoordinateUniforms",emitted:"CoordinateUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"parameterFocusSeed",emitted:"parameterFocusSeed",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"},{name:"axesOrigin",emitted:"axesOrigin",type:"vec3<f64>"}]},{name:"SpatialDecor",emitted:"SpatialDecor",fields:[{name:"color",emitted:"color",type:"vec3<f32>"},{name:"labels",emitted:"labels",type:"vec3<f32>"}]},{name:"VertexOutput",emitted:"VertexOutput",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"uv",emitted:"uv",type:"vec2<f32>"}]}],overrides:[],features:[],gl:{vertices:{fullscreen:{vertex:`#version 300 es
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
`,blocks:{},samplers:{}}},draws:{buildSpatialLabels:{fragment:`#version 300 es
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
  float parameterFocusSeed;
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

struct WideNumberFormat {
  vec2 value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
};

struct CoordinateUniforms_value {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
};
layout(std140) uniform CoordinateUniforms {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
} u;

uniform highp sampler2D _fp64;
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

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0, 1.0));
}

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = plot_u_2.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms plot_u_3) {
  return basisVector(((plot_u_3.model * vec4(p, 1.0)).xyz - vec3(plot_u_3.plotCenter, plot_u_3.plotCenterZ)), plot_u_3);
}

vec3 cameraVector(vec3 p, PlotUniforms plot_u_4) {
  return basisVector((plot_u_4.model * vec4(p, 0.0)).xyz, plot_u_4);
}

vec3 homogeneous(vec3 p, PlotUniforms plot_u_7, bool direction) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 camera = (direction ? cameraVector(p, plot_u_7) : cameraPoint(p, plot_u_7));
  float w = ((plot_u_7.view3d == 2u) ? (direction ? (-camera.z) : (plot_u_7.cameraLens.y - camera.z)) : (direction ? 0.0 : plot_u_7.cameraLens.y));
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + plot_u_7.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms plot_u_8) {
  vec3 h = homogeneous(p, plot_u_8, false);
  return (h.xy / max(h.z, 0.101));
}

vec2 df64_split(float a, float _fp64_g) {
  float _v0 = (a * (_fp64_g * 4097.0));
  float _v1 = ((_v0 * _fp64_g) - (_v0 - a));
  float _v2 = ((a * _fp64_g) - _v1);
  return vec2(_v1, _v2);
}

vec2 df64_twoProd(float a, float b, float _fp64_g) {
  float _v0 = (a * b);
  vec2 _v1 = df64_split(a, _fp64_g);
  vec2 _v2 = df64_split(b, _fp64_g);
  float _v3 = (((((_v1.x * _v2.x) - _v0) + (_v1.x * _v2.y)) + (_v1.y * _v2.x)) + (_v1.y * _v2.y));
  return vec2(_v0, _v3);
}

vec2 df64_quickTwoSum(float a, float b, float _fp64_g) {
  float _v0 = ((a + b) * _fp64_g);
  float _v1 = (b - ((_v0 - a) * _fp64_g));
  return vec2(_v0, _v1);
}

vec2 df64_mul(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoProd(a.x, b.x, _fp64_g);
  _v0.y = (_v0.y + (a.x * b.y));
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + (a.y * b.x));
  return df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
}

vec2 df64_twoSum(float a, float b, float _fp64_g) {
  float _v0 = (a + b);
  float _v1 = (((_v0 * _fp64_g) - a) * _fp64_g);
  float _v2 = (((a - ((_v0 - _v1) * _fp64_g)) * _fp64_g) + (b - _v1));
  return vec2(_v0, _v2);
}

vec2 df64_add(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoSum(a.x, b.x, _fp64_g);
  vec2 _v1 = df64_twoSum(a.y, b.y, _fp64_g);
  _v0.y = (_v0.y + _v1.x);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + _v1.y);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  return _v0;
}

vec2 df64_sub(vec2 a, vec2 b, float _fp64_g) {
  return df64_add(a, (-b), _fp64_g);
}

vec2 df64_div(vec2 a, vec2 b, float _fp64_g) {
  float _v0 = (_fp64_g / b.x);
  vec2 _v1 = (a * _v0);
  float _v2 = df64_sub(a, df64_mul(b, _v1, _fp64_g), _fp64_g).x;
  vec2 _v3 = df64_twoProd(_v0, _v2, _fp64_g);
  return df64_add(_v1, _v3, _fp64_g);
}

vec2 widePower(int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = min(abs(exponent), 32);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _cse0 = vec2(1.0, 0.0);
  vec2 value = _cse0;
  for (int i = 0; (i < _licm0); i = (i + 1)) {
    value = df64_mul(value, _licm1, _fp64_g);
  }
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse2, _cse2);
  return ((exponent < 0) ? df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g) : value);
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

bool df64_lt(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y < b.y)));
}

vec2 df64_abs(vec2 a) {
  return ((a.x < 0.0) ? (-a) : a);
}

float df64_narrow(vec2 a) {
  return (a.x + a.y);
}

bool df64_gt(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y > b.y)));
}

bool df64_ge(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y >= b.y)));
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  return ((_v0 == a.x) ? df64_quickTwoSum(_v0, floor(a.y), _fp64_g) : vec2(_v0, 0.0));
}

WideNumberFormat wideNumberFormat(vec2 input_, float spacing) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse6 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _licm0 = vec2(_cse6, _cse6);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _licm2 = vec2(0.009999999776482582, 2.2351741291171123e-10);
  vec2 _cse0 = vec2(0.0, 0.0);
  float _cse7 = abs(spacing);
  vec2 value = (df64_lt(df64_abs(input_), vec2((_cse7 * 0.0001), 0.0)) ? _cse0 : input_);
  vec2 magnitude = df64_abs(value);
  float _cse1 = log2(10.0);
  int exponent = _f2i(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse1)));
  bool _gv0 = df64_gt(magnitude, _cse0);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  bool scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  float _cse2 = log2(max(_cse7, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse2) / _cse1)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  int digits = 1;
  vec2 _cse3 = vec2(0.5, 0.0);
  vec2 _cse4 = vec2(0.25, 0.0);
  if (scientific) {
    decimals = _f2i(clamp(ceil((float(exponent) - (_cse2 / _cse1))), 0.0, 12.0));
    vec2 scale = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(df64_div(df64_add(magnitude, _licm0, _fp64_g), df64_add(widePower(exponent), _licm0, _fp64_g), _fp64_g), scale, _fp64_g), _cse3, _fp64_g), _fp64_g);
    if (df64_ge(magnitude, df64_mul(_licm1, scale, _fp64_g))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    vec2 _gv1 = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(magnitude, _gv1, _fp64_g), _cse3, _fp64_g), _fp64_g);
    vec2 integral = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), df64_add(_gv1, _licm0, _fp64_g), _fp64_g), _fp64_g);
    digits = max(1, (exponent + 1));
    if (df64_ge(integral, widePower(digits))) {
      digits += 1;
    }
    if (((digits > 1) && df64_lt(integral, widePower((digits - 1))))) {
      digits -= 1;
    }
  }
  vec2 _cse5 = df64_add(_licm1, _licm0, _fp64_g);
  for (int i = 0; (i < 13); i = (i + 1)) {
    if (((decimals > 0) && df64_lt(df64_abs(df64_sub(df64_add(magnitude, _licm0, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g), _licm1, _fp64_g), _fp64_g)), _licm2))) {
      magnitude = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g);
      decimals -= 1;
    }
  }
  bool negative = df64_lt(value, _cse0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

float wideNumberWidth(vec2 value, float spacing, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberWidth(df64_narrow(value), spacing, size);
  }
  return ((float(wideNumberFormat(value, spacing).length) * size) * 0.625);
}

vec2 axisBase(vec3 axis, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

vec3 axisOriginH(vec3 axis, CoordinateUniforms_value u) {
  vec3 local = vec3((df64_narrow((-vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z))) * (1.0 - axis.z)));
  vec3 camera = cameraVector(local, CoordinateUniforms_as_PlotUniforms(u));
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5, 0.5) + u.plotPan) * w)) * size), w);
}

vec3 axisH(float value, vec3 axis, CoordinateUniforms_value u) {
  return (axisOriginH(axis, u) + (homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true) * value));
}

vec2 projectAxis(float value, vec3 axis, CoordinateUniforms_value u) {
  vec3 at = axisH(value, axis, u);
  return (at.xy / max(at.z, 0.101));
}

bool axisVisible(float value, vec3 axis, CoordinateUniforms_value u) {
  return ((u.view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
}

float wideWeight(vec2 value, vec3 levels, bool coarse) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing((coarse ? levels.x : levels.y)), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : (coarse ? (1.0 - levels.z) : levels.z));
}

float axisParameter(vec2 pixel, vec3 axis, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  vec3 direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

vec3 spatialLevels(vec3 axis, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float center = axisParameter((plotSize(u.resolution) * 0.5), axis, u);
  float span = max(u.plotSpan.x, u.plotSpan.y);
  vec3 at = axisH(center, axis, u);
  vec3 direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  vec2 tangent = (((direction.xy * at.z) - (at.xy * direction.z)) / max((at.z * at.z), 1e-20));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  vec2 absolute = df64_add(axisBase(axis, u), vec2(center, 0.0), _fp64_g);
  float rough = (((span * u.appearance.w) * 4.0) / pixels);
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 _lc0 = vec2((span * 0.5), 0.0);
  float width = max(wideNumberWidth(df64_sub(df64_add(absolute, _cse0, _fp64_g), df64_add(_lc0, _cse0, _fp64_g), _fp64_g), rough, u.appearance.w), wideNumberWidth(df64_add(absolute, _lc0, _fp64_g), rough, u.appearance.w));
  float gap = (horizontal ? max((u.appearance.w * 3.5), (width + (u.appearance.w * 1.3))) : (u.appearance.w * 2.6));
  return tickLevels(((span * gap) / max((pixels * u.labelStyle.x), 1.0)));
}

bool df64_le(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y <= b.y)));
}

vec4 prepareSpatialLabels(vec4 position, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int row = _f2i(position.y);
  int column = _f2i(position.x);
  vec2 size = plotSize(u.resolution);
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
      return vec4(spatialLevels(axis, u), 1.0);
    }
    vec2 edge = ((column == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
    float t = axisParameter(edge, axis, u);
    vec2 _cse4 = vec2(18.0, 18.0);
    vec2 at = clamp((projectAxis(t, axis, u) + vec2(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4(at, float((120 + column)), (axisVisible(t, axis, u) ? 1.0 : 0.0));
  }
  int axisIndex = (row / 12);
  int candidate = _irem((row / 2), 6);
  vec3 axis_1 = ((axisIndex == 0) ? _cse1 : ((axisIndex == 1) ? _cse2 : _cse3));
  vec3 originH = axisOriginH(axis_1, u);
  PlotUniforms _cse8 = CoordinateUniforms_as_PlotUniforms(u);
  vec3 axisLine = cross(originH, homogeneous(axis_1, _cse8, true));
  float magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float extent = dot(abs(tangent), size);
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float along = (low + ((position.x / float(u.curveTiles.w)) * extent));
  vec2 foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  vec3 levels = spatialLevels(axis_1, u);
  bool _gv0 = (candidate < 3);
  float stride = (_gv0 ? levels.x : levels.y);
  vec2 _gv1 = axisBase(axis_1, u);
  vec2 absolute = df64_add(_gv1, vec2(axisParameter(foot, axis_1, u), 0.0), _fp64_g);
  float _cse9 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse5 = vec2(_cse9, _cse9);
  vec2 _lc0 = wideGridSpacing(stride);
  vec2 number = df64_mul(df64_add(df64_floor(df64_add(df64_div(df64_add(absolute, _cse5, _fp64_g), df64_add(_lc0, _cse5, _fp64_g), _fp64_g), vec2(0.5, 0.0), _fp64_g), _fp64_g), vec2(float((_irem(candidate, 3) - 1)), 0.0), _fp64_g), _lc0, _fp64_g);
  float t_1 = df64_narrow(df64_sub(df64_add(number, _cse5, _fp64_g), df64_add(_gv1, _cse5, _fp64_g), _fp64_g));
  if ((axisVisible(t_1, axis_1, u) == false)) {
    return _cse0;
  }
  vec2 at_1 = projectAxis(t_1, axis_1, u);
  float fontSize = u.appearance.w;
  float sign = ((axis_1.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  if ((_irem(row, 2) == 0)) {
    return vec4(at_1, outward);
  }
  vec2 anchor = ((at_1 + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
  float width = wideNumberWidth(number, levels.x, fontSize);
  vec2 before = projectAxis((t_1 - stride), axis_1, u);
  vec2 after = projectAxis((t_1 + stride), axis_1, u);
  vec2 separation = min(abs((at_1 - before)), abs((after - at_1)));
  vec2 box = vec2((width + fontSize), ((fontSize * 1.8) + 6.0));
  float fit = smoothstep(0.85, 1.15, max((separation.x / box.x), (separation.y / box.y)));
  float visibility = ((_gv0 ? wideWeight(number, levels, false) : wideWeight(number, levels, true)) * fit);
  float _lc1 = (width * 0.5);
  float room = min(min(((anchor.x - _lc1) - 3.0), (((size.x - anchor.x) - _lc1) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
  bool zero = df64_le(df64_abs(number), vec2((levels.x * 0.001), 0.0));
  vec2 _cse6 = project(vec3(0.0, 0.0, 0.0), _cse8);
  float crossing = (zero ? ((axis_1.x > 0.0) ? 1.0 : 0.0) : smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse6))));
  float priority = 1.0;
  if ((axisIndex == 2)) {
    vec3 xDirection = homogeneous(_cse1, _cse8, true);
    vec3 zDirection = homogeneous(_cse3, _cse8, true);
    vec2 _cse7 = vec2(1e-12, 1e-12);
    vec2 xTangent = normalize(((xDirection.xy - (_cse6 * xDirection.z)) + _cse7));
    vec2 zTangent = normalize(((zDirection.xy - (_cse6 * zDirection.z)) + _cse7));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4(t_1, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}
layout(location = 0) out uvec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = floatBitsToUint(prepareSpatialLabels(position, CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin)));
}
`,blocks:{u:"CoordinateUniforms"},samplers:{_fp64:null}},drawBackdrop:{fragment:`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

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
  float parameterFocusSeed;
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

struct WideNumberFormat {
  vec2 value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
};

struct CoordinateUniforms_value {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};
layout(std140) uniform CoordinateUniforms {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
} u;

uniform usampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;

uniform highp sampler2D _fp64;
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

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport plot_u) {
  float _cse0 = (((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
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

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = plot_u_2.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms plot_u_3) {
  return basisVector(((plot_u_3.model * vec4(p, 1.0)).xyz - vec3(plot_u_3.plotCenter, plot_u_3.plotCenterZ)), plot_u_3);
}

vec3 cameraVector(vec3 p, PlotUniforms plot_u_4) {
  return basisVector((plot_u_4.model * vec4(p, 0.0)).xyz, plot_u_4);
}

vec3 sceneCenter(PlotUniforms plot_u_5) {
  return (plot_u_5.inverseModel * vec4(plot_u_5.plotCenter, plot_u_5.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms plot_u_7, bool direction) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 camera = (direction ? cameraVector(p, plot_u_7) : cameraPoint(p, plot_u_7));
  float w = ((plot_u_7.view3d == 2u) ? (direction ? (-camera.z) : (plot_u_7.cameraLens.y - camera.z)) : (direction ? 0.0 : plot_u_7.cameraLens.y));
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + plot_u_7.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms plot_u_8) {
  vec3 h = homogeneous(p, plot_u_8, false);
  return (h.xy / max(h.z, 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - plot_u_9.plotPan);
  vec2 size = plotSize(plot_u_9.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * plot_u_9.cameraLens.x);
  bool _cse0 = (plot_u_9.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, plot_u_9.cameraLens.y) : vec3((cameraXY * plot_u_9.cameraLens.y), plot_u_9.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, plot_u_9) + sceneCenter(plot_u_9)), inverseCamera(direction, plot_u_9));
}

vec2 df64_split(float a, float _fp64_g) {
  float _v0 = (a * (_fp64_g * 4097.0));
  float _v1 = ((_v0 * _fp64_g) - (_v0 - a));
  float _v2 = ((a * _fp64_g) - _v1);
  return vec2(_v1, _v2);
}

vec2 df64_twoProd(float a, float b, float _fp64_g) {
  float _v0 = (a * b);
  vec2 _v1 = df64_split(a, _fp64_g);
  vec2 _v2 = df64_split(b, _fp64_g);
  float _v3 = (((((_v1.x * _v2.x) - _v0) + (_v1.x * _v2.y)) + (_v1.y * _v2.x)) + (_v1.y * _v2.y));
  return vec2(_v0, _v3);
}

vec2 df64_quickTwoSum(float a, float b, float _fp64_g) {
  float _v0 = ((a + b) * _fp64_g);
  float _v1 = (b - ((_v0 - a) * _fp64_g));
  return vec2(_v0, _v1);
}

vec2 df64_mul(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoProd(a.x, b.x, _fp64_g);
  _v0.y = (_v0.y + (a.x * b.y));
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + (a.y * b.x));
  return df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
}

vec2 df64_twoSum(float a, float b, float _fp64_g) {
  float _v0 = (a + b);
  float _v1 = (((_v0 * _fp64_g) - a) * _fp64_g);
  float _v2 = (((a - ((_v0 - _v1) * _fp64_g)) * _fp64_g) + (b - _v1));
  return vec2(_v0, _v2);
}

vec2 df64_add(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoSum(a.x, b.x, _fp64_g);
  vec2 _v1 = df64_twoSum(a.y, b.y, _fp64_g);
  _v0.y = (_v0.y + _v1.x);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + _v1.y);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  return _v0;
}

vec2 df64_sub(vec2 a, vec2 b, float _fp64_g) {
  return df64_add(a, (-b), _fp64_g);
}

vec2 df64_div(vec2 a, vec2 b, float _fp64_g) {
  float _v0 = (_fp64_g / b.x);
  vec2 _v1 = (a * _v0);
  float _v2 = df64_sub(a, df64_mul(b, _v1, _fp64_g), _fp64_g).x;
  vec2 _v3 = df64_twoProd(_v0, _v2, _fp64_g);
  return df64_add(_v1, _v3, _fp64_g);
}

vec2 widePower(int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = min(abs(exponent), 32);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _cse0 = vec2(1.0, 0.0);
  vec2 value = _cse0;
  for (int i = 0; (i < _licm0); i = (i + 1)) {
    value = df64_mul(value, _licm1, _fp64_g);
  }
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse2, _cse2);
  return ((exponent < 0) ? df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g) : value);
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  return ((_v0 == a.x) ? df64_quickTwoSum(_v0, floor(a.y), _fp64_g) : vec2(_v0, 0.0));
}

float df64_narrow(vec2 a) {
  return (a.x + a.y);
}

int wideDigit(vec2 value, int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _cse0 = vec2(0.25, 0.0);
  float _cse3 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse3, _cse3);
  vec2 integer = df64_floor(df64_div(df64_add(value, _cse0, _fp64_g), df64_add(widePower(exponent), _cse1, _fp64_g), _fp64_g), _fp64_g);
  vec2 _cse2 = vec2(10.0, 0.0);
  return _f2i(df64_narrow(df64_sub(df64_add(integer, _cse1, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(integer, _cse0, _fp64_g), df64_add(_cse2, _cse1, _fp64_g), _fp64_g), _fp64_g), _cse2, _fp64_g), _fp64_g)));
}

bool df64_lt(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y < b.y)));
}

vec2 df64_abs(vec2 a) {
  return ((a.x < 0.0) ? (-a) : a);
}

bool df64_gt(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y > b.y)));
}

bool df64_ge(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y >= b.y)));
}

WideNumberFormat wideNumberFormat(vec2 input_, float spacing) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse6 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _licm0 = vec2(_cse6, _cse6);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _licm2 = vec2(0.009999999776482582, 2.2351741291171123e-10);
  vec2 _cse0 = vec2(0.0, 0.0);
  float _cse7 = abs(spacing);
  vec2 value = (df64_lt(df64_abs(input_), vec2((_cse7 * 0.0001), 0.0)) ? _cse0 : input_);
  vec2 magnitude = df64_abs(value);
  float _cse1 = log2(10.0);
  int exponent = _f2i(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse1)));
  bool _gv0 = df64_gt(magnitude, _cse0);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  bool scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  float _cse2 = log2(max(_cse7, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse2) / _cse1)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  int digits = 1;
  vec2 _cse3 = vec2(0.5, 0.0);
  vec2 _cse4 = vec2(0.25, 0.0);
  if (scientific) {
    decimals = _f2i(clamp(ceil((float(exponent) - (_cse2 / _cse1))), 0.0, 12.0));
    vec2 scale = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(df64_div(df64_add(magnitude, _licm0, _fp64_g), df64_add(widePower(exponent), _licm0, _fp64_g), _fp64_g), scale, _fp64_g), _cse3, _fp64_g), _fp64_g);
    if (df64_ge(magnitude, df64_mul(_licm1, scale, _fp64_g))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    vec2 _gv1 = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(magnitude, _gv1, _fp64_g), _cse3, _fp64_g), _fp64_g);
    vec2 integral = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), df64_add(_gv1, _licm0, _fp64_g), _fp64_g), _fp64_g);
    digits = max(1, (exponent + 1));
    if (df64_ge(integral, widePower(digits))) {
      digits += 1;
    }
    if (((digits > 1) && df64_lt(integral, widePower((digits - 1))))) {
      digits -= 1;
    }
  }
  vec2 _cse5 = df64_add(_licm1, _licm0, _fp64_g);
  for (int i = 0; (i < 13); i = (i + 1)) {
    if (((decimals > 0) && df64_lt(df64_abs(df64_sub(df64_add(magnitude, _licm0, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g), _licm1, _fp64_g), _fp64_g)), _licm2))) {
      magnitude = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g);
      decimals -= 1;
    }
  }
  bool negative = df64_lt(value, _cse0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int wideNumberGlyph(WideNumberFormat n, int column) {
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
      return (48 + wideDigit(n.value, (n.decimals - digit)));
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
  return (48 + wideDigit(n.value, (((n.digits + n.decimals) - digit_1) - 1)));
}

vec2 wideTickNumberLayers(vec2 p, vec2 value, float spacing, float align, float fontSize, float halo) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return tickNumberLayers(p, df64_narrow(value), spacing, align, fontSize, halo);
  }
  WideNumberFormat n = wideNumberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse1 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse1;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse1;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float wideNumberWidth(vec2 value, float spacing, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberWidth(df64_narrow(value), spacing, size);
  }
  return ((float(wideNumberFormat(value, spacing).length) * size) * 0.625);
}

float wideNumberPlate(vec2 p, vec2 value, float spacing, float align, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberPlate(p, df64_narrow(value), spacing, align, size);
  }
  float width = wideNumberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase(vec3 axis, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

vec3 axisOriginH(vec3 axis, CoordinateUniforms_value u) {
  vec3 local = vec3((df64_narrow((-vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z))) * (1.0 - axis.z)));
  vec3 camera = cameraVector(local, CoordinateUniforms_as_PlotUniforms(u));
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5, 0.5) + u.plotPan) * w)) * size), w);
}

vec3 axisH(float value, vec3 axis, CoordinateUniforms_value u) {
  return (axisOriginH(axis, u) + (homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true) * value));
}

bool axisVisible(float value, vec3 axis, CoordinateUniforms_value u) {
  return ((u.view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
}

float wideWeight(vec2 value, vec3 levels, bool coarse) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing((coarse ? levels.x : levels.y)), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : (coarse ? (1.0 - levels.z) : levels.z));
}

vec3 wideNumberAt(vec2 pixel, vec2 anchor, vec2 value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

float axisParameter(vec2 pixel, vec3 axis, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  vec3 direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  PlotUniforms _cse0 = CoordinateUniforms_as_PlotUniforms(u);
  vec3 direction = homogeneous(axis, _cse0, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(vec3(0.0, 0.0, 0.0), _cse0)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  return (axisVisible(axisParameter(pixel, axis, u), axis, u) ? distanceCoverage(distance, u.appearance.x) : 0.0);
}

float groundFieldNarrow(ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
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
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

float groundField(vec2 uv, ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow(ray, u, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5, 0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = inverseCamera(eye, CoordinateUniforms_as_PlotUniforms(u));
  float _cse3 = abs(ray.direction.y);
  float denominator = ((_cse3 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float _cse7 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse4 = vec2(_cse7, _cse7);
  vec2 depth = df64_div(df64_add((-df64_add(_cse1, vec2(offset.y, 0.0), _fp64_g)), _cse4, _fp64_g), df64_add(vec2(denominator, 0.0), _cse4, _fp64_g), _fp64_g);
  vec2 gx = df64_add(df64_add(_cse0, vec2(offset.x, 0.0), _fp64_g), df64_mul(vec2(ray.direction.x, 0.0), depth, _fp64_g), _fp64_g);
  vec2 gz = df64_add(df64_add(_cse2, vec2(offset.z, 0.0), _fp64_g), df64_mul(vec2(ray.direction.z, 0.0), depth, _fp64_g), _fp64_g);
  vec2 high = vec2(df64_narrow(gx), df64_narrow(gz));
  vec2 _gv0 = df64_add(gx, _cse4, _fp64_g);
  vec2 _gv1 = df64_add(gz, _cse4, _fp64_g);
  vec2 low = vec2(df64_narrow(df64_sub(_gv0, df64_add(vec2(high.x, 0.0), _cse4, _fp64_g), _fp64_g)), df64_narrow(df64_sub(_gv1, df64_add(vec2(high.y, 0.0), _cse4, _fp64_g), _fp64_g)));
  vec2 dx = (dFdx(high) + dFdx(low));
  vec2 dy = (dFdy(high) + dFdy(low));
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20, 1e-20));
  float field = 0.0;
  vec2 _cse5 = vec2(0.5, 0.0);
  float _cse6 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 _gv2 = df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 _gv3 = df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 phase = (vec2(df64_narrow(df64_fract(_gv2, _fp64_g)), df64_narrow(df64_fract(_gv3, _fp64_g))) - 0.5);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse6);
    vec2 separation = ((spacing / gradient) * _cse6);
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nx = df64_mul(df64_floor(_gv2, _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(_gv3, _fp64_g), sz, _fp64_g);
    bool _lc2 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc2), wideWeight(nz, zLevels, _lc2));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  float _cse1 = pixelWidth();
  float _licm3 = (3.0 + _cse1);
  bool _licm4 = (u.appearance.x > 0.0);
  float _licm5 = u.appearance.x;
  vec2 _licm6 = axisBase(axis, u);
  float _licm7 = u.labelStyle.y;
  float _licm8 = u.labelStyle.z;
  float _licm9 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH(axis, u), homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse1)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0, 0.0, 0.0);
  float ticks = 0.0;
  float _cse0 = (((_licm5 * 0.5) + 4.0) + _cse1);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse1))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse0, _cse0))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm6, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm7, _licm8) * style.w) * _licm9));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport(CoordinateUniforms_value value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

SpatialDecor cachedSpatialBackground(vec2 uv, CoordinateUniforms_value u) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport(u);
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms(u));
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField(uv, ray, u, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, u));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, u));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, u));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = loadLabels(ivec2(index, 36));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, u.sceneOpacity.x), (labels * u.sceneOpacity.x));
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = vec4(cachedSpatialBackground(uv, CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin)).color, 1.0);
}
`,blocks:{u:"CoordinateUniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null,_fp64:null}},drawLabels:{fragment:`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

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
  float parameterFocusSeed;
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

struct WideNumberFormat {
  vec2 value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
};

struct CoordinateUniforms_value {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};
layout(std140) uniform CoordinateUniforms {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
} u;

uniform usampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;

uniform highp sampler2D _fp64;
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

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport plot_u) {
  float _cse0 = (((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
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

vec3 labelColor(vec3 color, vec3 plot_labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (plot_labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), plot_labels.y), vec3(0.25, 0.29, 0.35), plot_labels.x);
}

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = plot_u_2.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms plot_u_3) {
  return basisVector(((plot_u_3.model * vec4(p, 1.0)).xyz - vec3(plot_u_3.plotCenter, plot_u_3.plotCenterZ)), plot_u_3);
}

vec3 cameraVector(vec3 p, PlotUniforms plot_u_4) {
  return basisVector((plot_u_4.model * vec4(p, 0.0)).xyz, plot_u_4);
}

vec3 sceneCenter(PlotUniforms plot_u_5) {
  return (plot_u_5.inverseModel * vec4(plot_u_5.plotCenter, plot_u_5.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms plot_u_7, bool direction) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 camera = (direction ? cameraVector(p, plot_u_7) : cameraPoint(p, plot_u_7));
  float w = ((plot_u_7.view3d == 2u) ? (direction ? (-camera.z) : (plot_u_7.cameraLens.y - camera.z)) : (direction ? 0.0 : plot_u_7.cameraLens.y));
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + plot_u_7.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms plot_u_8) {
  vec3 h = homogeneous(p, plot_u_8, false);
  return (h.xy / max(h.z, 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - plot_u_9.plotPan);
  vec2 size = plotSize(plot_u_9.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * plot_u_9.cameraLens.x);
  bool _cse0 = (plot_u_9.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, plot_u_9.cameraLens.y) : vec3((cameraXY * plot_u_9.cameraLens.y), plot_u_9.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, plot_u_9) + sceneCenter(plot_u_9)), inverseCamera(direction, plot_u_9));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms plot_u_10) {
  float _licm0 = plot_u_10.surfaceRange.x;
  float _licm1 = plot_u_10.surfaceRange.y;
  float _licm2 = (plot_u_10.appearance.w * 0.7);
  float _licm3 = ((plot_u_10.surfaceRange.y - plot_u_10.surfaceRange.x) * 0.5);
  float _licm4 = plot_u_10.appearance.w;
  float _licm5 = plot_u_10.labelStyle.y;
  if (((plot_u_10.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(plot_u_10.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(plot_u_10.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 plot_labels_2 = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    plot_labels_2 = max(plot_labels_2, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, plot_labels_2);
}

vec2 df64_split(float a, float _fp64_g) {
  float _v0 = (a * (_fp64_g * 4097.0));
  float _v1 = ((_v0 * _fp64_g) - (_v0 - a));
  float _v2 = ((a * _fp64_g) - _v1);
  return vec2(_v1, _v2);
}

vec2 df64_twoProd(float a, float b, float _fp64_g) {
  float _v0 = (a * b);
  vec2 _v1 = df64_split(a, _fp64_g);
  vec2 _v2 = df64_split(b, _fp64_g);
  float _v3 = (((((_v1.x * _v2.x) - _v0) + (_v1.x * _v2.y)) + (_v1.y * _v2.x)) + (_v1.y * _v2.y));
  return vec2(_v0, _v3);
}

vec2 df64_quickTwoSum(float a, float b, float _fp64_g) {
  float _v0 = ((a + b) * _fp64_g);
  float _v1 = (b - ((_v0 - a) * _fp64_g));
  return vec2(_v0, _v1);
}

vec2 df64_mul(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoProd(a.x, b.x, _fp64_g);
  _v0.y = (_v0.y + (a.x * b.y));
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + (a.y * b.x));
  return df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
}

vec2 df64_twoSum(float a, float b, float _fp64_g) {
  float _v0 = (a + b);
  float _v1 = (((_v0 * _fp64_g) - a) * _fp64_g);
  float _v2 = (((a - ((_v0 - _v1) * _fp64_g)) * _fp64_g) + (b - _v1));
  return vec2(_v0, _v2);
}

vec2 df64_add(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoSum(a.x, b.x, _fp64_g);
  vec2 _v1 = df64_twoSum(a.y, b.y, _fp64_g);
  _v0.y = (_v0.y + _v1.x);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + _v1.y);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  return _v0;
}

vec2 df64_sub(vec2 a, vec2 b, float _fp64_g) {
  return df64_add(a, (-b), _fp64_g);
}

vec2 df64_div(vec2 a, vec2 b, float _fp64_g) {
  float _v0 = (_fp64_g / b.x);
  vec2 _v1 = (a * _v0);
  float _v2 = df64_sub(a, df64_mul(b, _v1, _fp64_g), _fp64_g).x;
  vec2 _v3 = df64_twoProd(_v0, _v2, _fp64_g);
  return df64_add(_v1, _v3, _fp64_g);
}

vec2 widePower(int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = min(abs(exponent), 32);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _cse0 = vec2(1.0, 0.0);
  vec2 value = _cse0;
  for (int i = 0; (i < _licm0); i = (i + 1)) {
    value = df64_mul(value, _licm1, _fp64_g);
  }
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse2, _cse2);
  return ((exponent < 0) ? df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g) : value);
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  return ((_v0 == a.x) ? df64_quickTwoSum(_v0, floor(a.y), _fp64_g) : vec2(_v0, 0.0));
}

float df64_narrow(vec2 a) {
  return (a.x + a.y);
}

int wideDigit(vec2 value, int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _cse0 = vec2(0.25, 0.0);
  float _cse3 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse3, _cse3);
  vec2 integer = df64_floor(df64_div(df64_add(value, _cse0, _fp64_g), df64_add(widePower(exponent), _cse1, _fp64_g), _fp64_g), _fp64_g);
  vec2 _cse2 = vec2(10.0, 0.0);
  return _f2i(df64_narrow(df64_sub(df64_add(integer, _cse1, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(integer, _cse0, _fp64_g), df64_add(_cse2, _cse1, _fp64_g), _fp64_g), _fp64_g), _cse2, _fp64_g), _fp64_g)));
}

bool df64_lt(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y < b.y)));
}

vec2 df64_abs(vec2 a) {
  return ((a.x < 0.0) ? (-a) : a);
}

bool df64_gt(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y > b.y)));
}

bool df64_ge(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y >= b.y)));
}

WideNumberFormat wideNumberFormat(vec2 input_, float spacing) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse6 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _licm0 = vec2(_cse6, _cse6);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _licm2 = vec2(0.009999999776482582, 2.2351741291171123e-10);
  vec2 _cse0 = vec2(0.0, 0.0);
  float _cse7 = abs(spacing);
  vec2 value = (df64_lt(df64_abs(input_), vec2((_cse7 * 0.0001), 0.0)) ? _cse0 : input_);
  vec2 magnitude = df64_abs(value);
  float _cse1 = log2(10.0);
  int exponent = _f2i(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse1)));
  bool _gv0 = df64_gt(magnitude, _cse0);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  bool scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  float _cse2 = log2(max(_cse7, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse2) / _cse1)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  int digits = 1;
  vec2 _cse3 = vec2(0.5, 0.0);
  vec2 _cse4 = vec2(0.25, 0.0);
  if (scientific) {
    decimals = _f2i(clamp(ceil((float(exponent) - (_cse2 / _cse1))), 0.0, 12.0));
    vec2 scale = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(df64_div(df64_add(magnitude, _licm0, _fp64_g), df64_add(widePower(exponent), _licm0, _fp64_g), _fp64_g), scale, _fp64_g), _cse3, _fp64_g), _fp64_g);
    if (df64_ge(magnitude, df64_mul(_licm1, scale, _fp64_g))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    vec2 _gv1 = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(magnitude, _gv1, _fp64_g), _cse3, _fp64_g), _fp64_g);
    vec2 integral = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), df64_add(_gv1, _licm0, _fp64_g), _fp64_g), _fp64_g);
    digits = max(1, (exponent + 1));
    if (df64_ge(integral, widePower(digits))) {
      digits += 1;
    }
    if (((digits > 1) && df64_lt(integral, widePower((digits - 1))))) {
      digits -= 1;
    }
  }
  vec2 _cse5 = df64_add(_licm1, _licm0, _fp64_g);
  for (int i = 0; (i < 13); i = (i + 1)) {
    if (((decimals > 0) && df64_lt(df64_abs(df64_sub(df64_add(magnitude, _licm0, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g), _licm1, _fp64_g), _fp64_g)), _licm2))) {
      magnitude = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g);
      decimals -= 1;
    }
  }
  bool negative = df64_lt(value, _cse0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int wideNumberGlyph(WideNumberFormat n, int column) {
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
      return (48 + wideDigit(n.value, (n.decimals - digit)));
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
  return (48 + wideDigit(n.value, (((n.digits + n.decimals) - digit_1) - 1)));
}

vec2 wideTickNumberLayers(vec2 p, vec2 value, float spacing, float align, float fontSize, float halo) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return tickNumberLayers(p, df64_narrow(value), spacing, align, fontSize, halo);
  }
  WideNumberFormat n = wideNumberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse1 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse1;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse1;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float wideNumberWidth(vec2 value, float spacing, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberWidth(df64_narrow(value), spacing, size);
  }
  return ((float(wideNumberFormat(value, spacing).length) * size) * 0.625);
}

float wideNumberPlate(vec2 p, vec2 value, float spacing, float align, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberPlate(p, df64_narrow(value), spacing, align, size);
  }
  float width = wideNumberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase(vec3 axis, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

vec3 axisOriginH(vec3 axis, CoordinateUniforms_value u) {
  vec3 local = vec3((df64_narrow((-vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z))) * (1.0 - axis.z)));
  vec3 camera = cameraVector(local, CoordinateUniforms_as_PlotUniforms(u));
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5, 0.5) + u.plotPan) * w)) * size), w);
}

vec3 axisH(float value, vec3 axis, CoordinateUniforms_value u) {
  return (axisOriginH(axis, u) + (homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true) * value));
}

bool axisVisible(float value, vec3 axis, CoordinateUniforms_value u) {
  return ((u.view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
}

float wideWeight(vec2 value, vec3 levels, bool coarse) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing((coarse ? levels.x : levels.y)), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : (coarse ? (1.0 - levels.z) : levels.z));
}

vec3 wideNumberAt(vec2 pixel, vec2 anchor, vec2 value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

float axisParameter(vec2 pixel, vec3 axis, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  vec3 direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  PlotUniforms _cse0 = CoordinateUniforms_as_PlotUniforms(u);
  vec3 direction = homogeneous(axis, _cse0, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(vec3(0.0, 0.0, 0.0), _cse0)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  return (axisVisible(axisParameter(pixel, axis, u), axis, u) ? distanceCoverage(distance, u.appearance.x) : 0.0);
}

float groundFieldNarrow(ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
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
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

float groundField(vec2 uv, ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow(ray, u, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5, 0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = inverseCamera(eye, CoordinateUniforms_as_PlotUniforms(u));
  float _cse3 = abs(ray.direction.y);
  float denominator = ((_cse3 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float _cse7 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse4 = vec2(_cse7, _cse7);
  vec2 depth = df64_div(df64_add((-df64_add(_cse1, vec2(offset.y, 0.0), _fp64_g)), _cse4, _fp64_g), df64_add(vec2(denominator, 0.0), _cse4, _fp64_g), _fp64_g);
  vec2 gx = df64_add(df64_add(_cse0, vec2(offset.x, 0.0), _fp64_g), df64_mul(vec2(ray.direction.x, 0.0), depth, _fp64_g), _fp64_g);
  vec2 gz = df64_add(df64_add(_cse2, vec2(offset.z, 0.0), _fp64_g), df64_mul(vec2(ray.direction.z, 0.0), depth, _fp64_g), _fp64_g);
  vec2 high = vec2(df64_narrow(gx), df64_narrow(gz));
  vec2 _gv0 = df64_add(gx, _cse4, _fp64_g);
  vec2 _gv1 = df64_add(gz, _cse4, _fp64_g);
  vec2 low = vec2(df64_narrow(df64_sub(_gv0, df64_add(vec2(high.x, 0.0), _cse4, _fp64_g), _fp64_g)), df64_narrow(df64_sub(_gv1, df64_add(vec2(high.y, 0.0), _cse4, _fp64_g), _fp64_g)));
  vec2 dx = (dFdx(high) + dFdx(low));
  vec2 dy = (dFdy(high) + dFdy(low));
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20, 1e-20));
  float field = 0.0;
  vec2 _cse5 = vec2(0.5, 0.0);
  float _cse6 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 _gv2 = df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 _gv3 = df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 phase = (vec2(df64_narrow(df64_fract(_gv2, _fp64_g)), df64_narrow(df64_fract(_gv3, _fp64_g))) - 0.5);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse6);
    vec2 separation = ((spacing / gradient) * _cse6);
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nx = df64_mul(df64_floor(_gv2, _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(_gv3, _fp64_g), sz, _fp64_g);
    bool _lc2 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc2), wideWeight(nz, zLevels, _lc2));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  float _cse1 = pixelWidth();
  float _licm3 = (3.0 + _cse1);
  bool _licm4 = (u.appearance.x > 0.0);
  float _licm5 = u.appearance.x;
  vec2 _licm6 = axisBase(axis, u);
  float _licm7 = u.labelStyle.y;
  float _licm8 = u.labelStyle.z;
  float _licm9 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH(axis, u), homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse1)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0, 0.0, 0.0);
  float ticks = 0.0;
  float _cse0 = (((_licm5 * 0.5) + 4.0) + _cse1);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse1))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse0, _cse0))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm6, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm7, _licm8) * style.w) * _licm9));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport(CoordinateUniforms_value value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

SpatialDecor cachedSpatialBackground(vec2 uv, CoordinateUniforms_value u) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport(u);
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms(u));
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField(uv, ray, u, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, u));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, u));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, u));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = loadLabels(ivec2(index, 36));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, u.sceneOpacity.x), (labels * u.sceneOpacity.x));
}

vec3 labelColorWide(vec3 color, vec3 layers) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (layers.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), layers.y), vec3(0.25, 0.29, 0.35), layers.x);
}

vec4 labels(vec2 uv, bool surface) {
  SpatialDecor decor = cachedSpatialBackground(uv, CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin));
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 black = labelColorWide(_cse0, decor.labels);
  vec3 white = labelColorWide(vec3(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    PlotUniforms _cse1 = CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin));
    black = mix(black, surfaceColorBar(black, uv, _cse1), u.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, _cse1), u.sceneOpacity.y);
  }
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = labels(uv, false);
}
`,blocks:{u:"CoordinateUniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null,_fp64:null}},drawSurfaceLabels:{fragment:`#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

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
  float parameterFocusSeed;
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

struct WideNumberFormat {
  vec2 value;
  bool negative;
  bool scientific;
  int decimals;
  int digits;
  int exponent;
  int length;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
};

struct CoordinateUniforms_value {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
};

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};
layout(std140) uniform CoordinateUniforms {
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
  float parameterFocusSeed;
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
  DF64Vec3 axesOrigin;
} u;

uniform usampler2D spatialLabels;

uniform sampler2D glyphAtlas;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;

uniform highp sampler2D _fp64;
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

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport plot_u) {
  float _cse0 = (((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth());
  if (any(greaterThan(abs((pixel - at)), vec2(_cse0, _cse0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
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

vec3 labelColor(vec3 color, vec3 plot_labels) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (plot_labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), plot_labels.y), vec3(0.25, 0.29, 0.35), plot_labels.x);
}

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001, 0.00001));
  vec3 q = (p / vec3(span, max(span.x, span.y)));
  vec4 basis = plot_u_2.rotationBasis;
  float horizontal = ((q.x * basis.y) + (q.z * basis.x));
  float depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

vec3 cameraPoint(vec3 p, PlotUniforms plot_u_3) {
  return basisVector(((plot_u_3.model * vec4(p, 1.0)).xyz - vec3(plot_u_3.plotCenter, plot_u_3.plotCenterZ)), plot_u_3);
}

vec3 cameraVector(vec3 p, PlotUniforms plot_u_4) {
  return basisVector((plot_u_4.model * vec4(p, 0.0)).xyz, plot_u_4);
}

vec3 sceneCenter(PlotUniforms plot_u_5) {
  return (plot_u_5.inverseModel * vec4(plot_u_5.plotCenter, plot_u_5.plotCenterZ, 1.0)).xyz;
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = vec3(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

vec3 homogeneous(vec3 p, PlotUniforms plot_u_7, bool direction) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 camera = (direction ? cameraVector(p, plot_u_7) : cameraPoint(p, plot_u_7));
  float w = ((plot_u_7.view3d == 2u) ? (direction ? (-camera.z) : (plot_u_7.cameraLens.y - camera.z)) : (direction ? 0.0 : plot_u_7.cameraLens.y));
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2(0.5, 0.5) + plot_u_7.plotPan) * w)) * size), w);
}

vec2 project(vec3 p, PlotUniforms plot_u_8) {
  vec3 h = homogeneous(p, plot_u_8, false);
  return (h.xy / max(h.z, 0.101));
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5, 0.5)) - plot_u_9.plotPan);
  vec2 size = plotSize(plot_u_9.resolution);
  vec2 cameraXY = (vec2((screen.x * (size.x / size.y)), screen.y) * plot_u_9.cameraLens.x);
  bool _cse0 = (plot_u_9.view3d == 2u);
  vec3 origin = (_cse0 ? vec3(0.0, 0.0, plot_u_9.cameraLens.y) : vec3((cameraXY * plot_u_9.cameraLens.y), plot_u_9.cameraLens.y));
  vec3 direction = (_cse0 ? vec3(cameraXY, -1.0) : vec3(0.0, 0.0, -1.0));
  return ViewRay((inverseCamera(origin, plot_u_9) + sceneCenter(plot_u_9)), inverseCamera(direction, plot_u_9));
}

vec3 surfaceColorBar(vec3 color, vec2 uv, PlotUniforms plot_u_10) {
  float _licm0 = plot_u_10.surfaceRange.x;
  float _licm1 = plot_u_10.surfaceRange.y;
  float _licm2 = (plot_u_10.appearance.w * 0.7);
  float _licm3 = ((plot_u_10.surfaceRange.y - plot_u_10.surfaceRange.x) * 0.5);
  float _licm4 = plot_u_10.appearance.w;
  float _licm5 = plot_u_10.labelStyle.y;
  if (((plot_u_10.surfaceFlags & 8u) == 0u)) {
    return color;
  }
  vec2 size = plotSize(plot_u_10.resolution);
  vec2 pixel = (uv * size);
  float height = min(160.0, (size.y * 0.36));
  vec2 lower = vec2((size.x - 25.0), ((size.y - 70.0) - height));
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - lower.y) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(plot_u_10.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(lower.x, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, lower.y), 0.7));
  result = mix(result, vec3(0.3, 0.3, 0.3), border);
  vec3 plot_labels_2 = vec3(0.0, 0.0, 0.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2((lower.x - 5.0), (mix(lower.y, upper.y, fraction) + _licm2));
    plot_labels_2 = max(plot_labels_2, numberAt(pixel, at, value, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(result, plot_labels_2);
}

vec2 df64_split(float a, float _fp64_g) {
  float _v0 = (a * (_fp64_g * 4097.0));
  float _v1 = ((_v0 * _fp64_g) - (_v0 - a));
  float _v2 = ((a * _fp64_g) - _v1);
  return vec2(_v1, _v2);
}

vec2 df64_twoProd(float a, float b, float _fp64_g) {
  float _v0 = (a * b);
  vec2 _v1 = df64_split(a, _fp64_g);
  vec2 _v2 = df64_split(b, _fp64_g);
  float _v3 = (((((_v1.x * _v2.x) - _v0) + (_v1.x * _v2.y)) + (_v1.y * _v2.x)) + (_v1.y * _v2.y));
  return vec2(_v0, _v3);
}

vec2 df64_quickTwoSum(float a, float b, float _fp64_g) {
  float _v0 = ((a + b) * _fp64_g);
  float _v1 = (b - ((_v0 - a) * _fp64_g));
  return vec2(_v0, _v1);
}

vec2 df64_mul(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoProd(a.x, b.x, _fp64_g);
  _v0.y = (_v0.y + (a.x * b.y));
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + (a.y * b.x));
  return df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
}

vec2 df64_twoSum(float a, float b, float _fp64_g) {
  float _v0 = (a + b);
  float _v1 = (((_v0 * _fp64_g) - a) * _fp64_g);
  float _v2 = (((a - ((_v0 - _v1) * _fp64_g)) * _fp64_g) + (b - _v1));
  return vec2(_v0, _v2);
}

vec2 df64_add(vec2 a, vec2 b, float _fp64_g) {
  vec2 _v0 = df64_twoSum(a.x, b.x, _fp64_g);
  vec2 _v1 = df64_twoSum(a.y, b.y, _fp64_g);
  _v0.y = (_v0.y + _v1.x);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  _v0.y = (_v0.y + _v1.y);
  _v0 = df64_quickTwoSum(_v0.x, _v0.y, _fp64_g);
  return _v0;
}

vec2 df64_sub(vec2 a, vec2 b, float _fp64_g) {
  return df64_add(a, (-b), _fp64_g);
}

vec2 df64_div(vec2 a, vec2 b, float _fp64_g) {
  float _v0 = (_fp64_g / b.x);
  vec2 _v1 = (a * _v0);
  float _v2 = df64_sub(a, df64_mul(b, _v1, _fp64_g), _fp64_g).x;
  vec2 _v3 = df64_twoProd(_v0, _v2, _fp64_g);
  return df64_add(_v1, _v3, _fp64_g);
}

vec2 widePower(int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = min(abs(exponent), 32);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _cse0 = vec2(1.0, 0.0);
  vec2 value = _cse0;
  for (int i = 0; (i < _licm0); i = (i + 1)) {
    value = df64_mul(value, _licm1, _fp64_g);
  }
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse2, _cse2);
  return ((exponent < 0) ? df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g) : value);
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  return ((_v0 == a.x) ? df64_quickTwoSum(_v0, floor(a.y), _fp64_g) : vec2(_v0, 0.0));
}

float df64_narrow(vec2 a) {
  return (a.x + a.y);
}

int wideDigit(vec2 value, int exponent) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _cse0 = vec2(0.25, 0.0);
  float _cse3 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse1 = vec2(_cse3, _cse3);
  vec2 integer = df64_floor(df64_div(df64_add(value, _cse0, _fp64_g), df64_add(widePower(exponent), _cse1, _fp64_g), _fp64_g), _fp64_g);
  vec2 _cse2 = vec2(10.0, 0.0);
  return _f2i(df64_narrow(df64_sub(df64_add(integer, _cse1, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(integer, _cse0, _fp64_g), df64_add(_cse2, _cse1, _fp64_g), _fp64_g), _fp64_g), _cse2, _fp64_g), _fp64_g)));
}

bool df64_lt(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y < b.y)));
}

vec2 df64_abs(vec2 a) {
  return ((a.x < 0.0) ? (-a) : a);
}

bool df64_gt(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y > b.y)));
}

bool df64_ge(vec2 a, vec2 b) {
  return ((a.x > b.x) || ((a.x == b.x) && (a.y >= b.y)));
}

WideNumberFormat wideNumberFormat(vec2 input_, float spacing) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse6 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _licm0 = vec2(_cse6, _cse6);
  vec2 _licm1 = vec2(10.0, 0.0);
  vec2 _licm2 = vec2(0.009999999776482582, 2.2351741291171123e-10);
  vec2 _cse0 = vec2(0.0, 0.0);
  float _cse7 = abs(spacing);
  vec2 value = (df64_lt(df64_abs(input_), vec2((_cse7 * 0.0001), 0.0)) ? _cse0 : input_);
  vec2 magnitude = df64_abs(value);
  float _cse1 = log2(10.0);
  int exponent = _f2i(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse1)));
  bool _gv0 = df64_gt(magnitude, _cse0);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  bool scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  float _cse2 = log2(max(_cse7, 1e-30));
  int decimals = _f2i(clamp(ceil(((-_cse2) / _cse1)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  int digits = 1;
  vec2 _cse3 = vec2(0.5, 0.0);
  vec2 _cse4 = vec2(0.25, 0.0);
  if (scientific) {
    decimals = _f2i(clamp(ceil((float(exponent) - (_cse2 / _cse1))), 0.0, 12.0));
    vec2 scale = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(df64_div(df64_add(magnitude, _licm0, _fp64_g), df64_add(widePower(exponent), _licm0, _fp64_g), _fp64_g), scale, _fp64_g), _cse3, _fp64_g), _fp64_g);
    if (df64_ge(magnitude, df64_mul(_licm1, scale, _fp64_g))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    vec2 _gv1 = widePower(decimals);
    magnitude = df64_floor(df64_add(df64_mul(magnitude, _gv1, _fp64_g), _cse3, _fp64_g), _fp64_g);
    vec2 integral = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), df64_add(_gv1, _licm0, _fp64_g), _fp64_g), _fp64_g);
    digits = max(1, (exponent + 1));
    if (df64_ge(integral, widePower(digits))) {
      digits += 1;
    }
    if (((digits > 1) && df64_lt(integral, widePower((digits - 1))))) {
      digits -= 1;
    }
  }
  vec2 _cse5 = df64_add(_licm1, _licm0, _fp64_g);
  for (int i = 0; (i < 13); i = (i + 1)) {
    if (((decimals > 0) && df64_lt(df64_abs(df64_sub(df64_add(magnitude, _licm0, _fp64_g), df64_mul(df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g), _licm1, _fp64_g), _fp64_g)), _licm2))) {
      magnitude = df64_floor(df64_div(df64_add(magnitude, _cse4, _fp64_g), _cse5, _fp64_g), _fp64_g);
      decimals -= 1;
    }
  }
  bool negative = df64_lt(value, _cse0);
  int length = (scientific ? ((5 + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)) : ((digits + ((decimals > 0) ? (1 + decimals) : 0)) + (negative ? 1 : 0)));
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

int wideNumberGlyph(WideNumberFormat n, int column) {
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
      return (48 + wideDigit(n.value, (n.decimals - digit)));
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
  return (48 + wideDigit(n.value, (((n.digits + n.decimals) - digit_1) - 1)));
}

vec2 wideTickNumberLayers(vec2 p, vec2 value, float spacing, float align, float fontSize, float halo) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return tickNumberLayers(p, df64_narrow(value), spacing, align, fontSize, halo);
  }
  WideNumberFormat n = wideNumberFormat(value, spacing);
  float advance = (fontSize * 0.625);
  vec2 offset = (p + vec2(((float(n.length) * advance) * align), 0.0));
  vec2 _cse1 = vec2(0.0, 0.0);
  if (((offset.y < 0.0) || (offset.y > (fontSize * 1.5)))) {
    return _cse1;
  }
  int column = _f2i(floor((offset.x / advance)));
  float atlasBearing = (fontSize * 0.125);
  vec2 coverage = _cse1;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    int index = (column + neighbor);
    if (((index >= 0) && (index < n.length))) {
      vec2 local = vec2(((offset.x - (float(index) * advance)) + atlasBearing), offset.y);
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(n, index), fontSize, halo));
    }
  }
  return coverage;
}

float wideNumberWidth(vec2 value, float spacing, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberWidth(df64_narrow(value), spacing, size);
  }
  return ((float(wideNumberFormat(value, spacing).length) * size) * 0.625);
}

float wideNumberPlate(vec2 p, vec2 value, float spacing, float align, float size) {
  vec2 _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2(100000.0, 0.0)))) {
    return numberPlate(p, df64_narrow(value), spacing, align, size);
  }
  float width = wideNumberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase(vec3 axis, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value value) {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

vec3 axisOriginH(vec3 axis, CoordinateUniforms_value u) {
  vec3 local = vec3((df64_narrow((-vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z))) * (1.0 - axis.z)));
  vec3 camera = cameraVector(local, CoordinateUniforms_as_PlotUniforms(u));
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5, 0.5) + u.plotPan) * w)) * size), w);
}

vec3 axisH(float value, vec3 axis, CoordinateUniforms_value u) {
  return (axisOriginH(axis, u) + (homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true) * value));
}

bool axisVisible(float value, vec3 axis, CoordinateUniforms_value u) {
  return ((u.view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
}

float wideWeight(vec2 value, vec3 levels, bool coarse) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing((coarse ? levels.x : levels.y)), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : (coarse ? (1.0 - levels.z) : levels.z));
}

vec3 wideNumberAt(vec2 pixel, vec2 anchor, vec2 value, float spacing, float align, float size, float halo, float plate) {
  vec2 delta = vec2((pixel.x - anchor.x), (anchor.y - pixel.y));
  if ((((delta.y < 0.0) || (delta.y > (size * 1.5))) || (abs(delta.x) > (size * 16.0)))) {
    return vec3(0.0, 0.0, 0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

float axisParameter(vec2 pixel, vec3 axis, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  vec3 direction = homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField(vec2 pixel, vec3 axis, ViewRay ray, CoordinateUniforms_value u) {
  vec3 origin = axisOriginH(axis, u);
  PlotUniforms _cse0 = CoordinateUniforms_as_PlotUniforms(u);
  vec3 direction = homogeneous(axis, _cse0, true);
  vec3 coefficients = cross(origin, direction);
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - project(vec3(0.0, 0.0, 0.0), _cse0)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  return (axisVisible(axisParameter(pixel, axis, u), axis, u) ? distanceCoverage(distance, u.appearance.x) : 0.0);
}

float groundFieldNarrow(ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
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
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels)));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

float groundField(vec2 uv, ViewRay ray, CoordinateUniforms_value u, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow(ray, u, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5, 0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = inverseCamera(eye, CoordinateUniforms_as_PlotUniforms(u));
  float _cse3 = abs(ray.direction.y);
  float denominator = ((_cse3 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float _cse7 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse4 = vec2(_cse7, _cse7);
  vec2 depth = df64_div(df64_add((-df64_add(_cse1, vec2(offset.y, 0.0), _fp64_g)), _cse4, _fp64_g), df64_add(vec2(denominator, 0.0), _cse4, _fp64_g), _fp64_g);
  vec2 gx = df64_add(df64_add(_cse0, vec2(offset.x, 0.0), _fp64_g), df64_mul(vec2(ray.direction.x, 0.0), depth, _fp64_g), _fp64_g);
  vec2 gz = df64_add(df64_add(_cse2, vec2(offset.z, 0.0), _fp64_g), df64_mul(vec2(ray.direction.z, 0.0), depth, _fp64_g), _fp64_g);
  vec2 high = vec2(df64_narrow(gx), df64_narrow(gz));
  vec2 _gv0 = df64_add(gx, _cse4, _fp64_g);
  vec2 _gv1 = df64_add(gz, _cse4, _fp64_g);
  vec2 low = vec2(df64_narrow(df64_sub(_gv0, df64_add(vec2(high.x, 0.0), _cse4, _fp64_g), _fp64_g)), df64_narrow(df64_sub(_gv1, df64_add(vec2(high.y, 0.0), _cse4, _fp64_g), _fp64_g)));
  vec2 dx = (dFdx(high) + dFdx(low));
  vec2 dy = (dFdy(high) + dFdy(low));
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20, 1e-20));
  float field = 0.0;
  vec2 _cse5 = vec2(0.5, 0.0);
  float _cse6 = pixelWidth();
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 _gv2 = df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 _gv3 = df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    vec2 phase = (vec2(df64_narrow(df64_fract(_gv2, _fp64_g)), df64_narrow(df64_fract(_gv3, _fp64_g))) - 0.5);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse6);
    vec2 separation = ((spacing / gradient) * _cse6);
    float _lc0 = (12.0 / _licm2);
    float _lc1 = (28.0 / _licm2);
    vec2 fade = smoothstep(vec2(_lc0, _lc0), vec2(_lc1, _lc1), separation);
    vec2 nx = df64_mul(df64_floor(_gv2, _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(_gv3, _fp64_g), sz, _fp64_g);
    bool _lc2 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc2), wideWeight(nz, zLevels, _lc2));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks(vec2 pixel, vec3 axis, int index, CoordinateUniforms_value u) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  float _cse1 = pixelWidth();
  float _licm3 = (3.0 + _cse1);
  bool _licm4 = (u.appearance.x > 0.0);
  float _licm5 = u.appearance.x;
  vec2 _licm6 = axisBase(axis, u);
  float _licm7 = u.labelStyle.y;
  float _licm8 = u.labelStyle.z;
  float _licm9 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH(axis, u), homogeneous(axis, CoordinateUniforms_as_PlotUniforms(u), true));
  float magnitude = length(axisLine.xy);
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse1)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  vec2 tangent = vec2(normal.y, (-normal.x));
  float low = (min(0.0, (tangent.x * size.x)) + min(0.0, (tangent.y * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0, 0.0, 0.0);
  float ticks = 0.0;
  float _cse0 = (((_licm5 * 0.5) + 4.0) + _cse1);
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse1))) && (delta.y <= _licm3));
    bool nearTick = (_licm4 && all(lessThanEqual(abs((pixel - at)), vec2(_cse0, _cse0))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm5) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm6, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm7, _licm8) * style.w) * _licm9));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport(CoordinateUniforms_value value) {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

SpatialDecor cachedSpatialBackground(vec2 uv, CoordinateUniforms_value u) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport(u);
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms(u));
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField(uv, ray, u, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField(pixel, _cse0, ray, u));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField(pixel, _cse1, ray, u));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField(pixel, _cse2, ray, u));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    for (int index = 0; (index < 3); index = (index + 1)) {
      vec4 name = loadLabels(ivec2(index, 36));
      if ((name.w > 0.0)) {
        labels = max(labels, (axisLabel(pixel, name.xy, _f2i(name.z), _licm0) * _licm1));
      }
    }
  }
  return SpatialDecor(mix(_cse3, color, u.sceneOpacity.x), (labels * u.sceneOpacity.x));
}

vec3 labelColorWide(vec3 color, vec3 layers) {
  vec3 plated = mix(color, vec3(0.995, 0.995, 0.995), (layers.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), layers.y), vec3(0.25, 0.29, 0.35), layers.x);
}

vec4 labels(vec2 uv, bool surface) {
  SpatialDecor decor = cachedSpatialBackground(uv, CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin));
  vec3 _cse0 = vec3(0.0, 0.0, 0.0);
  vec3 black = labelColorWide(_cse0, decor.labels);
  vec3 white = labelColorWide(vec3(1.0, 1.0, 1.0), decor.labels);
  if (surface) {
    PlotUniforms _cse1 = CoordinateUniforms_as_PlotUniforms(CoordinateUniforms_value(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceDepth, u.surfaceRender, u.surfaceFlags, u.axesOrigin));
    black = mix(black, surfaceColorBar(black, uv, _cse1), u.sceneOpacity.y);
    white = mix(white, surfaceColorBar(white, uv, _cse1), u.sceneOpacity.y);
  }
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = labels(uv, true);
}
`,blocks:{u:"CoordinateUniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null,_fp64:null}}}}};var m={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}},u=class{constructor(l,a,t,i){this.owner=l;this.format=a;this.surface=t;this.limit=i;this.program=l.runtime.load(this.pack)}pack=d;program;labels;backdrop;overlay;cache;async initialize(){let l=["buildSpatialLabels","drawBackdrop",this.surface?"drawSurfaceLabels":"drawLabels"],a=await Promise.allSettled(l.map((i,o)=>this.owner.run(()=>this.program.render({vertex:"fullscreen",fragment:i,targets:[o===0?"rgba32uint":o===2?{format:this.format,blend:m}:this.format]})))),t=a.find(i=>i.status==="rejected");if(t?.status==="rejected")throw t.reason;[this.labels,this.backdrop,this.overlay]=a.map(i=>i.value)}draw(l,a,t,i,o="clear"){let s=new Set(this.pack.entries.filter(c=>c.name===a.vertex||c.name===a.fragment).flatMap(c=>(c.bindings??[]).map(e=>e.name)));l.pass({color:[{target:i,load:o}]},c=>c.draw(a,Object.fromEntries(Object.entries(t).filter(([e])=>s.has(e))),{count:3}))}prepare(l,a,t,i){let o=a.u,s=o.resolution,c=Math.min(this.limit,Math.ceil(Math.hypot(...s)*t)+2),e=i?void 0:this.cache;e||(e={texture:this.owner.runtime.texture({size:[c,38],format:"rgba32uint"}),key:""},i||(this.cache=e)),e.texture.width!==c&&(e.texture.resize(c,38),e.key="");let r=o.curveTiles,n={...o,model:o.axesModel,inverseModel:o.inverseAxesModel,curveTiles:[r[0],r[1],r[2],c]},_={u:n,glyphAtlas:a.bindings.glyphAtlas,font:{pixelRatio:t},spatialLabels:e.texture},v=JSON.stringify([n.resolution,n.axesOrigin,n.plotSpan,n.plotPan,n.rotationBasis,n.cameraLens,n.view3d,n.appearance,n.labelStyle,n.decorations,n.decorationOpacity,n.sceneOpacity,n.model,n.inverseModel,t]);try{e.key!==v&&(this.draw(l,this.labels,_,e.texture),e.key=v)}catch(f){throw i?e.texture.destroy():e.key="",f}return{bindings:_,finish(f){i?e.texture.destroy():f||(e.key="")}}}background(l,a,t){this.draw(l,this.backdrop,a.bindings,t)}foreground(l,a,t){this.draw(l,this.overlay,a.bindings,t,"load")}dispose(){this.cache?.texture.destroy(),this.cache=void 0}};export{u as CoordinatesRenderer};
