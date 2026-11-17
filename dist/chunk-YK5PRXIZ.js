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
  surfaceHeight: vec2<f32>,
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
  surfaceHeight: vec2<f32>,
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

struct _spec7_result {
  labels: vec3<f32>,
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
  let distance = (length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0));
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
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2<f32>(15.0, 18.0);
      origin = vec2<i32>(((code - 32) * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2<f32>(60.0, 72.0);
      let _cse1 = (code - 32);
      origin = vec2<i32>(((_cse1 % 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  let q = ((p * (referenceSize / fontSize)) - vec2<f32>(0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2<f32>(0.0);
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
  let _cse0 = abs(spacing);
  let value = select(input, 0.0, (abs(input) < (_cse0 * 0.0001)));
  var magnitude: f32 = abs(value);
  let _cse1 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(magnitude, 1e-30)) / _cse1)));
  let scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  var decimals: i32 = i32(clamp(ceil(((-log2(max(_cse0, 1e-30))) / _cse1)), 0.0, 6.0));
  var digits: i32 = 1;
  if (scientific) {
    decimals = i32(clamp(_flow131_shared(exponent, spacing), 0.0, 6.0));
    let scale = pow(10.0, f32(decimals));
    magnitude = floor((((magnitude / pow(10.0, f32(exponent))) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    let _gv0 = pow(10.0, f32(decimals));
    magnitude = floor(((magnitude * _gv0) + 0.5));
    digits = (i32(floor((log2(max(floor((magnitude / _gv0)), 1.0)) / _cse1))) + 1);
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

fn numberFormat_into(_dst: ptr<function, NumberFormat>, input: f32, spacing: f32) {
  let _cse0 = abs(spacing);
  let value = select(input, 0.0, (abs(input) < (_cse0 * 0.0001)));
  var magnitude: f32 = abs(value);
  let _cse1 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(magnitude, 1e-30)) / _cse1)));
  let scientific = ((magnitude > 0.0) && ((exponent >= 5) || (exponent < -3)));
  var decimals: i32 = i32(clamp(ceil(((-log2(max(_cse0, 1e-30))) / _cse1)), 0.0, 6.0));
  var digits: i32 = 1;
  if (scientific) {
    decimals = i32(clamp(_flow131_shared(exponent, spacing), 0.0, 6.0));
    let scale = pow(10.0, f32(decimals));
    magnitude = floor((((magnitude / pow(10.0, f32(exponent))) * scale) + 0.5));
    if ((magnitude >= (10.0 * scale))) {
      magnitude = scale;
      exponent = (exponent + 1);
    }
  } else {
    let _gv0 = pow(10.0, f32(decimals));
    magnitude = floor(((magnitude * _gv0) + 0.5));
    digits = (i32(floor((log2(max(floor((magnitude / _gv0)), 1.0)) / _cse1))) + 1);
  }
  for (var i: i32 = 0; (i < 6); i = (i + 1)) {
    if (((decimals > 0) && (abs((magnitude - (floor((magnitude / 10.0)) * 10.0))) < 0.01))) {
      magnitude /= 10.0;
      decimals -= 1;
    }
  }
  let negative = (value < 0.0);
  let length = select(((digits + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), ((5 + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), scientific);
  (*_dst) = NumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

fn numberGlyph(n: ptr<function, NumberFormat>, column: i32) -> i32 {
  var i: i32 = column;
  if (((*n).negative && (i == 0))) {
    return 45;
  }
  i = (i - select(0, 1, (*n).negative));
  let _cse0 = ((*n).decimals > 0);
  if ((*n).scientific) {
    let mantissaLength = (1 + select(0, (1 + (*n).decimals), _cse0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      let digit = (i - select(0, 1, (i > 1)));
      return (48 + (i32(floor(((*n).value / pow(10.0, f32(((*n).decimals - digit)))))) % 10));
    }
    let suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return select(43, 45, ((*n).exponent < 0));
    }
    let _cse1 = abs((*n).exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + (_cse1 % 10));
  }
  if ((_cse0 && (i == (*n).digits))) {
    return 46;
  }
  let digit_1 = (i - select(0, 1, (i > (*n).digits)));
  return (48 + (i32(floor(((*n).value / pow(10.0, f32(((((*n).digits + (*n).decimals) - digit_1) - 1)))))) % 10));
}

fn tickNumberLayers(p: vec2<f32>, value: f32, spacing: f32, align: f32, fontSize: f32, halo: f32) -> vec2<f32> {
  var n: NumberFormat;
  numberFormat_into(&n, value, spacing);
  let advance = (fontSize * 0.625);
  let offset = (p + vec2<f32>(((f32(n.length) * advance) * align), 0.0));
  let _cse0 = vec2<f32>(0.0);
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
      coverage = max(coverage, glyphLayers(local, numberGlyph(&n, index), fontSize, halo));
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
  let q = ((abs((p - center)) - half) + vec2<f32>(3.0));
  let distance = _flow135_shared(q, q.x, q.y);
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
    return vec3<f32>(t);
  }
  if ((palette == 2u)) {
    let _cse0 = vec3<f32>(0.87);
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

fn plotSize(resolution: vec2<f32>) -> vec2<f32> {
  return max(resolution, vec2<f32>(1.0));
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
  if ((((width <= 0.0) || any((p < (min(a, b) - vec2<f32>((radius + 1.0)))))) || any((p > (max(a, b) + vec2<f32>((radius + 1.0))))))) {
    return 0.0;
  }
  let ab = (b - a);
  let _cse0 = (p - a);
  let t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

fn numberAt(pixel: vec2<f32>, anchor: vec2<f32>, value: f32, spacing: f32, align: f32, size: f32, halo: f32, plate: f32) -> vec3<f32> {
  let _cse0 = (pixel.x - anchor.x);
  let _cse1 = (anchor.y - pixel.y);
  let delta = vec2<f32>(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3<f32>(0.0);
  }
  return vec3<f32>(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

fn labelColor(color: vec3<f32>, plot_labels: vec3<f32>) -> vec3<f32> {
  let plated = mix(color, vec3<f32>(0.995), (plot_labels.z * 0.94));
  return _flow139_shared(plated, plot_labels.y, plot_labels.x);
}

fn basisVector(p: vec3<f32>, plot_u_2: ptr<function, PlotUniforms>) -> vec3<f32> {
  let span = max((*plot_u_2).plotSpan, vec2<f32>(0.00001));
  let q = (p / vec3<f32>(span, max(span.x, span.y)));
  let basis = (*plot_u_2).rotationBasis;
  let horizontal = ((q.x * basis.y) + (q.z * basis.x));
  let depth = (((-q.x) * basis.x) + (q.z * basis.y));
  return vec3<f32>(horizontal, ((q.y * basis.w) - (depth * basis.z)), ((q.y * basis.z) + (depth * basis.w)));
}

fn cameraPoint(p: vec3<f32>, plot_u_3: ptr<function, PlotUniforms>) -> vec3<f32> {
  return basisVector((((*plot_u_3).model * vec4<f32>(p, 1.0)).xyz - vec3<f32>((*plot_u_3).plotCenter, (*plot_u_3).plotCenterZ)), plot_u_3);
}

fn cameraVector(p: vec3<f32>, plot_u_4: ptr<function, PlotUniforms>) -> vec3<f32> {
  return basisVector(((*plot_u_4).model * vec4<f32>(p, 0.0)).xyz, plot_u_4);
}

fn sceneCenter(plot_u_5: ptr<function, PlotUniforms>) -> vec3<f32> {
  return ((*plot_u_5).inverseModel * vec4<f32>((*plot_u_5).plotCenter, (*plot_u_5).plotCenterZ, 1.0)).xyz;
}

fn inverseCamera(p: vec3<f32>, plot_u_6: ptr<function, PlotUniforms>) -> vec3<f32> {
  let basis = (*plot_u_6).rotationBasis;
  let y = ((p.y * basis.w) + (p.z * basis.z));
  let depth = (((-p.y) * basis.z) + (p.z * basis.w));
  let q = vec3<f32>(((p.x * basis.y) - (depth * basis.x)), y, ((p.x * basis.x) + (depth * basis.y)));
  return ((*plot_u_6).inverseModel * vec4<f32>((q * vec3<f32>((*plot_u_6).plotSpan, max((*plot_u_6).plotSpan.x, (*plot_u_6).plotSpan.y))), 0.0)).xyz;
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
  var _sel0: vec2<f32>;
  if ((exponent < 0)) {
    let _cse2 = bitcast<f32>(bitcast<u32>(0.0));
    let _cse1 = vec2<f32>(_cse2, _cse2);
    _sel0 = df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g);
  } else {
    _sel0 = value;
  }
  return _sel0;
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
  let _cse0 = abs(spacing);
  let _cse1 = vec2<f32>(0.0, 0.0);
  let value = select(input, _cse1, df64_lt(df64_abs(input), vec2<f32>((_cse0 * 0.0001), 0.0)));
  var magnitude: vec2<f32> = df64_abs(value);
  let _cse2 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse2)));
  let _gv0 = df64_gt(magnitude, _cse1);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  let scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  var decimals: i32 = i32(clamp(ceil(((-log2(max(_cse0, 1e-30))) / _cse2)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  var digits: i32 = 1;
  let _cse3 = vec2<f32>(0.5, 0.0);
  let _cse4 = vec2<f32>(0.25, 0.0);
  if (scientific) {
    decimals = i32(clamp(_flow131_shared(exponent, spacing), 0.0, 12.0));
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
  let negative = df64_lt(value, _cse1);
  let length = select(((digits + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), ((5 + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), scientific);
  return WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

fn wideNumberFormat_into(_dst: ptr<function, WideNumberFormat>, input: vec2<f32>, spacing: f32) {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse6 = bitcast<f32>(bitcast<u32>(0.0));
  let _licm0 = vec2<f32>(_cse6, _cse6);
  let _licm1 = vec2<f32>(10.0, 0.0);
  let _licm2 = vec2<f32>(0.009999999776482582, 2.2351741291171123e-10);
  let _cse0 = abs(spacing);
  let _cse1 = vec2<f32>(0.0, 0.0);
  let value = select(input, _cse1, df64_lt(df64_abs(input), vec2<f32>((_cse0 * 0.0001), 0.0)));
  var magnitude: vec2<f32> = df64_abs(value);
  let _cse2 = log2(10.0);
  var exponent: i32 = i32(floor((log2(max(df64_narrow(magnitude), 1e-30)) / _cse2)));
  let _gv0 = df64_gt(magnitude, _cse1);
  if ((_gv0 && df64_lt(magnitude, widePower(exponent)))) {
    exponent -= 1;
  }
  if (df64_ge(magnitude, widePower((exponent + 1)))) {
    exponent += 1;
  }
  let scientific = (_gv0 && ((exponent >= 12) || (exponent < -3)));
  var decimals: i32 = i32(clamp(ceil(((-log2(max(_cse0, 1e-30))) / _cse2)), 0.0, 12.0));
  if ((scientific == false)) {
    decimals = min(decimals, max(0, (12 - exponent)));
  }
  var digits: i32 = 1;
  let _cse3 = vec2<f32>(0.5, 0.0);
  let _cse4 = vec2<f32>(0.25, 0.0);
  if (scientific) {
    decimals = i32(clamp(_flow131_shared(exponent, spacing), 0.0, 12.0));
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
  let negative = df64_lt(value, _cse1);
  let length = select(((digits + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), ((5 + select(0, (1 + decimals), (decimals > 0))) + select(0, 1, negative)), scientific);
  (*_dst) = WideNumberFormat(magnitude, negative, scientific, decimals, digits, exponent, length);
}

fn wideNumberGlyph(n: ptr<function, WideNumberFormat>, column: i32) -> i32 {
  var i: i32 = column;
  if (((*n).negative && (i == 0))) {
    return 45;
  }
  i = (i - select(0, 1, (*n).negative));
  let _cse0 = ((*n).decimals > 0);
  if ((*n).scientific) {
    let mantissaLength = (1 + select(0, (1 + (*n).decimals), _cse0));
    if ((i < mantissaLength)) {
      if ((_cse0 && (i == 1))) {
        return 46;
      }
      let digit = (i - select(0, 1, (i > 1)));
      return (48 + wideDigit((*n).value, ((*n).decimals - digit)));
    }
    let suffix = (i - mantissaLength);
    if ((suffix == 0)) {
      return 101;
    }
    if ((suffix == 1)) {
      return select(43, 45, ((*n).exponent < 0));
    }
    let _cse1 = abs((*n).exponent);
    if ((suffix == 2)) {
      return (48 + (_cse1 / 10));
    }
    return (48 + (_cse1 % 10));
  }
  if ((_cse0 && (i == (*n).digits))) {
    return 46;
  }
  let digit_1 = (i - select(0, 1, (i > (*n).digits)));
  return (48 + wideDigit((*n).value, ((((*n).digits + (*n).decimals) - digit_1) - 1)));
}

fn wideTickNumberLayers(p: vec2<f32>, value: vec2<f32>, spacing: f32, align: f32, fontSize: f32, halo: f32) -> vec2<f32> {
  let _cse0 = df64_abs(value);
  if ((df64_lt(_cse0, vec2<f32>((abs(spacing) * 1024.0), 0.0)) && df64_lt(_cse0, vec2<f32>(100000.0, 0.0)))) {
    return tickNumberLayers(p, df64_narrow(value), spacing, align, fontSize, halo);
  }
  var n: WideNumberFormat;
  wideNumberFormat_into(&n, value, spacing);
  let advance = (fontSize * 0.625);
  let offset = (p + vec2<f32>(((f32(n.length) * advance) * align), 0.0));
  let _cse1 = vec2<f32>(0.0);
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
      coverage = max(coverage, glyphLayers(local, wideNumberGlyph(&n, index), fontSize, halo));
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
  let q = ((abs((p - center)) - half) + vec2<f32>(3.0));
  let distance = _flow135_shared(q, q.x, q.y);
  let aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

fn loadLabels(at: vec2<i32>) -> vec4<f32> {
  return bitcast<vec4<f32>>(textureLoad(spatialLabels, at, 0u));
}

fn axisBase(axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec2<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2<f32>((*u).axesOrigin.hi.x, (*u).axesOrigin.lo.x), vec2<f32>(axis.x, 0.0), _fp64_g), df64_mul(vec2<f32>((*u).axesOrigin.hi.y, (*u).axesOrigin.lo.y), vec2<f32>(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2<f32>((*u).axesOrigin.hi.z, (*u).axesOrigin.lo.z), vec2<f32>(axis.z, 0.0), _fp64_g), _fp64_g);
}

fn CoordinateUniforms_as_PlotUniforms(value: CoordinateUniforms) -> PlotUniforms {
  return PlotUniforms(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity, value.model, value.inverseModel, value.axesModel, value.inverseAxesModel, value.sceneOpacity, value.cameraLens, value.plotCenterZ, value.probe, value.parameterFocusSeed, value.view3d, value.parameterBounds, value.parameterMode, value.curveQuality, value.curvePattern, value.curveTiles, value.surfaceBounds, value.surfaceDomainMode, value.surfaceRange, value.surfaceHeight, value.surfaceDepth, value.surfaceRender, value.surfaceFlags);
}

fn axisOriginH(axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  let local = vec3<f32>((df64_narrow((-vec2<f32>((*u).axesOrigin.hi.x, (*u).axesOrigin.lo.x))) * (1.0 - axis.x)), (df64_narrow((-vec2<f32>((*u).axesOrigin.hi.y, (*u).axesOrigin.lo.y))) * (1.0 - axis.y)), (df64_narrow((-vec2<f32>((*u).axesOrigin.hi.z, (*u).axesOrigin.lo.z))) * (1.0 - axis.z)));
  let camera = _flow5_fused(local, u);
  let size = plotSize((*u).resolution);
  let w = select((*u).cameraLens.y, ((*u).cameraLens.y - camera.z), ((*u).view3d == 2u));
  return vec3<f32>((((vec2<f32>((camera.x / (size.x / size.y)), camera.y) / (*u).cameraLens.x) + ((vec2<f32>(0.5) + (*u).plotPan) * w)) * size), w);
}

fn axisH(value: f32, axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  return (axisOriginH(axis, u) + (_flow15_fused(axis, u) * value));
}

fn projectAxis(value: f32, axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec2<f32> {
  let at = axisH(value, axis, u);
  return (at.xy / max(at.z, 0.101));
}

fn axisVisible(value: f32, axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> bool {
  return (((*u).view3d != 2u) || (axisH(value, axis, u).z >= 0.101));
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
  let _cse0 = (pixel.x - anchor.x);
  let _cse1 = (anchor.y - pixel.y);
  let delta = vec2<f32>(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3<f32>(0.0);
  }
  return vec3<f32>(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

fn axisField(pixel: vec2<f32>, axis: vec3<f32>, ray: ptr<function, ViewRay>, u: ptr<uniform, CoordinateUniforms>) -> f32 {
  let origin = axisOriginH(axis, u);
  let coefficients = cross(origin, _flow15_fused(axis, u));
  let magnitude = length(coefficients.xy);
  var distance: f32 = length((pixel - _flow25_fused(vec3<f32>(0.0), u)));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3<f32>(pixel, 1.0))) / magnitude);
  }
  var _sel1: f32;
  if (axisVisible(axisParameter(pixel, axis, u), axis, u)) {
    _sel1 = distanceCoverage(distance, (*u).appearance.x);
  } else {
    _sel1 = 0.0;
  }
  return _sel1;
}

fn groundFieldNarrow(ray: ptr<function, ViewRay>, u: ptr<uniform, CoordinateUniforms>, xLevels: vec3<f32>, zLevels: vec3<f32>) -> f32 {
  let _licm0 = vec2<f32>(xLevels.x, zLevels.x);
  let _licm1 = vec2<f32>(xLevels.y, zLevels.y);
  let _licm2 = clamp((*u).labelStyle.x, 0.5, 2.0);
  let _licm3 = (*u).appearance.y;
  let _cse0 = abs((*ray).direction.y);
  let denominator = select((*ray).direction.y, select(1e-8, -1e-8, ((*ray).direction.y < 0.0)), (_cse0 < 1e-8));
  let depth = ((-(*ray).origin.y) / denominator);
  let ground = ((*ray).origin + ((*ray).direction * depth)).xz;
  let gradient = max(vec2<f32>(length(vec2<f32>(dpdx(ground.x), dpdy(ground.x))), length(vec2<f32>(dpdx(ground.y), dpdy(ground.y)))), vec2<f32>(1e-20));
  var field: f32 = 0.0;
  let _cse1 = pixelWidth();
  let _licm4 = vec2<f32>((12.0 / _licm2));
  let _licm5 = vec2<f32>((28.0 / _licm2));
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let _gv0 = (level == 0);
    let spacing = select(_licm1, _licm0, _gv0);
    let _gv1 = ((ground / spacing) + 0.5);
    let distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    let separation = ((spacing / gradient) * _cse1);
    let fade = smoothstep(_licm4, _licm5, separation);
    let nearest = (floor(_gv1) * spacing);
    var _sel2: vec2<f32>;
    if (_gv0) {
      _sel2 = vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels));
    } else {
      _sel2 = vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels));
    }
    let weights = _sel2;
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return select(0.0, (field * (*u).decorationOpacity.x), (((((*u).view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && (((*u).decorations & 1u) != 0u)));
}

fn groundField(uv: vec2<f32>, ray: ptr<function, ViewRay>, u: ptr<uniform, CoordinateUniforms>, xLevels: vec3<f32>, zLevels: vec3<f32>) -> f32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _licm0 = vec2<f32>(xLevels.x, zLevels.x);
  let _licm1 = vec2<f32>(xLevels.y, zLevels.y);
  let _licm2 = clamp((*u).labelStyle.x, 0.5, 2.0);
  let _licm3 = (*u).appearance.y;
  let _cse0 = vec2<f32>((*u).axesOrigin.hi.x, (*u).axesOrigin.lo.x);
  let _cse1 = vec2<f32>((*u).axesOrigin.hi.y, (*u).axesOrigin.lo.y);
  let _cse2 = vec2<f32>((*u).axesOrigin.hi.z, (*u).axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2<f32>((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow(ray, u, xLevels, zLevels);
  }
  let screen = ((uv - vec2<f32>(0.5)) - (*u).plotPan);
  let size = plotSize((*u).resolution);
  let xy = (vec2<f32>((screen.x * (size.x / size.y)), screen.y) * (*u).cameraLens.x);
  let eye = select(vec3<f32>((xy * (*u).cameraLens.y), (*u).cameraLens.y), vec3<f32>(0.0, 0.0, (*u).cameraLens.y), ((*u).view3d == 2u));
  let offset = _flow35_fused(eye, u);
  let _cse3 = abs((*ray).direction.y);
  let denominator = select((*ray).direction.y, select(1e-8, -1e-8, ((*ray).direction.y < 0.0)), (_cse3 < 1e-8));
  let _cse7 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse4 = vec2<f32>(_cse7, _cse7);
  let depth = df64_div(df64_add((-df64_add(_cse1, vec2<f32>(offset.y, 0.0), _fp64_g)), _cse4, _fp64_g), df64_add(vec2<f32>(denominator, 0.0), _cse4, _fp64_g), _fp64_g);
  let gx = df64_add(df64_add(_cse0, vec2<f32>(offset.x, 0.0), _fp64_g), df64_mul(vec2<f32>((*ray).direction.x, 0.0), depth, _fp64_g), _fp64_g);
  let gz = df64_add(df64_add(_cse2, vec2<f32>(offset.z, 0.0), _fp64_g), df64_mul(vec2<f32>((*ray).direction.z, 0.0), depth, _fp64_g), _fp64_g);
  let high = vec2<f32>(df64_narrow(gx), df64_narrow(gz));
  let _gv0 = df64_add(gx, _cse4, _fp64_g);
  let _gv1 = df64_add(gz, _cse4, _fp64_g);
  let low = vec2<f32>(df64_narrow(df64_sub(_gv0, df64_add(vec2<f32>(high.x, 0.0), _cse4, _fp64_g), _fp64_g)), df64_narrow(df64_sub(_gv1, df64_add(vec2<f32>(high.y, 0.0), _cse4, _fp64_g), _fp64_g)));
  let dx = (dpdx(high) + dpdx(low));
  let dy = (dpdy(high) + dpdy(low));
  let gradient = max(vec2<f32>(length(vec2<f32>(dx.x, dy.x)), length(vec2<f32>(dx.y, dy.y))), vec2<f32>(1e-20));
  var field: f32 = 0.0;
  let _cse5 = vec2<f32>(0.5, 0.0);
  let _cse6 = pixelWidth();
  let _licm4 = vec2<f32>((12.0 / _licm2));
  let _licm5 = vec2<f32>((28.0 / _licm2));
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let spacing = select(_licm1, _licm0, (level == 0));
    let sx = wideGridSpacing(spacing.x);
    let sz = wideGridSpacing(spacing.y);
    let _gv2 = df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    let _gv3 = df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse5, _fp64_g);
    let phase = (vec2<f32>(df64_narrow(df64_fract(_gv2, _fp64_g)), df64_narrow(df64_fract(_gv3, _fp64_g))) - 0.5);
    let distance = (((abs(phase) * spacing) / gradient) * _cse6);
    let separation = ((spacing / gradient) * _cse6);
    let fade = smoothstep(_licm4, _licm5, separation);
    let nx = df64_mul(df64_floor(_gv2, _fp64_g), sx, _fp64_g);
    let nz = df64_mul(df64_floor(_gv3, _fp64_g), sz, _fp64_g);
    let _lc0 = (level != 0);
    let weights = vec2<f32>(wideWeight(nx, xLevels, _lc0), wideWeight(nz, zLevels, _lc0));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return select(0.0, (field * (*u).decorationOpacity.x), (((((*u).view3d != 2u) || df64_ge(depth, vec2<f32>(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && (((*u).decorations & 1u) != 0u)));
}

fn axisParameter(pixel: vec2<f32>, axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> f32 {
  let origin = axisOriginH(axis, u);
  let direction = _flow15_fused(axis, u);
  let line = cross(origin, direction);
  let foot = (pixel - ((line.xy * dot(line, vec3<f32>(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  let slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

fn spatialLevels(axis: vec3<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let center = axisParameter((plotSize((*u).resolution) * 0.5), axis, u);
  let span = max((*u).plotSpan.x, (*u).plotSpan.y);
  let at = axisH(center, axis, u);
  let direction = _flow15_fused(axis, u);
  let tangent = (((direction.xy * at.z) - (at.xy * direction.z)) / max((at.z * at.z), 1e-20));
  let pixels = max((length(tangent) * span), 1.0);
  let horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  let absolute = df64_add(axisBase(axis, u), vec2<f32>(center, 0.0), _fp64_g);
  let rough = (((span * (*u).appearance.w) * 4.0) / pixels);
  let _cse1 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse0 = vec2<f32>(_cse1, _cse1);
  let _lc0 = vec2<f32>((span * 0.5), 0.0);
  let width = max(wideNumberWidth(df64_sub(df64_add(absolute, _cse0, _fp64_g), df64_add(_lc0, _cse0, _fp64_g), _fp64_g), rough, (*u).appearance.w), wideNumberWidth(df64_add(absolute, _lc0, _fp64_g), rough, (*u).appearance.w));
  let gap = select(((*u).appearance.w * 2.6), max(((*u).appearance.w * 3.5), (width + ((*u).appearance.w * 1.3))), horizontal);
  return tickLevels(((span * gap) / max((pixels * (*u).labelStyle.x), 1.0)));
}

fn prepareSpatialLabels(position: vec4<f32>, u: ptr<uniform, CoordinateUniforms>) -> vec4<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let row = i32(position.y);
  let column = i32(position.x);
  let size = plotSize((*u).resolution);
  let _cse0 = vec4<f32>(0.0);
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
    let _cse4 = vec2<f32>(18.0);
    let at = clamp((projectAxis(t, axis, u) + vec2<f32>(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4<f32>(at, f32((120 + column)), select(0.0, 1.0, axisVisible(t, axis, u)));
  }
  let axisIndex = (row / 12);
  let candidate = ((row / 2) % 6);
  let axis_1 = select(select(_cse3, _cse2, (axisIndex == 1)), _cse1, (axisIndex == 0));
  let originH = axisOriginH(axis_1, u);
  let axisLine = cross(originH, _flow15_fused(axis_1, u));
  let magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  let normal = (axisLine.xy / magnitude);
  let _gv0 = (-normal.x);
  let tangent = vec2<f32>(normal.y, _gv0);
  let extent = dot(abs(tangent), size);
  let low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  let along = (low + ((position.x / f32((*u).curveTiles.w)) * extent));
  let foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  let levels = spatialLevels(axis_1, u);
  let _gv1 = (candidate < 3);
  let stride = select(levels.y, levels.x, _gv1);
  let _gv2 = axisBase(axis_1, u);
  let absolute = df64_add(_gv2, vec2<f32>(axisParameter(foot, axis_1, u), 0.0), _fp64_g);
  let _cse8 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse5 = vec2<f32>(_cse8, _cse8);
  let _lc0 = wideGridSpacing(stride);
  let number = df64_mul(df64_add(df64_floor(df64_add(df64_div(df64_add(absolute, _cse5, _fp64_g), df64_add(_lc0, _cse5, _fp64_g), _fp64_g), vec2<f32>(0.5, 0.0), _fp64_g), _fp64_g), vec2<f32>(f32(((candidate % 3) - 1)), 0.0), _fp64_g), _lc0, _fp64_g);
  let t_1 = df64_narrow(df64_sub(df64_add(number, _cse5, _fp64_g), df64_add(_gv2, _cse5, _fp64_g), _fp64_g));
  if ((axisVisible(t_1, axis_1, u) == false)) {
    return _cse0;
  }
  let at_1 = projectAxis(t_1, axis_1, u);
  let fontSize = (*u).appearance.w;
  let sign = select(select(1.0, -1.0, (normal.y > 0.0)), select(1.0, -1.0, (normal.x > 0.0)), (axis_1.y > 0.0));
  let outward = (normal * sign);
  if (((row % 2) == 0)) {
    return vec4<f32>(at_1, outward);
  }
  let anchor = _flow143_shared(at_1, outward, fontSize);
  let width = wideNumberWidth(number, levels.x, fontSize);
  let before = projectAxis((t_1 - stride), axis_1, u);
  let after = projectAxis((t_1 + stride), axis_1, u);
  let separation = min(abs((at_1 - before)), abs((after - at_1)));
  let _gv3 = (width + fontSize);
  let _gv4 = ((fontSize * 1.8) + 6.0);
  let fit = smoothstep(0.85, 1.15, max((separation.x / _gv3), (separation.y / _gv4)));
  var _sel3: f32;
  if (_gv1) {
    _sel3 = _spec2_wideWeight(number, levels);
  } else {
    _sel3 = _spec3_wideWeight(number, levels);
  }
  let visibility = (_sel3 * fit);
  let _lc1 = (width * 0.5);
  let room = min(min(((anchor.x - _lc1) - 3.0), (((size.x - anchor.x) - _lc1) - 3.0)), min((anchor.y - (fontSize * 1.5)), (size.y - anchor.y)));
  let zero = df64_le(df64_abs(number), vec2<f32>((levels.x * 0.001), 0.0));
  var _sel4: f32;
  let _cse6 = _flow25_fused(vec3<f32>(0.0), u);
  if (zero) {
    _sel4 = select(0.0, 1.0, (axis_1.x > 0.0));
  } else {
    _sel4 = smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse6)));
  }
  let crossing = _sel4;
  var priority: f32 = 1.0;
  if ((axisIndex == 2)) {
    let xDirection = _flow15_fused(_cse1, u);
    let zDirection = _flow15_fused(_cse3, u);
    let _cse7 = vec2<f32>(1e-12);
    let xTangent = normalize(((xDirection.xy - (_cse6 * xDirection.z)) + _cse7));
    let zTangent = normalize(((zDirection.xy - (_cse6 * zDirection.z)) + _cse7));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4<f32>(t_1, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}

fn cachedSpatialTicks(pixel: vec2<f32>, axis: vec3<f32>, index: i32, u: ptr<uniform, CoordinateUniforms>) -> vec4<f32> {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _licm0 = (index * 12);
  let _licm1 = (((*u).decorations & 2u) != 0u);
  let _licm2 = ((*u).appearance.x > 0.0);
  let _licm3 = (((*u).appearance.x * 0.5) + 4.0);
  let _licm4 = (*u).appearance.x;
  let _licm5 = axisBase(axis, u);
  let _licm6 = (*u).labelStyle.y;
  let _licm7 = (*u).labelStyle.z;
  let _licm8 = (*u).decorationOpacity.y;
  let size = plotSize((*u).resolution);
  let fontSize = (*u).appearance.w;
  let axisLine = cross(axisOriginH(axis, u), _flow15_fused(axis, u));
  let magnitude = length(axisLine.xy);
  let _cse0 = pixelWidth();
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3<f32>(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse0)))) {
    return vec4<f32>(0.0);
  }
  let normal = (axisLine.xy / magnitude);
  let _gv0 = (-normal.x);
  let tangent = vec2<f32>(normal.y, _gv0);
  let low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  let coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  let column = clamp(i32(floor((coordinate * f32((*u).curveTiles.w)))), 0, (i32((*u).curveTiles.w) - 1));
  var labels: vec3<f32> = vec3<f32>(0.0);
  var ticks: f32 = 0.0;
  for (var candidate: i32 = 0; (candidate < 6); candidate = (candidate + 1)) {
    let row = (_licm0 + (candidate * 2));
    let location = loadLabels(vec2<i32>(column, row));
    let at = location.xy;
    let outward = location.zw;
    let anchor = _flow143_shared(at, outward, fontSize);
    let delta = (pixel - anchor);
    let nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse0))) && (delta.y <= (3.0 + _cse0)));
    let nearTick = (_licm2 && all((abs((pixel - at)) <= vec2<f32>((_licm3 + _cse0)))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    let style = loadLabels(vec2<i32>(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm4) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm5, vec2<f32>(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4<f32>(ticks, labels);
}

fn CoordinateUniforms_as_PlotViewport(value: CoordinateUniforms) -> PlotViewport {
  return PlotViewport(value.resolution, value.plotCenter, value.plotSpan, value.plotRotation, value.rotationBasis, value.plotPan, value.plotBlend, value.appearance, value.decorations, value.labelStyle, value.decorationOpacity);
}

fn cachedSpatialBackground(uv: vec2<f32>, u: ptr<uniform, CoordinateUniforms>) -> SpatialDecor {
  let _licm0 = (*u).decorationOpacity.z;
  let size = plotSize((*u).resolution);
  let pixel = (uv * size);
  var ray: ViewRay;
  _flow70_fused_into(&ray, uv, u);
  let xLevels = loadLabels(vec2<i32>(0, 37)).xyz;
  let zLevels = loadLabels(vec2<i32>(2, 37)).xyz;
  let grid = groundField(uv, &ray, u, xLevels, zLevels);
  let _cse0 = vec3<f32>(1.0, 0.0, 0.0);
  let xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  let _cse1 = vec3<f32>(0.0, 1.0, 0.0);
  let yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  let _cse2 = vec3<f32>(0.0, 0.0, 1.0);
  let zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  var labels: vec3<f32> = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  var color: vec3<f32> = _flow145_shared(grid);
  color = mix(color, vec3<f32>(0.67, 0.28, 0.25), axisField(pixel, _cse0, &ray, u));
  color = mix(color, vec3<f32>(0.23, 0.47, 0.3), axisField(pixel, _cse1, &ray, u));
  color = mix(color, vec3<f32>(0.4, 0.35, 0.62), axisField(pixel, _cse2, &ray, u));
  color = mix(color, vec3<f32>(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if ((((*u).decorations & 4u) != 0u)) {
    let _u0_name = loadLabels(vec2<i32>(0, 36));
    if ((_u0_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u0_name.xy, i32(_u0_name.z), u) * _licm0));
    }
    let _u1_name = loadLabels(vec2<i32>(1, 36));
    if ((_u1_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u1_name.xy, i32(_u1_name.z), u) * _licm0));
    }
    let _u2_name = loadLabels(vec2<i32>(2, 36));
    if ((_u2_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u2_name.xy, i32(_u2_name.z), u) * _licm0));
    }
  }
  return SpatialDecor(mix(vec3<f32>(0.965, 0.973, 0.985), color, (*u).sceneOpacity.x), (labels * (*u).sceneOpacity.x));
}

@vertex
fn fullscreen(@builtin(vertex_index) i: u32) -> VertexOutput {
  let x = select(-1.0, 3.0, (i == 1u));
  let y = select(-1.0, 3.0, (i == 2u));
  return VertexOutput(vec4<f32>(x, y, 0.0, 1.0), vec2<f32>(((x * 0.5) + 0.5), ((y * 0.5) + 0.5)));
}

@fragment
fn buildSpatialLabels(@builtin(position) position: vec4<f32>) -> @location(0) vec4<u32> {
  return bitcast<vec4<u32>>(prepareSpatialLabels(position, &u));
}

@fragment
fn drawBackdrop(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(cachedSpatialBackground(uv, &u).color, 1.0);
}

fn labelColorWide(color: vec3<f32>, layers: vec3<f32>) -> vec3<f32> {
  let plated = mix(color, vec3<f32>(0.995), (layers.z * 0.94));
  return _flow139_shared(plated, layers.y, layers.x);
}

@fragment
fn drawLabels(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return _spec4_labels(uv);
}

@fragment
fn drawSurfaceLabels(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return _spec5_labels(uv);
}

fn _spec0_homogeneous(p: vec3<f32>, plot_u_7: ptr<function, PlotUniforms>) -> vec3<f32> {
  let size = plotSize((*plot_u_7).resolution);
  var _sel5: vec3<f32>;
  _sel5 = cameraPoint(p, plot_u_7);
  let camera = _sel5;
  let w = select((*plot_u_7).cameraLens.y, ((*plot_u_7).cameraLens.y - camera.z), ((*plot_u_7).view3d == 2u));
  let focal = (1.0 / (*plot_u_7).cameraLens.x);
  return vec3<f32>((((vec2<f32>((camera.x / (size.x / size.y)), camera.y) * focal) + ((vec2<f32>(0.5) + (*plot_u_7).plotPan) * w)) * size), w);
}

fn _spec2_wideWeight(value: vec2<f32>, levels: vec3<f32>) -> f32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse1 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse0 = vec2<f32>(_cse1, _cse1);
  let multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing(levels.y), _cse0, _fp64_g), _fp64_g);
  let shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2<f32>(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2<f32>(0.0010000000474974513, -4.7497450417210985e-11));
  return select(levels.z, 1.0, shared_);
}

fn _spec3_wideWeight(value: vec2<f32>, levels: vec3<f32>) -> f32 {
  let _fp64_g = textureLoad(_fp64, vec2<i32>(0, 0), 0).x;
  let _cse1 = bitcast<f32>(bitcast<u32>(0.0));
  let _cse0 = vec2<f32>(_cse1, _cse1);
  let multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing(levels.x), _cse0, _fp64_g), _fp64_g);
  let shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2<f32>(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2<f32>(0.0010000000474974513, -4.7497450417210985e-11));
  return select((1.0 - levels.z), 1.0, shared_);
}

fn _spec4_labels(uv: vec2<f32>) -> vec4<f32> {
  var decor: _spec7_result;
  _spec6_cachedSpatialBackground_into(&decor, uv, &u);
  let _cse0 = vec3<f32>(0.0);
  var black: vec3<f32> = labelColorWide(_cse0, decor.labels);
  var white: vec3<f32> = labelColorWide(vec3<f32>(1.0), decor.labels);
  let alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4<f32>(select(_cse0, (black / alpha), (alpha > 0.0)), alpha);
}

fn _spec5_labels(uv: vec2<f32>) -> vec4<f32> {
  var decor: _spec7_result;
  _spec6_cachedSpatialBackground_into(&decor, uv, &u);
  let _cse0 = vec3<f32>(0.0);
  var black: vec3<f32> = labelColorWide(_cse0, decor.labels);
  var white: vec3<f32> = labelColorWide(vec3<f32>(1.0), decor.labels);
  black = mix(black, _flow116_fused(black, uv, &u), u.sceneOpacity.y);
  white = mix(white, _flow116_fused(white, uv, &u), u.sceneOpacity.y);
  let alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4<f32>(select(_cse0, (black / alpha), (alpha > 0.0)), alpha);
}

fn _spec6_cachedSpatialBackground_into(_dst: ptr<function, _spec7_result>, uv: vec2<f32>, u: ptr<uniform, CoordinateUniforms>) {
  let _licm0 = (*u).decorationOpacity.z;
  let size = plotSize((*u).resolution);
  let pixel = (uv * size);
  var ray: ViewRay;
  _flow70_fused_into(&ray, uv, u);
  let xLevels = loadLabels(vec2<i32>(0, 37)).xyz;
  let zLevels = loadLabels(vec2<i32>(2, 37)).xyz;
  let grid = groundField(uv, &ray, u, xLevels, zLevels);
  let _cse0 = vec3<f32>(1.0, 0.0, 0.0);
  let xTicks = cachedSpatialTicks(pixel, _cse0, 0, u);
  let _cse1 = vec3<f32>(0.0, 1.0, 0.0);
  let yTicks = cachedSpatialTicks(pixel, _cse1, 1, u);
  let _cse2 = vec3<f32>(0.0, 0.0, 1.0);
  let zTicks = cachedSpatialTicks(pixel, _cse2, 2, u);
  var labels: vec3<f32> = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  var color: vec3<f32> = _flow145_shared(grid);
  color = mix(color, vec3<f32>(0.67, 0.28, 0.25), axisField(pixel, _cse0, &ray, u));
  color = mix(color, vec3<f32>(0.23, 0.47, 0.3), axisField(pixel, _cse1, &ray, u));
  color = mix(color, vec3<f32>(0.4, 0.35, 0.62), axisField(pixel, _cse2, &ray, u));
  color = mix(color, vec3<f32>(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if ((((*u).decorations & 4u) != 0u)) {
    let _u0_name = loadLabels(vec2<i32>(0, 36));
    if ((_u0_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u0_name.xy, i32(_u0_name.z), u) * _licm0));
    }
    let _u1_name = loadLabels(vec2<i32>(1, 36));
    if ((_u1_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u1_name.xy, i32(_u1_name.z), u) * _licm0));
    }
    let _u2_name = loadLabels(vec2<i32>(2, 36));
    if ((_u2_name.w > 0.0)) {
      labels = max(labels, (_flow81_fused(pixel, _u2_name.xy, i32(_u2_name.z), u) * _licm0));
    }
  }
  let _spec10_field = (labels * (*u).sceneOpacity.x);
  (*_dst) = _spec7_result(_spec10_field);
}

fn _flow5_fused(_flow0_input: vec3<f32>, _flow1_input: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  var _flow4_arg: PlotUniforms = PlotUniforms((*_flow1_input).resolution, (*_flow1_input).plotCenter, (*_flow1_input).plotSpan, (*_flow1_input).plotRotation, (*_flow1_input).rotationBasis, (*_flow1_input).plotPan, (*_flow1_input).plotBlend, (*_flow1_input).appearance, (*_flow1_input).decorations, (*_flow1_input).labelStyle, (*_flow1_input).decorationOpacity, (*_flow1_input).model, (*_flow1_input).inverseModel, (*_flow1_input).axesModel, (*_flow1_input).inverseAxesModel, (*_flow1_input).sceneOpacity, (*_flow1_input).cameraLens, (*_flow1_input).plotCenterZ, (*_flow1_input).probe, (*_flow1_input).parameterFocusSeed, (*_flow1_input).view3d, (*_flow1_input).parameterBounds, (*_flow1_input).parameterMode, (*_flow1_input).curveQuality, (*_flow1_input).curvePattern, (*_flow1_input).curveTiles, (*_flow1_input).surfaceBounds, (*_flow1_input).surfaceDomainMode, (*_flow1_input).surfaceRange, (*_flow1_input).surfaceHeight, (*_flow1_input).surfaceDepth, (*_flow1_input).surfaceRender, (*_flow1_input).surfaceFlags);
  return basisVector(((*_flow1_input).model * vec4<f32>(_flow0_input, 0.0)).xyz, &_flow4_arg);
}

fn _flow15_fused(_flow6_input: vec3<f32>, _flow7_input: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  var _flow14_arg: PlotUniforms = PlotUniforms((*_flow7_input).resolution, (*_flow7_input).plotCenter, (*_flow7_input).plotSpan, (*_flow7_input).plotRotation, (*_flow7_input).rotationBasis, (*_flow7_input).plotPan, (*_flow7_input).plotBlend, (*_flow7_input).appearance, (*_flow7_input).decorations, (*_flow7_input).labelStyle, (*_flow7_input).decorationOpacity, (*_flow7_input).model, (*_flow7_input).inverseModel, (*_flow7_input).axesModel, (*_flow7_input).inverseAxesModel, (*_flow7_input).sceneOpacity, (*_flow7_input).cameraLens, (*_flow7_input).plotCenterZ, (*_flow7_input).probe, (*_flow7_input).parameterFocusSeed, (*_flow7_input).view3d, (*_flow7_input).parameterBounds, (*_flow7_input).parameterMode, (*_flow7_input).curveQuality, (*_flow7_input).curvePattern, (*_flow7_input).curveTiles, (*_flow7_input).surfaceBounds, (*_flow7_input).surfaceDomainMode, (*_flow7_input).surfaceRange, (*_flow7_input).surfaceHeight, (*_flow7_input).surfaceDepth, (*_flow7_input).surfaceRender, (*_flow7_input).surfaceFlags);
  let _flow9_local = plotSize((*_flow7_input).resolution);
  var _sel6: vec3<f32>;
  _sel6 = cameraVector(_flow6_input, &_flow14_arg);
  let _flow10_local = _sel6;
  let _flow11_local = select(0.0, (-_flow10_local.z), ((*_flow7_input).view3d == 2u));
  let _flow12_local = (1.0 / (*_flow7_input).cameraLens.x);
  return vec3<f32>((((vec2<f32>((_flow10_local.x / (_flow9_local.x / _flow9_local.y)), _flow10_local.y) * _flow12_local) + ((vec2<f32>(0.5) + (*_flow7_input).plotPan) * _flow11_local)) * _flow9_local), _flow11_local);
}

fn _flow25_fused(_flow19_input: vec3<f32>, _flow20_input: ptr<uniform, CoordinateUniforms>) -> vec2<f32> {
  var _flow24_arg: PlotUniforms = PlotUniforms((*_flow20_input).resolution, (*_flow20_input).plotCenter, (*_flow20_input).plotSpan, (*_flow20_input).plotRotation, (*_flow20_input).rotationBasis, (*_flow20_input).plotPan, (*_flow20_input).plotBlend, (*_flow20_input).appearance, (*_flow20_input).decorations, (*_flow20_input).labelStyle, (*_flow20_input).decorationOpacity, (*_flow20_input).model, (*_flow20_input).inverseModel, (*_flow20_input).axesModel, (*_flow20_input).inverseAxesModel, (*_flow20_input).sceneOpacity, (*_flow20_input).cameraLens, (*_flow20_input).plotCenterZ, (*_flow20_input).probe, (*_flow20_input).parameterFocusSeed, (*_flow20_input).view3d, (*_flow20_input).parameterBounds, (*_flow20_input).parameterMode, (*_flow20_input).curveQuality, (*_flow20_input).curvePattern, (*_flow20_input).curveTiles, (*_flow20_input).surfaceBounds, (*_flow20_input).surfaceDomainMode, (*_flow20_input).surfaceRange, (*_flow20_input).surfaceHeight, (*_flow20_input).surfaceDepth, (*_flow20_input).surfaceRender, (*_flow20_input).surfaceFlags);
  let _flow22_local = _spec0_homogeneous(_flow19_input, &_flow24_arg);
  return (_flow22_local.xy / max(_flow22_local.z, 0.101));
}

fn _flow35_fused(_flow26_input: vec3<f32>, _flow27_input: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  let _flow29_local = (*_flow27_input).rotationBasis;
  let _flow30_local = ((_flow26_input.y * _flow29_local.w) + (_flow26_input.z * _flow29_local.z));
  let _flow31_local = (((-_flow26_input.y) * _flow29_local.z) + (_flow26_input.z * _flow29_local.w));
  let _flow32_local = vec3<f32>(((_flow26_input.x * _flow29_local.y) - (_flow31_local * _flow29_local.x)), _flow30_local, ((_flow26_input.x * _flow29_local.x) + (_flow31_local * _flow29_local.y)));
  return ((*_flow27_input).inverseModel * vec4<f32>((_flow32_local * vec3<f32>((*_flow27_input).plotSpan, max((*_flow27_input).plotSpan.x, (*_flow27_input).plotSpan.y))), 0.0)).xyz;
}

fn _flow70_fused_into(_dst: ptr<function, ViewRay>, _flow60_input: vec2<f32>, _flow61_input: ptr<uniform, CoordinateUniforms>) {
  var _flow69_arg: PlotUniforms = PlotUniforms((*_flow61_input).resolution, (*_flow61_input).plotCenter, (*_flow61_input).plotSpan, (*_flow61_input).plotRotation, (*_flow61_input).rotationBasis, (*_flow61_input).plotPan, (*_flow61_input).plotBlend, (*_flow61_input).appearance, (*_flow61_input).decorations, (*_flow61_input).labelStyle, (*_flow61_input).decorationOpacity, (*_flow61_input).model, (*_flow61_input).inverseModel, (*_flow61_input).axesModel, (*_flow61_input).inverseAxesModel, (*_flow61_input).sceneOpacity, (*_flow61_input).cameraLens, (*_flow61_input).plotCenterZ, (*_flow61_input).probe, (*_flow61_input).parameterFocusSeed, (*_flow61_input).view3d, (*_flow61_input).parameterBounds, (*_flow61_input).parameterMode, (*_flow61_input).curveQuality, (*_flow61_input).curvePattern, (*_flow61_input).curveTiles, (*_flow61_input).surfaceBounds, (*_flow61_input).surfaceDomainMode, (*_flow61_input).surfaceRange, (*_flow61_input).surfaceHeight, (*_flow61_input).surfaceDepth, (*_flow61_input).surfaceRender, (*_flow61_input).surfaceFlags);
  let _flow63_local = ((_flow60_input - vec2<f32>(0.5)) - (*_flow61_input).plotPan);
  let _flow64_local = plotSize((*_flow61_input).resolution);
  let _flow65_local = (vec2<f32>((_flow63_local.x * (_flow64_local.x / _flow64_local.y)), _flow63_local.y) * (*_flow61_input).cameraLens.x);
  let _gv0 = ((*_flow61_input).view3d == 2u);
  let _flow66_local = select(vec3<f32>((_flow65_local * (*_flow61_input).cameraLens.y), (*_flow61_input).cameraLens.y), vec3<f32>(0.0, 0.0, (*_flow61_input).cameraLens.y), _gv0);
  let _flow67_local = select(vec3<f32>(0.0, 0.0, -1.0), vec3<f32>(_flow65_local, -1.0), _gv0);
  (*_dst) = ViewRay((inverseCamera(_flow66_local, &_flow69_arg) + sceneCenter(&_flow69_arg)), inverseCamera(_flow67_local, &_flow69_arg));
}

fn _flow81_fused(_flow71_input: vec2<f32>, _flow72_input: vec2<f32>, _flow73_input: i32, _flow74_input: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  let _flow89_part = (*_flow74_input).appearance;
  let _flow91_part = (*_flow74_input).labelStyle;
  if (any((abs((_flow71_input - _flow72_input)) > vec2<f32>((((_flow89_part.w * 1.5) + 4.0) + pixelWidth()))))) {
    return vec3<f32>(0.0);
  }
  let _flow76_local = vec2<f32>((_flow71_input.x - _flow72_input.x), ((_flow72_input.y - _flow71_input.y) + (_flow89_part.w * 0.75)));
  return vec3<f32>(glyphLayers((_flow76_local + vec2<f32>((_flow89_part.w * 0.42), 0.0)), _flow73_input, _flow89_part.w, _flow91_part.y), (numberPlate(_flow76_local, 0.0, 1.0, 0.5, _flow89_part.w) * _flow91_part.z));
}

fn _flow116_fused(_flow93_input: vec3<f32>, _flow94_input: vec2<f32>, _flow95_input: ptr<uniform, CoordinateUniforms>) -> vec3<f32> {
  let _licm0 = (*_flow95_input).surfaceRange.x;
  let _licm1 = (*_flow95_input).surfaceRange.y;
  let _licm2 = ((*_flow95_input).appearance.w * 0.7);
  let _licm3 = (((*_flow95_input).surfaceRange.y - (*_flow95_input).surfaceRange.x) * 0.5);
  let _licm4 = (*_flow95_input).appearance.w;
  let _licm5 = (*_flow95_input).labelStyle.y;
  if ((((*_flow95_input).surfaceFlags & 8u) == 0u)) {
    return _flow93_input;
  }
  let _flow97_local = plotSize((*_flow95_input).resolution);
  let _flow98_local = (_flow94_input * _flow97_local);
  let _flow99_local = min(160.0, (_flow97_local.y * 0.36));
  let _gv0 = (_flow97_local.x - 25.0);
  let _gv1 = ((_flow97_local.y - 70.0) - _flow99_local);
  let _flow100_local = vec2<f32>(_gv0, _gv1);
  let _flow101_local = (_flow100_local + vec2<f32>(10.0, _flow99_local));
  let _flow102_local = max((_flow100_local - _flow98_local), (_flow98_local - _flow101_local));
  let _flow103_local = max(_flow102_local.x, _flow102_local.y);
  let _flow104_local = distanceCoverage(max(0.0, _flow103_local), 1.2);
  let _flow105_local = clamp(((_flow98_local.y - _gv1) / _flow99_local), 0.0, 1.0);
  var _flow106_local: vec3<f32> = mix(_flow93_input, colorMap(_flow105_local, u32((*_flow95_input).surfaceRender.x)), _flow104_local);
  let _flow107_local = max(stroke(_flow98_local, _flow100_local, vec2<f32>(_gv0, _flow101_local.y), 0.7), stroke(_flow98_local, _flow101_local, vec2<f32>(_flow101_local.x, _gv1), 0.7));
  _flow106_local = mix(_flow106_local, vec3<f32>(0.3), _flow107_local);
  var _flow108_local: vec3<f32> = vec3<f32>(0.0);
  let _licm6 = (_gv0 - 5.0);
  for (var _flow109_local: i32 = 0; (_flow109_local < 3); _flow109_local = (_flow109_local + 1)) {
    let _flow110_local = (f32(_flow109_local) * 0.5);
    let _flow111_local = mix(_licm0, _licm1, _flow110_local);
    let _flow112_local = vec2<f32>(_licm6, (mix(_gv1, _flow101_local.y, _flow110_local) + _licm2));
    _flow108_local = max(_flow108_local, numberAt(_flow98_local, _flow112_local, _flow111_local, _licm3, 1.0, _licm4, _licm5, 0.0));
  }
  return labelColor(_flow106_local, _flow108_local);
}

fn _flow131_shared(_flow129_input: i32, _flow130_input: f32) -> f32 {
  return ceil((f32(_flow129_input) - (log2(max(abs(_flow130_input), 1e-30)) / log2(10.0))));
}

fn _flow135_shared(_flow132_input: vec2<f32>, _flow133_input: f32, _flow134_input: f32) -> f32 {
  return ((length(max(_flow132_input, vec2<f32>(0.0))) + min(max(_flow133_input, _flow134_input), 0.0)) - 3.0);
}

fn _flow139_shared(_flow136_input: vec3<f32>, _flow137_input: f32, _flow138_input: f32) -> vec3<f32> {
  return mix(mix(_flow136_input, vec3<f32>(0.965, 0.973, 0.985), _flow137_input), vec3<f32>(0.25, 0.29, 0.35), _flow138_input);
}

fn _flow143_shared(_flow140_input: vec2<f32>, _flow141_input: vec2<f32>, _flow142_input: f32) -> vec2<f32> {
  return ((_flow140_input + (_flow141_input * ((_flow142_input * 0.95) + 6.0))) + vec2<f32>(0.0, (_flow142_input * 0.65)));
}

fn _flow145_shared(_flow144_input: f32) -> vec3<f32> {
  return mix(vec3<f32>(0.965, 0.973, 0.985), vec3<f32>(0.8, 0.82, 0.85), (_flow144_input * 0.65));
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
  var _sel7: vec2<f32>;
  if ((_v0 == a.x)) {
    _sel7 = df64_quickTwoSum(_v0, floor(a.y), _fp64_g);
  } else {
    _sel7 = vec2<f32>(_v0, 0.0);
  }
  return _sel7;
}

fn df64_fract(a: vec2<f32>, _fp64_g: f32) -> vec2<f32> {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

fn df64_narrow(a: vec2<f32>) -> f32 {
  return (a.x + a.y);
}
`,bindings:[{name:"u",emitted:"u",space:"uniform",group:0,binding:0,type:"struct:CoordinateUniforms",resource:{resourceKind:"uniform-buffer",structName:"CoordinateUniforms",structEmitted:"CoordinateUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:592,fields:[{name:"resolution",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenter",offset:8,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotSpan",offset:16,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotRotation",offset:24,layout:{kind:"vector",size:2,type:"f32"}},{name:"rotationBasis",offset:32,layout:{kind:"vector",size:4,type:"f32"}},{name:"plotPan",offset:48,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotBlend",offset:56,layout:{kind:"scalar",type:"f32"}},{name:"appearance",offset:64,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorations",offset:80,layout:{kind:"scalar",type:"u32"}},{name:"labelStyle",offset:96,layout:{kind:"vector",size:4,type:"f32"}},{name:"decorationOpacity",offset:112,layout:{kind:"vector",size:3,type:"f32"}},{name:"model",offset:128,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseModel",offset:192,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"axesModel",offset:256,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"inverseAxesModel",offset:320,layout:{kind:"matrix",columns:4,rows:4,columnStride:16}},{name:"sceneOpacity",offset:384,layout:{kind:"vector",size:2,type:"f32"}},{name:"cameraLens",offset:392,layout:{kind:"vector",size:2,type:"f32"}},{name:"plotCenterZ",offset:400,layout:{kind:"scalar",type:"f32"}},{name:"probe",offset:404,layout:{kind:"scalar",type:"f32"}},{name:"parameterFocusSeed",offset:408,layout:{kind:"scalar",type:"f32"}},{name:"view3d",offset:412,layout:{kind:"scalar",type:"u32"}},{name:"parameterBounds",offset:416,layout:{kind:"vector",size:2,type:"f32"}},{name:"parameterMode",offset:424,layout:{kind:"scalar",type:"u32"}},{name:"curveQuality",offset:432,layout:{kind:"vector",size:2,type:"u32"}},{name:"curvePattern",offset:448,layout:{kind:"vector",size:4,type:"f32"}},{name:"curveTiles",offset:464,layout:{kind:"vector",size:4,type:"u32"}},{name:"surfaceBounds",offset:480,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceDomainMode",offset:496,layout:{kind:"scalar",type:"u32"}},{name:"surfaceRange",offset:504,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceHeight",offset:512,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceDepth",offset:520,layout:{kind:"vector",size:2,type:"f32"}},{name:"surfaceRender",offset:528,layout:{kind:"vector",size:4,type:"f32"}},{name:"surfaceFlags",offset:544,layout:{kind:"scalar",type:"u32"}},{name:"axesOrigin",offset:560,layout:{kind:"vector",size:3,type:"f64",lo:16}}]}},{name:"spatialLabels",emitted:"spatialLabels",space:"uniform",group:0,binding:1,type:"texture_2d<u32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"u32",sampleType:"uint"},stages:["fragment"]},{name:"glyphAtlas",emitted:"glyphAtlas",space:"uniform",group:0,binding:2,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"font",emitted:"font",space:"uniform",group:0,binding:3,type:"struct:FontUniforms",resource:{resourceKind:"uniform-buffer",structName:"FontUniforms",structEmitted:"FontUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixelRatio",offset:0,layout:{kind:"scalar",type:"f32"}}]}},{name:"_fp64",emitted:"_fp64",space:"uniform",group:0,binding:4,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"],injected:!0}],entries:[{name:"fullscreen",emitted:"fullscreen",stage:"vertex",inputs:[{name:"i",emitted:"i",type:"u32",builtin:"vertex_index"}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],bindings:[{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:235}},{name:"buildSpatialLabels",emitted:"buildSpatialLabels",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:238}},{name:"drawBackdrop",emitted:"drawBackdrop",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:239}},{name:"drawLabels",emitted:"drawLabels",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:249}},{name:"drawSurfaceLabels",emitted:"drawSurfaceLabels",stage:"fragment",inputs:[{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"spatialLabels",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1},{name:"_fp64",writes:!1}],line:{file:"shaders/coordinates.shade.ts",line:250}}],structs:[{name:"FontUniforms",emitted:"FontUniforms",fields:[{name:"pixelRatio",emitted:"pixelRatio",type:"f32"}]},{name:"NumberFormat",emitted:"NumberFormat",fields:[{name:"value",emitted:"value",type:"f32"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"PlotViewport",emitted:"PlotViewport",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"}]},{name:"PlotUniforms",emitted:"PlotUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"parameterFocusSeed",emitted:"parameterFocusSeed",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceHeight",emitted:"surfaceHeight",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"}]},{name:"ViewRay",emitted:"ViewRay",fields:[{name:"origin",emitted:"origin",type:"vec3<f32>"},{name:"direction",emitted:"direction",type:"vec3<f32>"}]},{name:"WideNumberFormat",emitted:"WideNumberFormat",fields:[{name:"value",emitted:"value",type:"f64"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"CoordinateUniforms",emitted:"CoordinateUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"plotCenter",emitted:"plotCenter",type:"vec2<f32>"},{name:"plotSpan",emitted:"plotSpan",type:"vec2<f32>"},{name:"plotRotation",emitted:"plotRotation",type:"vec2<f32>"},{name:"rotationBasis",emitted:"rotationBasis",type:"vec4<f32>"},{name:"plotPan",emitted:"plotPan",type:"vec2<f32>"},{name:"plotBlend",emitted:"plotBlend",type:"f32"},{name:"appearance",emitted:"appearance",type:"vec4<f32>"},{name:"decorations",emitted:"decorations",type:"u32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"decorationOpacity",emitted:"decorationOpacity",type:"vec3<f32>"},{name:"model",emitted:"model",type:"mat4x4<f32>"},{name:"inverseModel",emitted:"inverseModel",type:"mat4x4<f32>"},{name:"axesModel",emitted:"axesModel",type:"mat4x4<f32>"},{name:"inverseAxesModel",emitted:"inverseAxesModel",type:"mat4x4<f32>"},{name:"sceneOpacity",emitted:"sceneOpacity",type:"vec2<f32>"},{name:"cameraLens",emitted:"cameraLens",type:"vec2<f32>"},{name:"plotCenterZ",emitted:"plotCenterZ",type:"f32"},{name:"probe",emitted:"probe",type:"f32"},{name:"parameterFocusSeed",emitted:"parameterFocusSeed",type:"f32"},{name:"view3d",emitted:"view3d",type:"u32"},{name:"parameterBounds",emitted:"parameterBounds",type:"vec2<f32>"},{name:"parameterMode",emitted:"parameterMode",type:"u32"},{name:"curveQuality",emitted:"curveQuality",type:"vec2<u32>"},{name:"curvePattern",emitted:"curvePattern",type:"vec4<f32>"},{name:"curveTiles",emitted:"curveTiles",type:"vec4<u32>"},{name:"surfaceBounds",emitted:"surfaceBounds",type:"vec4<f32>"},{name:"surfaceDomainMode",emitted:"surfaceDomainMode",type:"u32"},{name:"surfaceRange",emitted:"surfaceRange",type:"vec2<f32>"},{name:"surfaceHeight",emitted:"surfaceHeight",type:"vec2<f32>"},{name:"surfaceDepth",emitted:"surfaceDepth",type:"vec2<f32>"},{name:"surfaceRender",emitted:"surfaceRender",type:"vec4<f32>"},{name:"surfaceFlags",emitted:"surfaceFlags",type:"u32"},{name:"axesOrigin",emitted:"axesOrigin",type:"vec3<f64>"}]},{name:"SpatialDecor",emitted:"SpatialDecor",fields:[{name:"color",emitted:"color",type:"vec3<f32>"},{name:"labels",emitted:"labels",type:"vec3<f32>"}]},{name:"VertexOutput",emitted:"VertexOutput",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"uv",emitted:"uv",type:"vec2<f32>"}]}],overrides:[],features:[],gl:{vertices:{fullscreen:{vertex:`#version 300 es
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
  vec2 surfaceHeight;
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
  vec2 surfaceHeight;
  vec2 surfaceDepth;
  vec4 surfaceRender;
  uint surfaceFlags;
  DF64Vec3 axesOrigin;
} u;

uniform highp sampler2D _fp64;
int _irem(int a, int b) {
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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
  return max(resolution, vec2(1.0));
}

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001));
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
  vec2 _sel0;
  if ((exponent < 0)) {
    float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
    vec2 _cse1 = vec2(_cse2, _cse2);
    _sel0 = df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g);
  } else {
    _sel0 = value;
  }
  return _sel0;
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
  vec2 _sel12;
  if ((_v0 == a.x)) {
    _sel12 = df64_quickTwoSum(_v0, floor(a.y), _fp64_g);
  } else {
    _sel12 = vec2(_v0, 0.0);
  }
  return _sel12;
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

vec2 axisBase_u(vec3 axis) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

vec3 _flow126_shared(vec2 _flow120_input, float _flow121_input, vec2 _flow122_input, float _flow123_input, vec2 _flow124_input, float _flow125_input) {
  return vec3((df64_narrow((-_flow120_input)) * (1.0 - _flow121_input)), (df64_narrow((-_flow122_input)) * (1.0 - _flow123_input)), (df64_narrow((-_flow124_input)) * (1.0 - _flow125_input)));
}

vec3 _flow9_fused(vec3 _flow6_input) {
  PlotUniforms _flow8_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  return basisVector((u.model * vec4(_flow6_input, 0.0)).xyz, _flow8_arg);
}

vec3 axisOriginH_u(vec3 axis) {
  vec3 local = _flow126_shared(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), axis.x, vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), axis.y, vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), axis.z);
  vec3 camera = _flow9_fused(local);
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5) + u.plotPan) * w)) * size), w);
}

