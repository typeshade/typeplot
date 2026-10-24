"use typeshade";
declare const heights: storage<array<f32>>;
function heightAt(column: u32, row: u32, columns: u32): f32 { return heights[row*columns+column]; }
/** Bilinear observations remain resident; absent samples are never extrapolated. */
export function sample(x: f32, z: f32, gridXMin: f32, gridXMax: f32, gridZMin: f32, gridZMax: f32, gridRows: f32, gridColumns: f32, gridCount: f32, heightScale: f32, heightOffset: f32): f32 {
  if(!(gridColumns>=2&&gridColumns<=4194304&&gridRows>=2&&gridRows<=4194304&&gridCount>=4&&gridCount<=4194304))return 1e20;
  const columns=u32(gridColumns),rows=u32(gridRows);
  if(columns<u32(2)||rows<u32(2)||columns>u32(4194304)||rows>u32(4194304)||columns>u32(gridCount)/rows||!(gridXMax>gridXMin&&gridZMax>gridZMin))return 1e20;
  const fraction=vec2((x-gridXMin)/(gridXMax-gridXMin),(z-gridZMin)/(gridZMax-gridZMin));
  if(any(fraction<vec2(0))||any(fraction>vec2(1)))return 1e20;
  const coordinate=fraction*vec2(f32(columns-u32(1)),f32(rows-u32(1)));
  const low=vec2u(floor(coordinate)),high=min(low+vec2u(1),vec2u(columns-u32(1),rows-u32(1)));
  const t=fract(coordinate);
  const a=heightAt(low.x,low.y,columns),b=heightAt(high.x,low.y,columns),c=heightAt(low.x,high.y,columns),d=heightAt(high.x,high.y,columns);
  if(!(abs(a)<1e18&&abs(b)<1e18&&abs(c)<1e18&&abs(d)<1e18))return 1e20;
  return mix(mix(a,b,t.x),mix(c,d,t.x),t.y)*heightScale+heightOffset;
}