vec3 _flow150_shared(float _flow142_input, float _flow143_input, float _flow144_input, float _flow145_input, float _flow146_input, vec2 _flow147_input, float _flow148_input, vec2 _flow149_input) {
  return vec3((((vec2((_flow142_input / (_flow143_input / _flow144_input)), _flow145_input) * _flow146_input) + ((vec2(0.5) + _flow147_input) * _flow148_input)) * _flow149_input), _flow148_input);
}

vec3 _flow27_fused(vec3 _flow20_input) {
  PlotUniforms _flow26_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec2 _flow21_local = plotSize(u.resolution);
  vec3 _sel11 = vec3(0.0);
  _sel11 = cameraVector(_flow20_input, _flow26_arg);
  vec3 _flow22_local = _sel11;
  float _flow23_local = ((u.view3d == 2u) ? (-_flow22_local.z) : 0.0);
  float _flow24_local = (1.0 / u.cameraLens.x);
  return _flow150_shared(_flow22_local.x, _flow21_local.x, _flow21_local.y, _flow22_local.y, _flow24_local, u.plotPan, _flow23_local, _flow21_local);
}

vec3 axisH_u(float value, vec3 axis) {
  return (axisOriginH_u(axis) + (_flow27_fused(axis) * value));
}

vec2 projectAxis_u(float value, vec3 axis) {
  vec3 at = axisH_u(value, axis);
  return (at.xy / max(at.z, 0.101));
}

bool axisVisible_u(float value, vec3 axis) {
  return ((u.view3d != 2u) || (axisH_u(value, axis).z >= 0.101));
}

float axisParameter_u(vec2 pixel, vec3 axis) {
  vec3 origin = axisOriginH_u(axis);
  vec3 direction = _flow27_fused(axis);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

vec3 spatialLevels_u(vec3 axis) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float center = axisParameter_u((plotSize(u.resolution) * 0.5), axis);
  float span = max(u.plotSpan.x, u.plotSpan.y);
  vec3 at = axisH_u(center, axis);
  vec3 direction = _flow27_fused(axis);
  vec2 tangent = (((direction.xy * at.z) - (at.xy * direction.z)) / max((at.z * at.z), 1e-20));
  float pixels = max((length(tangent) * span), 1.0);
  bool horizontal = (abs(tangent.x) >= (abs(tangent.y) * 0.7));
  vec2 absolute = df64_add(axisBase_u(axis), vec2(center, 0.0), _fp64_g);
  float rough = (((span * u.appearance.w) * 4.0) / pixels);
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 _lc0 = vec2((span * 0.5), 0.0);
  float width = max(wideNumberWidth(df64_sub(df64_add(absolute, _cse0, _fp64_g), df64_add(_lc0, _cse0, _fp64_g), _fp64_g), rough, u.appearance.w), wideNumberWidth(df64_add(absolute, _lc0, _fp64_g), rough, u.appearance.w));
  float gap = (horizontal ? max((u.appearance.w * 3.5), (width + (u.appearance.w * 1.3))) : (u.appearance.w * 2.6));
  return tickLevels(((span * gap) / max((pixels * u.labelStyle.x), 1.0)));
}

float _spec2_wideWeight(vec2 value, vec3 levels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing(levels.y), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : levels.z);
}

float _spec3_wideWeight(vec2 value, vec3 levels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse1 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse1, _cse1);
  vec2 multiple = df64_div(df64_add(value, _cse0, _fp64_g), df64_add(wideGridSpacing(levels.x), _cse0, _fp64_g), _fp64_g);
  bool shared_ = df64_lt(df64_abs(df64_sub(df64_add(multiple, _cse0, _fp64_g), df64_floor(df64_add(multiple, vec2(0.5, 0.0), _fp64_g), _fp64_g), _fp64_g)), vec2(0.0010000000474974513, -4.7497450417210985e-11));
  return (shared_ ? 1.0 : (1.0 - levels.z));
}

float _flow141_shared(float _flow135_input, float _flow136_input, float _flow137_input, float _flow138_input, float _flow139_input, float _flow140_input) {
  float _cse0 = (_flow136_input * 0.5);
  return min(min(((_flow135_input - _cse0) - 3.0), (((_flow137_input - _flow135_input) - _cse0) - 3.0)), min((_flow138_input - (_flow139_input * 1.5)), (_flow140_input - _flow138_input)));
}

bool df64_le(vec2 a, vec2 b) {
  return ((a.x < b.x) || ((a.x == b.x) && (a.y <= b.y)));
}

vec3 _spec0_homogeneous(vec3 p, PlotUniforms plot_u_7) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 _sel9 = vec3(0.0);
  _sel9 = cameraPoint(p, plot_u_7);
  vec3 camera = _sel9;
  float w = ((plot_u_7.view3d == 2u) ? (plot_u_7.cameraLens.y - camera.z) : plot_u_7.cameraLens.y);
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return _flow150_shared(camera.x, size.x, size.y, camera.y, focal, plot_u_7.plotPan, w, size);
}

vec2 _flow43_fused(vec3 _flow39_input) {
  PlotUniforms _flow42_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec3 _flow40_local = _spec0_homogeneous(_flow39_input, _flow42_arg);
  return (_flow40_local.xy / max(_flow40_local.z, 0.101));
}

vec4 prepareSpatialLabels_u(vec4 position) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int row = _f2i(position.y);
  int column = _f2i(position.x);
  vec2 size = plotSize(u.resolution);
  vec4 _cse0 = vec4(0.0);
  vec3 _cse1 = vec3(1.0, 0.0, 0.0);
  vec3 _cse2 = vec3(0.0, 1.0, 0.0);
  vec3 _cse3 = vec3(0.0, 0.0, 1.0);
  if ((row >= 36)) {
    if ((column >= 3)) {
      return _cse0;
    }
    vec3 axis = ((column == 0) ? _cse1 : ((column == 1) ? _cse2 : _cse3));
    if ((row == 37)) {
      return vec4(spatialLevels_u(axis), 1.0);
    }
    vec2 edge = ((column == 1) ? vec2((size.x * 0.5), (size.y - 30.0)) : vec2((size.x - 30.0), (size.y * 0.5)));
    float t = axisParameter_u(edge, axis);
    vec2 _cse4 = vec2(18.0);
    vec2 at = clamp((projectAxis_u(t, axis) + vec2(10.0, 18.0)), _cse4, (size - _cse4));
    return vec4(at, float((120 + column)), (axisVisible_u(t, axis) ? 1.0 : 0.0));
  }
  int axisIndex = (row / 12);
  int candidate = _irem((row / 2), 6);
  vec3 axis_1 = ((axisIndex == 0) ? _cse1 : ((axisIndex == 1) ? _cse2 : _cse3));
  vec3 originH = axisOriginH_u(axis_1);
  vec3 axisLine = cross(originH, _flow27_fused(axis_1));
  float magnitude = length(axisLine.xy);
  if ((magnitude <= 1e-12)) {
    return _cse0;
  }
  vec2 normal = (axisLine.xy / magnitude);
  float _gv0 = (-normal.x);
  vec2 tangent = vec2(normal.y, _gv0);
  float extent = dot(abs(tangent), size);
  float low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  float along = (low + ((position.x / float(u.curveTiles.w)) * extent));
  vec2 foot = ((tangent * along) - (normal * (axisLine.z / magnitude)));
  vec3 levels = spatialLevels_u(axis_1);
  bool _gv1 = (candidate < 3);
  float stride = (_gv1 ? levels.x : levels.y);
  vec2 _gv2 = axisBase_u(axis_1);
  vec2 absolute = df64_add(_gv2, vec2(axisParameter_u(foot, axis_1), 0.0), _fp64_g);
  float _cse8 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse5 = vec2(_cse8, _cse8);
  vec2 _lc0 = wideGridSpacing(stride);
  vec2 number = df64_mul(df64_add(df64_floor(df64_add(df64_div(df64_add(absolute, _cse5, _fp64_g), df64_add(_lc0, _cse5, _fp64_g), _fp64_g), vec2(0.5, 0.0), _fp64_g), _fp64_g), vec2(float((_irem(candidate, 3) - 1)), 0.0), _fp64_g), _lc0, _fp64_g);
  float t_1 = df64_narrow(df64_sub(df64_add(number, _cse5, _fp64_g), df64_add(_gv2, _cse5, _fp64_g), _fp64_g));
  if ((axisVisible_u(t_1, axis_1) == false)) {
    return _cse0;
  }
  vec2 at_1 = projectAxis_u(t_1, axis_1);
  float fontSize = u.appearance.w;
  float sign = ((axis_1.y > 0.0) ? ((normal.x > 0.0) ? -1.0 : 1.0) : ((normal.y > 0.0) ? -1.0 : 1.0));
  vec2 outward = (normal * sign);
  if ((_irem(row, 2) == 0)) {
    return vec4(at_1, outward);
  }
  vec2 anchor = ((at_1 + (outward * ((fontSize * 0.95) + 6.0))) + vec2(0.0, (fontSize * 0.65)));
  float width = wideNumberWidth(number, levels.x, fontSize);
  vec2 before = projectAxis_u((t_1 - stride), axis_1);
  vec2 after = projectAxis_u((t_1 + stride), axis_1);
  vec2 separation = min(abs((at_1 - before)), abs((after - at_1)));
  float _gv3 = (width + fontSize);
  float _gv4 = ((fontSize * 1.8) + 6.0);
  float fit = smoothstep(0.85, 1.15, max((separation.x / _gv3), (separation.y / _gv4)));
  float _sel7;
  if (_gv1) {
    _sel7 = _spec2_wideWeight(number, levels);
  } else {
    _sel7 = _spec3_wideWeight(number, levels);
  }
  float visibility = (_sel7 * fit);
  float room = _flow141_shared(anchor.x, width, size.x, anchor.y, fontSize, size.y);
  bool zero = df64_le(df64_abs(number), vec2((levels.x * 0.001), 0.0));
  float _sel8 = 0.0;
  vec2 _cse6 = _flow43_fused(vec3(0.0));
  if (zero) {
    _sel8 = ((axis_1.x > 0.0) ? 1.0 : 0.0);
  } else {
    _sel8 = smoothstep((fontSize * 2.0), (fontSize * 4.0), length((at_1 - _cse6)));
  }
  float crossing = _sel8;
  float priority = 1.0;
  if ((axisIndex == 2)) {
    vec3 xDirection = _flow27_fused(_cse1);
    vec3 zDirection = _flow27_fused(_cse3);
    vec2 _cse7 = vec2(1e-12);
    vec2 xTangent = normalize(((xDirection.xy - (_cse6 * xDirection.z)) + _cse7));
    vec2 zTangent = normalize(((zDirection.xy - (_cse6 * zDirection.z)) + _cse7));
    priority = smoothstep(0.08, 0.25, abs(((xTangent.x * zTangent.y) - (xTangent.y * zTangent.x))));
  }
  return vec4(t_1, levels.x, visibility, (((visibility * smoothstep(0.0, 6.0, room)) * crossing) * priority));
}
layout(location = 0) out uvec4 _ret;

void main() {
  vec4 position = gl_FragCoord;
  _ret = floatBitsToUint(prepareSpatialLabels_u(position));
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
  vec2 surfaceHeight;
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

struct SpatialDecor {
  vec3 color;
  vec3 labels;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
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
  vec2 surfaceHeight;
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
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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
  float distance = (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2(((code - 32) * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      int _cse1 = (code - 32);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0);
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
  vec2 _cse0 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport plot_u) {
  if (any(greaterThan(abs((pixel - at)), vec2((((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth()))))) {
    return vec3(0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0));
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
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001));
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

vec3 _flow119_shared(float _flow114_input, float _flow115_input, float _flow116_input, float _flow117_input, float _flow118_input) {
  return vec3(((_flow114_input * _flow115_input) - (_flow116_input * _flow117_input)), _flow118_input, ((_flow114_input * _flow117_input) + (_flow116_input * _flow115_input)));
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = _flow119_shared(p.x, basis.y, depth, basis.x, y);
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5)) - plot_u_9.plotPan);
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
  vec2 _sel0;
  if ((exponent < 0)) {
    float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
    vec2 _cse1 = vec2(_cse2, _cse2);
    _sel0 = df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g);
  } else {
    _sel0 = value;
  }
  return _sel0;
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  vec2 _sel12;
  if ((_v0 == a.x)) {
    _sel12 = df64_quickTwoSum(_v0, floor(a.y), _fp64_g);
  } else {
    _sel12 = vec2(_v0, 0.0);
  }
  return _sel12;
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
  vec2 _cse1 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase_u(vec3 axis) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms_u() {
  return PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
}

vec3 _flow126_shared(vec2 _flow120_input, float _flow121_input, vec2 _flow122_input, float _flow123_input, vec2 _flow124_input, float _flow125_input) {
  return vec3((df64_narrow((-_flow120_input)) * (1.0 - _flow121_input)), (df64_narrow((-_flow122_input)) * (1.0 - _flow123_input)), (df64_narrow((-_flow124_input)) * (1.0 - _flow125_input)));
}

vec3 _flow9_fused(vec3 _flow6_input) {
  PlotUniforms _flow8_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  return basisVector((u.model * vec4(_flow6_input, 0.0)).xyz, _flow8_arg);
}

vec3 axisOriginH_u(vec3 axis) {
  vec3 local = _flow126_shared(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), axis.x, vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), axis.y, vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), axis.z);
  vec3 camera = _flow9_fused(local);
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5) + u.plotPan) * w)) * size), w);
}

vec3 _flow150_shared(float _flow142_input, float _flow143_input, float _flow144_input, float _flow145_input, float _flow146_input, vec2 _flow147_input, float _flow148_input, vec2 _flow149_input) {
  return vec3((((vec2((_flow142_input / (_flow143_input / _flow144_input)), _flow145_input) * _flow146_input) + ((vec2(0.5) + _flow147_input) * _flow148_input)) * _flow149_input), _flow148_input);
}

vec3 _flow27_fused(vec3 _flow20_input) {
  PlotUniforms _flow26_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec2 _flow21_local = plotSize(u.resolution);
  vec3 _sel11 = vec3(0.0);
  _sel11 = cameraVector(_flow20_input, _flow26_arg);
  vec3 _flow22_local = _sel11;
  float _flow23_local = ((u.view3d == 2u) ? (-_flow22_local.z) : 0.0);
  float _flow24_local = (1.0 / u.cameraLens.x);
  return _flow150_shared(_flow22_local.x, _flow21_local.x, _flow21_local.y, _flow22_local.y, _flow24_local, u.plotPan, _flow23_local, _flow21_local);
}

vec3 axisH_u(float value, vec3 axis) {
  return (axisOriginH_u(axis) + (_flow27_fused(axis) * value));
}

bool axisVisible_u(float value, vec3 axis) {
  return ((u.view3d != 2u) || (axisH_u(value, axis).z >= 0.101));
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
  float _cse0 = (pixel.x - anchor.x);
  float _cse1 = (anchor.y - pixel.y);
  vec2 delta = vec2(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3(0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

vec3 _spec0_homogeneous(vec3 p, PlotUniforms plot_u_7) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 _sel9 = vec3(0.0);
  _sel9 = cameraPoint(p, plot_u_7);
  vec3 camera = _sel9;
  float w = ((plot_u_7.view3d == 2u) ? (plot_u_7.cameraLens.y - camera.z) : plot_u_7.cameraLens.y);
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return _flow150_shared(camera.x, size.x, size.y, camera.y, focal, plot_u_7.plotPan, w, size);
}

vec2 _flow43_fused(vec3 _flow39_input) {
  PlotUniforms _flow42_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec3 _flow40_local = _spec0_homogeneous(_flow39_input, _flow42_arg);
  return (_flow40_local.xy / max(_flow40_local.z, 0.101));
}

float axisParameter_u(vec2 pixel, vec3 axis) {
  vec3 origin = axisOriginH_u(axis);
  vec3 direction = _flow27_fused(axis);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField_u(vec2 pixel, vec3 axis, ViewRay ray) {
  vec3 origin = axisOriginH_u(axis);
  vec3 coefficients = cross(origin, _flow27_fused(axis));
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - _flow43_fused(vec3(0.0))));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  float _sel2;
  if (axisVisible_u(axisParameter_u(pixel, axis), axis)) {
    _sel2 = distanceCoverage(distance, u.appearance.x);
  } else {
    _sel2 = 0.0;
  }
  return _sel2;
}

vec2 _flow129_shared(float _flow127_input, float _flow128_input) {
  return max(vec2(length(vec2(dFdx(_flow127_input), dFdy(_flow127_input))), length(vec2(dFdx(_flow128_input), dFdy(_flow128_input)))), vec2(1e-20));
}

float groundFieldNarrow_u(ViewRay ray, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = _flow129_shared(ground.x, ground.y);
  float field = 0.0;
  float _cse1 = pixelWidth();
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 _sel4;
    if (_gv0) {
      _sel4 = vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels));
    } else {
      _sel4 = vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels));
    }
    vec2 weights = _sel4;
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec3 _flow61_fused(vec3 _flow54_input) {
  vec4 _flow55_local = u.rotationBasis;
  float _flow56_local = ((_flow54_input.y * _flow55_local.w) + (_flow54_input.z * _flow55_local.z));
  float _flow57_local = (((-_flow54_input.y) * _flow55_local.z) + (_flow54_input.z * _flow55_local.w));
  vec3 _flow58_local = _flow119_shared(_flow54_input.x, _flow55_local.y, _flow57_local, _flow55_local.x, _flow56_local);
  return (u.inverseModel * vec4((_flow58_local * vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y))), 0.0)).xyz;
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

vec2 _flow134_shared(vec2 _flow130_input, vec2 _flow131_input, vec2 _flow132_input, vec2 _flow133_input) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse2, _cse2);
  vec2 _cse1 = vec2(0.5, 0.0);
  return (vec2(df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow130_input, _cse0, _fp64_g), df64_add(_flow131_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g)), df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow132_input, _cse0, _fp64_g), df64_add(_flow133_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g))) - 0.5);
}

float groundField_u(vec2 uv, ViewRay ray, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow_u(ray, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = _flow61_fused(eye);
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
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20));
  float field = 0.0;
  float _cse5 = pixelWidth();
  vec2 _cse6 = vec2(0.5, 0.0);
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 phase = _flow134_shared(gx, sx, gz, sz);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse5);
    vec2 separation = ((spacing / gradient) * _cse5);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nx = df64_mul(df64_floor(df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sz, _fp64_g);
    bool _lc0 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc0), wideWeight(nz, zLevels, _lc0));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks_u(vec2 pixel, vec3 axis, int index) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  bool _licm2 = (u.appearance.x > 0.0);
  float _licm3 = ((u.appearance.x * 0.5) + 4.0);
  float _licm4 = u.appearance.x;
  vec2 _licm5 = axisBase_u(axis);
  float _licm6 = u.labelStyle.y;
  float _licm7 = u.labelStyle.z;
  float _licm8 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH_u(axis), _flow27_fused(axis));
  float magnitude = length(axisLine.xy);
  float _cse0 = pixelWidth();
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse0)))) {
    return vec4(0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  float _gv0 = (-normal.x);
  vec2 tangent = vec2(normal.y, _gv0);
  float low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0);
  float ticks = 0.0;
  float _licm9 = ((fontSize * 0.95) + 6.0);
  vec2 _licm10 = vec2(0.0, (fontSize * 0.65));
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * _licm9)) + _licm10);
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse0))) && (delta.y <= (3.0 + _cse0)));
    bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2((_licm3 + _cse0)))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm4) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm5, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport_u() {
  return PlotViewport(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity);
}

SpatialDecor cachedSpatialBackground_u(vec2 uv) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport_u();
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms_u());
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField_u(uv, ray, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks_u(pixel, _cse0, 0);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks_u(pixel, _cse1, 1);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks_u(pixel, _cse2, 2);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 _cse3 = vec3(0.965, 0.973, 0.985);
  vec3 color = mix(_cse3, vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField_u(pixel, _cse0, ray));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField_u(pixel, _cse1, ray));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField_u(pixel, _cse2, ray));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    vec4 _u0_name = loadLabels(ivec2(0, 36));
    if ((_u0_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u0_name.xy, _f2i(_u0_name.z), _licm0) * _licm1));
    }
    vec4 _u1_name = loadLabels(ivec2(1, 36));
    if ((_u1_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u1_name.xy, _f2i(_u1_name.z), _licm0) * _licm1));
    }
    vec4 _u2_name = loadLabels(ivec2(2, 36));
    if ((_u2_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u2_name.xy, _f2i(_u2_name.z), _licm0) * _licm1));
    }
  }
  return SpatialDecor(mix(_cse3, color, u.sceneOpacity.x), (labels * u.sceneOpacity.x));
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = vec4(cachedSpatialBackground_u(uv).color, 1.0);
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
  vec2 surfaceHeight;
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

struct _spec7_result {
  vec3 labels;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
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
  vec2 surfaceHeight;
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
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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
  float distance = (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2(((code - 32) * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      int _cse1 = (code - 32);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0);
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
  vec2 _cse0 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec3 axisLabel(vec2 pixel, vec2 at, int code, PlotViewport plot_u) {
  if (any(greaterThan(abs((pixel - at)), vec2((((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth()))))) {
    return vec3(0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0));
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
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001));
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

vec3 _flow119_shared(float _flow114_input, float _flow115_input, float _flow116_input, float _flow117_input, float _flow118_input) {
  return vec3(((_flow114_input * _flow115_input) - (_flow116_input * _flow117_input)), _flow118_input, ((_flow114_input * _flow117_input) + (_flow116_input * _flow115_input)));
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = _flow119_shared(p.x, basis.y, depth, basis.x, y);
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5)) - plot_u_9.plotPan);
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
  vec2 _sel0;
  if ((exponent < 0)) {
    float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
    vec2 _cse1 = vec2(_cse2, _cse2);
    _sel0 = df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g);
  } else {
    _sel0 = value;
  }
  return _sel0;
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  vec2 _sel12;
  if ((_v0 == a.x)) {
    _sel12 = df64_quickTwoSum(_v0, floor(a.y), _fp64_g);
  } else {
    _sel12 = vec2(_v0, 0.0);
  }
  return _sel12;
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
  vec2 _cse1 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase_u(vec3 axis) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms_u() {
  return PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
}

vec3 _flow126_shared(vec2 _flow120_input, float _flow121_input, vec2 _flow122_input, float _flow123_input, vec2 _flow124_input, float _flow125_input) {
  return vec3((df64_narrow((-_flow120_input)) * (1.0 - _flow121_input)), (df64_narrow((-_flow122_input)) * (1.0 - _flow123_input)), (df64_narrow((-_flow124_input)) * (1.0 - _flow125_input)));
}

vec3 _flow9_fused(vec3 _flow6_input) {
  PlotUniforms _flow8_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  return basisVector((u.model * vec4(_flow6_input, 0.0)).xyz, _flow8_arg);
}

vec3 axisOriginH_u(vec3 axis) {
  vec3 local = _flow126_shared(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), axis.x, vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), axis.y, vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), axis.z);
  vec3 camera = _flow9_fused(local);
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5) + u.plotPan) * w)) * size), w);
}

vec3 _flow150_shared(float _flow142_input, float _flow143_input, float _flow144_input, float _flow145_input, float _flow146_input, vec2 _flow147_input, float _flow148_input, vec2 _flow149_input) {
  return vec3((((vec2((_flow142_input / (_flow143_input / _flow144_input)), _flow145_input) * _flow146_input) + ((vec2(0.5) + _flow147_input) * _flow148_input)) * _flow149_input), _flow148_input);
}

vec3 _flow27_fused(vec3 _flow20_input) {
  PlotUniforms _flow26_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec2 _flow21_local = plotSize(u.resolution);
  vec3 _sel11 = vec3(0.0);
  _sel11 = cameraVector(_flow20_input, _flow26_arg);
  vec3 _flow22_local = _sel11;
  float _flow23_local = ((u.view3d == 2u) ? (-_flow22_local.z) : 0.0);
  float _flow24_local = (1.0 / u.cameraLens.x);
  return _flow150_shared(_flow22_local.x, _flow21_local.x, _flow21_local.y, _flow22_local.y, _flow24_local, u.plotPan, _flow23_local, _flow21_local);
}

vec3 axisH_u(float value, vec3 axis) {
  return (axisOriginH_u(axis) + (_flow27_fused(axis) * value));
}

bool axisVisible_u(float value, vec3 axis) {
  return ((u.view3d != 2u) || (axisH_u(value, axis).z >= 0.101));
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
  float _cse0 = (pixel.x - anchor.x);
  float _cse1 = (anchor.y - pixel.y);
  vec2 delta = vec2(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3(0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

vec3 _spec0_homogeneous(vec3 p, PlotUniforms plot_u_7) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 _sel9 = vec3(0.0);
  _sel9 = cameraPoint(p, plot_u_7);
  vec3 camera = _sel9;
  float w = ((plot_u_7.view3d == 2u) ? (plot_u_7.cameraLens.y - camera.z) : plot_u_7.cameraLens.y);
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return _flow150_shared(camera.x, size.x, size.y, camera.y, focal, plot_u_7.plotPan, w, size);
}

vec2 _flow43_fused(vec3 _flow39_input) {
  PlotUniforms _flow42_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec3 _flow40_local = _spec0_homogeneous(_flow39_input, _flow42_arg);
  return (_flow40_local.xy / max(_flow40_local.z, 0.101));
}

float axisParameter_u(vec2 pixel, vec3 axis) {
  vec3 origin = axisOriginH_u(axis);
  vec3 direction = _flow27_fused(axis);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField_u(vec2 pixel, vec3 axis, ViewRay ray) {
  vec3 origin = axisOriginH_u(axis);
  vec3 coefficients = cross(origin, _flow27_fused(axis));
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - _flow43_fused(vec3(0.0))));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  float _sel2;
  if (axisVisible_u(axisParameter_u(pixel, axis), axis)) {
    _sel2 = distanceCoverage(distance, u.appearance.x);
  } else {
    _sel2 = 0.0;
  }
  return _sel2;
}

vec2 _flow129_shared(float _flow127_input, float _flow128_input) {
  return max(vec2(length(vec2(dFdx(_flow127_input), dFdy(_flow127_input))), length(vec2(dFdx(_flow128_input), dFdy(_flow128_input)))), vec2(1e-20));
}

float groundFieldNarrow_u(ViewRay ray, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = _flow129_shared(ground.x, ground.y);
  float field = 0.0;
  float _cse1 = pixelWidth();
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 _sel4;
    if (_gv0) {
      _sel4 = vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels));
    } else {
      _sel4 = vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels));
    }
    vec2 weights = _sel4;
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec3 _flow61_fused(vec3 _flow54_input) {
  vec4 _flow55_local = u.rotationBasis;
  float _flow56_local = ((_flow54_input.y * _flow55_local.w) + (_flow54_input.z * _flow55_local.z));
  float _flow57_local = (((-_flow54_input.y) * _flow55_local.z) + (_flow54_input.z * _flow55_local.w));
  vec3 _flow58_local = _flow119_shared(_flow54_input.x, _flow55_local.y, _flow57_local, _flow55_local.x, _flow56_local);
  return (u.inverseModel * vec4((_flow58_local * vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y))), 0.0)).xyz;
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

vec2 _flow134_shared(vec2 _flow130_input, vec2 _flow131_input, vec2 _flow132_input, vec2 _flow133_input) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse2, _cse2);
  vec2 _cse1 = vec2(0.5, 0.0);
  return (vec2(df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow130_input, _cse0, _fp64_g), df64_add(_flow131_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g)), df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow132_input, _cse0, _fp64_g), df64_add(_flow133_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g))) - 0.5);
}

float groundField_u(vec2 uv, ViewRay ray, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow_u(ray, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = _flow61_fused(eye);
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
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20));
  float field = 0.0;
  float _cse5 = pixelWidth();
  vec2 _cse6 = vec2(0.5, 0.0);
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 phase = _flow134_shared(gx, sx, gz, sz);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse5);
    vec2 separation = ((spacing / gradient) * _cse5);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nx = df64_mul(df64_floor(df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sz, _fp64_g);
    bool _lc0 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc0), wideWeight(nz, zLevels, _lc0));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks_u(vec2 pixel, vec3 axis, int index) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  bool _licm2 = (u.appearance.x > 0.0);
  float _licm3 = ((u.appearance.x * 0.5) + 4.0);
  float _licm4 = u.appearance.x;
  vec2 _licm5 = axisBase_u(axis);
  float _licm6 = u.labelStyle.y;
  float _licm7 = u.labelStyle.z;
  float _licm8 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH_u(axis), _flow27_fused(axis));
  float magnitude = length(axisLine.xy);
  float _cse0 = pixelWidth();
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse0)))) {
    return vec4(0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  float _gv0 = (-normal.x);
  vec2 tangent = vec2(normal.y, _gv0);
  float low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0);
  float ticks = 0.0;
  float _licm9 = ((fontSize * 0.95) + 6.0);
  vec2 _licm10 = vec2(0.0, (fontSize * 0.65));
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * _licm9)) + _licm10);
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse0))) && (delta.y <= (3.0 + _cse0)));
    bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2((_licm3 + _cse0)))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm4) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm5, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport_u() {
  return PlotViewport(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity);
}

vec3 labelColorWide(vec3 color, vec3 layers) {
  vec3 plated = mix(color, vec3(0.995), (layers.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), layers.y), vec3(0.25, 0.29, 0.35), layers.x);
}

_spec7_result _spec6_cachedSpatialBackground_u(vec2 uv) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport_u();
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms_u());
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField_u(uv, ray, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks_u(pixel, _cse0, 0);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks_u(pixel, _cse1, 1);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks_u(pixel, _cse2, 2);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 color = mix(vec3(0.965, 0.973, 0.985), vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField_u(pixel, _cse0, ray));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField_u(pixel, _cse1, ray));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField_u(pixel, _cse2, ray));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    vec4 _u0_name = loadLabels(ivec2(0, 36));
    if ((_u0_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u0_name.xy, _f2i(_u0_name.z), _licm0) * _licm1));
    }
    vec4 _u1_name = loadLabels(ivec2(1, 36));
    if ((_u1_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u1_name.xy, _f2i(_u1_name.z), _licm0) * _licm1));
    }
    vec4 _u2_name = loadLabels(ivec2(2, 36));
    if ((_u2_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u2_name.xy, _f2i(_u2_name.z), _licm0) * _licm1));
    }
  }
  vec3 _spec10_field = (labels * u.sceneOpacity.x);
  return _spec7_result(_spec10_field);
}

vec4 _spec4_labels(vec2 uv) {
  _spec7_result decor = _spec6_cachedSpatialBackground_u(uv);
  vec3 _cse0 = vec3(0.0);
  vec3 black = labelColorWide(_cse0, decor.labels);
  vec3 white = labelColorWide(vec3(1.0), decor.labels);
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = _spec4_labels(uv);
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
  vec2 surfaceHeight;
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

struct _spec7_result {
  vec3 labels;
};

struct DF64Vec3 {
  vec3 hi;
  vec3 lo;
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
  vec2 surfaceHeight;
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
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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
  float distance = (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
    if ((_cse0 <= 14.0)) {
      referenceSize = 12.0;
      cell = vec2(15.0, 18.0);
      origin = ivec2(((code - 32) * 15), 3384);
    } else if ((_cse0 > 28.0)) {
      referenceSize = 48.0;
      cell = vec2(60.0, 72.0);
      int _cse1 = (code - 32);
      origin = ivec2((_irem(_cse1, 66) * 60), (3402 + ((_cse1 / 66) * 72)));
    }
  }
  vec2 q = ((p * (referenceSize / fontSize)) - vec2(0.5));
  if (((((q.x < 0.0) || (q.y < 0.0)) || (q.x >= (cell.x - 1.0))) || (q.y >= (cell.y - 1.0)))) {
    return vec2(0.0);
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
  vec2 _cse0 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
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
    return vec3(t);
  }
  if ((palette == 2u)) {
    vec3 _cse0 = vec3(0.87);
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
  if (any(greaterThan(abs((pixel - at)), vec2((((plot_u.appearance.w * 1.5) + 4.0) + pixelWidth()))))) {
    return vec3(0.0);
  }
  vec2 local = vec2((pixel.x - at.x), ((at.y - pixel.y) + (plot_u.appearance.w * 0.75)));
  return vec3(glyphLayers((local + vec2((plot_u.appearance.w * 0.42), 0.0)), code, plot_u.appearance.w, plot_u.labelStyle.y), (numberPlate(local, 0.0, 1.0, 0.5, plot_u.appearance.w) * plot_u.labelStyle.z));
}

vec2 plotSize(vec2 resolution) {
  return max(resolution, vec2(1.0));
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
  if ((((width <= 0.0) || any(lessThan(p, (min(a, b) - vec2((radius + 1.0)))))) || any(greaterThan(p, (max(a, b) + vec2((radius + 1.0))))))) {
    return 0.0;
  }
  vec2 ab = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, ab) / max(dot(ab, ab), 0.0001)), 0.0, 1.0);
  return distanceCoverage(length((_cse0 - (ab * t))), width);
}

vec3 numberAt(vec2 pixel, vec2 anchor, float value, float spacing, float align, float size, float halo, float plate) {
  float _cse0 = (pixel.x - anchor.x);
  float _cse1 = (anchor.y - pixel.y);
  vec2 delta = vec2(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3(0.0);
  }
  return vec3(tickNumberLayers(delta, value, spacing, align, size, halo), (numberPlate(delta, value, spacing, align, size) * plate));
}

vec3 labelColor(vec3 color, vec3 plot_labels) {
  vec3 plated = mix(color, vec3(0.995), (plot_labels.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), plot_labels.y), vec3(0.25, 0.29, 0.35), plot_labels.x);
}

vec3 basisVector(vec3 p, PlotUniforms plot_u_2) {
  vec2 span = max(plot_u_2.plotSpan, vec2(0.00001));
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

vec3 _flow119_shared(float _flow114_input, float _flow115_input, float _flow116_input, float _flow117_input, float _flow118_input) {
  return vec3(((_flow114_input * _flow115_input) - (_flow116_input * _flow117_input)), _flow118_input, ((_flow114_input * _flow117_input) + (_flow116_input * _flow115_input)));
}

vec3 inverseCamera(vec3 p, PlotUniforms plot_u_6) {
  vec4 basis = plot_u_6.rotationBasis;
  float y = ((p.y * basis.w) + (p.z * basis.z));
  float depth = (((-p.y) * basis.z) + (p.z * basis.w));
  vec3 q = _flow119_shared(p.x, basis.y, depth, basis.x, y);
  return (plot_u_6.inverseModel * vec4((q * vec3(plot_u_6.plotSpan, max(plot_u_6.plotSpan.x, plot_u_6.plotSpan.y))), 0.0)).xyz;
}

ViewRay viewRay(vec2 uv, PlotUniforms plot_u_9) {
  vec2 screen = ((uv - vec2(0.5)) - plot_u_9.plotPan);
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
  float _gv0 = (size.x - 25.0);
  float _gv1 = ((size.y - 70.0) - height);
  vec2 lower = vec2(_gv0, _gv1);
  vec2 upper = (lower + vec2(10.0, height));
  vec2 q = max((lower - pixel), (pixel - upper));
  float distance = max(q.x, q.y);
  float coverage = distanceCoverage(max(0.0, distance), 1.2);
  float t = clamp(((pixel.y - _gv1) / height), 0.0, 1.0);
  vec3 result = mix(color, colorMap(t, _f2u(plot_u_10.surfaceRender.x)), coverage);
  float border = max(stroke(pixel, lower, vec2(_gv0, upper.y), 0.7), stroke(pixel, upper, vec2(upper.x, _gv1), 0.7));
  result = mix(result, vec3(0.3), border);
  vec3 plot_labels_2 = vec3(0.0);
  float _licm6 = (_gv0 - 5.0);
  for (int index = 0; (index < 3); index = (index + 1)) {
    float fraction = (float(index) * 0.5);
    float value = mix(_licm0, _licm1, fraction);
    vec2 at = vec2(_licm6, (mix(_gv1, upper.y, fraction) + _licm2));
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
  vec2 _sel0;
  if ((exponent < 0)) {
    float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
    vec2 _cse1 = vec2(_cse2, _cse2);
    _sel0 = df64_div(df64_add(_cse0, _cse1, _fp64_g), df64_add(value, _cse1, _fp64_g), _fp64_g);
  } else {
    _sel0 = value;
  }
  return _sel0;
}

vec2 wideGridSpacing(float step) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int exponent = _f2i(floor((log2(max(step, 1e-30)) / log2(10.0))));
  float multiplier = roundEven((step / pow(10.0, float(exponent))));
  return df64_mul(vec2(multiplier, 0.0), widePower(exponent), _fp64_g);
}

vec2 df64_floor(vec2 a, float _fp64_g) {
  float _v0 = floor(a.x);
  vec2 _sel12;
  if ((_v0 == a.x)) {
    _sel12 = df64_quickTwoSum(_v0, floor(a.y), _fp64_g);
  } else {
    _sel12 = vec2(_v0, 0.0);
  }
  return _sel12;
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
  vec2 _cse1 = vec2(0.0);
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
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = ((length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep((-aa), aa, distance));
}

vec4 loadLabels(ivec2 at) {
  return uintBitsToFloat(texelFetch(spatialLabels, at, int(0u)));
}

vec2 axisBase_u(vec3 axis) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  return df64_add(df64_add(df64_mul(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), vec2(axis.x, 0.0), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), vec2(axis.y, 0.0), _fp64_g), _fp64_g), df64_mul(vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), vec2(axis.z, 0.0), _fp64_g), _fp64_g);
}

PlotUniforms CoordinateUniforms_as_PlotUniforms_u() {
  return PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
}

vec3 _flow126_shared(vec2 _flow120_input, float _flow121_input, vec2 _flow122_input, float _flow123_input, vec2 _flow124_input, float _flow125_input) {
  return vec3((df64_narrow((-_flow120_input)) * (1.0 - _flow121_input)), (df64_narrow((-_flow122_input)) * (1.0 - _flow123_input)), (df64_narrow((-_flow124_input)) * (1.0 - _flow125_input)));
}

vec3 _flow9_fused(vec3 _flow6_input) {
  PlotUniforms _flow8_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  return basisVector((u.model * vec4(_flow6_input, 0.0)).xyz, _flow8_arg);
}

vec3 axisOriginH_u(vec3 axis) {
  vec3 local = _flow126_shared(vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x), axis.x, vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y), axis.y, vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z), axis.z);
  vec3 camera = _flow9_fused(local);
  vec2 size = plotSize(u.resolution);
  float w = ((u.view3d == 2u) ? (u.cameraLens.y - camera.z) : u.cameraLens.y);
  return vec3((((vec2((camera.x / (size.x / size.y)), camera.y) / u.cameraLens.x) + ((vec2(0.5) + u.plotPan) * w)) * size), w);
}

vec3 _flow150_shared(float _flow142_input, float _flow143_input, float _flow144_input, float _flow145_input, float _flow146_input, vec2 _flow147_input, float _flow148_input, vec2 _flow149_input) {
  return vec3((((vec2((_flow142_input / (_flow143_input / _flow144_input)), _flow145_input) * _flow146_input) + ((vec2(0.5) + _flow147_input) * _flow148_input)) * _flow149_input), _flow148_input);
}

vec3 _flow27_fused(vec3 _flow20_input) {
  PlotUniforms _flow26_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec2 _flow21_local = plotSize(u.resolution);
  vec3 _sel11 = vec3(0.0);
  _sel11 = cameraVector(_flow20_input, _flow26_arg);
  vec3 _flow22_local = _sel11;
  float _flow23_local = ((u.view3d == 2u) ? (-_flow22_local.z) : 0.0);
  float _flow24_local = (1.0 / u.cameraLens.x);
  return _flow150_shared(_flow22_local.x, _flow21_local.x, _flow21_local.y, _flow22_local.y, _flow24_local, u.plotPan, _flow23_local, _flow21_local);
}

vec3 axisH_u(float value, vec3 axis) {
  return (axisOriginH_u(axis) + (_flow27_fused(axis) * value));
}

bool axisVisible_u(float value, vec3 axis) {
  return ((u.view3d != 2u) || (axisH_u(value, axis).z >= 0.101));
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
  float _cse0 = (pixel.x - anchor.x);
  float _cse1 = (anchor.y - pixel.y);
  vec2 delta = vec2(_cse0, _cse1);
  if ((((_cse1 < 0.0) || (_cse1 > (size * 1.5))) || (abs(_cse0) > (size * 16.0)))) {
    return vec3(0.0);
  }
  return vec3(wideTickNumberLayers(delta, value, spacing, align, size, halo), (wideNumberPlate(delta, value, spacing, align, size) * plate));
}

vec3 _spec0_homogeneous(vec3 p, PlotUniforms plot_u_7) {
  vec2 size = plotSize(plot_u_7.resolution);
  vec3 _sel9 = vec3(0.0);
  _sel9 = cameraPoint(p, plot_u_7);
  vec3 camera = _sel9;
  float w = ((plot_u_7.view3d == 2u) ? (plot_u_7.cameraLens.y - camera.z) : plot_u_7.cameraLens.y);
  float focal = (1.0 / plot_u_7.cameraLens.x);
  return _flow150_shared(camera.x, size.x, size.y, camera.y, focal, plot_u_7.plotPan, w, size);
}

vec2 _flow43_fused(vec3 _flow39_input) {
  PlotUniforms _flow42_arg = PlotUniforms(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity, u.model, u.inverseModel, u.axesModel, u.inverseAxesModel, u.sceneOpacity, u.cameraLens, u.plotCenterZ, u.probe, u.parameterFocusSeed, u.view3d, u.parameterBounds, u.parameterMode, u.curveQuality, u.curvePattern, u.curveTiles, u.surfaceBounds, u.surfaceDomainMode, u.surfaceRange, u.surfaceHeight, u.surfaceDepth, u.surfaceRender, u.surfaceFlags);
  vec3 _flow40_local = _spec0_homogeneous(_flow39_input, _flow42_arg);
  return (_flow40_local.xy / max(_flow40_local.z, 0.101));
}

float axisParameter_u(vec2 pixel, vec3 axis) {
  vec3 origin = axisOriginH_u(axis);
  vec3 direction = _flow27_fused(axis);
  vec3 line = cross(origin, direction);
  vec2 foot = (pixel - ((line.xy * dot(line, vec3(pixel, 1.0))) / max(dot(line.xy, line.xy), 1e-20)));
  vec2 slope = (direction.xy - (foot * direction.z));
  return (dot(((foot * origin.z) - origin.xy), slope) / max(dot(slope, slope), 1e-20));
}

float axisField_u(vec2 pixel, vec3 axis, ViewRay ray) {
  vec3 origin = axisOriginH_u(axis);
  vec3 coefficients = cross(origin, _flow27_fused(axis));
  float magnitude = length(coefficients.xy);
  float distance = length((pixel - _flow43_fused(vec3(0.0))));
  if ((magnitude > 1e-12)) {
    distance = (abs(dot(coefficients, vec3(pixel, 1.0))) / magnitude);
  }
  float _sel2;
  if (axisVisible_u(axisParameter_u(pixel, axis), axis)) {
    _sel2 = distanceCoverage(distance, u.appearance.x);
  } else {
    _sel2 = 0.0;
  }
  return _sel2;
}

vec2 _flow129_shared(float _flow127_input, float _flow128_input) {
  return max(vec2(length(vec2(dFdx(_flow127_input), dFdy(_flow127_input))), length(vec2(dFdx(_flow128_input), dFdy(_flow128_input)))), vec2(1e-20));
}

float groundFieldNarrow_u(ViewRay ray, vec3 xLevels, vec3 zLevels) {
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  float _cse0 = abs(ray.direction.y);
  float denominator = ((_cse0 < 1e-8) ? ((ray.direction.y < 0.0) ? -1e-8 : 1e-8) : ray.direction.y);
  float depth = ((-ray.origin.y) / denominator);
  vec2 ground = (ray.origin + (ray.direction * depth)).xz;
  vec2 gradient = _flow129_shared(ground.x, ground.y);
  float field = 0.0;
  float _cse1 = pixelWidth();
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? _licm0 : _licm1);
    vec2 _gv1 = ((ground / spacing) + 0.5);
    vec2 distance = (((abs((fract(_gv1) - 0.5)) * spacing) / gradient) * _cse1);
    vec2 separation = ((spacing / gradient) * _cse1);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nearest = (floor(_gv1) * spacing);
    vec2 _sel4;
    if (_gv0) {
      _sel4 = vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, zLevels));
    } else {
      _sel4 = vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, zLevels));
    }
    vec2 weights = _sel4;
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || (depth >= 0.101)) && (_cse0 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec2 df64_max(vec2 a, vec2 b) {
  return (df64_gt(a, b) ? a : b);
}

vec3 _flow61_fused(vec3 _flow54_input) {
  vec4 _flow55_local = u.rotationBasis;
  float _flow56_local = ((_flow54_input.y * _flow55_local.w) + (_flow54_input.z * _flow55_local.z));
  float _flow57_local = (((-_flow54_input.y) * _flow55_local.z) + (_flow54_input.z * _flow55_local.w));
  vec3 _flow58_local = _flow119_shared(_flow54_input.x, _flow55_local.y, _flow57_local, _flow55_local.x, _flow56_local);
  return (u.inverseModel * vec4((_flow58_local * vec3(u.plotSpan, max(u.plotSpan.x, u.plotSpan.y))), 0.0)).xyz;
}

vec2 df64_fract(vec2 a, float _fp64_g) {
  return df64_sub(a, df64_floor(a, _fp64_g), _fp64_g);
}

vec2 _flow134_shared(vec2 _flow130_input, vec2 _flow131_input, vec2 _flow132_input, vec2 _flow133_input) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  float _cse2 = uintBitsToFloat(floatBitsToUint(0.0));
  vec2 _cse0 = vec2(_cse2, _cse2);
  vec2 _cse1 = vec2(0.5, 0.0);
  return (vec2(df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow130_input, _cse0, _fp64_g), df64_add(_flow131_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g)), df64_narrow(df64_fract(df64_add(df64_div(df64_add(_flow132_input, _cse0, _fp64_g), df64_add(_flow133_input, _cse0, _fp64_g), _fp64_g), _cse1, _fp64_g), _fp64_g))) - 0.5);
}

float groundField_u(vec2 uv, ViewRay ray, vec3 xLevels, vec3 zLevels) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  vec2 _licm0 = vec2(xLevels.x, zLevels.x);
  vec2 _licm1 = vec2(xLevels.y, zLevels.y);
  float _licm2 = clamp(u.labelStyle.x, 0.5, 2.0);
  float _licm3 = u.appearance.y;
  vec2 _cse0 = vec2(u.axesOrigin.hi.x, u.axesOrigin.lo.x);
  vec2 _cse1 = vec2(u.axesOrigin.hi.y, u.axesOrigin.lo.y);
  vec2 _cse2 = vec2(u.axesOrigin.hi.z, u.axesOrigin.lo.z);
  if (df64_lt(df64_max(df64_max(df64_abs(_cse0), df64_abs(_cse1)), df64_abs(_cse2)), vec2((min(xLevels.x, zLevels.x) * 1024.0), 0.0))) {
    return groundFieldNarrow_u(ray, xLevels, zLevels);
  }
  vec2 screen = ((uv - vec2(0.5)) - u.plotPan);
  vec2 size = plotSize(u.resolution);
  vec2 xy = (vec2((screen.x * (size.x / size.y)), screen.y) * u.cameraLens.x);
  vec3 eye = ((u.view3d == 2u) ? vec3(0.0, 0.0, u.cameraLens.y) : vec3((xy * u.cameraLens.y), u.cameraLens.y));
  vec3 offset = _flow61_fused(eye);
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
  vec2 gradient = max(vec2(length(vec2(dx.x, dy.x)), length(vec2(dx.y, dy.y))), vec2(1e-20));
  float field = 0.0;
  float _cse5 = pixelWidth();
  vec2 _cse6 = vec2(0.5, 0.0);
  vec2 _licm4 = vec2((12.0 / _licm2));
  vec2 _licm5 = vec2((28.0 / _licm2));
  for (int level = 0; (level < 2); level = (level + 1)) {
    vec2 spacing = ((level == 0) ? _licm0 : _licm1);
    vec2 sx = wideGridSpacing(spacing.x);
    vec2 sz = wideGridSpacing(spacing.y);
    vec2 phase = _flow134_shared(gx, sx, gz, sz);
    vec2 distance = (((abs(phase) * spacing) / gradient) * _cse5);
    vec2 separation = ((spacing / gradient) * _cse5);
    vec2 fade = smoothstep(_licm4, _licm5, separation);
    vec2 nx = df64_mul(df64_floor(df64_add(df64_div(_gv0, df64_add(sx, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sx, _fp64_g);
    vec2 nz = df64_mul(df64_floor(df64_add(df64_div(_gv1, df64_add(sz, _cse4, _fp64_g), _fp64_g), _cse6, _fp64_g), _fp64_g), sz, _fp64_g);
    bool _lc0 = (level != 0);
    vec2 weights = vec2(wideWeight(nx, xLevels, _lc0), wideWeight(nz, zLevels, _lc0));
    field = max(field, max(((distanceCoverage(distance.x, _licm3) * fade.x) * weights.x), ((distanceCoverage(distance.y, _licm3) * fade.y) * weights.y)));
  }
  return (((((u.view3d != 2u) || df64_ge(depth, vec2(0.10100000351667404, -3.516674063064329e-9))) && (_cse3 >= 1e-8)) && ((u.decorations & 1u) != 0u)) ? (field * u.decorationOpacity.x) : 0.0);
}

vec4 cachedSpatialTicks_u(vec2 pixel, vec3 axis, int index) {
  float _fp64_g = texelFetch(_fp64, ivec2(0, 0), 0).x;
  int _licm0 = (index * 12);
  bool _licm1 = ((u.decorations & 2u) != 0u);
  bool _licm2 = (u.appearance.x > 0.0);
  float _licm3 = ((u.appearance.x * 0.5) + 4.0);
  float _licm4 = u.appearance.x;
  vec2 _licm5 = axisBase_u(axis);
  float _licm6 = u.labelStyle.y;
  float _licm7 = u.labelStyle.z;
  float _licm8 = u.decorationOpacity.y;
  vec2 size = plotSize(u.resolution);
  float fontSize = u.appearance.w;
  vec3 axisLine = cross(axisOriginH_u(axis), _flow27_fused(axis));
  float magnitude = length(axisLine.xy);
  float _cse0 = pixelWidth();
  if (((magnitude <= 1e-12) || ((abs(dot(axisLine, vec3(pixel, 1.0))) / magnitude) > (((fontSize * 6.0) + 12.0) + _cse0)))) {
    return vec4(0.0);
  }
  vec2 normal = (axisLine.xy / magnitude);
  float _gv0 = (-normal.x);
  vec2 tangent = vec2(normal.y, _gv0);
  float low = (min(0.0, (normal.y * size.x)) + min(0.0, (_gv0 * size.y)));
  float coordinate = ((dot(pixel, tangent) - low) / max(dot(abs(tangent), size), 1e-20));
  int column = clamp(_f2i(floor((coordinate * float(u.curveTiles.w)))), 0, (int(u.curveTiles.w) - 1));
  vec3 labels = vec3(0.0);
  float ticks = 0.0;
  float _licm9 = ((fontSize * 0.95) + 6.0);
  vec2 _licm10 = vec2(0.0, (fontSize * 0.65));
  for (int candidate = 0; (candidate < 6); candidate = (candidate + 1)) {
    int row = (_licm0 + (candidate * 2));
    vec4 location = loadLabels(ivec2(column, row));
    vec2 at = location.xy;
    vec2 outward = location.zw;
    vec2 anchor = ((at + (outward * _licm9)) + _licm10);
    vec2 delta = (pixel - anchor);
    bool nearLabel = (((_licm1 && (abs(delta.x) <= (fontSize * 9.0))) && (delta.y >= ((((-fontSize) * 1.5) - 3.0) - _cse0))) && (delta.y <= (3.0 + _cse0)));
    bool nearTick = (_licm2 && all(lessThanEqual(abs((pixel - at)), vec2((_licm3 + _cse0)))));
    if (((nearLabel == false) && (nearTick == false))) {
      continue;
    }
    vec4 style = loadLabels(ivec2(column, (row + 1)));
    if ((nearTick && (style.z > 0.0))) {
      ticks = max(ticks, (tickMark(pixel, at, tangent, 3.0, _licm4) * style.z));
    }
    if ((nearLabel && (style.w > 0.0))) {
      labels = max(labels, ((wideNumberAt(pixel, anchor, df64_add(_licm5, vec2(style.x, 0.0), _fp64_g), style.y, 0.5, fontSize, _licm6, _licm7) * style.w) * _licm8));
    }
  }
  return vec4(ticks, labels);
}

PlotViewport CoordinateUniforms_as_PlotViewport_u() {
  return PlotViewport(u.resolution, u.plotCenter, u.plotSpan, u.plotRotation, u.rotationBasis, u.plotPan, u.plotBlend, u.appearance, u.decorations, u.labelStyle, u.decorationOpacity);
}

vec3 labelColorWide(vec3 color, vec3 layers) {
  vec3 plated = mix(color, vec3(0.995), (layers.z * 0.94));
  return mix(mix(plated, vec3(0.965, 0.973, 0.985), layers.y), vec3(0.25, 0.29, 0.35), layers.x);
}

_spec7_result _spec6_cachedSpatialBackground_u(vec2 uv) {
  PlotViewport _licm0 = CoordinateUniforms_as_PlotViewport_u();
  float _licm1 = u.decorationOpacity.z;
  vec2 size = plotSize(u.resolution);
  vec2 pixel = (uv * size);
  ViewRay ray = viewRay(uv, CoordinateUniforms_as_PlotUniforms_u());
  vec3 xLevels = loadLabels(ivec2(0, 37)).xyz;
  vec3 zLevels = loadLabels(ivec2(2, 37)).xyz;
  float grid = groundField_u(uv, ray, xLevels, zLevels);
  vec3 _cse0 = vec3(1.0, 0.0, 0.0);
  vec4 xTicks = cachedSpatialTicks_u(pixel, _cse0, 0);
  vec3 _cse1 = vec3(0.0, 1.0, 0.0);
  vec4 yTicks = cachedSpatialTicks_u(pixel, _cse1, 1);
  vec3 _cse2 = vec3(0.0, 0.0, 1.0);
  vec4 zTicks = cachedSpatialTicks_u(pixel, _cse2, 2);
  vec3 labels = max(max(xTicks.yzw, yTicks.yzw), zTicks.yzw);
  vec3 color = mix(vec3(0.965, 0.973, 0.985), vec3(0.8, 0.82, 0.85), (grid * 0.65));
  color = mix(color, vec3(0.67, 0.28, 0.25), axisField_u(pixel, _cse0, ray));
  color = mix(color, vec3(0.23, 0.47, 0.3), axisField_u(pixel, _cse1, ray));
  color = mix(color, vec3(0.4, 0.35, 0.62), axisField_u(pixel, _cse2, ray));
  color = mix(color, vec3(0.25, 0.29, 0.35), max(max(xTicks.x, yTicks.x), zTicks.x));
  if (((u.decorations & 4u) != 0u)) {
    vec4 _u0_name = loadLabels(ivec2(0, 36));
    if ((_u0_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u0_name.xy, _f2i(_u0_name.z), _licm0) * _licm1));
    }
    vec4 _u1_name = loadLabels(ivec2(1, 36));
    if ((_u1_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u1_name.xy, _f2i(_u1_name.z), _licm0) * _licm1));
    }
    vec4 _u2_name = loadLabels(ivec2(2, 36));
    if ((_u2_name.w > 0.0)) {
      labels = max(labels, (axisLabel(pixel, _u2_name.xy, _f2i(_u2_name.z), _licm0) * _licm1));
    }
  }
  vec3 _spec10_field = (labels * u.sceneOpacity.x);
  return _spec7_result(_spec10_field);
}

vec4 _spec5_labels(vec2 uv) {
  _spec7_result decor = _spec6_cachedSpatialBackground_u(uv);
  vec3 _cse0 = vec3(0.0);
  vec3 black = labelColorWide(_cse0, decor.labels);
  vec3 white = labelColorWide(vec3(1.0), decor.labels);
  PlotUniforms _cse1 = CoordinateUniforms_as_PlotUniforms_u();
  black = mix(black, surfaceColorBar(black, uv, _cse1), u.sceneOpacity.y);
  white = mix(white, surfaceColorBar(white, uv, _cse1), u.sceneOpacity.y);
  float alpha = clamp((1.0 - (white.x - black.x)), 0.0, 1.0);
  return vec4(((alpha > 0.0) ? (black / alpha) : _cse0), alpha);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  _ret = _spec5_labels(uv);
}
`,blocks:{u:"CoordinateUniforms",font:"FontUniforms"},samplers:{spatialLabels:null,glyphAtlas:null,_fp64:null}}}}};var m={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}},v=class{constructor(l,t,a,i){this.owner=l;this.format=t;this.surface=a;this.limit=i;this.program=l.runtime.load(this.pack)}pack=d;program;labels;backdrop;overlay;cache;async initialize(){let l=["buildSpatialLabels","drawBackdrop",this.surface?"drawSurfaceLabels":"drawLabels"],t=await Promise.allSettled(l.map((i,c)=>this.owner.run(()=>this.program.render({vertex:"fullscreen",fragment:i,targets:[c===0?"rgba32uint":c===2?{format:this.format,blend:m}:this.format]})))),a=t.find(i=>i.status==="rejected");if(a?.status==="rejected")throw a.reason;[this.labels,this.backdrop,this.overlay]=t.map(i=>i.value)}draw(l,t,a,i,c="clear"){let _=new Set(this.pack.entries.filter(o=>o.name===t.vertex||o.name===t.fragment).flatMap(o=>(o.bindings??[]).map(e=>e.name)));l.pass({color:[{target:i,load:c}]},o=>o.draw(t,Object.fromEntries(Object.entries(a).filter(([e])=>_.has(e))),{count:3}))}prepare(l,t,a,i){let c=t.u,_=c.resolution,o=Math.min(this.limit,Math.ceil(Math.hypot(..._)*a)+2),e=i?void 0:this.cache;e||(e={texture:this.owner.runtime.texture({size:[o,38],format:"rgba32uint"}),key:""},i||(this.cache=e)),e.texture.width!==o&&(e.texture.resize(o,38),e.key="");let f=c.curveTiles,n={...c,model:c.axesModel,inverseModel:c.inverseAxesModel,curveTiles:[f[0],f[1],f[2],o]},r={u:n,glyphAtlas:t.bindings.glyphAtlas,font:{pixelRatio:a},spatialLabels:e.texture},u=JSON.stringify([n.resolution,n.axesOrigin,n.plotSpan,n.plotPan,n.rotationBasis,n.cameraLens,n.view3d,n.appearance,n.labelStyle,n.decorations,n.decorationOpacity,n.sceneOpacity,n.model,n.inverseModel,a]);try{e.key!==u&&(this.draw(l,this.labels,r,e.texture),e.key=u)}catch(s){throw i?e.texture.destroy():e.key="",s}return{bindings:r,finish(s){i?e.texture.destroy():s||(e.key="")}}}background(l,t,a){this.draw(l,this.backdrop,t.bindings,a)}foreground(l,t,a){this.draw(l,this.overlay,t.bindings,a,"load")}dispose(){this.cache?.texture.destroy(),this.cache=void 0}};export{v as CoordinatesRenderer};
