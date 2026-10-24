import{a as we,b as $,d as ae,h as Ge,i as He,p as oe}from"./chunk-LUN72YDN.js";import{a as Ve,b as H,g as M}from"./chunk-ZLOTGWYT.js";import{a as Ke,b as se}from"./chunk-UQPTWQHA.js";import{a as Ye}from"./chunk-DDPNJOPS.js";import{b as ye}from"./chunk-3T5N3NYN.js";import{a as L,b as ie,c as ze,d as Ee,h as Me,j as O,k as Be,l as Ue,p as Ne,r as qe,s as Ce,t as je,u as We,v as $e,w as Ie}from"./chunk-66TJAPV3.js";import{A as De,C as Pe,D as Re,H as Fe,K as j,L as Te,N as Le,P as re,Q as Ae,R as A,S as F,V as Oe,a as ge,b as xe,c as be,d as I,e as C,f as _e,h as ke,i as Se,j as G}from"./chunk-IMLMLGHM.js";var V=class{from;target;started=-1/0;constructor(e){this.from=e,this.target=e}value(e){let n=Math.max(0,Math.min(1,(e-this.started)/160));return this.from+(this.target-this.from)*n*n*(3-2*n)}set(e,n,t){e!==this.target&&(this.from=t?e:this.value(n),this.target=e,this.started=n)}active(e){return this.from!==this.target&&e-this.started<160}};var ht=1<<20,K=class{constructor(e,n,t,i={}){this.gpu=e;this.pool=new $e(e),this.info=G("webgpu",e),this.limits=I(e.limits),this.#e=typeof n.console=="function"?n.console:void 0,this.#a=n.consoleBytes??ht,this.#r=t,this.#i=n.emit,this.#s=i}info;tier="webgpu";limits;pool;#e;#a;#o=[];#t=new Map;#n;#r;#i;#s;limitRemedy(e,n){return this.#r?this.#s[e]===n?"This adapter supports no more.":"Pass the program in createRuntime({ programs }), or raise the limit with createRuntime({ limits }).":"Request the limit in requestDevice({ requiredLimits }) for the device the runtime was given."}get device(){return this.gpu}load(e,n={}){Ue(e);for(let i of e.features)if(!this.gpu.features.has(i))throw new TypeError(`The program needs the "${i}" feature, which this device lacks; request it, or pass the program in createRuntime({ programs }).`);let t=n.console??e.console!==void 0;if(t&&e.console===void 0){if(this.#i===void 0||e.ir===void 0)throw new TypeError(this.#i===void 0?"load({ console: true }): this manifest carries no recorded variant; build it with packModule(m, { console: true }) or in vite dev, or pass the load-time emitter, createRuntime({ emit: repack }), with a manifest that carries its IR.":"load({ console: true }): this manifest carries no recorded variant and no IR to emit one from; build it with packModule(m, { ir: true }) or typeshade({ ir: true }).");e=this.#i(e,{console:!0})}return new Ie(this,e,t)}texture(e){return new O(this.gpu,e)}sampler(e){return new Be(this.gpu,e)}frame(){return new le(this)}bindGroup(e,n,t){let i=this.#t.get(e);i===void 0&&this.#t.set(e,i=new Map);let r=i.get(n);return r===void 0&&(i.size>4096&&i.clear(),i.set(n,r=this.gpu.createBindGroup({layout:e,entries:t}))),r}guardView(){if(this.#n===void 0){let e=this.gpu.createTexture({size:[1,1,1],format:"rgba8unorm",usage:ie.TEXTURE_BINDING|ie.COPY_DST});this.gpu.queue.writeTexture({texture:e},new Uint8Array([255,255,255,255]),{bytesPerRow:4},[1,1,1]),this.#n=e.createView()}return this.#n}consoleBuffer(e,n){let t=this.#a,i=this.pool.take(t,L.STORAGE|L.COPY_SRC|L.COPY_DST);return this.gpu.queue.writeBuffer(i,0,new Uint32Array(2)),this.#o.push({buffer:i,log:e,entry:n,size:t}),i}takeConsole(e){let n=this.#o;if(this.#o=[],n.length===0)return;let t=n.map(i=>{let r=this.pool.take(i.size,L.MAP_READ|L.COPY_DST);return e.copyBufferToBuffer(i.buffer,0,r,0,i.size),{...i,staging:r}});return async()=>{let i=[];for(let r of t){await r.staging.mapAsync(ze);let s=new Uint32Array(r.staging.getMappedRange().slice(0));r.staging.unmap();let{events:o,dropped:d}=ge(s,r.log);if(this.#e!==void 0)for(let l of o)this.#e(l);else{for(let l of o)xe(l,"GPU");be(r.entry,d)}i.push({entry:r.entry,lines:o.length,dropped:d})}return i}}async submit(...e){if(e.length===0)throw new TypeError("submit() takes the GPUCommandEncoders to submit.");let n=e[e.length-1],t=this.takeConsole(n);this.gpu.queue.submit(e.map(s=>s.finish()));let i=this.gpu.queue.onSubmittedWorkDone();this.pool.release(i);let r=t===void 0?[]:await t();return await i,{console:r}}destroy(){this.pool.destroy(),this.#t.clear(),this.#r&&this.gpu.destroy?.()}},le=class{constructor(e){this.rt=e;e.gpu.pushErrorScope("validation"),this.#e=e.gpu.createCommandEncoder()}#e;#a=!1;get encoder(){return this.#e}dispatch(e,n,t){e.dispatch(this.#e,n,t)}pass(e,n){let t=qe(e,vt),i,r=t.color.map(u=>{let p=Xe(u.target);return i??=p.size,{view:p.view,loadOp:u.load,storeOp:u.store,clearValue:u.clear}}),s=t.depth,o=s===void 0?void 0:Xe(s.target);i??=o?.size;let d=this.#e.beginRenderPass({colorAttachments:r,...s!==void 0&&o!==void 0?{depthStencilAttachment:yt(o.view,s)}:{}}),l=this.rt.limits.maxTextureDimension2D??8192,c=new ce(d,l,i,{depthFormat:s?.format,depthReadOnly:s?.depth.readOnly??!1,stencilReadOnly:s?.stencil?.readOnly??!1});try{n(c)}finally{d.end()}}async submit(){if(this.#a)throw new TypeError("This frame was submitted already; make a new one with rt.frame().");this.#a=!0;let e=this.rt.takeConsole(this.#e);this.rt.gpu.queue.submit([this.#e.finish()]);let n=this.rt.gpu.popErrorScope(),t=this.rt.gpu.queue.onSubmittedWorkDone();this.rt.pool.release(t);let i=await n;if(i!==null)throw new Error(`The frame did not validate: ${i.message}`);let r=e===void 0?[]:await e();return await t,{console:r}}};function Xe(a){if(a instanceof O)return{view:a.view(),size:{width:a.width,height:a.height}};if("getCurrentTexture"in a){let e=a.getCurrentTexture();return{view:e.createView(),size:{width:e.width,height:e.height}}}return"createView"in a?{view:a.createView()}:{view:a}}var vt={isTexture:a=>a instanceof O,isCanvas:a=>"getCurrentTexture"in a,formatOf:a=>a.format};function yt(a,e){let n=e.depth,t=e.stencil;return{view:a,...n.readOnly?{depthReadOnly:!0}:{depthLoadOp:n.load,depthStoreOp:n.store,depthClearValue:n.clear},...t===void 0?{}:t.readOnly?{stencilReadOnly:!0}:{stencilLoadOp:t.load,stencilStoreOp:t.store,stencilClearValue:t.clear}}}var ce=class{constructor(e,n,t,i){this.raw=e;this.limit=n;this.size=t;this.passState={...i,blend:[0,0,0,0],blendDeclared:!1,stencilReference:0}}passState;draw(e,n,t){e.draw(this,n,t)}setViewport(e,n,t,i,r,s){let o=Ce(e,n,t,i,r,s,this.limit);this.raw.setViewport(...o.rect,o.minDepth,o.maxDepth)}setScissorRect(e,n,t,i){this.raw.setScissorRect(...je(e,n,t,i,this.size))}setBlendConstant(e){let n=We(e);this.raw.setBlendConstant(n),this.passState.blend=n,this.passState.blendDeclared=!1}setStencilReference(e){let n=Ne(e);this.raw.setStencilReference(n),this.passState.stencilReference=n}};function gt(a){let e=a;return typeof e.getParameter=="function"&&typeof e.createTransformFeedback=="function"}async function Ze(a,e){let{GlRuntimeImpl:n}=await import("./chunk-Z7GMD2FN.js");return new n(a,e)}async function Y(a={}){let e=a.limits;if(e!==void 0&&_e(e),a.device!==void 0){if(gt(a.device)){if(e!==void 0)throw new TypeError("createRuntime({ limits }): the device is a WebGL2 context, which has no WebGPU limits. Omit limits, or pass a GPUDevice.");return await Ze(a.device,!1)}let i=a.device;return e!==void 0&&wt(e,i.limits),new K(i,a,!1)}let n=a.prefer??["webgpu","webgl2"];if(!Array.isArray(n)||n.length===0)throw new TypeError("createRuntime(): prefer takes a non-empty list of tiers.");for(let i of n)if(i!=="webgpu"&&i!=="webgl2")throw new TypeError(`createRuntime(): "${String(i)}" is not a tier of the program runtime; its tiers are webgpu and webgl2.`);if(new Set(n).size!==n.length)throw new TypeError("createRuntime(): prefer names a tier twice.");let t=[];for(let i of n){if(i==="webgl2"){let m=we();if(m!==null)return await Ze(m,!0);t.push("webgl2: the environment makes no WebGL2 context");continue}let r=Ee();if(r===void 0){t.push("webgpu: navigator.gpu is undefined");continue}let s=await r.requestAdapter();if(s===null){t.push("webgpu: WebGPU gave no adapter");continue}let o=new Set((a.programs??[]).flatMap(m=>m.features)),d=[...o].find(m=>!s.features.has(m));if(d!==void 0){t.push(`webgpu: the adapter lacks the "${d}" feature a program needs`);continue}let l=I(s.limits),c=e===void 0?void 0:xt(e,l,t);if(c==="refused")continue;let u=bt(a,l,c),p=await s.requestDevice({requiredFeatures:[...o],...Object.keys(u).length>0?{requiredLimits:u}:{}});return Se(p,s),new K(p,a,!0,l)}throw new Error(`createRuntime(): no tier it may use is here (${t.join("; ")}).`)}function xt(a,e,n){if(Object.keys(e).length===0)return a;for(let t of Object.keys(a)){if(!Object.hasOwn(e,t))throw new TypeError(`createRuntime({ limits }): "${t}" is not a limit this adapter reports.`);let i=a[t],r=e[t];if(C(t)?i<r:i>r)return n.push(`webgpu: the adapter supports ${t} ${C(t)?"down to":"up to"} ${r}, and createRuntime({ limits }) asks for ${i}`),"refused"}return a}function bt(a,e,n){let t={};if(Object.keys(e).length===0)return t;for(let[i,r]of Object.entries(Me(a.programs??[],a.emit!==void 0)))Object.hasOwn(e,i)&&(t[i]=Math.min(r,e[i]));for(let[i,r]of Object.entries(n??{}))t[i]=C(i)?r:Math.max(t[i]??0,r);for(let i of["maxStorageBufferBindingSize","maxUniformBufferBindingSize"]){let r=n?.[i];r===void 0||!Object.hasOwn(e,"maxBufferSize")||(t.maxBufferSize=Math.max(t.maxBufferSize??0,Math.min(r,e.maxBufferSize)))}return t}function wt(a,e){let n=I(e);if(Object.keys(n).length!==0)for(let t of Object.keys(a)){if(!Object.hasOwn(n,t))throw new TypeError(`createRuntime({ limits }): "${t}" is not a limit this device reports.`);let i=a[t],r=n[t];if(C(t)?i<r:i>r)throw new TypeError(`The device has ${t} ${r}; createRuntime({ limits }) asks for ${i}. Request the limit in requestDevice({ requiredLimits }) for this device, or omit device so the runtime requests it.`)}}function Qe(a,e,n,t=1){if(a===void 0)return Math.max(1,Math.min(n,t));let i=Math.floor(e*.8/a.msPerUnit);return Math.min(n,Math.max(1,t,Math.min(i,a.lastUnits*4)))}function Je(a,e,n){let t=Math.max(1,e),i=Math.max(.001,n)/t;return Object.freeze({msPerUnit:a===void 0?i:.5*a.msPerUnit+.5*i,chunks:(a?.chunks??0)+1,longestMs:Math.max(a?.longestMs??0,n),lastUnits:t})}var _t=64*1024*1024,kt=250,et=6e4;function tt(a){if(a instanceof Float32Array)return"f32";if(a instanceof Int32Array)return"i32";if(a instanceof Uint32Array)return"u32";if(a instanceof Float64Array)return"f64"}var St={f32:4,i32:4,u32:4,f64:8},Dt=0,z=class{info;tier;fp64Flavor;timeBudgetMs;skipped;limits;lost;label;owner;#e;#a;#o;#t=new Map;#n=new Map;#r=new Set;#i=0;#s=0;#p=0;#h=0;#u=0;#v=0;#d=new Map;#c;#f=new Set;constructor(e,n,t,i,r,s,o,d){this.tier=e;let l=i??(e==="webgl2"?$():null);this.info=G(e,l),this.fp64Flavor=o==="auto"?ke(e,l,this.info):o,this.timeBudgetMs=d,this.skipped=Object.freeze(t.map(c=>Object.freeze({...c}))),this.#e=i,this.#a=r,this.#o=s,this.label=`Device #${++Dt}`,this.limits=i===null?Object.freeze({}):Pe(i).limits,this.lost=i===null?new Promise(()=>{}):i.lost.then(c=>{let u=c??{};return Object.freeze({reason:typeof u.reason=="string"?u.reason:"unknown",message:typeof u.message=="string"?u.message:"the WebGPU device was lost"})}),this.owner=Object.freeze({label:this.label,tiers:()=>n,device:()=>Promise.resolve(i),fp64Flavor:()=>this.fp64Flavor,assertCall:()=>this.#l("call()")})}get statistics(){return Object.freeze({live:this.#t.size,liveBytes:this.#s,pooledBytes:this.#i,allocations:this.#p,reuses:this.#h,uploadBytes:this.#u,readBytes:this.#v})}array(...e){this.#l("array()");let n=e.length>=2,[t,i]=e,r=n?A(t,i):A(t),s=re(r),o=n?i:tt(t),d=n?t:o!==void 0?t.length:0,l=o===void 0?void 0:`${o}:${d}`,c=o===void 0?0:d*St[o];!n&&o!==void 0&&(this.#u+=c);let u=l===void 0?void 0:this.#w(l);if(u!==void 0)return r.destroy(),this.#h++,n?this.#_(u,o,d):u.inner.write(t),this.#y(u);let p={state:s,inner:r,key:l,element:o,length:d,bytes:c,pooled:!1};return s.ownedBy=this.owner,this.#t.set(s,p),this.#s+=c,this.#p++,this.#y(p)}texture(e){this.#l("texture()");let n=`${this.label}.texture()`;if(typeof e!="object"||e===null)throw new TypeError(`${n}: takes an options object, { size: [width, height], format }.`);let{size:t,format:i,storage:r}=e;if(!Array.isArray(t)||t.length!==2||!t.every(o=>Number.isSafeInteger(o)&&o>=1))throw new TypeError(`${n}: size takes [width, height], two whole numbers of 1 or more.`);if(typeof i!="string"||i==="")throw new TypeError(`${n}: format takes a WebGPU texture format, such as "rgba8unorm".`);if(r!==void 0&&typeof r!="boolean")throw new TypeError(`${n}: storage takes true or false.`);if(this.#e===null){let o=Ge(i);if(o!==void 0)throw new TypeError(`${n}: ${o}.`);let d=new He(t[0],t[1],i);return ae.set(d,this.owner),d}let s=new O(this.#e,{size:[t[0],t[1]],format:i,...r===!0?{storage:!0}:{}});return ae.set(s,this.owner),this.#f.add(s),s}release(e){this.#l("release()");let n=this.#k(e,"release()");if(n.pooled)return;if(n.key===void 0||n.bytes>this.#o||n.bytes===0){this.#g(n);return}n.pooled=!0;let t=this.#n.get(n.key);t===void 0?this.#n.set(n.key,[n]):t.push(n),this.#r.add(n),this.#i+=n.bytes;for(let i of this.#r){if(this.#i<=this.#o)break;this.#g(i)}}get chunkRates(){return Object.freeze(Object.fromEntries(this.#d))}chunkSize(e,n,t=1){this.#l("chunkSize()"),it(`${this.label}.chunkSize()`,"key",e);for(let[i,r]of[["max",n],["min",t]])if(!Number.isSafeInteger(r)||r<1)throw new RangeError(`${this.label}.chunkSize(): ${i} takes a whole number of 1 or more.`);return this.tier==="cpu"?n:Qe(this.#d.get(e),this.timeBudgetMs,n,t)}fuse(e,n){let t;try{this.#l("fuse()"),t=Pt(`${this.label}.fuse()`,n)}catch(i){return Promise.reject(i)}return t===void 0?oe(e,this.owner):this.#b(oe,e,t)}#b(e,n,t){let i;try{i=F.run(()=>this.#m())}catch(o){return Promise.reject(o)}let r=e(n,this.owner),s=F.run(()=>this.#m());return Promise.all([i,r,s]).then(([o,d,l])=>{let c=l-o;return this.#d.set(t.key,Je(this.#d.get(t.key),t.units,c)),{...d,chunk:Object.freeze({key:t.key,units:t.units,elapsedMs:c})}})}async#m(){let e=this.#e?.queue;return typeof e?.onSubmittedWorkDone=="function"&&await e.onSubmittedWorkDone(),performance.now()}async wait(){this.#l("wait()"),await F.idle(),await this.#m()}dispose(){return this.#c!==void 0?this.#c:(this.#c=(async()=>{await F.idle();for(let e of this.#t.values())e.inner.destroy();this.#t.clear(),this.#n.clear(),this.#r.clear(),this.#i=0,this.#s=0;for(let e of this.#f)e.destroy();if(this.#f.clear(),this.#a&&this.#e!==null){let e=this.#e;F.whenIdle(()=>e.destroy?.())}})(),this.#c)}#y(e){let n={read:()=>e.inner.read().then(t=>(ArrayBuffer.isView(t)&&(this.#v+=t.byteLength),t)),write:t=>{e.inner.write(t),tt(t)!==void 0&&(this.#u+=t.byteLength)},destroy:()=>{this.#t.has(e.state)&&this.#x(e),e.inner.destroy()}};return Ae(n,e.state),n}#w(e){let n=this.#n.get(e),t=n?.shift();if(t!==void 0)return n.length===0&&this.#n.delete(e),this.#r.delete(t),this.#i-=t.bytes,t.pooled=!1,t}#_(e,n,t){let i=e.state;F.whenIdle(()=>{let r=Le[n](t),s=this.#e;if(i.gpu!==void 0&&s!==null&&i.gpu.d===s){i.host=r,i.fresh="device",i.clearPending=!0,Fe.set(i.gpu.buffer,i);return}i.assign(r)})}#g(e){this.#x(e),e.inner.destroy()}#x(e){if(e.pooled){e.pooled=!1,this.#r.delete(e),this.#i-=e.bytes;let n=this.#n.get(e.key);if(n!==void 0){let t=n.indexOf(e);t>=0&&n.splice(t,1),n.length===0&&this.#n.delete(e.key)}}this.#t.delete(e.state),this.#s-=e.bytes}#k(e,n){let t=re(e);if(t===void 0)throw new TypeError(`${this.label}.${n}: takes a Resident this device made with array().`);let i=this.#t.get(t);if(i===void 0)throw new TypeError(t.ownedBy===this.owner?`${this.label}.${n}: this Resident was destroyed.`:`${this.label}.${n}: this Resident belongs to ${t.ownedBy?.label??"the default owner (configure(), resident())"}, not to ${this.label}.`);return i}#l(e){if(this.#c!==void 0)throw new TypeError(`${this.label}.${e}: this Device was disposed. Make a new one with createDevice().`)}};function it(a,e,n){if(typeof n!="string"||n==="")throw new TypeError(`${a}: ${e} takes a non-empty string that names the kernel loop.`)}function Pt(a,e){if(e===void 0)return;if(typeof e!="object"||e===null)throw new TypeError(`${a}: the second argument takes an object, { chunk: { key, units } }.`);let n=e.chunk;if(n===void 0)return;if(typeof n!="object"||n===null)throw new TypeError(`${a}: chunk takes an object, { key, units }.`);let{key:t,units:i}=n;if(it(a,"chunk.key",t),typeof i!="number"||!Number.isSafeInteger(i)||i<1)throw new TypeError(`${a}: chunk.units takes a whole number of 1 or more.`);return{key:t,units:i}}function nt(a){let e=a;return typeof e.getParameter=="function"&&typeof e.createTransformFeedback=="function"}async function de(a={}){if(typeof a!="object"||a===null)throw new TypeError("createDevice(): takes an options object.");let e=["prefer","device","runtime"].filter(o=>a[o]!==void 0);if(e.length>1)throw new TypeError(`createDevice(): ${e.map(o=>`"${o}"`).join(" and ")} are exclusive; pass one of prefer, device and runtime.`);let n=a.poolBytes??_t;if(!Number.isSafeInteger(n)||n<0)throw new TypeError("createDevice(): poolBytes takes a whole number of bytes, 0 or more.");let t=a.timeBudgetMs??kt;if(typeof t!="number"||!Number.isFinite(t)||t<1||t>et)throw new RangeError(`createDevice(): timeBudgetMs takes a finite number of milliseconds from 1 to ${et}.`);let i=a.fp64Flavor===void 0?"auto":Oe("createDevice({ fp64Flavor })",a.fp64Flavor);if(a.device!==void 0){if(typeof a.device!="object"||a.device===null||nt(a.device))throw new TypeError("createDevice({ device }): device takes a GPUDevice.");return new z("webgpu",j,[],a.device,!1,n,i,t)}if(a.runtime!==void 0){let o=a.runtime;if(typeof o!="object"||o===null||typeof o.device!="object"||o.device===null)throw new TypeError("createDevice({ runtime }): runtime takes a runtime from createRuntime().");if(o.tier==="webgl2"||nt(o.device))throw new TypeError("createDevice({ runtime }): runtime takes a WebGPU runtime; on WebGL2 the calls use a context of their own.");return new z("webgpu",j,[],o.device,!1,n,i,t)}let r=a.prefer??j;if(!Array.isArray(r)||r.length===0)throw new TypeError("createDevice(): prefer takes a non-empty list of tiers.");for(let o of r)if(!j.includes(o))throw new TypeError(`createDevice(): "${String(o)}" is not a tier; the tiers are ${Te()}.`);if(new Set(r).size!==r.length)throw new TypeError("createDevice(): prefer names a tier twice.");let s=[];for(let[o,d]of r.entries()){let l=r.slice(o);if(d==="webgpu"){let c=await Re(De());if(c!==null)return new z(d,l,s,c,!0,n,i,t);s.push({tier:d,reason:"there is no WebGPU device"})}else if(d==="webgl2"){if($()!==null)return new z(d,l,s,null,!1,n,i,t);s.push({tier:d,reason:"there is no WebGL2 context"})}else return new z(d,l,s,null,!1,n,i,t)}throw new Error(`createDevice(): no tier of prefer opened (${s.map(o=>`${o.tier}: ${o.reason}`).join("; ")}).`)}var X=class{constructor(e,n){this.win=e;this.gl=n}stopped=!1;pending=new Set;wait(){let e=this.gl;if(!e||this.stopped||e.isContextLost())return Promise.resolve();let n=e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE,0);return n?(e.flush(),new Promise(t=>{let i=0,r=()=>{this.win.clearTimeout(i),e.deleteSync(n),this.pending.delete(r),t()},s=()=>{if(this.stopped||e.isContextLost()){r();return}e.clientWaitSync(n,0,0)===e.TIMEOUT_EXPIRED?i=this.win.setTimeout(s,4):r()};this.pending.add(r),s()})):Promise.resolve()}destroy(){this.stopped=!0;for(let e of[...this.pending])e()}};var Z=class{constructor(e,n){this.runtime=e;this.completion=new X(n,e.tier==="webgl2"?e.device:void 0)}scope=new Ve;completion;arrays=new Set;device;preparing;retirement;run(e){return this.scope.run(e)}prepareData(){return this.preparing||(this.preparing=this.run(async()=>{this.runtime.tier==="webgpu"&&(this.device=await de({runtime:this.runtime}))})),this.preparing}array(e){if(this.scope.assertOpen(),this.runtime.tier==="webgpu"&&!this.device)throw new Error("Prepare the session's data owner before allocating resident inputs.");let n=this.device?this.device.array(e):A(e);return this.arrays.add(n),n}release(e){this.arrays.delete(e)&&(this.device?this.device.release(e):e.destroy())}present(e){return this.run(async()=>{await e.submit(),await this.completion.wait()})}retire(e){if(!this.retirement){let n=this.scope.close();this.completion.destroy(),this.retirement=n.then(async()=>{let t=[],i=r=>{try{r()}catch(s){t.push(s)}};try{await e()}catch(r){t.push(r)}for(let r of[...this.arrays])i(()=>this.release(r));try{await this.device?.dispose()}catch(r){t.push(r)}if(i(()=>this.runtime.destroy()),t.length)throw new AggregateError(t,"Rendering resources could not all be disposed.")})}return this.retirement}};var ue={schema:2,compiler:"0.1.0",wgsl:`struct FontUniforms {
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

struct DataUniforms {
  resolution: vec2<f32>,
  lower: vec2<f32>,
  span: vec2<f32>,
  logarithmic: vec2<f32>,
  grid: f32,
  labelStyle: vec4<f32>,
  layer: f32,
  background: vec4<f32>,
  legend: vec4<f32>,
  focus: f32,
}

struct SeriesUniforms {
  color: vec4<f32>,
  kind: f32,
  width: f32,
  dash: f32,
  marker: f32,
  count: u32,
  ordered: u32,
  period: f32,
  offset: f32,
  automatic: u32,
  xParameter: u32,
  parameterRange: f32,
  dataBounds: vec4<f32>,
  baseline: f32,
  capSize: f32,
  where_: u32,
}

struct TextUniforms {
  color: vec4<f32>,
  box: vec4<f32>,
  anchor: vec4<f32>,
  offset: vec2<f32>,
  target_: vec2<f32>,
  arrow: vec4<f32>,
}

struct Surface {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

struct Letter {
  @builtin(position) position: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) @interpolate(flat) code: u32,
  @location(2) size: f32,
}

struct DataHit {
  distance: f32,
  index: u32,
}

struct DataPickUniforms {
  pixel: vec2<f32>,
  radius: f32,
  series: u32,
}

struct FieldUniforms {
  bounds: vec4<f32>,
  range: vec2<f32>,
  shape: vec2<u32>,
  palette: u32,
  origin: u32,
  mode: u32,
  interpolation: u32,
  alpha: f32,
  levels: u32,
  lineWidth: f32,
}

struct FieldSample {
  value: f32,
  valid: bool,
  index: u32,
  gradient: vec2<f32>,
}

@group(0) @binding(0) var<uniform> u: DataUniforms;
@group(0) @binding(1) var<uniform> s: SeriesUniforms;
@group(0) @binding(2) var<storage, read> points: array<f32>;
@group(0) @binding(3) var<uniform> text: TextUniforms;
@group(0) @binding(4) var<uniform> query: DataPickUniforms;
@group(0) @binding(5) var<uniform> field: FieldUniforms;
@group(0) @binding(6) var glyphAtlas: texture_2d<f32>;
@group(0) @binding(7) var<uniform> font: FontUniforms;

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

fn clipPosition(p: vec2<f32>) -> vec4<f32> {
  return vec4<f32>((((p.x / u.resolution.x) * 2.0) - 1.0), (1.0 - ((p.y / u.resolution.y) * 2.0)), 0.0, 1.0);
}

fn extent() -> vec2<f32> {
  return max((u.resolution - vec2<f32>(100.0, 104.0)), vec2<f32>(1.0, 1.0));
}

fn pixelPoint(p: vec2<f32>) -> vec2<f32> {
  let _cse0 = log2(10.0);
  let q = vec2<f32>(select(p.x, (log2(max(p.x, 1e-30)) / _cse0), (u.logarithmic.x > 0.0)), select(p.y, (log2(max(p.y, 1e-30)) / _cse0), (u.logarithmic.y > 0.0)));
  let position = ((q - u.lower) / u.span);
  return (vec2<f32>(76.0, 42.0) + (vec2<f32>(position.x, (1.0 - position.y)) * extent()));
}

fn line(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, radius: f32) -> f32 {
  let d = (b - a);
  let _cse0 = (p - a);
  let t = clamp((dot(_cse0, d) / max(dot(d, d), 0.00001)), 0.0, 1.0);
  let aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep(max(0.0, (radius - aa)), (radius + aa), length((_cse0 - (t * d)))));
}

fn dataTickLevels(lower: f32, span: f32, pixels: f32, logarithmic: f32, horizontal: bool) -> vec3<f32> {
  let size = u.labelStyle.x;
  let rough = (((span * size) * 4.0) / max(pixels, 1.0));
  var gap: f32 = (size * 2.6);
  let _cse0 = (logarithmic > 0.0);
  if (horizontal) {
    let low = select(lower, pow(10.0, lower), _cse0);
    let _cse1 = (lower + span);
    let high = select(_cse1, pow(10.0, _cse1), _cse0);
    let step = select(rough, max((low * (pow(10.0, min(rough, 20.0)) - 1.0)), 1e-30), _cse0);
    gap = max((size * 3.5), (max(numberWidth(low, step, size), numberWidth(high, step, size)) + (size * 1.3)));
  }
  var raw: f32 = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if ((_cse0 && (span >= 2.0))) {
    raw = max(raw, 1.0);
  }
  return tickLevels(raw);
}

@vertex
fn surfaceVertex(@builtin(vertex_index) i: u32) -> Surface {
  let x = select(-1.0, 3.0, (i == 1u));
  let y = select(-1.0, 3.0, (i == 2u));
  return Surface(vec4<f32>(x, y, 0.0, 1.0), vec2<f32>(((x * 0.5) + 0.5), ((y * 0.5) + 0.5)));
}

@fragment
fn axesFragment(v: Surface) -> @location(0) vec4<f32> {
  let _licm0 = u.lower.x;
  let _licm1 = u.span.x;
  let _licm2 = u.lower.y;
  let _licm3 = u.span.y;
  let _licm4 = (u.layer > 0.5);
  let _licm5 = vec2<f32>(1.0, 0.0);
  let _licm6 = u.labelStyle.x;
  let _licm7 = u.resolution.x;
  let _licm8 = u.labelStyle.z;
  let _licm9 = u.labelStyle.w;
  let _licm10 = vec2<f32>(0.0, 1.0);
  let _licm11 = (u.labelStyle.x * 1.6);
  let _licm12 = (u.labelStyle.x * 2.2);
  let _licm13 = (u.labelStyle.x * 0.75);
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let size = extent();
  let lo = vec2<f32>(76.0, 42.0);
  let hi = (lo + size);
  let inside = ((((p.x >= lo.x) && (p.x <= hi.x)) && (p.y >= lo.y)) && (p.y <= hi.y));
  let value = (u.lower + (vec2<f32>(((p.x - lo.x) / size.x), (1.0 - ((p.y - lo.y) / size.y))) * u.span));
  let xLevels = dataTickLevels(_licm0, _licm1, size.x, u.logarithmic.x, true);
  let yLevels = dataTickLevels(_licm2, _licm3, size.y, u.logarithmic.y, false);
  var grid: f32 = 0.0;
  var labels: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
  let _lc0 = vec2<f32>(hi.x, lo.y);
  let _lc1 = vec2<f32>(lo.x, hi.y);
  var coverage: f32 = max(max(line(p, lo, _lc0, 0.5), line(p, lo, _lc1, 0.5)), max(line(p, hi, _lc1, 0.5), line(p, hi, _lc0, 0.5)));
  let _cse0 = (u.logarithmic.x > 0.0);
  let _cse1 = (u.logarithmic.y > 0.0);
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let _gv0 = (level == 0);
    let spacing = select(vec2<f32>(xLevels.y, yLevels.y), vec2<f32>(xLevels.x, yLevels.x), _gv0);
    let nearest = (floor(((value / spacing) + 0.5)) * spacing);
    let tick = (lo + (vec2<f32>(((nearest.x - _licm0) / _licm1), (1.0 - ((nearest.y - _licm2) / _licm3))) * size));
    let weights = select(vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels)), vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)), _gv0);
    grid = max(grid, max((line(p, vec2<f32>(tick.x, lo.y), vec2<f32>(tick.x, hi.y), 0.5) * weights.x), (line(p, vec2<f32>(lo.x, tick.y), vec2<f32>(hi.x, tick.y), 0.5) * weights.y)));
    if (_licm4) {
      if (((tick.x >= (lo.x - 0.01)) && (tick.x <= (hi.x + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2<f32>(tick.x, (hi.y + 2.5)), _licm5, 2.5, 1.0) * weights.x));
        let n = select(nearest.x, pow(10.0, nearest.x), _cse0);
        let step = select(xLevels.x, max((n * (pow(10.0, xLevels.x) - 1.0)), 1e-30), _cse0);
        let width = numberWidth(n, step, _licm6);
        let _lc2 = (width * 0.5);
        let room = min(((tick.x - _lc2) - 4.0), (((_licm7 - tick.x) - _lc2) - 4.0));
        let fit = smoothstep((width + 6.0), (width + 14.0), ((spacing.x / _licm1) * size.x));
        let opacity = ((weights.x * fit) * smoothstep(0.0, 5.0, room));
        let local = (p - vec2<f32>(tick.x, (hi.y + 6.0)));
        labels = max(labels, (vec3<f32>(tickNumberLayers(local, n, step, 0.5, _licm6, _licm8), (numberPlate(local, n, step, 0.5, _licm6) * _licm9)) * opacity));
      }
      if (((tick.y >= (lo.y - 0.01)) && (tick.y <= (hi.y + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2<f32>((lo.x - 2.5), tick.y), _licm10, 2.5, 1.0) * weights.y));
        let n_1 = select(nearest.y, pow(10.0, nearest.y), _cse1);
        let step_1 = select(yLevels.x, max((n_1 * (pow(10.0, yLevels.x) - 1.0)), 1e-30), _cse1);
        let width_1 = numberWidth(n_1, step_1, _licm6);
        let fit_1 = smoothstep(_licm11, _licm12, ((spacing.y / _licm3) * size.y));
        let opacity_1 = ((weights.y * fit_1) * smoothstep(0.0, 5.0, ((lo.x - 13.0) - width_1)));
        let local_1 = (p - vec2<f32>((lo.x - 9.0), (tick.y - _licm13)));
        labels = max(labels, (vec3<f32>(tickNumberLayers(local_1, n_1, step_1, 1.0, _licm6, _licm8), (numberPlate(local_1, n_1, step_1, 1.0, _licm6) * _licm9)) * opacity_1));
      }
    }
  }
  if ((u.layer < 0.5)) {
    return vec4<f32>(select(u.background.rgb, mix(u.background.rgb, vec3<f32>(0.89, 0.91, 0.93), (grid * u.grid)), inside), u.background.a);
  }
  let alpha = max(max(coverage, labels.y), (labels.z * 0.94));
  let ink = max(coverage, labels.x);
  var color: vec4<f32> = vec4<f32>(mix(u.background.rgb, vec3<f32>(0.2, 0.26, 0.34), (ink / max(alpha, 1e-20))), alpha);
  if ((((((u.legend.z > 0.0) && (p.x >= u.legend.x)) && (p.y >= u.legend.y)) && (p.x <= (u.legend.x + u.legend.z))) && (p.y <= (u.legend.y + u.legend.w)))) {
    color = vec4<f32>(1.0, 1.0, 1.0, 0.96);
  }
  if (((u.focus > 0.0) && (min(min(p.x, p.y), min((_licm7 - p.x), (u.resolution.y - p.y))) < 2.0))) {
    color = vec4<f32>(0.09, 0.42, 0.92, 1.0);
  }
  return color;
}

fn sampleAt(index: u32) -> vec4<f32> {
  let i = (index * 8u);
  let p = vec4<f32>(points[i], points[(i + 1u)], points[(i + 2u)], points[(i + 3u)]);
  let valid = (((((p.w > 0.0) && (abs(p.x) <= 3.4028234e+38)) && (abs(p.y) <= 3.4028234e+38)) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && (((u.logarithmic.y <= 0.0) || (p.y > 0.0)) || (s.kind == 6.0)));
  return vec4<f32>(p.xyz, select(0.0, 1.0, valid));
}

fn segmentDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> f32 {
  let delta = (b - a);
  let _cse0 = (p - a);
  let t = clamp((dot(_cse0, delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  return length((_cse0 - (t * delta)));
}

fn boxDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> f32 {
  let q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
}

fn visibleDashPeriod() -> f32 {
  if (((s.dash <= 0.0) || (s.automatic == 0u))) {
    return s.period;
  }
  var rate: f32 = 0.0;
  if ((s.xParameter != 0u)) {
    let _cse0 = extent().x;
    rate = (u.span.x / _cse0);
    if ((u.logarithmic.x > 0.0)) {
      let visibleMaximum = min(s.dataBounds.z, pow(10.0, (u.lower.x + u.span.x)));
      rate *= (max(visibleMaximum, 1e-30) * log(10.0));
      if (((s.ordered != 0u) && (s.count >= 2u))) {
        let right = min((s.count - 1u), max(1u, lowerBound(visibleMaximum)));
        let a = sampleAt((right - 1u));
        let b = sampleAt(right);
        let logSpan = ((log2(b.x) - log2(a.x)) / log2(10.0));
        if ((((a.w > 0.0) && (b.w > 0.0)) && (logSpan > 1e-20))) {
          rate = (((abs((b.z - a.z)) / logSpan) * u.span.x) / _cse0);
        }
      }
    }
  } else {
    let projected = abs((pixelPoint(s.dataBounds.zw) - pixelPoint(s.dataBounds.xy)));
    rate = (s.parameterRange / max(max(projected.x, projected.y), 1e-20));
  }
  let pixelPeriod = select(max(8.0, (s.width * 4.0)), max(5.0, (s.width * 2.5)), (s.dash > 1.5));
  if (((rate > 0.0) == false)) {
    return s.period;
  }
  let level = ceil(log2(max(((rate * pixelPeriod) / s.period), 1e-20)));
  return max((s.period * pow(2.0, level)), 1e-30);
}

fn pathDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, parameters: vec2<f32>, period: f32) -> f32 {
  let _licm0 = s.offset;
  let _licm1 = parameters.x;
  let _cse0 = segmentDistance(p, a, b);
  if ((s.dash <= 0.0)) {
    return _cse0;
  }
  let delta = (b - a);
  let along = clamp((dot((p - a), delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  let parameter = mix(_licm1, parameters.y, along);
  let on = select(0.6, 0.0, (s.dash > 1.5));
  let phase = ((parameter - _licm0) / period);
  let cycle = floor(((phase - (on * 0.5)) + 0.5));
  let difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    return select(100000000000000000000.0, _cse0, (fract(phase) <= on));
  }
  var distance: f32 = 100000000000000000000.0;
  for (var neighbor: i32 = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    let start = (_licm0 + ((cycle + f32(neighbor)) * period));
    let first = ((start - _licm1) / difference);
    let second = (((start + (on * period)) - _licm1) / difference);
    let lo = max(0.0, min(first, second));
    let hi = min(1.0, max(first, second));
    if ((hi >= lo)) {
      distance = min(distance, segmentDistance(p, mix(a, b, lo), mix(a, b, hi)));
    }
  }
  return distance;
}

fn lowerBound(value: f32) -> u32 {
  var lo: u32 = 0u;
  var hi: u32 = s.count;
  for (var iteration: i32 = 0; (iteration < 32); iteration = (iteration + 1)) {
    if ((lo >= hi)) {
      break;
    }
    let middle = (lo + ((hi - lo) / 2u));
    if ((points[(middle * 8u)] < value)) {
      lo = (middle + 1u);
    } else {
      hi = middle;
    }
  }
  return lo;
}

fn validData(p: vec2<f32>) -> bool {
  return ((all((abs(p) <= vec2<f32>(3.4028234e+38, 3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
}

fn crossing(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> bool {
  return (((a.y > p.y) != (b.y > p.y)) && (p.x < ((((b.x - a.x) * (p.y - a.y)) / (b.y - a.y)) + a.x)));
}

fn bandDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, c: vec2<f32>, d: vec2<f32>) -> f32 {
  let distance = min(min(segmentDistance(p, a, b), segmentDistance(p, b, c)), min(segmentDistance(p, c, d), segmentDistance(p, d, a)));
  let inside = (((crossing(p, a, b) != crossing(p, b, c)) != crossing(p, c, d)) != crossing(p, d, a));
  return select(distance, (-distance), inside);
}

fn stepDistance(p: vec2<f32>, a: vec4<f32>, b: vec4<f32>, period: f32) -> f32 {
  let first = pixelPoint(a.xy);
  let last = pixelPoint(b.xy);
  let middle = pixelPoint(vec2<f32>(((a.x + b.x) * 0.5), a.y)).x;
  let t = ((a.z + b.z) * 0.5);
  let _cse0 = (s.xParameter != 0u);
  if ((s.where_ == 0u)) {
    let corner = vec2<f32>(first.x, last.y);
    let parameter = select(t, a.z, _cse0);
    return min(pathDistance(p, first, corner, vec2<f32>(a.z, parameter), period), pathDistance(p, corner, last, vec2<f32>(parameter, b.z), period));
  }
  if ((s.where_ == 1u)) {
    let corner_1 = vec2<f32>(last.x, first.y);
    let parameter_1 = select(t, b.z, _cse0);
    return min(pathDistance(p, first, corner_1, vec2<f32>(a.z, parameter_1), period), pathDistance(p, corner_1, last, vec2<f32>(parameter_1, b.z), period));
  }
  let _lc0 = vec2<f32>(middle, first.y);
  let _lc1 = vec2<f32>(middle, last.y);
  return min(min(pathDistance(p, first, _lc0, vec2<f32>(a.z, t), period), pathDistance(p, _lc0, _lc1, vec2<f32>(t, t), period)), pathDistance(p, _lc1, last, vec2<f32>(t, b.z), period));
}

fn seriesHit(p: vec2<f32>, search: f32) -> DataHit {
  let _licm0 = (s.kind == 6.0);
  let _licm1 = (u.logarithmic.y > 0.0);
  let _licm2 = (s.kind == 1.0);
  let _licm3 = (s.marker > 0.5);
  let _licm4 = s.width;
  let _licm5 = (s.kind == 2.0);
  let _licm6 = (s.baseline <= 0.0);
  let _licm7 = pow(10.0, u.lower.x);
  let _licm8 = s.baseline;
  let _licm9 = (s.kind == 5.0);
  let _licm10 = (s.kind == 7.0);
  var distance: f32 = 100000000000000000000.0;
  var selected: u32 = 0u;
  let _cse0 = (s.kind == 4.0);
  let lineKind = ((s.kind < 0.5) || _cse0);
  let _gv0 = (lineKind || _licm0);
  var start: u32 = 0u;
  var end: u32 = select(s.count, select(0u, (s.count - 1u), (s.count > 0u)), _gv0);
  let _cse1 = (_licm4 * 0.5);
  let radius = ((_cse1 + pixelWidth()) + search);
  let _cse3 = (u.logarithmic.x > 0.0);
  if ((_gv0 && (s.ordered > 0u))) {
    let _cse2 = extent().x;
    let low = (u.lower.x + ((((p.x - radius) - 76.0) / _cse2) * u.span.x));
    let high = (u.lower.x + ((((p.x + radius) - 76.0) / _cse2) * u.span.x));
    let left = lowerBound(select(low, pow(10.0, low), _cse3));
    start = select(0u, (left - 1u), (left > 0u));
    end = min(end, lowerBound(select(high, pow(10.0, high), _cse3)));
  }
  let period = visibleDashPeriod();
  let _cse4 = (_licm0 && _licm1);
  let _cse5 = (s.kind == 3.0);
  let _cse6 = select(_licm8, pow(10.0, u.lower.y), (_licm1 && _licm6));
  let _cse7 = vec2<f32>(0.0, s.capSize);
  let _cse8 = vec2<f32>(s.capSize, 0.0);
  for (var index: u32 = start; (index < end); index = (index + 1u)) {
    let a = sampleAt(index);
    if ((a.w <= 0.0)) {
      continue;
    }
    let point = pixelPoint(vec2<f32>(a.x, select(a.y, 1e-30, (_cse4 && (a.y <= 0.0)))));
    let extra = ((index * 8u) + 4u);
    var candidate: f32 = 100000000000000000000.0;
    if (_gv0) {
      let b = sampleAt((index + 1u));
      if ((b.w <= 0.0)) {
        continue;
      }
      let other = pixelPoint(vec2<f32>(b.x, select(b.y, 1e-30, (_cse4 && (b.y <= 0.0)))));
      if (_licm0) {
        let first = points[extra];
        let second = points[(extra + 8u)];
        let lowerA = vec2<f32>(a.x, select(first, 1e-30, (_licm1 && (first <= 0.0))));
        let lowerB = vec2<f32>(b.x, select(second, 1e-30, (_licm1 && (second <= 0.0))));
        if ((validData(lowerA) && validData(lowerB))) {
          candidate = bandDistance(p, point, other, pixelPoint(lowerB), pixelPoint(lowerA));
        }
      } else if ((all((p >= (min(point, other) - vec2<f32>(radius, radius)))) && all((p <= (max(point, other) + vec2<f32>(radius, radius)))))) {
        candidate = (select(pathDistance(p, point, other, vec2<f32>(a.z, b.z), period), stepDistance(p, a, b, period), _cse0) - _cse1);
      }
    } else if (_licm2) {
      let q = abs((p - point));
      candidate = (select(length(q), max(q.x, q.y), _licm3) - _licm4);
    } else if ((_licm5 || _cse5)) {
      let baseline = select(_cse6, select(_licm8, _licm7, (_cse3 && _licm6)), _cse5);
      let first_1 = select(vec2<f32>(points[extra], a.y), vec2<f32>(baseline, points[extra]), _cse5);
      let last = select(vec2<f32>(points[(extra + 1u)], baseline), vec2<f32>(a.x, points[(extra + 1u)]), _cse5);
      if ((validData(first_1) && validData(last))) {
        candidate = boxDistance(p, pixelPoint(first_1), pixelPoint(last));
      }
    } else if (_licm9) {
      let baseline_1 = vec2<f32>(a.x, _cse6);
      if (validData(baseline_1)) {
        candidate = (segmentDistance(p, point, pixelPoint(baseline_1)) - _cse1);
      }
    } else if (_licm10) {
      let lowX = points[extra];
      let lowY = points[(extra + 2u)];
      let left_1 = vec2<f32>(select(lowX, 1e-30, (_cse3 && (lowX <= 0.0))), a.y);
      let right = vec2<f32>(points[(extra + 1u)], a.y);
      let bottom = vec2<f32>(a.x, select(lowY, 1e-30, (_licm1 && (lowY <= 0.0))));
      let top = vec2<f32>(a.x, points[(extra + 3u)]);
      if ((validData(left_1) && validData(right))) {
        let lo = pixelPoint(left_1);
        let hi = pixelPoint(right);
        candidate = min(candidate, (segmentDistance(p, lo, hi) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo - _cse7), (lo + _cse7)), segmentDistance(p, (hi - _cse7), (hi + _cse7))) - _cse1));
      }
      if ((validData(bottom) && validData(top))) {
        let lo_1 = pixelPoint(bottom);
        let hi_1 = pixelPoint(top);
        candidate = min(candidate, (segmentDistance(p, lo_1, hi_1) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo_1 - _cse8), (lo_1 + _cse8)), segmentDistance(p, (hi_1 - _cse8), (hi_1 + _cse8))) - _cse1));
      }
    }
    if ((candidate < distance)) {
      distance = candidate;
      selected = index;
    }
  }
  return DataHit(distance, selected);
}

@fragment
fn seriesFragment(v: Surface) -> @location(0) vec4<f32> {
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let _cse0 = vec2<f32>(76.0, 42.0);
  if ((any((p < _cse0)) || any((p > (_cse0 + extent()))))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let hit = seriesHit(p, 0.0);
  let aa = (pixelWidth() * 0.5);
  return vec4<f32>(s.color.rgb, (s.color.a * (1.0 - smoothstep((-aa), aa, hit.distance))));
}

@fragment
fn pickFragment(v: Surface) -> @location(0) vec4<u32> {
  let p = query.pixel;
  let _cse0 = vec2<f32>(76.0, 42.0);
  if ((any((p < _cse0)) || any((p > (_cse0 + extent()))))) {
    discard;
  }
  let hit = seriesHit(p, query.radius);
  if ((hit.distance > query.radius)) {
    discard;
  }
  return vec4<u32>((query.series + 1u), (hit.index + 1u), bitcast<u32>(hit.distance), 1u);
}

@vertex
fn textVertex(@location(0) origin: vec2<f32>, @location(1) info: vec3<f32>, @location(2) unit: vec2<f32>) -> Letter {
  let size = info.y;
  let local = ((unit * vec2<f32>(20.0, 24.0)) * (size * 0.0625));
  let p = textPoint((origin + select(local, vec2<f32>(local.y, (-local.x)), (info.z > 0.0))));
  return Letter(clipPosition(p), local, u32(info.x), size);
}

@fragment
fn textFragment(v: Letter) -> @location(0) vec4<f32> {
  let layers = glyphLayers(v.local, i32(v.code), v.size, u.labelStyle.z);
  return vec4<f32>(mix(u.background.rgb, text.color.rgb, (layers.x / max(layers.y, 1e-20))), (text.color.a * layers.y));
}

@fragment
fn labelPlateFragment(v: Surface) -> @location(0) vec4<f32> {
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let q = ((abs((textLocal(p) - text.box.xy)) - text.box.zw) + vec2<f32>(3.0, 3.0));
  let distance = ((length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  let aa = (pixelWidth() * 0.5);
  let coverage = (1.0 - smoothstep((-aa), aa, distance));
  let border = (1.0 - smoothstep((-0.7 - aa), (-0.7 + aa), distance));
  let fill = mix(u.background.rgb, vec3<f32>(0.995, 0.995, 0.995), 0.8);
  return vec4<f32>(mix(vec3<f32>(0.8, 0.84, 0.9), fill, border), (coverage * 0.94));
}

fn fieldAt(column: i32, row: i32) -> f32 {
  let x = u32(clamp(column, 0, (i32(field.shape.y) - 1)));
  let y = u32(clamp(row, 0, (i32(field.shape.x) - 1)));
  return points[((y * field.shape.y) + x)];
}

fn fieldSample(pixel: vec2<f32>) -> FieldSample {
  let _cse0 = extent();
  let position = ((pixel - vec2<f32>(76.0, 42.0)) / _cse0);
  let scaled = (u.lower + (vec2<f32>(position.x, (1.0 - position.y)) * u.span));
  let _cse1 = (u.logarithmic.x > 0.0);
  let _cse2 = (u.logarithmic.y > 0.0);
  let value = vec2<f32>(select(scaled.x, pow(10.0, scaled.x), _cse1), select(scaled.y, pow(10.0, scaled.y), _cse2));
  let _cse3 = (field.bounds.zw - field.bounds.xy);
  let fraction = ((value - field.bounds.xy) / _cse3);
  let _cse9 = f32(field.shape.y);
  let _cse10 = f32(field.shape.x);
  let _cse4 = vec2<f32>(_cse9, _cse10);
  let _cse5 = vec2<f32>(0.5, 0.5);
  var coordinate: vec2<f32> = ((fraction * _cse4) - _cse5);
  let _cse6 = (_cse10 - 1.0);
  if ((field.origin != 0u)) {
    coordinate.y = (_cse6 - coordinate.y);
  }
  let _cse7 = vec2<f32>(0.0, 0.0);
  let nearest = vec2<u32>(clamp(floor((coordinate + _cse5)), _cse7, vec2<f32>((_cse9 - 1.0), _cse6)));
  let index = ((nearest.y * field.shape.y) + nearest.x);
  var sample: f32 = points[index];
  var gradient: vec2<f32> = _cse7;
  if ((field.interpolation != 0u)) {
    let low = vec2<i32>(floor(coordinate));
    let t = fract(coordinate);
    let a = fieldAt(low.x, low.y);
    let _gv0 = (low.x + 1);
    let b = fieldAt(_gv0, low.y);
    let _gv1 = (low.y + 1);
    let c = fieldAt(low.x, _gv1);
    let d = fieldAt(_gv0, _gv1);
    sample = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
    let _cse8 = log(10.0);
    let dataRate = ((u.span / _cse0) * vec2<f32>(select(1.0, (value.x * _cse8), _cse1), select(1.0, (value.y * _cse8), _cse2)));
    gradient = (((vec2<f32>(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  return FieldSample(sample, ((all((fraction >= _cse7)) && all((fraction <= vec2<f32>(1.0, 1.0)))) && (abs(sample) <= 3.4028234e+38)), index, gradient);
}

fn fieldLevel(index: u32) -> f32 {
  return points[((field.shape.x * field.shape.y) + index)];
}

fn fieldColors(value: f32) -> vec4<f32> {
  let _licm0 = field.levels;
  if ((field.mode != 2u)) {
    return vec4<f32>(colorMap(((value - field.range.x) / (field.range.y - field.range.x)), field.palette), 1.0);
  }
  var below: u32 = 0u;
  for (var i: u32 = 0u; (i < _licm0); i = (i + 1u)) {
    if ((value >= fieldLevel(i))) {
      below = (i + 1u);
    }
  }
  let _cse0 = (_licm0 - 1u);
  if (((below == 0u) || (value > fieldLevel(_cse0)))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  return vec4<f32>(colorMap(((f32(min(below, _cse0)) - 0.5) / f32(_cse0)), field.palette), 1.0);
}

fn nearestLevel(value: f32) -> f32 {
  let _licm0 = field.levels;
  var distance: f32 = 100000000000000000000.0;
  for (var i: u32 = 0u; (i < _licm0); i = (i + 1u)) {
    distance = min(distance, abs((value - fieldLevel(i))));
  }
  return distance;
}

@fragment
fn fieldFragment(v: Surface) -> @location(0) vec4<f32> {
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let sample = fieldSample(p);
  let magnitude = max(abs(sample.gradient.x), abs(sample.gradient.y));
  let rate = select(0.0, (magnitude * length((sample.gradient / max(magnitude, 1e-30)))), (magnitude > 0.0));
  let _cse0 = vec2<f32>(76.0, 42.0);
  if (((any((p < _cse0)) || any((p > (_cse0 + extent())))) || (sample.valid == false))) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let tint = fieldColors(sample.value);
  let distance = (nearestLevel(sample.value) / max(rate, 1e-30));
  let aa = (pixelWidth() * 0.5);
  let _cse1 = (field.lineWidth * 0.5);
  let coverage = select(1.0, select(0.0, (1.0 - smoothstep(max(0.0, (_cse1 - aa)), (_cse1 + aa), distance)), ((rate > 1e-30) && (rate < 3.4028234e+38))), (field.mode == 1u));
  return vec4<f32>(tint.rgb, ((tint.a * field.alpha) * coverage));
}

@fragment
fn fieldPickFragment(v: Surface) -> @location(0) vec4<u32> {
  let p = query.pixel;
  let sample = fieldSample(p);
  let _cse0 = vec2<f32>(76.0, 42.0);
  if ((((any((p < _cse0)) || any((p > (_cse0 + extent())))) || (sample.valid == false)) || (fieldColors(sample.value).a == 0.0))) {
    discard;
  }
  if ((field.mode == 1u)) {
    let magnitude = max(abs(sample.gradient.x), abs(sample.gradient.y));
    let rate = select(0.0, (magnitude * length((sample.gradient / max(magnitude, 1e-30)))), (magnitude > 0.0));
    if (((((rate > 1e-30) && (rate < 3.4028234e+38)) == false) || ((nearestLevel(sample.value) / rate) > (query.radius + (field.lineWidth * 0.5))))) {
      discard;
    }
  }
  return vec4<u32>((query.series + 1u), (sample.index + 1u), 0u, 1u);
}

@fragment
fn colorBarFragment(v: Surface) -> @location(0) vec4<f32> {
  let _licm0 = field.range.x;
  let _licm1 = field.range.y;
  let _licm2 = (u.labelStyle.x * 0.75);
  let _licm3 = ((field.range.y - field.range.x) * 0.5);
  let _licm4 = u.labelStyle.x;
  let _licm5 = u.labelStyle.z;
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let height = min(140.0, (u.resolution.y * 0.4));
  let lo = vec2<f32>((u.resolution.x - 40.0), 58.0);
  let hi = (lo + vec2<f32>(10.0, height));
  let fraction = clamp((1.0 - ((p.y - lo.y) / height)), 0.0, 1.0);
  let value = mix(_licm0, _licm1, fraction);
  let tint = fieldColors(value);
  let distance = boxDistance(p, lo, hi);
  let aa = (pixelWidth() * 0.5);
  let coverage = ((1.0 - smoothstep((-aa), aa, distance)) * tint.a);
  var layers: vec2<f32> = vec2<f32>(0.0, 0.0);
  for (var i: i32 = 0; (i < 3); i = (i + 1)) {
    let t = (f32(i) * 0.5);
    let n = mix(_licm0, _licm1, t);
    let local = (p - vec2<f32>((lo.x - 5.0), ((lo.y + ((1.0 - t) * height)) - _licm2)));
    layers = max(layers, tickNumberLayers(local, n, _licm3, 1.0, _licm4, _licm5));
  }
  let alpha = max(coverage, layers.y);
  let ink = mix(u.background.rgb, vec3<f32>(0.2, 0.26, 0.34), (layers.x / max(layers.y, 1e-20)));
  return vec4<f32>(mix(tint.rgb, ink, (layers.y / max(alpha, 1e-20))), alpha);
}

fn textPoint(p: vec2<f32>) -> vec2<f32> {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  let c = cos(text.anchor.w);
  let sine = sin(text.anchor.w);
  return ((pixelPoint(text.anchor.xy) + text.offset) + vec2<f32>(((c * p.x) + (sine * p.y)), (((-sine) * p.x) + (c * p.y))));
}

fn textLocal(p: vec2<f32>) -> vec2<f32> {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  let delta = ((p - pixelPoint(text.anchor.xy)) - text.offset);
  let c = cos(text.anchor.w);
  let sine = sin(text.anchor.w);
  return vec2<f32>(((c * delta.x) - (sine * delta.y)), ((sine * delta.x) + (c * delta.y)));
}

fn triangleDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, c: vec2<f32>) -> f32 {
  let ab = (b - a);
  let bc = (c - b);
  let ca = (a - c);
  let pa = (p - a);
  let pb = (p - b);
  let pc = (p - c);
  let x = ((ab.x * pa.y) - (ab.y * pa.x));
  let y = ((bc.x * pb.y) - (bc.y * pb.x));
  let z = ((ca.x * pc.y) - (ca.y * pc.x));
  let inside = ((((x >= 0.0) && (y >= 0.0)) && (z >= 0.0)) || (((x <= 0.0) && (y <= 0.0)) && (z <= 0.0)));
  let distance = min(segmentDistance(p, a, b), min(segmentDistance(p, b, c), segmentDistance(p, c, a)));
  return select(distance, (-distance), inside);
}

@fragment
fn annotationFragment(v: Surface) -> @location(0) vec4<f32> {
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let target_1 = pixelPoint(text.target_);
  let localTarget = textLocal(target_1);
  let start = textPoint(clamp(localTarget, (text.box.xy - text.box.zw), (text.box.xy + text.box.zw)));
  let _gv0 = (target_1 - start);
  let lengthToTarget = length(_gv0);
  if ((lengthToTarget < 0.0001)) {
    return vec4<f32>(0.0, 0.0, 0.0, 0.0);
  }
  let direction = (_gv0 / lengthToTarget);
  let normal = vec2<f32>((-direction.y), direction.x);
  let size = min(text.arrow.z, (lengthToTarget * 0.5));
  let back = (target_1 - (direction * size));
  let aa = (pixelWidth() * 0.5);
  let head = select(0.0, (1.0 - smoothstep((-aa), aa, triangleDistance(p, target_1, (back + ((normal * size) * 0.4)), (back - ((normal * size) * 0.4))))), (size > 0.0));
  let shaft = select(0.0, line(p, start, back, (text.arrow.y * 0.5)), (text.arrow.y > 0.0));
  return vec4<f32>(text.color.rgb, (text.color.a * max(shaft, head)));
}
`,bindings:[{name:"u",emitted:"u",space:"uniform",group:0,binding:0,type:"struct:DataUniforms",resource:{resourceKind:"uniform-buffer",structName:"DataUniforms",structEmitted:"DataUniforms"},stages:["vertex","fragment"],rule:"std140",layout:{kind:"struct",size:128,fields:[{name:"resolution",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"lower",offset:8,layout:{kind:"vector",size:2,type:"f32"}},{name:"span",offset:16,layout:{kind:"vector",size:2,type:"f32"}},{name:"logarithmic",offset:24,layout:{kind:"vector",size:2,type:"f32"}},{name:"grid",offset:32,layout:{kind:"scalar",type:"f32"}},{name:"labelStyle",offset:48,layout:{kind:"vector",size:4,type:"f32"}},{name:"layer",offset:64,layout:{kind:"scalar",type:"f32"}},{name:"background",offset:80,layout:{kind:"vector",size:4,type:"f32"}},{name:"legend",offset:96,layout:{kind:"vector",size:4,type:"f32"}},{name:"focus",offset:112,layout:{kind:"scalar",type:"f32"}}]}},{name:"s",emitted:"s",space:"uniform",group:0,binding:1,type:"struct:SeriesUniforms",resource:{resourceKind:"uniform-buffer",structName:"SeriesUniforms",structEmitted:"SeriesUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:96,fields:[{name:"color",offset:0,layout:{kind:"vector",size:4,type:"f32"}},{name:"kind",offset:16,layout:{kind:"scalar",type:"f32"}},{name:"width",offset:20,layout:{kind:"scalar",type:"f32"}},{name:"dash",offset:24,layout:{kind:"scalar",type:"f32"}},{name:"marker",offset:28,layout:{kind:"scalar",type:"f32"}},{name:"count",offset:32,layout:{kind:"scalar",type:"u32"}},{name:"ordered",offset:36,layout:{kind:"scalar",type:"u32"}},{name:"period",offset:40,layout:{kind:"scalar",type:"f32"}},{name:"offset",offset:44,layout:{kind:"scalar",type:"f32"}},{name:"automatic",offset:48,layout:{kind:"scalar",type:"u32"}},{name:"xParameter",offset:52,layout:{kind:"scalar",type:"u32"}},{name:"parameterRange",offset:56,layout:{kind:"scalar",type:"f32"}},{name:"dataBounds",offset:64,layout:{kind:"vector",size:4,type:"f32"}},{name:"baseline",offset:80,layout:{kind:"scalar",type:"f32"}},{name:"capSize",offset:84,layout:{kind:"scalar",type:"f32"}},{name:"where",offset:88,layout:{kind:"scalar",type:"u32"}}]}},{name:"points",emitted:"points",space:"storage",group:0,binding:2,access:"read",type:"array<f32>",resource:{resourceKind:"storage-buffer",glslDataTexture:"r32f"},stages:["fragment"],rule:"std430",layout:{kind:"array",length:null,stride:4,element:{kind:"scalar",type:"f32"}},dataTexture:{format:"r32float",lanes:1}},{name:"text",emitted:"text",space:"uniform",group:0,binding:3,type:"struct:TextUniforms",resource:{resourceKind:"uniform-buffer",structName:"TextUniforms",structEmitted:"TextUniforms"},stages:["vertex","fragment"],rule:"std140",layout:{kind:"struct",size:80,fields:[{name:"color",offset:0,layout:{kind:"vector",size:4,type:"f32"}},{name:"box",offset:16,layout:{kind:"vector",size:4,type:"f32"}},{name:"anchor",offset:32,layout:{kind:"vector",size:4,type:"f32"}},{name:"offset",offset:48,layout:{kind:"vector",size:2,type:"f32"}},{name:"target",offset:56,layout:{kind:"vector",size:2,type:"f32"}},{name:"arrow",offset:64,layout:{kind:"vector",size:4,type:"f32"}}]}},{name:"query",emitted:"query",space:"uniform",group:0,binding:4,type:"struct:DataPickUniforms",resource:{resourceKind:"uniform-buffer",structName:"DataPickUniforms",structEmitted:"DataPickUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixel",offset:0,layout:{kind:"vector",size:2,type:"f32"}},{name:"radius",offset:8,layout:{kind:"scalar",type:"f32"}},{name:"series",offset:12,layout:{kind:"scalar",type:"u32"}}]}},{name:"field",emitted:"field",space:"uniform",group:0,binding:5,type:"struct:FieldUniforms",resource:{resourceKind:"uniform-buffer",structName:"FieldUniforms",structEmitted:"FieldUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:64,fields:[{name:"bounds",offset:0,layout:{kind:"vector",size:4,type:"f32"}},{name:"range",offset:16,layout:{kind:"vector",size:2,type:"f32"}},{name:"shape",offset:24,layout:{kind:"vector",size:2,type:"u32"}},{name:"palette",offset:32,layout:{kind:"scalar",type:"u32"}},{name:"origin",offset:36,layout:{kind:"scalar",type:"u32"}},{name:"mode",offset:40,layout:{kind:"scalar",type:"u32"}},{name:"interpolation",offset:44,layout:{kind:"scalar",type:"u32"}},{name:"alpha",offset:48,layout:{kind:"scalar",type:"f32"}},{name:"levels",offset:52,layout:{kind:"scalar",type:"u32"}},{name:"lineWidth",offset:56,layout:{kind:"scalar",type:"f32"}}]}},{name:"glyphAtlas",emitted:"glyphAtlas",space:"uniform",group:0,binding:6,type:"texture_2d<f32>",resource:{resourceKind:"texture",textureDim:"2d",textureElem:"f32",sampleType:"unfilterable-float"},stages:["fragment"]},{name:"font",emitted:"font",space:"uniform",group:0,binding:7,type:"struct:FontUniforms",resource:{resourceKind:"uniform-buffer",structName:"FontUniforms",structEmitted:"FontUniforms"},stages:["fragment"],rule:"std140",layout:{kind:"struct",size:16,fields:[{name:"pixelRatio",offset:0,layout:{kind:"scalar",type:"f32"}}]}}],entries:[{name:"surfaceVertex",emitted:"surfaceVertex",stage:"vertex",inputs:[{name:"i",emitted:"i",type:"u32",builtin:"vertex_index"}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],bindings:[],line:{file:"shaders/data.shade.ts",line:74}},{name:"axesFragment",emitted:"axesFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:81}},{name:"seriesFragment",emitted:"seriesFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"s",writes:!1},{name:"points",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:310}},{name:"pickFragment",emitted:"pickFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"s",writes:!1},{name:"points",writes:!1},{name:"query",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:317}},{name:"textVertex",emitted:"textVertex",stage:"vertex",inputs:[{name:"origin",emitted:"origin",type:"vec2<f32>",location:0},{name:"info",emitted:"info",type:"vec3<f32>",location:1},{name:"unit",emitted:"unit",type:"vec2<f32>",location:2}],outputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"local",emitted:"local",type:"vec2<f32>",location:0},{name:"code",emitted:"code",type:"u32",location:1},{name:"size",emitted:"size",type:"f32",location:2}],bindings:[{name:"u",writes:!1},{name:"text",writes:!1}],vertex:{attributes:[{name:"origin",location:0,offset:0,format:"float32x2",type:"vec2<f32>"},{name:"info",location:1,offset:8,format:"float32x3",type:"vec3<f32>"},{name:"unit",location:2,offset:20,format:"float32x2",type:"vec2<f32>"}],arrayStride:28},line:{file:"shaders/data.shade.ts",line:325}},{name:"textFragment",emitted:"textFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"local",emitted:"local",type:"vec2<f32>",location:0},{name:"code",emitted:"code",type:"u32",location:1},{name:"size",emitted:"size",type:"f32",location:2}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"text",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:331}},{name:"labelPlateFragment",emitted:"labelPlateFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"text",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:337}},{name:"fieldFragment",emitted:"fieldFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"points",writes:!1},{name:"field",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:398}},{name:"fieldPickFragment",emitted:"fieldPickFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<u32>",location:0}],bindings:[{name:"u",writes:!1},{name:"points",writes:!1},{name:"query",writes:!1},{name:"field",writes:!1}],line:{file:"shaders/data.shade.ts",line:410}},{name:"colorBarFragment",emitted:"colorBarFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"points",writes:!1},{name:"field",writes:!1},{name:"glyphAtlas",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:420}},{name:"annotationFragment",emitted:"annotationFragment",stage:"fragment",inputs:[{name:"position",emitted:"position",type:"vec4<f32>",builtin:"position"},{name:"uv",emitted:"uv",type:"vec2<f32>",location:0}],outputs:[{name:"_ret",emitted:"_ret",type:"vec4<f32>",location:0}],bindings:[{name:"u",writes:!1},{name:"text",writes:!1},{name:"font",writes:!1}],line:{file:"shaders/data.shade.ts",line:455}}],structs:[{name:"FontUniforms",emitted:"FontUniforms",fields:[{name:"pixelRatio",emitted:"pixelRatio",type:"f32"}]},{name:"NumberFormat",emitted:"NumberFormat",fields:[{name:"value",emitted:"value",type:"f32"},{name:"negative",emitted:"negative",type:"bool"},{name:"scientific",emitted:"scientific",type:"bool"},{name:"decimals",emitted:"decimals",type:"i32"},{name:"digits",emitted:"digits",type:"i32"},{name:"exponent",emitted:"exponent",type:"i32"},{name:"length",emitted:"length",type:"i32"}]},{name:"DataUniforms",emitted:"DataUniforms",fields:[{name:"resolution",emitted:"resolution",type:"vec2<f32>"},{name:"lower",emitted:"lower",type:"vec2<f32>"},{name:"span",emitted:"span",type:"vec2<f32>"},{name:"logarithmic",emitted:"logarithmic",type:"vec2<f32>"},{name:"grid",emitted:"grid",type:"f32"},{name:"labelStyle",emitted:"labelStyle",type:"vec4<f32>"},{name:"layer",emitted:"layer",type:"f32"},{name:"background",emitted:"background",type:"vec4<f32>"},{name:"legend",emitted:"legend",type:"vec4<f32>"},{name:"focus",emitted:"focus",type:"f32"}]},{name:"SeriesUniforms",emitted:"SeriesUniforms",fields:[{name:"color",emitted:"color",type:"vec4<f32>"},{name:"kind",emitted:"kind",type:"f32"},{name:"width",emitted:"width",type:"f32"},{name:"dash",emitted:"dash",type:"f32"},{name:"marker",emitted:"marker",type:"f32"},{name:"count",emitted:"count",type:"u32"},{name:"ordered",emitted:"ordered",type:"u32"},{name:"period",emitted:"period",type:"f32"},{name:"offset",emitted:"offset",type:"f32"},{name:"automatic",emitted:"automatic",type:"u32"},{name:"xParameter",emitted:"xParameter",type:"u32"},{name:"parameterRange",emitted:"parameterRange",type:"f32"},{name:"dataBounds",emitted:"dataBounds",type:"vec4<f32>"},{name:"baseline",emitted:"baseline",type:"f32"},{name:"capSize",emitted:"capSize",type:"f32"},{name:"where",emitted:"where_",type:"u32"}]},{name:"TextUniforms",emitted:"TextUniforms",fields:[{name:"color",emitted:"color",type:"vec4<f32>"},{name:"box",emitted:"box",type:"vec4<f32>"},{name:"anchor",emitted:"anchor",type:"vec4<f32>"},{name:"offset",emitted:"offset",type:"vec2<f32>"},{name:"target",emitted:"target_",type:"vec2<f32>"},{name:"arrow",emitted:"arrow",type:"vec4<f32>"}]},{name:"Surface",emitted:"Surface",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"uv",emitted:"uv",type:"vec2<f32>"}]},{name:"Letter",emitted:"Letter",fields:[{name:"position",emitted:"position",type:"vec4<f32>"},{name:"local",emitted:"local",type:"vec2<f32>"},{name:"code",emitted:"code",type:"u32"},{name:"size",emitted:"size",type:"f32"}]},{name:"DataHit",emitted:"DataHit",fields:[{name:"distance",emitted:"distance",type:"f32"},{name:"index",emitted:"index",type:"u32"}]},{name:"DataPickUniforms",emitted:"DataPickUniforms",fields:[{name:"pixel",emitted:"pixel",type:"vec2<f32>"},{name:"radius",emitted:"radius",type:"f32"},{name:"series",emitted:"series",type:"u32"}]},{name:"FieldUniforms",emitted:"FieldUniforms",fields:[{name:"bounds",emitted:"bounds",type:"vec4<f32>"},{name:"range",emitted:"range",type:"vec2<f32>"},{name:"shape",emitted:"shape",type:"vec2<u32>"},{name:"palette",emitted:"palette",type:"u32"},{name:"origin",emitted:"origin",type:"u32"},{name:"mode",emitted:"mode",type:"u32"},{name:"interpolation",emitted:"interpolation",type:"u32"},{name:"alpha",emitted:"alpha",type:"f32"},{name:"levels",emitted:"levels",type:"u32"},{name:"lineWidth",emitted:"lineWidth",type:"f32"}]},{name:"FieldSample",emitted:"FieldSample",fields:[{name:"value",emitted:"value",type:"f32"},{name:"valid",emitted:"valid",type:"bool"},{name:"index",emitted:"index",type:"u32"},{name:"gradient",emitted:"gradient",type:"vec2<f32>"}]}],overrides:[],features:[],gl:{vertices:{surfaceVertex:{vertex:`#version 300 es
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
`,blocks:{},samplers:{}},textVertex:{vertex:`#version 300 es
precision highp float;
precision highp int;

struct Letter {
  vec4 position;
  vec2 local;
  uint code;
  float size;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform TextUniforms {
  vec4 color;
  vec4 box;
  vec4 anchor;
  vec2 offset;
  vec2 target;
  vec4 arrow;
} text;
uint _f2u(float x) {
  return uint(mix(clamp(x, 0.0, 4294967040.0), 0.0, isnan(x)));
}
vec4 clipPosition(vec2 p) {
  return vec4((((p.x / u.resolution.x) * 2.0) - 1.0), (1.0 - ((p.y / u.resolution.y) * 2.0)), 0.0, 1.0);
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

vec2 pixelPoint(vec2 p) {
  float _cse0 = log2(10.0);
  vec2 q = vec2(((u.logarithmic.x > 0.0) ? (log2(max(p.x, 1e-30)) / _cse0) : p.x), ((u.logarithmic.y > 0.0) ? (log2(max(p.y, 1e-30)) / _cse0) : p.y));
  vec2 position = ((q - u.lower) / u.span);
  return (vec2(76.0, 42.0) + (vec2(position.x, (1.0 - position.y)) * extent()));
}

vec2 textPoint(vec2 p) {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  float c = cos(text.anchor.w);
  float sine = sin(text.anchor.w);
  return ((pixelPoint(text.anchor.xy) + text.offset) + vec2(((c * p.x) + (sine * p.y)), (((-sine) * p.x) + (c * p.y))));
}
layout(location = 0) in vec2 a_origin;
layout(location = 1) in vec3 a_info;
layout(location = 2) in vec2 a_unit;
out vec2 local;
flat out uint code;
out float size;

Letter textVertex_impl(vec2 origin, vec3 info, vec2 unit) {
  float size = info.y;
  vec2 local = ((unit * vec2(20.0, 24.0)) * (size * 0.0625));
  vec2 p = textPoint((origin + ((info.z > 0.0) ? vec2(local.y, (-local.x)) : local)));
  return Letter(clipPosition(p), local, _f2u(info.x), size);
}

void main() {
  Letter _out = textVertex_impl(a_origin, a_info, a_unit);
  gl_Position = _out.position;
  local = _out.local;
  code = _out.code;
  size = _out.size;
}
`,blocks:{u:"DataUniforms",text:"TextUniforms"},samplers:{}}},draws:{axesFragment:{fragment:`#version 300 es
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

struct Surface {
  vec4 position;
  vec2 uv;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
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

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

float line(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 d = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, d) / max(dot(d, d), 0.00001)), 0.0, 1.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep(max(0.0, (radius - aa)), (radius + aa), length((_cse0 - (t * d)))));
}

vec3 dataTickLevels(float lower, float span, float pixels, float logarithmic, bool horizontal) {
  float size = u.labelStyle.x;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float gap = (size * 2.6);
  bool _cse0 = (logarithmic > 0.0);
  if (horizontal) {
    float low = (_cse0 ? pow(10.0, lower) : lower);
    float _cse1 = (lower + span);
    float high = (_cse0 ? pow(10.0, _cse1) : _cse1);
    float step = (_cse0 ? max((low * (pow(10.0, min(rough, 20.0)) - 1.0)), 1e-30) : rough);
    gap = max((size * 3.5), (max(numberWidth(low, step, size), numberWidth(high, step, size)) + (size * 1.3)));
  }
  float raw = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if ((_cse0 && (span >= 2.0))) {
    raw = max(raw, 1.0);
  }
  return tickLevels(raw);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 axesFragment_impl(Surface v) {
  float _licm0 = u.lower.x;
  float _licm1 = u.span.x;
  float _licm2 = u.lower.y;
  float _licm3 = u.span.y;
  bool _licm4 = (u.layer > 0.5);
  vec2 _licm5 = vec2(1.0, 0.0);
  float _licm6 = u.labelStyle.x;
  float _licm7 = u.resolution.x;
  float _licm8 = u.labelStyle.z;
  float _licm9 = u.labelStyle.w;
  vec2 _licm10 = vec2(0.0, 1.0);
  float _licm11 = (u.labelStyle.x * 1.6);
  float _licm12 = (u.labelStyle.x * 2.2);
  float _licm13 = (u.labelStyle.x * 0.75);
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  vec2 size = extent();
  vec2 lo = vec2(76.0, 42.0);
  vec2 hi = (lo + size);
  bool inside = ((((p.x >= lo.x) && (p.x <= hi.x)) && (p.y >= lo.y)) && (p.y <= hi.y));
  vec2 value = (u.lower + (vec2(((p.x - lo.x) / size.x), (1.0 - ((p.y - lo.y) / size.y))) * u.span));
  vec3 xLevels = dataTickLevels(_licm0, _licm1, size.x, u.logarithmic.x, true);
  vec3 yLevels = dataTickLevels(_licm2, _licm3, size.y, u.logarithmic.y, false);
  float grid = 0.0;
  vec3 labels = vec3(0.0, 0.0, 0.0);
  vec2 _lc0 = vec2(hi.x, lo.y);
  vec2 _lc1 = vec2(lo.x, hi.y);
  float coverage = max(max(line(p, lo, _lc0, 0.5), line(p, lo, _lc1, 0.5)), max(line(p, hi, _lc1, 0.5), line(p, hi, _lc0, 0.5)));
  bool _cse0 = (u.logarithmic.x > 0.0);
  bool _cse1 = (u.logarithmic.y > 0.0);
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y));
    vec2 nearest = (floor(((value / spacing) + 0.5)) * spacing);
    vec2 tick = (lo + (vec2(((nearest.x - _licm0) / _licm1), (1.0 - ((nearest.y - _licm2) / _licm3))) * size));
    vec2 weights = (_gv0 ? vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels)) : vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels)));
    grid = max(grid, max((line(p, vec2(tick.x, lo.y), vec2(tick.x, hi.y), 0.5) * weights.x), (line(p, vec2(lo.x, tick.y), vec2(hi.x, tick.y), 0.5) * weights.y)));
    if (_licm4) {
      if (((tick.x >= (lo.x - 0.01)) && (tick.x <= (hi.x + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2(tick.x, (hi.y + 2.5)), _licm5, 2.5, 1.0) * weights.x));
        float n = (_cse0 ? pow(10.0, nearest.x) : nearest.x);
        float step = (_cse0 ? max((n * (pow(10.0, xLevels.x) - 1.0)), 1e-30) : xLevels.x);
        float width = numberWidth(n, step, _licm6);
        float _lc2 = (width * 0.5);
        float room = min(((tick.x - _lc2) - 4.0), (((_licm7 - tick.x) - _lc2) - 4.0));
        float fit = smoothstep((width + 6.0), (width + 14.0), ((spacing.x / _licm1) * size.x));
        float opacity = ((weights.x * fit) * smoothstep(0.0, 5.0, room));
        vec2 local = (p - vec2(tick.x, (hi.y + 6.0)));
        labels = max(labels, (vec3(tickNumberLayers(local, n, step, 0.5, _licm6, _licm8), (numberPlate(local, n, step, 0.5, _licm6) * _licm9)) * opacity));
      }
      if (((tick.y >= (lo.y - 0.01)) && (tick.y <= (hi.y + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2((lo.x - 2.5), tick.y), _licm10, 2.5, 1.0) * weights.y));
        float n_1 = (_cse1 ? pow(10.0, nearest.y) : nearest.y);
        float step_1 = (_cse1 ? max((n_1 * (pow(10.0, yLevels.x) - 1.0)), 1e-30) : yLevels.x);
        float width_1 = numberWidth(n_1, step_1, _licm6);
        float fit_1 = smoothstep(_licm11, _licm12, ((spacing.y / _licm3) * size.y));
        float opacity_1 = ((weights.y * fit_1) * smoothstep(0.0, 5.0, ((lo.x - 13.0) - width_1)));
        vec2 local_1 = (p - vec2((lo.x - 9.0), (tick.y - _licm13)));
        labels = max(labels, (vec3(tickNumberLayers(local_1, n_1, step_1, 1.0, _licm6, _licm8), (numberPlate(local_1, n_1, step_1, 1.0, _licm6) * _licm9)) * opacity_1));
      }
    }
  }
  if ((u.layer < 0.5)) {
    return vec4((inside ? mix(u.background.rgb, vec3(0.89, 0.91, 0.93), (grid * u.grid)) : u.background.rgb), u.background.a);
  }
  float alpha = max(max(coverage, labels.y), (labels.z * 0.94));
  float ink = max(coverage, labels.x);
  vec4 color = vec4(mix(u.background.rgb, vec3(0.2, 0.26, 0.34), (ink / max(alpha, 1e-20))), alpha);
  if ((((((u.legend.z > 0.0) && (p.x >= u.legend.x)) && (p.y >= u.legend.y)) && (p.x <= (u.legend.x + u.legend.z))) && (p.y <= (u.legend.y + u.legend.w)))) {
    color = vec4(1.0, 1.0, 1.0, 0.96);
  }
  if (((u.focus > 0.0) && (min(min(p.x, p.y), min((_licm7 - p.x), (u.resolution.y - p.y))) < 2.0))) {
    color = vec4(0.09, 0.42, 0.92, 1.0);
  }
  return color;
}

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  _ret = axesFragment_impl(v);
}
`,blocks:{u:"DataUniforms",font:"FontUniforms"},samplers:{glyphAtlas:null}},seriesFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};

struct DataHit {
  float distance;
  uint index;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform SeriesUniforms {
  vec4 color;
  float kind;
  float width;
  float dash;
  float marker;
  uint count;
  uint ordered;
  float period;
  float offset;
  uint automatic;
  uint xParameter;
  float parameterRange;
  vec4 dataBounds;
  float baseline;
  float capSize;
  uint where;
} s;

uniform sampler2D points;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

vec2 pixelPoint(vec2 p) {
  float _cse0 = log2(10.0);
  vec2 q = vec2(((u.logarithmic.x > 0.0) ? (log2(max(p.x, 1e-30)) / _cse0) : p.x), ((u.logarithmic.y > 0.0) ? (log2(max(p.y, 1e-30)) / _cse0) : p.y));
  vec2 position = ((q - u.lower) / u.span);
  return (vec2(76.0, 42.0) + (vec2(position.x, (1.0 - position.y)) * extent()));
}

vec4 sampleAt(uint index) {
  uint i = (index * 8u);
  vec4 p = vec4(_sfetch(points, int(i)), _sfetch(points, int((i + 1u))), _sfetch(points, int((i + 2u))), _sfetch(points, int((i + 3u))));
  bool valid = (((((p.w > 0.0) && (abs(p.x) <= 3.4028234e+38)) && (abs(p.y) <= 3.4028234e+38)) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && (((u.logarithmic.y <= 0.0) || (p.y > 0.0)) || (s.kind == 6.0)));
  return vec4(p.xyz, (valid ? 1.0 : 0.0));
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  return length((_cse0 - (t * delta)));
}

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
}

uint lowerBound(float value) {
  uint lo = 0u;
  uint hi = s.count;
  for (int iteration = 0; (iteration < 32); iteration = (iteration + 1)) {
    if ((lo >= hi)) {
      break;
    }
    uint middle = (lo + ((hi - lo) / 2u));
    if ((_sfetch(points, int((middle * 8u))) < value)) {
      lo = (middle + 1u);
    } else {
      hi = middle;
    }
  }
  return lo;
}

float visibleDashPeriod() {
  if (((s.dash <= 0.0) || (s.automatic == 0u))) {
    return s.period;
  }
  float rate = 0.0;
  if ((s.xParameter != 0u)) {
    float _cse0 = extent().x;
    rate = (u.span.x / _cse0);
    if ((u.logarithmic.x > 0.0)) {
      float visibleMaximum = min(s.dataBounds.z, pow(10.0, (u.lower.x + u.span.x)));
      rate *= (max(visibleMaximum, 1e-30) * log(10.0));
      if (((s.ordered != 0u) && (s.count >= 2u))) {
        uint right = min((s.count - 1u), max(1u, lowerBound(visibleMaximum)));
        vec4 a = sampleAt((right - 1u));
        vec4 b = sampleAt(right);
        float logSpan = ((log2(b.x) - log2(a.x)) / log2(10.0));
        if ((((a.w > 0.0) && (b.w > 0.0)) && (logSpan > 1e-20))) {
          rate = (((abs((b.z - a.z)) / logSpan) * u.span.x) / _cse0);
        }
      }
    }
  } else {
    vec2 projected = abs((pixelPoint(s.dataBounds.zw) - pixelPoint(s.dataBounds.xy)));
    rate = (s.parameterRange / max(max(projected.x, projected.y), 1e-20));
  }
  float pixelPeriod = ((s.dash > 1.5) ? max(5.0, (s.width * 2.5)) : max(8.0, (s.width * 4.0)));
  if (((rate > 0.0) == false)) {
    return s.period;
  }
  float level = ceil(log2(max(((rate * pixelPeriod) / s.period), 1e-20)));
  return max((s.period * pow(2.0, level)), 1e-30);
}

float pathDistance(vec2 p, vec2 a, vec2 b, vec2 parameters, float period) {
  float _licm0 = s.offset;
  float _licm1 = parameters.x;
  float _cse0 = segmentDistance(p, a, b);
  if ((s.dash <= 0.0)) {
    return _cse0;
  }
  vec2 delta = (b - a);
  float along = clamp((dot((p - a), delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  float parameter = mix(_licm1, parameters.y, along);
  float on = ((s.dash > 1.5) ? 0.0 : 0.6);
  float phase = ((parameter - _licm0) / period);
  float cycle = floor(((phase - (on * 0.5)) + 0.5));
  float difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    return ((fract(phase) <= on) ? _cse0 : 100000000000000000000.0);
  }
  float distance = 100000000000000000000.0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    float start = (_licm0 + ((cycle + float(neighbor)) * period));
    float first = ((start - _licm1) / difference);
    float second = (((start + (on * period)) - _licm1) / difference);
    float lo = max(0.0, min(first, second));
    float hi = min(1.0, max(first, second));
    if ((hi >= lo)) {
      distance = min(distance, segmentDistance(p, mix(a, b, lo), mix(a, b, hi)));
    }
  }
  return distance;
}

bool validData(vec2 p) {
  return ((all(lessThanEqual(abs(p), vec2(3.4028234e+38, 3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
}

bool crossing(vec2 p, vec2 a, vec2 b) {
  return (((a.y > p.y) != (b.y > p.y)) && (p.x < ((((b.x - a.x) * (p.y - a.y)) / (b.y - a.y)) + a.x)));
}

float bandDistance(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  float distance = min(min(segmentDistance(p, a, b), segmentDistance(p, b, c)), min(segmentDistance(p, c, d), segmentDistance(p, d, a)));
  bool inside = (((crossing(p, a, b) != crossing(p, b, c)) != crossing(p, c, d)) != crossing(p, d, a));
  return (inside ? (-distance) : distance);
}

float stepDistance(vec2 p, vec4 a, vec4 b, float period) {
  vec2 first = pixelPoint(a.xy);
  vec2 last = pixelPoint(b.xy);
  float middle = pixelPoint(vec2(((a.x + b.x) * 0.5), a.y)).x;
  float t = ((a.z + b.z) * 0.5);
  bool _cse0 = (s.xParameter != 0u);
  if ((s.where == 0u)) {
    vec2 corner = vec2(first.x, last.y);
    float parameter = (_cse0 ? a.z : t);
    return min(pathDistance(p, first, corner, vec2(a.z, parameter), period), pathDistance(p, corner, last, vec2(parameter, b.z), period));
  }
  if ((s.where == 1u)) {
    vec2 corner_1 = vec2(last.x, first.y);
    float parameter_1 = (_cse0 ? b.z : t);
    return min(pathDistance(p, first, corner_1, vec2(a.z, parameter_1), period), pathDistance(p, corner_1, last, vec2(parameter_1, b.z), period));
  }
  vec2 _lc0 = vec2(middle, first.y);
  vec2 _lc1 = vec2(middle, last.y);
  return min(min(pathDistance(p, first, _lc0, vec2(a.z, t), period), pathDistance(p, _lc0, _lc1, vec2(t, t), period)), pathDistance(p, _lc1, last, vec2(t, b.z), period));
}

DataHit seriesHit(vec2 p, float search) {
  bool _licm0 = (s.kind == 6.0);
  bool _licm1 = (u.logarithmic.y > 0.0);
  bool _licm2 = (s.kind == 1.0);
  bool _licm3 = (s.marker > 0.5);
  float _licm4 = s.width;
  bool _licm5 = (s.kind == 2.0);
  bool _licm6 = (s.baseline <= 0.0);
  float _licm7 = pow(10.0, u.lower.x);
  float _licm8 = s.baseline;
  bool _licm9 = (s.kind == 5.0);
  bool _licm10 = (s.kind == 7.0);
  float distance = 100000000000000000000.0;
  uint selected = 0u;
  bool _cse0 = (s.kind == 4.0);
  bool lineKind = ((s.kind < 0.5) || _cse0);
  bool _gv0 = (lineKind || _licm0);
  uint start = 0u;
  uint end = (_gv0 ? ((s.count > 0u) ? (s.count - 1u) : 0u) : s.count);
  float _cse1 = (_licm4 * 0.5);
  float radius = ((_cse1 + pixelWidth()) + search);
  bool _cse3 = (u.logarithmic.x > 0.0);
  if ((_gv0 && (s.ordered > 0u))) {
    float _cse2 = extent().x;
    float low = (u.lower.x + ((((p.x - radius) - 76.0) / _cse2) * u.span.x));
    float high = (u.lower.x + ((((p.x + radius) - 76.0) / _cse2) * u.span.x));
    uint left = lowerBound((_cse3 ? pow(10.0, low) : low));
    start = ((left > 0u) ? (left - 1u) : 0u);
    end = min(end, lowerBound((_cse3 ? pow(10.0, high) : high)));
  }
  float period = visibleDashPeriod();
  bool _cse4 = (_licm0 && _licm1);
  bool _cse5 = (s.kind == 3.0);
  float _cse6 = ((_licm1 && _licm6) ? pow(10.0, u.lower.y) : _licm8);
  vec2 _cse7 = vec2(0.0, s.capSize);
  vec2 _cse8 = vec2(s.capSize, 0.0);
  for (uint index = start; (index < end); index = (index + 1u)) {
    vec4 a = sampleAt(index);
    if ((a.w <= 0.0)) {
      continue;
    }
    vec2 point = pixelPoint(vec2(a.x, ((_cse4 && (a.y <= 0.0)) ? 1e-30 : a.y)));
    uint extra = ((index * 8u) + 4u);
    float candidate = 100000000000000000000.0;
    if (_gv0) {
      vec4 b = sampleAt((index + 1u));
      if ((b.w <= 0.0)) {
        continue;
      }
      vec2 other = pixelPoint(vec2(b.x, ((_cse4 && (b.y <= 0.0)) ? 1e-30 : b.y)));
      if (_licm0) {
        float first = _sfetch(points, int(extra));
        float second = _sfetch(points, int((extra + 8u)));
        vec2 lowerA = vec2(a.x, ((_licm1 && (first <= 0.0)) ? 1e-30 : first));
        vec2 lowerB = vec2(b.x, ((_licm1 && (second <= 0.0)) ? 1e-30 : second));
        if ((validData(lowerA) && validData(lowerB))) {
          candidate = bandDistance(p, point, other, pixelPoint(lowerB), pixelPoint(lowerA));
        }
      } else if ((all(greaterThanEqual(p, (min(point, other) - vec2(radius, radius)))) && all(lessThanEqual(p, (max(point, other) + vec2(radius, radius)))))) {
        candidate = ((_cse0 ? stepDistance(p, a, b, period) : pathDistance(p, point, other, vec2(a.z, b.z), period)) - _cse1);
      }
    } else if (_licm2) {
      vec2 q = abs((p - point));
      candidate = ((_licm3 ? max(q.x, q.y) : length(q)) - _licm4);
    } else if ((_licm5 || _cse5)) {
      float baseline = (_cse5 ? ((_cse3 && _licm6) ? _licm7 : _licm8) : _cse6);
      vec2 first_1 = (_cse5 ? vec2(baseline, _sfetch(points, int(extra))) : vec2(_sfetch(points, int(extra)), a.y));
      vec2 last = (_cse5 ? vec2(a.x, _sfetch(points, int((extra + 1u)))) : vec2(_sfetch(points, int((extra + 1u))), baseline));
      if ((validData(first_1) && validData(last))) {
        candidate = boxDistance(p, pixelPoint(first_1), pixelPoint(last));
      }
    } else if (_licm9) {
      vec2 baseline_1 = vec2(a.x, _cse6);
      if (validData(baseline_1)) {
        candidate = (segmentDistance(p, point, pixelPoint(baseline_1)) - _cse1);
      }
    } else if (_licm10) {
      float lowX = _sfetch(points, int(extra));
      float lowY = _sfetch(points, int((extra + 2u)));
      vec2 left_1 = vec2(((_cse3 && (lowX <= 0.0)) ? 1e-30 : lowX), a.y);
      vec2 right = vec2(_sfetch(points, int((extra + 1u))), a.y);
      vec2 bottom = vec2(a.x, ((_licm1 && (lowY <= 0.0)) ? 1e-30 : lowY));
      vec2 top = vec2(a.x, _sfetch(points, int((extra + 3u))));
      if ((validData(left_1) && validData(right))) {
        vec2 lo = pixelPoint(left_1);
        vec2 hi = pixelPoint(right);
        candidate = min(candidate, (segmentDistance(p, lo, hi) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo - _cse7), (lo + _cse7)), segmentDistance(p, (hi - _cse7), (hi + _cse7))) - _cse1));
      }
      if ((validData(bottom) && validData(top))) {
        vec2 lo_1 = pixelPoint(bottom);
        vec2 hi_1 = pixelPoint(top);
        candidate = min(candidate, (segmentDistance(p, lo_1, hi_1) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo_1 - _cse8), (lo_1 + _cse8)), segmentDistance(p, (hi_1 - _cse8), (hi_1 + _cse8))) - _cse1));
      }
    }
    if ((candidate < distance)) {
      distance = candidate;
      selected = index;
    }
  }
  return DataHit(distance, selected);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 seriesFragment_impl(Surface v) {
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  vec2 _cse0 = vec2(76.0, 42.0);
  if ((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent()))))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  DataHit hit = seriesHit(p, 0.0);
  float aa = (pixelWidth() * 0.5);
  return vec4(s.color.rgb, (s.color.a * (1.0 - smoothstep((-aa), aa, hit.distance))));
}

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  _ret = seriesFragment_impl(v);
}
`,blocks:{u:"DataUniforms",s:"SeriesUniforms",font:"FontUniforms"},samplers:{},data:["points"]},pickFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};

struct DataHit {
  float distance;
  uint index;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform SeriesUniforms {
  vec4 color;
  float kind;
  float width;
  float dash;
  float marker;
  uint count;
  uint ordered;
  float period;
  float offset;
  uint automatic;
  uint xParameter;
  float parameterRange;
  vec4 dataBounds;
  float baseline;
  float capSize;
  uint where;
} s;

uniform sampler2D points;

layout(std140) uniform DataPickUniforms {
  vec2 pixel;
  float radius;
  uint series;
} query;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
}
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

vec2 pixelPoint(vec2 p) {
  float _cse0 = log2(10.0);
  vec2 q = vec2(((u.logarithmic.x > 0.0) ? (log2(max(p.x, 1e-30)) / _cse0) : p.x), ((u.logarithmic.y > 0.0) ? (log2(max(p.y, 1e-30)) / _cse0) : p.y));
  vec2 position = ((q - u.lower) / u.span);
  return (vec2(76.0, 42.0) + (vec2(position.x, (1.0 - position.y)) * extent()));
}

vec4 sampleAt(uint index) {
  uint i = (index * 8u);
  vec4 p = vec4(_sfetch(points, int(i)), _sfetch(points, int((i + 1u))), _sfetch(points, int((i + 2u))), _sfetch(points, int((i + 3u))));
  bool valid = (((((p.w > 0.0) && (abs(p.x) <= 3.4028234e+38)) && (abs(p.y) <= 3.4028234e+38)) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && (((u.logarithmic.y <= 0.0) || (p.y > 0.0)) || (s.kind == 6.0)));
  return vec4(p.xyz, (valid ? 1.0 : 0.0));
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  return length((_cse0 - (t * delta)));
}

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
}

uint lowerBound(float value) {
  uint lo = 0u;
  uint hi = s.count;
  for (int iteration = 0; (iteration < 32); iteration = (iteration + 1)) {
    if ((lo >= hi)) {
      break;
    }
    uint middle = (lo + ((hi - lo) / 2u));
    if ((_sfetch(points, int((middle * 8u))) < value)) {
      lo = (middle + 1u);
    } else {
      hi = middle;
    }
  }
  return lo;
}

float visibleDashPeriod() {
  if (((s.dash <= 0.0) || (s.automatic == 0u))) {
    return s.period;
  }
  float rate = 0.0;
  if ((s.xParameter != 0u)) {
    float _cse0 = extent().x;
    rate = (u.span.x / _cse0);
    if ((u.logarithmic.x > 0.0)) {
      float visibleMaximum = min(s.dataBounds.z, pow(10.0, (u.lower.x + u.span.x)));
      rate *= (max(visibleMaximum, 1e-30) * log(10.0));
      if (((s.ordered != 0u) && (s.count >= 2u))) {
        uint right = min((s.count - 1u), max(1u, lowerBound(visibleMaximum)));
        vec4 a = sampleAt((right - 1u));
        vec4 b = sampleAt(right);
        float logSpan = ((log2(b.x) - log2(a.x)) / log2(10.0));
        if ((((a.w > 0.0) && (b.w > 0.0)) && (logSpan > 1e-20))) {
          rate = (((abs((b.z - a.z)) / logSpan) * u.span.x) / _cse0);
        }
      }
    }
  } else {
    vec2 projected = abs((pixelPoint(s.dataBounds.zw) - pixelPoint(s.dataBounds.xy)));
    rate = (s.parameterRange / max(max(projected.x, projected.y), 1e-20));
  }
  float pixelPeriod = ((s.dash > 1.5) ? max(5.0, (s.width * 2.5)) : max(8.0, (s.width * 4.0)));
  if (((rate > 0.0) == false)) {
    return s.period;
  }
  float level = ceil(log2(max(((rate * pixelPeriod) / s.period), 1e-20)));
  return max((s.period * pow(2.0, level)), 1e-30);
}

float pathDistance(vec2 p, vec2 a, vec2 b, vec2 parameters, float period) {
  float _licm0 = s.offset;
  float _licm1 = parameters.x;
  float _cse0 = segmentDistance(p, a, b);
  if ((s.dash <= 0.0)) {
    return _cse0;
  }
  vec2 delta = (b - a);
  float along = clamp((dot((p - a), delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  float parameter = mix(_licm1, parameters.y, along);
  float on = ((s.dash > 1.5) ? 0.0 : 0.6);
  float phase = ((parameter - _licm0) / period);
  float cycle = floor(((phase - (on * 0.5)) + 0.5));
  float difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    return ((fract(phase) <= on) ? _cse0 : 100000000000000000000.0);
  }
  float distance = 100000000000000000000.0;
  for (int neighbor = -1; (neighbor <= 1); neighbor = (neighbor + 1)) {
    float start = (_licm0 + ((cycle + float(neighbor)) * period));
    float first = ((start - _licm1) / difference);
    float second = (((start + (on * period)) - _licm1) / difference);
    float lo = max(0.0, min(first, second));
    float hi = min(1.0, max(first, second));
    if ((hi >= lo)) {
      distance = min(distance, segmentDistance(p, mix(a, b, lo), mix(a, b, hi)));
    }
  }
  return distance;
}

bool validData(vec2 p) {
  return ((all(lessThanEqual(abs(p), vec2(3.4028234e+38, 3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
}

bool crossing(vec2 p, vec2 a, vec2 b) {
  return (((a.y > p.y) != (b.y > p.y)) && (p.x < ((((b.x - a.x) * (p.y - a.y)) / (b.y - a.y)) + a.x)));
}

float bandDistance(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  float distance = min(min(segmentDistance(p, a, b), segmentDistance(p, b, c)), min(segmentDistance(p, c, d), segmentDistance(p, d, a)));
  bool inside = (((crossing(p, a, b) != crossing(p, b, c)) != crossing(p, c, d)) != crossing(p, d, a));
  return (inside ? (-distance) : distance);
}

float stepDistance(vec2 p, vec4 a, vec4 b, float period) {
  vec2 first = pixelPoint(a.xy);
  vec2 last = pixelPoint(b.xy);
  float middle = pixelPoint(vec2(((a.x + b.x) * 0.5), a.y)).x;
  float t = ((a.z + b.z) * 0.5);
  bool _cse0 = (s.xParameter != 0u);
  if ((s.where == 0u)) {
    vec2 corner = vec2(first.x, last.y);
    float parameter = (_cse0 ? a.z : t);
    return min(pathDistance(p, first, corner, vec2(a.z, parameter), period), pathDistance(p, corner, last, vec2(parameter, b.z), period));
  }
  if ((s.where == 1u)) {
    vec2 corner_1 = vec2(last.x, first.y);
    float parameter_1 = (_cse0 ? b.z : t);
    return min(pathDistance(p, first, corner_1, vec2(a.z, parameter_1), period), pathDistance(p, corner_1, last, vec2(parameter_1, b.z), period));
  }
  vec2 _lc0 = vec2(middle, first.y);
  vec2 _lc1 = vec2(middle, last.y);
  return min(min(pathDistance(p, first, _lc0, vec2(a.z, t), period), pathDistance(p, _lc0, _lc1, vec2(t, t), period)), pathDistance(p, _lc1, last, vec2(t, b.z), period));
}

DataHit seriesHit(vec2 p, float search) {
  bool _licm0 = (s.kind == 6.0);
  bool _licm1 = (u.logarithmic.y > 0.0);
  bool _licm2 = (s.kind == 1.0);
  bool _licm3 = (s.marker > 0.5);
  float _licm4 = s.width;
  bool _licm5 = (s.kind == 2.0);
  bool _licm6 = (s.baseline <= 0.0);
  float _licm7 = pow(10.0, u.lower.x);
  float _licm8 = s.baseline;
  bool _licm9 = (s.kind == 5.0);
  bool _licm10 = (s.kind == 7.0);
  float distance = 100000000000000000000.0;
  uint selected = 0u;
  bool _cse0 = (s.kind == 4.0);
  bool lineKind = ((s.kind < 0.5) || _cse0);
  bool _gv0 = (lineKind || _licm0);
  uint start = 0u;
  uint end = (_gv0 ? ((s.count > 0u) ? (s.count - 1u) : 0u) : s.count);
  float _cse1 = (_licm4 * 0.5);
  float radius = ((_cse1 + pixelWidth()) + search);
  bool _cse3 = (u.logarithmic.x > 0.0);
  if ((_gv0 && (s.ordered > 0u))) {
    float _cse2 = extent().x;
    float low = (u.lower.x + ((((p.x - radius) - 76.0) / _cse2) * u.span.x));
    float high = (u.lower.x + ((((p.x + radius) - 76.0) / _cse2) * u.span.x));
    uint left = lowerBound((_cse3 ? pow(10.0, low) : low));
    start = ((left > 0u) ? (left - 1u) : 0u);
    end = min(end, lowerBound((_cse3 ? pow(10.0, high) : high)));
  }
  float period = visibleDashPeriod();
  bool _cse4 = (_licm0 && _licm1);
  bool _cse5 = (s.kind == 3.0);
  float _cse6 = ((_licm1 && _licm6) ? pow(10.0, u.lower.y) : _licm8);
  vec2 _cse7 = vec2(0.0, s.capSize);
  vec2 _cse8 = vec2(s.capSize, 0.0);
  for (uint index = start; (index < end); index = (index + 1u)) {
    vec4 a = sampleAt(index);
    if ((a.w <= 0.0)) {
      continue;
    }
    vec2 point = pixelPoint(vec2(a.x, ((_cse4 && (a.y <= 0.0)) ? 1e-30 : a.y)));
    uint extra = ((index * 8u) + 4u);
    float candidate = 100000000000000000000.0;
    if (_gv0) {
      vec4 b = sampleAt((index + 1u));
      if ((b.w <= 0.0)) {
        continue;
      }
      vec2 other = pixelPoint(vec2(b.x, ((_cse4 && (b.y <= 0.0)) ? 1e-30 : b.y)));
      if (_licm0) {
        float first = _sfetch(points, int(extra));
        float second = _sfetch(points, int((extra + 8u)));
        vec2 lowerA = vec2(a.x, ((_licm1 && (first <= 0.0)) ? 1e-30 : first));
        vec2 lowerB = vec2(b.x, ((_licm1 && (second <= 0.0)) ? 1e-30 : second));
        if ((validData(lowerA) && validData(lowerB))) {
          candidate = bandDistance(p, point, other, pixelPoint(lowerB), pixelPoint(lowerA));
        }
      } else if ((all(greaterThanEqual(p, (min(point, other) - vec2(radius, radius)))) && all(lessThanEqual(p, (max(point, other) + vec2(radius, radius)))))) {
        candidate = ((_cse0 ? stepDistance(p, a, b, period) : pathDistance(p, point, other, vec2(a.z, b.z), period)) - _cse1);
      }
    } else if (_licm2) {
      vec2 q = abs((p - point));
      candidate = ((_licm3 ? max(q.x, q.y) : length(q)) - _licm4);
    } else if ((_licm5 || _cse5)) {
      float baseline = (_cse5 ? ((_cse3 && _licm6) ? _licm7 : _licm8) : _cse6);
      vec2 first_1 = (_cse5 ? vec2(baseline, _sfetch(points, int(extra))) : vec2(_sfetch(points, int(extra)), a.y));
      vec2 last = (_cse5 ? vec2(a.x, _sfetch(points, int((extra + 1u)))) : vec2(_sfetch(points, int((extra + 1u))), baseline));
      if ((validData(first_1) && validData(last))) {
        candidate = boxDistance(p, pixelPoint(first_1), pixelPoint(last));
      }
    } else if (_licm9) {
      vec2 baseline_1 = vec2(a.x, _cse6);
      if (validData(baseline_1)) {
        candidate = (segmentDistance(p, point, pixelPoint(baseline_1)) - _cse1);
      }
    } else if (_licm10) {
      float lowX = _sfetch(points, int(extra));
      float lowY = _sfetch(points, int((extra + 2u)));
      vec2 left_1 = vec2(((_cse3 && (lowX <= 0.0)) ? 1e-30 : lowX), a.y);
      vec2 right = vec2(_sfetch(points, int((extra + 1u))), a.y);
      vec2 bottom = vec2(a.x, ((_licm1 && (lowY <= 0.0)) ? 1e-30 : lowY));
      vec2 top = vec2(a.x, _sfetch(points, int((extra + 3u))));
      if ((validData(left_1) && validData(right))) {
        vec2 lo = pixelPoint(left_1);
        vec2 hi = pixelPoint(right);
        candidate = min(candidate, (segmentDistance(p, lo, hi) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo - _cse7), (lo + _cse7)), segmentDistance(p, (hi - _cse7), (hi + _cse7))) - _cse1));
      }
      if ((validData(bottom) && validData(top))) {
        vec2 lo_1 = pixelPoint(bottom);
        vec2 hi_1 = pixelPoint(top);
        candidate = min(candidate, (segmentDistance(p, lo_1, hi_1) - _cse1));
        candidate = min(candidate, (min(segmentDistance(p, (lo_1 - _cse8), (lo_1 + _cse8)), segmentDistance(p, (hi_1 - _cse8), (hi_1 + _cse8))) - _cse1));
      }
    }
    if ((candidate < distance)) {
      distance = candidate;
      selected = index;
    }
  }
  return DataHit(distance, selected);
}
in vec2 uv;
layout(location = 0) out uvec4 _ret;

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  vec2 p = query.pixel;
  vec2 _cse0 = vec2(76.0, 42.0);
  if ((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent()))))) {
    discard;
  }
  DataHit hit = seriesHit(p, query.radius);
  if ((hit.distance > query.radius)) {
    discard;
  }
  _ret = uvec4((query.series + 1u), (hit.index + 1u), floatBitsToUint(hit.distance), 1u);
}
`,blocks:{u:"DataUniforms",s:"SeriesUniforms",query:"DataPickUniforms",font:"FontUniforms"},samplers:{},data:["points"]},textFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform TextUniforms {
  vec4 color;
  vec4 box;
  vec4 anchor;
  vec2 offset;
  vec2 target;
  vec4 arrow;
} text;

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
in vec2 local;
flat in uint code;
in float size;
layout(location = 0) out vec4 _ret;

void main() {
  vec2 layers = glyphLayers(local, int(code), size, u.labelStyle.z);
  _ret = vec4(mix(u.background.rgb, text.color.rgb, (layers.x / max(layers.y, 1e-20))), (text.color.a * layers.y));
}
`,blocks:{u:"DataUniforms",text:"TextUniforms",font:"FontUniforms"},samplers:{glyphAtlas:null}},labelPlateFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform TextUniforms {
  vec4 color;
  vec4 box;
  vec4 anchor;
  vec2 offset;
  vec2 target;
  vec4 arrow;
} text;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

vec2 pixelPoint(vec2 p) {
  float _cse0 = log2(10.0);
  vec2 q = vec2(((u.logarithmic.x > 0.0) ? (log2(max(p.x, 1e-30)) / _cse0) : p.x), ((u.logarithmic.y > 0.0) ? (log2(max(p.y, 1e-30)) / _cse0) : p.y));
  vec2 position = ((q - u.lower) / u.span);
  return (vec2(76.0, 42.0) + (vec2(position.x, (1.0 - position.y)) * extent()));
}

vec2 textLocal(vec2 p) {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  vec2 delta = ((p - pixelPoint(text.anchor.xy)) - text.offset);
  float c = cos(text.anchor.w);
  float sine = sin(text.anchor.w);
  return vec2(((c * delta.x) - (sine * delta.y)), ((sine * delta.x) + (c * delta.y)));
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  vec2 p = (vec2(uv.x, (1.0 - uv.y)) * u.resolution);
  vec2 q = ((abs((textLocal(p) - text.box.xy)) - text.box.zw) + vec2(3.0, 3.0));
  float distance = ((length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0)) - 3.0);
  float aa = (pixelWidth() * 0.5);
  float coverage = (1.0 - smoothstep((-aa), aa, distance));
  float border = (1.0 - smoothstep((-0.7 - aa), (-0.7 + aa), distance));
  vec3 fill = mix(u.background.rgb, vec3(0.995, 0.995, 0.995), 0.8);
  _ret = vec4(mix(vec3(0.8, 0.84, 0.9), fill, border), (coverage * 0.94));
}
`,blocks:{u:"DataUniforms",text:"TextUniforms",font:"FontUniforms"},samplers:{}},fieldFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};

struct FieldSample {
  float value;
  bool valid;
  uint index;
  vec2 gradient;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

uniform sampler2D points;

layout(std140) uniform FieldUniforms {
  vec4 bounds;
  vec2 range;
  uvec2 shape;
  uint palette;
  uint origin;
  uint mode;
  uint interpolation;
  float alpha;
  uint levels;
  float lineWidth;
} field;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
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

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

float fieldAt(int column, int row) {
  uint x = uint(clamp(column, 0, (int(field.shape.y) - 1)));
  uint y = uint(clamp(row, 0, (int(field.shape.x) - 1)));
  return _sfetch(points, int(((y * field.shape.y) + x)));
}

FieldSample fieldSample(vec2 pixel) {
  vec2 _cse0 = extent();
  vec2 position = ((pixel - vec2(76.0, 42.0)) / _cse0);
  vec2 scaled = (u.lower + (vec2(position.x, (1.0 - position.y)) * u.span));
  bool _cse1 = (u.logarithmic.x > 0.0);
  bool _cse2 = (u.logarithmic.y > 0.0);
  vec2 value = vec2((_cse1 ? pow(10.0, scaled.x) : scaled.x), (_cse2 ? pow(10.0, scaled.y) : scaled.y));
  vec2 _cse3 = (field.bounds.zw - field.bounds.xy);
  vec2 fraction = ((value - field.bounds.xy) / _cse3);
  float _cse9 = float(field.shape.y);
  float _cse10 = float(field.shape.x);
  vec2 _cse4 = vec2(_cse9, _cse10);
  vec2 _cse5 = vec2(0.5, 0.5);
  vec2 coordinate = ((fraction * _cse4) - _cse5);
  float _cse6 = (_cse10 - 1.0);
  if ((field.origin != 0u)) {
    coordinate.y = (_cse6 - coordinate.y);
  }
  vec2 _cse7 = vec2(0.0, 0.0);
  uvec2 nearest = _f2u(clamp(floor((coordinate + _cse5)), _cse7, vec2((_cse9 - 1.0), _cse6)));
  uint index = ((nearest.y * field.shape.y) + nearest.x);
  float sample_ = _sfetch(points, int(index));
  vec2 gradient = _cse7;
  if ((field.interpolation != 0u)) {
    ivec2 low = _f2i(floor(coordinate));
    vec2 t = fract(coordinate);
    float a = fieldAt(low.x, low.y);
    int _gv0 = (low.x + 1);
    float b = fieldAt(_gv0, low.y);
    int _gv1 = (low.y + 1);
    float c = fieldAt(low.x, _gv1);
    float d = fieldAt(_gv0, _gv1);
    sample_ = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
    float _cse8 = log(10.0);
    vec2 dataRate = ((u.span / _cse0) * vec2((_cse1 ? (value.x * _cse8) : 1.0), (_cse2 ? (value.y * _cse8) : 1.0)));
    gradient = (((vec2(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  return FieldSample(sample_, ((all(greaterThanEqual(fraction, _cse7)) && all(lessThanEqual(fraction, vec2(1.0, 1.0)))) && (abs(sample_) <= 3.4028234e+38)), index, gradient);
}

float fieldLevel(uint index) {
  return _sfetch(points, int(((field.shape.x * field.shape.y) + index)));
}

vec4 fieldColors(float value) {
  uint _licm0 = field.levels;
  if ((field.mode != 2u)) {
    return vec4(colorMap(((value - field.range.x) / (field.range.y - field.range.x)), field.palette), 1.0);
  }
  uint below = 0u;
  for (uint i = 0u; (i < _licm0); i = (i + 1u)) {
    if ((value >= fieldLevel(i))) {
      below = (i + 1u);
    }
  }
  uint _cse0 = (_licm0 - 1u);
  if (((below == 0u) || (value > fieldLevel(_cse0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  return vec4(colorMap(((float(min(below, _cse0)) - 0.5) / float(_cse0)), field.palette), 1.0);
}

float nearestLevel(float value) {
  uint _licm0 = field.levels;
  float distance = 100000000000000000000.0;
  for (uint i = 0u; (i < _licm0); i = (i + 1u)) {
    distance = min(distance, abs((value - fieldLevel(i))));
  }
  return distance;
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 fieldFragment_impl(Surface v) {
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  FieldSample sample_ = fieldSample(p);
  float magnitude = max(abs(sample_.gradient.x), abs(sample_.gradient.y));
  float rate = ((magnitude > 0.0) ? (magnitude * length((sample_.gradient / max(magnitude, 1e-30)))) : 0.0);
  vec2 _cse0 = vec2(76.0, 42.0);
  if (((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent())))) || (sample_.valid == false))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec4 tint = fieldColors(sample_.value);
  float distance = (nearestLevel(sample_.value) / max(rate, 1e-30));
  float aa = (pixelWidth() * 0.5);
  float _cse1 = (field.lineWidth * 0.5);
  float coverage = ((field.mode == 1u) ? (((rate > 1e-30) && (rate < 3.4028234e+38)) ? (1.0 - smoothstep(max(0.0, (_cse1 - aa)), (_cse1 + aa), distance)) : 0.0) : 1.0);
  return vec4(tint.rgb, ((tint.a * field.alpha) * coverage));
}

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  _ret = fieldFragment_impl(v);
}
`,blocks:{u:"DataUniforms",field:"FieldUniforms",font:"FontUniforms"},samplers:{},data:["points"]},fieldPickFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};

struct FieldSample {
  float value;
  bool valid;
  uint index;
  vec2 gradient;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

uniform sampler2D points;

layout(std140) uniform DataPickUniforms {
  vec2 pixel;
  float radius;
  uint series;
} query;

layout(std140) uniform FieldUniforms {
  vec4 bounds;
  vec2 range;
  uvec2 shape;
  uint palette;
  uint origin;
  uint mode;
  uint interpolation;
  float alpha;
  uint levels;
  float lineWidth;
} field;
float _sfetch(sampler2D t, int i) {
  int w = textureSize(t, 0).x;
  return texelFetch(t, ivec2(i % w, i / w), 0).r;
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

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

float fieldAt(int column, int row) {
  uint x = uint(clamp(column, 0, (int(field.shape.y) - 1)));
  uint y = uint(clamp(row, 0, (int(field.shape.x) - 1)));
  return _sfetch(points, int(((y * field.shape.y) + x)));
}

FieldSample fieldSample(vec2 pixel) {
  vec2 _cse0 = extent();
  vec2 position = ((pixel - vec2(76.0, 42.0)) / _cse0);
  vec2 scaled = (u.lower + (vec2(position.x, (1.0 - position.y)) * u.span));
  bool _cse1 = (u.logarithmic.x > 0.0);
  bool _cse2 = (u.logarithmic.y > 0.0);
  vec2 value = vec2((_cse1 ? pow(10.0, scaled.x) : scaled.x), (_cse2 ? pow(10.0, scaled.y) : scaled.y));
  vec2 _cse3 = (field.bounds.zw - field.bounds.xy);
  vec2 fraction = ((value - field.bounds.xy) / _cse3);
  float _cse9 = float(field.shape.y);
  float _cse10 = float(field.shape.x);
  vec2 _cse4 = vec2(_cse9, _cse10);
  vec2 _cse5 = vec2(0.5, 0.5);
  vec2 coordinate = ((fraction * _cse4) - _cse5);
  float _cse6 = (_cse10 - 1.0);
  if ((field.origin != 0u)) {
    coordinate.y = (_cse6 - coordinate.y);
  }
  vec2 _cse7 = vec2(0.0, 0.0);
  uvec2 nearest = _f2u(clamp(floor((coordinate + _cse5)), _cse7, vec2((_cse9 - 1.0), _cse6)));
  uint index = ((nearest.y * field.shape.y) + nearest.x);
  float sample_ = _sfetch(points, int(index));
  vec2 gradient = _cse7;
  if ((field.interpolation != 0u)) {
    ivec2 low = _f2i(floor(coordinate));
    vec2 t = fract(coordinate);
    float a = fieldAt(low.x, low.y);
    int _gv0 = (low.x + 1);
    float b = fieldAt(_gv0, low.y);
    int _gv1 = (low.y + 1);
    float c = fieldAt(low.x, _gv1);
    float d = fieldAt(_gv0, _gv1);
    sample_ = mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
    float _cse8 = log(10.0);
    vec2 dataRate = ((u.span / _cse0) * vec2((_cse1 ? (value.x * _cse8) : 1.0), (_cse2 ? (value.y * _cse8) : 1.0)));
    gradient = (((vec2(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  return FieldSample(sample_, ((all(greaterThanEqual(fraction, _cse7)) && all(lessThanEqual(fraction, vec2(1.0, 1.0)))) && (abs(sample_) <= 3.4028234e+38)), index, gradient);
}

float fieldLevel(uint index) {
  return _sfetch(points, int(((field.shape.x * field.shape.y) + index)));
}

vec4 fieldColors(float value) {
  uint _licm0 = field.levels;
  if ((field.mode != 2u)) {
    return vec4(colorMap(((value - field.range.x) / (field.range.y - field.range.x)), field.palette), 1.0);
  }
  uint below = 0u;
  for (uint i = 0u; (i < _licm0); i = (i + 1u)) {
    if ((value >= fieldLevel(i))) {
      below = (i + 1u);
    }
  }
  uint _cse0 = (_licm0 - 1u);
  if (((below == 0u) || (value > fieldLevel(_cse0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  return vec4(colorMap(((float(min(below, _cse0)) - 0.5) / float(_cse0)), field.palette), 1.0);
}

float nearestLevel(float value) {
  uint _licm0 = field.levels;
  float distance = 100000000000000000000.0;
  for (uint i = 0u; (i < _licm0); i = (i + 1u)) {
    distance = min(distance, abs((value - fieldLevel(i))));
  }
  return distance;
}
in vec2 uv;
layout(location = 0) out uvec4 _ret;

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  vec2 p = query.pixel;
  FieldSample sample_ = fieldSample(p);
  vec2 _cse0 = vec2(76.0, 42.0);
  if ((((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent())))) || (sample_.valid == false)) || (fieldColors(sample_.value).a == 0.0))) {
    discard;
  }
  if ((field.mode == 1u)) {
    float magnitude = max(abs(sample_.gradient.x), abs(sample_.gradient.y));
    float rate = ((magnitude > 0.0) ? (magnitude * length((sample_.gradient / max(magnitude, 1e-30)))) : 0.0);
    if (((((rate > 1e-30) && (rate < 3.4028234e+38)) == false) || ((nearestLevel(sample_.value) / rate) > (query.radius + (field.lineWidth * 0.5))))) {
      discard;
    }
  }
  _ret = uvec4((query.series + 1u), (sample_.index + 1u), 0u, 1u);
}
`,blocks:{u:"DataUniforms",query:"DataPickUniforms",field:"FieldUniforms"},samplers:{},data:["points"]},colorBarFragment:{fragment:`#version 300 es
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
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

uniform sampler2D points;

layout(std140) uniform FieldUniforms {
  vec4 bounds;
  vec2 range;
  uvec2 shape;
  uint palette;
  uint origin;
  uint mode;
  uint interpolation;
  float alpha;
  uint levels;
  float lineWidth;
} field;

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

int _f2i(float x) {
  return int(mix(clamp(x, -2147483648.0, 2147483520.0), 0.0, isnan(x)));
}

ivec2 _f2i(vec2 x) {
  return ivec2(_f2i(x.x), _f2i(x.y));
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

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
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

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0, 0.0))) + min(max(q.x, q.y), 0.0));
}

float fieldLevel(uint index) {
  return _sfetch(points, int(((field.shape.x * field.shape.y) + index)));
}

vec4 fieldColors(float value) {
  uint _licm0 = field.levels;
  if ((field.mode != 2u)) {
    return vec4(colorMap(((value - field.range.x) / (field.range.y - field.range.x)), field.palette), 1.0);
  }
  uint below = 0u;
  for (uint i = 0u; (i < _licm0); i = (i + 1u)) {
    if ((value >= fieldLevel(i))) {
      below = (i + 1u);
    }
  }
  uint _cse0 = (_licm0 - 1u);
  if (((below == 0u) || (value > fieldLevel(_cse0)))) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  return vec4(colorMap(((float(min(below, _cse0)) - 0.5) / float(_cse0)), field.palette), 1.0);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  float _licm0 = field.range.x;
  float _licm1 = field.range.y;
  float _licm2 = (u.labelStyle.x * 0.75);
  float _licm3 = ((field.range.y - field.range.x) * 0.5);
  float _licm4 = u.labelStyle.x;
  float _licm5 = u.labelStyle.z;
  vec2 p = (vec2(uv.x, (1.0 - uv.y)) * u.resolution);
  float height = min(140.0, (u.resolution.y * 0.4));
  vec2 lo = vec2((u.resolution.x - 40.0), 58.0);
  vec2 hi = (lo + vec2(10.0, height));
  float fraction = clamp((1.0 - ((p.y - lo.y) / height)), 0.0, 1.0);
  float value = mix(_licm0, _licm1, fraction);
  vec4 tint = fieldColors(value);
  float distance = boxDistance(p, lo, hi);
  float aa = (pixelWidth() * 0.5);
  float coverage = ((1.0 - smoothstep((-aa), aa, distance)) * tint.a);
  vec2 layers = vec2(0.0, 0.0);
  for (int i = 0; (i < 3); i = (i + 1)) {
    float t = (float(i) * 0.5);
    float n = mix(_licm0, _licm1, t);
    vec2 local = (p - vec2((lo.x - 5.0), ((lo.y + ((1.0 - t) * height)) - _licm2)));
    layers = max(layers, tickNumberLayers(local, n, _licm3, 1.0, _licm4, _licm5));
  }
  float alpha = max(coverage, layers.y);
  vec3 ink = mix(u.background.rgb, vec3(0.2, 0.26, 0.34), (layers.x / max(layers.y, 1e-20)));
  _ret = vec4(mix(tint.rgb, ink, (layers.y / max(alpha, 1e-20))), alpha);
}
`,blocks:{u:"DataUniforms",field:"FieldUniforms",font:"FontUniforms"},samplers:{glyphAtlas:null},data:["points"]},annotationFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};
layout(std140) uniform DataUniforms {
  vec2 resolution;
  vec2 lower;
  vec2 span;
  vec2 logarithmic;
  float grid;
  vec4 labelStyle;
  float layer;
  vec4 background;
  vec4 legend;
  float focus;
} u;

layout(std140) uniform TextUniforms {
  vec4 color;
  vec4 box;
  vec4 anchor;
  vec2 offset;
  vec2 target;
  vec4 arrow;
} text;

layout(std140) uniform FontUniforms {
  float pixelRatio;
} font;
float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0, 1.0));
}

vec2 pixelPoint(vec2 p) {
  float _cse0 = log2(10.0);
  vec2 q = vec2(((u.logarithmic.x > 0.0) ? (log2(max(p.x, 1e-30)) / _cse0) : p.x), ((u.logarithmic.y > 0.0) ? (log2(max(p.y, 1e-30)) / _cse0) : p.y));
  vec2 position = ((q - u.lower) / u.span);
  return (vec2(76.0, 42.0) + (vec2(position.x, (1.0 - position.y)) * extent()));
}

float line(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 d = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, d) / max(dot(d, d), 0.00001)), 0.0, 1.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep(max(0.0, (radius - aa)), (radius + aa), length((_cse0 - (t * d)))));
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, delta) / max(dot(delta, delta), 1e-20)), 0.0, 1.0);
  return length((_cse0 - (t * delta)));
}

vec2 textPoint(vec2 p) {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  float c = cos(text.anchor.w);
  float sine = sin(text.anchor.w);
  return ((pixelPoint(text.anchor.xy) + text.offset) + vec2(((c * p.x) + (sine * p.y)), (((-sine) * p.x) + (c * p.y))));
}

vec2 textLocal(vec2 p) {
  if ((text.anchor.z == 0.0)) {
    return p;
  }
  vec2 delta = ((p - pixelPoint(text.anchor.xy)) - text.offset);
  float c = cos(text.anchor.w);
  float sine = sin(text.anchor.w);
  return vec2(((c * delta.x) - (sine * delta.y)), ((sine * delta.x) + (c * delta.y)));
}

float triangleDistance(vec2 p, vec2 a, vec2 b, vec2 c) {
  vec2 ab = (b - a);
  vec2 bc = (c - b);
  vec2 ca = (a - c);
  vec2 pa = (p - a);
  vec2 pb = (p - b);
  vec2 pc = (p - c);
  float x = ((ab.x * pa.y) - (ab.y * pa.x));
  float y = ((bc.x * pb.y) - (bc.y * pb.x));
  float z = ((ca.x * pc.y) - (ca.y * pc.x));
  bool inside = ((((x >= 0.0) && (y >= 0.0)) && (z >= 0.0)) || (((x <= 0.0) && (y <= 0.0)) && (z <= 0.0)));
  float distance = min(segmentDistance(p, a, b), min(segmentDistance(p, b, c), segmentDistance(p, c, a)));
  return (inside ? (-distance) : distance);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 annotationFragment_impl(Surface v) {
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  vec2 target = pixelPoint(text.target);
  vec2 localTarget = textLocal(target);
  vec2 start = textPoint(clamp(localTarget, (text.box.xy - text.box.zw), (text.box.xy + text.box.zw)));
  vec2 _gv0 = (target - start);
  float lengthToTarget = length(_gv0);
  if ((lengthToTarget < 0.0001)) {
    return vec4(0.0, 0.0, 0.0, 0.0);
  }
  vec2 direction = (_gv0 / lengthToTarget);
  vec2 normal = vec2((-direction.y), direction.x);
  float size = min(text.arrow.z, (lengthToTarget * 0.5));
  vec2 back = (target - (direction * size));
  float aa = (pixelWidth() * 0.5);
  float head = ((size > 0.0) ? (1.0 - smoothstep((-aa), aa, triangleDistance(p, target, (back + ((normal * size) * 0.4)), (back - ((normal * size) * 0.4))))) : 0.0);
  float shaft = ((text.arrow.y > 0.0) ? line(p, start, back, (text.arrow.y * 0.5)) : 0.0);
  return vec4(text.color.rgb, (text.color.a * max(shaft, head)));
}

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  _ret = annotationFragment_impl(v);
}
`,blocks:{u:"DataUniforms",text:"TextUniforms",font:"FontUniforms"},samplers:{}}}}};var Ft={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}};function rt(a,e){return(a>=12592&&a<=55203?16:10)*e/16}function fe(a,e){return Array.from(a).reduce((n,t)=>n+rt(t.codePointAt(0),e),0)}function zt(a,e,n,t,i=0,r=!1){let s=[],o=-fe(a,t)*i;for(let d of a){let l=d.codePointAt(0);for(let[c,u]of[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])s.push(e+(r?0:o),n+(r?-o:0),l,t,r?1:0,c,u);o+=rt(l,t)}return new Float32Array(s)}var Q=class a{constructor(e,n,t,i){this.canvas=e;this.runtime=n;this.target=t;this.format=i;this.session=new Z(n,e.ownerDocument.defaultView)}axes;series;text;labelPlate;picking;fieldPipeline;fieldPicking;colorBar;annotationLine;glyphs;fullGlyphs=!1;glyphUpgrade;program;samples=new Map;fields=new Map;destroyed=!1;session;get backend(){return this.runtime.tier}static async create(e,n="auto"){if(!["auto","webgpu","webgl2"].includes(n))throw new TypeError("Unknown plot backend.");let t=e.ownerDocument.defaultView,i=ue,r=Ke();if(n!=="webgl2"){let l,c;try{l=await Y({prefer:["webgpu"],programs:[i]});let u=t.navigator.gpu.getPreferredCanvasFormat();c=new a(e,l,void 0,u),await c.initialize(r);let p=e.getContext("webgpu");if(!p)throw new Error("This canvas has no WebGPU context.");return p.configure({device:l.device,format:u,alphaMode:"premultiplied"}),c.target=p,c}catch(u){if(c?c.destroy():l?.destroy(),n==="webgpu")throw u}}let s=e.getContext("webgl2",{alpha:!0,antialias:!1});if(!s)throw new Error("TypePlot requires WebGPU or WebGL2 in this browser.");let o=await Y({device:s,programs:[i]}),d=new a(e,o,s,"rgba8unorm");try{return await d.initialize(r),d}catch(l){throw d.destroy(),l}}async initialize(e){this.program=this.runtime.load(ue);let n=this.session.run(()=>se(this.runtime,!1,void 0,()=>!this.destroyed,e).then(r=>{this.glyphs=r}));await Promise.resolve();let i=(await Promise.allSettled([this.pipeline("axesFragment").then(r=>{this.axes=r}),this.pipeline("seriesFragment").then(r=>{this.series=r}),this.pipeline("textFragment","textVertex").then(r=>{this.text=r}),n,this.session.prepareData()])).find(r=>r.status==="rejected");if(i?.status==="rejected")throw i.reason}pipeline(e,n="surfaceVertex",t=!1){return this.session.run(()=>this.program.render({vertex:n,fragment:e,targets:t?["rgba32uint"]:[{format:this.format,blend:Ft}]}))}async prepareScene(e){let n=[this.ensureGlyphs(e)];!this.fieldPipeline&&e.axes.some(t=>t.fields.length)&&n.push(this.pipeline("fieldFragment").then(t=>{this.fieldPipeline=t})),!this.colorBar&&e.axes.some(t=>t.fields.some(i=>i.options.colorBar))&&n.push(this.pipeline("colorBarFragment").then(t=>{this.colorBar=t})),!this.labelPlate&&e.axes.some(t=>t.settings.labelBackground)&&n.push(this.pipeline("labelPlateFragment").then(t=>{this.labelPlate=t})),!this.annotationLine&&e.axes.some(t=>t.annotations.some(i=>i.options.arrow))&&n.push(this.pipeline("annotationFragment").then(t=>{this.annotationLine=t})),await Promise.all(n)}async ensureGlyphs(e){if(this.fullGlyphs)return;let n=/[\uac00-\ud7a3]/;(n.test(e.title??"")||e.axes.some(i=>[i.settings.title,i.settings.xLabel,i.settings.yLabel].some(r=>n.test(r??""))||i.series.some(r=>n.test(r.style.label))||i.annotations.some(r=>n.test(r.value))))&&(this.glyphUpgrade||(this.glyphUpgrade=this.session.run(()=>se(this.runtime,!0,this.glyphs,()=>!this.destroyed)).then(()=>{this.fullGlyphs=!0}).finally(()=>{this.glyphUpgrade=void 0})),await this.glyphUpgrade)}uniform(e,n,t,i,r){return{resolution:[n,t],lower:[e.bounds.x[0],e.bounds.y[0]],span:[e.bounds.x[1]-e.bounds.x[0],e.bounds.y[1]-e.bounds.y[0]],logarithmic:[e.settings.xScale==="log"?1:0,e.settings.yScale==="log"?1:0],grid:e.gridOpacity,labelStyle:[e.settings.labelSize??11,e.settings.tickDensity??1,e.settings.labelHalo??.8,e.settings.labelBackground?1:0],layer:0,background:i,legend:r,focus:e.focused?1:0}}sampleResource(e){let n=this.samples.get(e.key);if(n?.data===e.data&&n.parameter===e.style.parameter)return n;n&&this.release(n.points);let{x:t,y:i}=e.data,r=t.every((f,v)=>Number.isFinite(f)&&(v===0||f>t[v-1])),s=e.style.parameter==="x"||e.style.parameter==="auto"&&r,o=new Float32Array(t.length*8),d=1/0,l=-1/0,c=1/0,u=1/0,p=-1/0,m=-1/0;for(let f=0;f<t.length;f++){let v=s?t[f]:f,y=[0,0,0,0];e.kind==="bar"?y=[e.edges?.[f]??t[f]-e.style.width/2,e.edges?.[f+1]??t[f]+e.style.width/2,0,0]:e.kind==="barh"?y=[i[f]-e.style.width/2,i[f]+e.style.width/2,0,0]:e.kind==="fill"?y[0]=e.data.lower[f]:e.kind==="error"&&(y=[e.data.xLow?.[f]??NaN,e.data.xHigh?.[f]??NaN,e.data.yLow?.[f]??NaN,e.data.yHigh?.[f]??NaN]),o.set([t[f],i[f],v,1,...y],f*8),Number.isFinite(t[f])&&Number.isFinite(i[f])&&(c=Math.min(c,t[f]),p=Math.max(p,t[f]),u=Math.min(u,i[f]),m=Math.max(m,i[f])),Number.isFinite(v)&&(d=Math.min(d,v),l=Math.max(l,v))}let h={data:e.data,points:this.session.array(o),count:t.length,ordered:r,period:Math.max((l-d)/60,1e-20),parameter:e.style.parameter,parameterRange:Number.isFinite(l-d)?l-d:0,xParameter:s,bounds:Number.isFinite(c)?[c,u,p,m]:[0,0,0,0]};return this.samples.set(e.key,h),h}release(e){this.session.release(e)}prune(e){let n=new Set(e.axes.flatMap(i=>i.series.map(r=>r.key)));for(let[i,r]of this.samples)n.has(i)||(this.release(r.points),this.samples.delete(i));let t=new Set(e.axes.flatMap(i=>i.fields.map(r=>r.key)));for(let[i,r]of this.fields)t.has(i)||(this.release(r.points),this.fields.delete(i))}fieldResource(e){let n=JSON.stringify(e.options.levels),t=this.fields.get(e.key);if(t?.values===e.values&&t.levels===n)return t.points;t&&this.release(t.points);let i=new Float32Array(e.values.length+e.options.levels.length);i.set(e.values),i.set(e.options.levels,e.values.length);let r=this.session.array(i);return this.fields.set(e.key,{values:e.values,levels:n,points:r}),r}drawField(e,n,t,i,r,s=!1){let o=t.options;if(!o.visible||o.alpha<=0)return;let[d,l,c,u]=o.extent,p={bounds:[d,c,l,u],range:o.valueRange,shape:o.shape,palette:H.indexOf(o.colorMap),origin:o.origin==="upper"?1:0,mode:["image","contour","contourf"].indexOf(t.mode),interpolation:o.interpolation==="linear"?1:0,alpha:o.alpha,levels:o.levels.length,lineWidth:o.lineWidth};e.draw(r?this.fieldPicking:s?this.colorBar:this.fieldPipeline,{u:n,field:p,points:this.fieldResource(t),...r?{}:{font:{pixelRatio:i}},...s?{glyphAtlas:this.glyphs}:{},...r?{query:r}:{}},{count:3})}drawSeries(e,n,t,i,r,s){let o=i.style;if(!o.visible||o.alpha<=0)return;let d=M(o.color,this.canvas.ownerDocument);if(d[3]*=o.alpha,d[3]<=0)return;let l=c=>{let u=this.sampleResource(i);if(!u.count)return;let p={color:d,kind:c,width:c===1?o.markerSize:o.lineWidth,dash:c===0||c===4?o.lineStyle==="--"?1:o.lineStyle===":"?2:0:0,marker:o.marker==="s"?1:0,count:u.count,ordered:u.ordered&&(n.settings.xScale!=="log"||i.data.x[0]>0)?1:0,period:o.dashPeriod||u.period,offset:o.dashOffset,automatic:o.dashPeriod>0?0:1,parameterRange:u.parameterRange,xParameter:u.xParameter?1:0,dataBounds:u.bounds,baseline:o.baseline,capSize:o.capSize,where:["pre","post","mid"].indexOf(o.where)};e.draw(s?this.picking:this.series,{u:t,s:p,points:u.points,font:{pixelRatio:r},...s?{query:s}:{}},{count:3})};i.kind==="bar"?l(2):i.kind==="barh"?l(3):i.kind==="fill"?l(6):((i.kind==="line"||i.kind==="step"||i.kind==="error")&&o.lineStyle!=="none"&&l(i.kind==="step"?4:0),i.kind==="stem"&&l(5),i.kind==="error"&&l(7),o.marker!=="none"&&l(1))}pick(e,n,t,i){return this.session.run(()=>this.pickFrame(e,n,t,i))}async pickFrame(e,n,t,i){if(this.destroyed)throw new Error("This renderer has been destroyed.");if(!Array.isArray(t)||t.length!==2||!t.every(Number.isFinite)||!Number.isFinite(i)||i<0||i>64)throw new RangeError("Picking needs a finite CSS-pixel position and radius between zero and 64.");let r=e.axes[n];if(!r)throw new RangeError("Unknown subplot.");let s=[];if(!this.picking&&r.series.length&&s.push(this.pipeline("pickFragment","surfaceVertex",!0).then(c=>{this.picking=c})),!this.fieldPicking&&r.fields.length&&s.push(this.pipeline("fieldPickFragment","surfaceVertex",!0).then(c=>{this.fieldPicking=c})),await Promise.all(s),this.destroyed)return null;let o=e.width/e.cols,d=(e.height-(e.titleHeight??0))/e.rows;if(t[0]<0||t[1]<0||t[0]>o||t[1]>d)return null;let l=this.runtime.texture({size:[1,1],format:"rgba32uint"});try{let c=this.uniform(r,o,d,M(e.background??"#fff",this.canvas.ownerDocument),[0,0,0,0]),u=this.runtime.frame();u.pass({color:[{target:l,clear:[0,0,0,0]}]},h=>{r.fields.forEach((f,v)=>this.drawField(h,c,f,1,{pixel:t,radius:i,series:v})),r.series.forEach((f,v)=>this.drawSeries(h,r,c,f,1,{pixel:t,radius:i,series:v+r.fields.length}))}),await u.submit();let p=await l.read(),m=new Uint32Array(p.buffer,p.byteOffset,4);return m[3]?{series:m[0]-1,index:m[1]-1}:null}finally{l.destroy()}}scene(e,n,t,i){let r=t/n.width,s=i/n.height,o=n.title?n.titleHeight??42:0,d=n.width/n.cols,l=(n.height-o)/n.rows,c=this.canvas.ownerDocument,u=M(n.background??"#fff",c),p=[.06,.09,.16,1],m=(h,f,v,y,w,T=0,k=!1,q=p,x)=>{if(!f)return;let b=h,P=fe(f,w),g=k?[v+w*.76,y-P*(.5-T)]:[v+P*(.5-T),y+w*.76],R=k?[w*.55+2,P*.5+3.5]:[P*.5+3.5,w*.55+2],pt=[...g,...R],ne={color:q,box:pt,anchor:x?[...x.position,1,x.options.rotation]:[0,0,0,0],offset:x?.options.offset??[0,0],target:x?.target??[0,0],arrow:x?[x.options.arrow?1:0,x.options.lineWidth,x.options.headSize,0]:[0,0,0,0]};x?.options.arrow&&e.draw(this.annotationLine,{u:h,text:ne,font:{pixelRatio:Math.min(r,s)}},{count:3}),b.labelStyle[3]>0&&f!=="\u2014"&&e.draw(this.labelPlate,{u:h,text:ne,font:{pixelRatio:Math.min(r,s)}},{count:3});let ve=zt(f,v,y,w,T,k);e.draw(this.text,{u:h,text:ne,glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,s)}},{vertices:ve,count:ve.length/7})};if(n.axes.forEach((h,f)=>{let v=Math.round(f%n.cols*d*r),y=Math.round((f%n.cols+1)*d*r),w=Math.round((o+Math.floor(f/n.cols)*l)*s),T=Math.round((o+(Math.floor(f/n.cols)+1)*l)*s);e.setViewport(v,w,y-v,T-w),e.setScissorRect(v,w,y-v,T-w);let k=h.settings.legend?h.series.filter(g=>g.style.label&&!g.style.label.startsWith("_")):[],q=k.length?Math.min(d-120,Math.max(...k.map(g=>fe(g.style.label,12)))+48):0,x=q>50?[d-32-q,50,q,k.length*22+12]:[0,0,0,0],b=this.uniform(h,d,l,u,x);e.draw(this.axes,{u:b,glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,s)}},{count:3});for(let g of h.fields)this.drawField(e,b,g,Math.min(r,s));for(let g of h.series)this.drawSeries(e,h,b,g,Math.min(r,s));for(let g of h.annotations){let R=M(g.options.color,c);R[3]*=g.options.alpha,m(b,g.value,0,0,g.options.fontSize,["left","center","right"].indexOf(g.options.align)*.5,!1,R,g)}e.draw(this.axes,{u:{...b,layer:1},glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,s)}},{count:3}),m(b,h.settings.title??"",(76+d-24)/2,6,14,.5);let P=[...h.fields].reverse().find(g=>g.options.colorBar&&g.options.visible);P&&this.drawField(e,b,P,Math.min(r,s),void 0,!0),m(b,h.settings.xLabel??"",(76+d-24)/2,l-29,13,.5),m(b,h.settings.yLabel??"",2,(42+l-62)/2,13,.5,!0),x[2]>0&&k.forEach((g,R)=>{m(b,"\u2014",x[0]+8,x[1]+4+R*22,12,0,!1,M(g.style.color,c)),m(b,g.style.label,x[0]+36,x[1]+4+R*22,12)})}),n.title){e.setViewport(0,0,t,Math.round(o*s)),e.setScissorRect(0,0,t,Math.round(o*s));let h=this.uniform(n.axes[0],n.width,o,u,[0,0,0,0]);e.draw(this.axes,{u:{...h,grid:0},glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,s)}},{count:3}),m(h,n.title,n.width/2,8,16,.5)}}render(e,n){return this.destroyed?Promise.resolve():this.session.run(()=>this.renderFrame(e,n))}async renderFrame(e,n){if(this.destroyed||(await this.prepareScene(e),this.destroyed))return;let t=Math.max(1,Math.round(e.width*n)),i=Math.max(1,Math.round(e.height*n));this.canvas.width!==t&&(this.canvas.width=t),this.canvas.height!==i&&(this.canvas.height=i);let r=this.runtime.frame();this.prune(e),r.pass({color:[{target:this.target,clear:[0,0,0,0]}]},s=>this.scene(s,e,t,i)),await this.session.present(r)}pixels(e,n){return this.session.run(()=>this.readPixels(e,n))}async readPixels(e,n){if(this.destroyed)throw new Error("This renderer has been destroyed.");if(await this.prepareScene(e),this.destroyed)throw new Error("This renderer has been destroyed.");let t=Math.ceil(e.width*n),i=Math.ceil(e.height*n),r=this.runtime.texture({size:[t,i],format:this.format});try{let s=this.runtime.frame();this.prune(e),s.pass({color:[{target:r,clear:[0,0,0,0]}]},d=>this.scene(d,e,t,i)),await s.submit();let o=await r.read();if(this.format.startsWith("bgra"))for(let d=0;d<o.length;d+=4){let l=o[d];o[d]=o[d+2],o[d+2]=l}for(let d=0;d<o.length;d+=4){let l=o[d+3];if(l>0&&l<255)for(let c=0;c<3;c++)o[d+c]=Math.min(255,Math.round(o[d+c]*255/l))}return{bytes:o,width:t,height:i}}finally{r.destroy()}}destroy(){this.destroyed||(this.destroyed=!0,this.backend==="webgpu"&&this.target?.unconfigure(),this.session.retire(()=>{this.glyphs?.destroy(),this.samples.clear(),this.fields.clear()}).catch(e=>console.error("[typeplot] Resource disposal failed",e)))}};async function at(a,e,n){let t=new Uint8Array((e*4+1)*n);for(let l=0;l<n;l++)t.set(a.subarray(l*e*4,(l+1)*e*4),l*(e*4+1)+1);let i=new Uint8Array(await new Response(new Blob([t]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer()),r=new TextEncoder;function s(l,c){let u=new Uint8Array(c.length+12),p=new DataView(u.buffer);p.setUint32(0,c.length),u.set(r.encode(l),4),u.set(c,8);let m=4294967295;for(let h=4;h<c.length+8;h++){m^=u[h];for(let f=0;f<8;f++)m=m>>>1^(m&1?3988292384:0)}return p.setUint32(c.length+8,(m^4294967295)>>>0),u}let o=new Uint8Array(13),d=new DataView(o.buffer);return d.setUint32(0,e),d.setUint32(4,n),o[8]=8,o[9]=6,new Blob([new Uint8Array([137,80,78,71,13,10,26,10]),s("IHDR",o),s("IDAT",i),s("IEND",new Uint8Array)],{type:"image/png"})}var J=class{constructor(e,n,t){this.canvas=e;this.query=n;this.report=t;this.win=e.ownerDocument.defaultView,e.addEventListener("pointermove",this.move),e.addEventListener("pointerleave",this.leave),e.addEventListener("pointerdown",this.down),e.addEventListener("pointercancel",this.cancel),e.addEventListener("click",this.click)}listeners={hover:new Set,click:new Set};win;frame=0;busy=!1;disposed=!1;generation=0;pending;pressed;dragged=!1;on(e,n){if(this.disposed)throw new Error("This picker has been destroyed.");if(!this.listeners[e]||typeof n!="function")throw new TypeError("Picking needs a hover/click event and a listener.");this.listeners[e].add(n)}off(e,n){this.listeners[e]?.delete(n)}position(e){let n=this.canvas.getBoundingClientRect();return[e.clientX-n.left,e.clientY-n.top]}emit(e,n,t,i){if(!this.disposed)for(let r of this.listeners[e])try{r({type:e,result:n,position:t,originalEvent:i})}catch(s){this.report(s)}}down=e=>{this.pressed=[e.clientX,e.clientY],this.dragged=!1,this.invalidate(),this.emit("hover",null,this.position(e),e)};cancel=()=>{this.pressed=void 0,this.dragged=!0,this.invalidate()};move=e=>{this.pressed&&e.buttons&&Math.hypot(e.clientX-this.pressed[0],e.clientY-this.pressed[1])>4&&(this.dragged=!0),!(e.buttons||e.pointerType==="touch"||!this.listeners.hover.size)&&(this.pending={event:e,position:this.position(e),generation:++this.generation},this.schedule())};schedule(){!this.disposed&&!this.busy&&this.pending&&!this.frame&&(this.frame=this.win.requestAnimationFrame(()=>{this.frame=0,this.flush()}))}async flush(){let e=this.pending;if(this.pending=void 0,!(!e||this.disposed||!this.listeners.hover.size)){this.busy=!0;try{let n=await this.query(e.position);e.generation===this.generation&&this.emit("hover",n,e.position,e.event)}catch(n){this.disposed||this.report(n)}finally{this.busy=!1,this.schedule()}}}leave=e=>{this.invalidate(),this.emit("hover",null,this.position(e),e)};click=e=>{if(e.button!==0||e.detail!==0&&this.dragged||!this.listeners.click.size)return;let n=this.position(e);this.query(n).then(t=>this.emit("click",t,n,e)).catch(t=>{this.disposed||this.report(t)})};invalidate(){this.generation++,this.pending=void 0}destroy(){this.disposed=!0,this.invalidate(),this.frame&&this.win.cancelAnimationFrame(this.frame),this.listeners.hover.clear(),this.listeners.click.clear(),this.canvas.removeEventListener("pointermove",this.move),this.canvas.removeEventListener("pointerleave",this.leave),this.canvas.removeEventListener("pointerdown",this.down),this.canvas.removeEventListener("pointercancel",this.cancel),this.canvas.removeEventListener("click",this.click)}};var B=3402823466e29;function me(a,e,n){let t=a.shape;if(!Array.isArray(t)||t.length!==2||t.some(f=>!Number.isSafeInteger(f)||f<1)||t[0]*t[1]>4194304)throw new RangeError("Field shape needs positive rows/columns with at most 4194304 values.");if(!e||e.length!==t[0]*t[1])throw new RangeError("Field data length must equal rows times columns.");let i=1/0,r=-1/0,s=Array.from(e,f=>{if(typeof f!="number"||Number.isFinite(f)&&Math.abs(f)>B)throw new RangeError("Field data must contain f32 numbers; NaN/Infinity are missing values.");return Number.isFinite(f)&&(i=Math.min(i,Math.fround(f)),r=Math.max(r,Math.fround(f))),f});if(i===1/0&&(i=0,r=1),i===r){let f=Math.max(Math.abs(i)*.05,.5);i=Math.max(-B,i-f),r=Math.min(B,r+f)}let o=a.extent??[-.5,t[1]-.5,-.5,t[0]-.5];if(!Array.isArray(o)||o.length!==4||!o.every(f=>Number.isFinite(f)&&Math.abs(f)<=3402823466e23)||!(o[1]>o[0]&&o[3]>o[2]))throw new RangeError("Field extent needs finite, increasing x/y ranges.");let d=a.valueRange??[i,r];if(!Array.isArray(d)||d.length!==2||!d.every(f=>Number.isFinite(f)&&Math.abs(f)<=B)||!(Math.fround(d[1])>Math.fround(d[0]))||d[1]-d[0]>B)throw new RangeError("valueRange needs two distinguishable, increasing f32 values.");let l=a.colorMap??"viridis";if(!H.includes(l))throw new TypeError("Unknown colorMap.");let c=a.interpolation??(n==="image"?"nearest":"linear"),u=a.origin??"upper";if(!["nearest","linear"].includes(c)||!["lower","upper"].includes(u))throw new TypeError("Unknown field interpolation or origin.");if(n==="contour"&&c!=="linear")throw new TypeError("Contour lines require linear interpolation.");let p=a.alpha??1,m=a.lineWidth??1;if(!Number.isFinite(p)||p<0||p>1||!Number.isFinite(m)||m<=0||m>32)throw new RangeError("Field alpha must be 0\u20131 and lineWidth must be 0\u201332 CSS pixels.");if(a.colorBar!==void 0&&typeof a.colorBar!="boolean"||a.visible!==void 0&&typeof a.visible!="boolean")throw new TypeError("colorBar and visible must be booleans.");let h=[];if(n!=="image"){let f=a.levels??10;if(typeof f=="number"){if(!Number.isSafeInteger(f)||f<2||f>64)throw new RangeError("levels must be 2\u201364 or an increasing array.");h=Array.from({length:f},(v,y)=>d[0]*(1-y/(f-1))+d[1]*y/(f-1))}else h=Array.from(f);if(h.length<2||h.length>64||h.some((v,y)=>!Number.isFinite(v)||Math.abs(v)>B||y>0&&Math.fround(v)<=Math.fround(h[y-1])))throw new RangeError("Contour levels must contain 2\u201364 distinguishable, increasing finite f32 values.")}return{values:s,options:{shape:[t[0],t[1]],extent:[o[0],o[1],o[2],o[3]],valueRange:[d[0],d[1]],colorMap:l,interpolation:c,origin:u,alpha:p,colorBar:a.colorBar??!1,levels:h,lineWidth:m,visible:a.visible??!0}}}function ot(a){return{...a,shape:[...a.shape],...a.extent?{extent:[...a.extent]}:{},...a.valueRange?{valueRange:[...a.valueRange]}:{},...a.levels!==void 0&&typeof a.levels!="number"?{levels:Array.from(a.levels)}:{}}}var U=class{constructor(e,n,t,i){this.axes=e;this.mode=i;let r=me(t,n,i);this.values=r.values,this.options=r.options,this.input=ot(t)}values;options;removed=!1;input;alive(){if(this.axes.assertAlive(),this.removed)throw new Error("This field has been removed.")}setData(e){this.alive();let n=me(this.input,e,this.mode);return this.values=n.values,this.options=n.options,this.axes.presentationChanged(),this}set(e){if(this.alive(),Object.hasOwn(e,"shape"))throw new TypeError("Recreate a field to change its shape.");let n=ot({...this.input,...e}),t=me(n,this.values,this.mode),i=this.input,r=this.options;this.input=n,this.options=t.options;try{e.extent?this.axes.refresh():this.axes.presentationChanged()}catch(s){throw this.input=i,this.options=r,s}return this}remove(){this.alive(),this.removed=!0,this.axes.removeField(this)}detach(){this.removed=!0}};function ee(a){if(!Array.isArray(a)||a.length!==2||a.some(e=>!Number.isFinite(e)||Math.abs(e)>3402823466e29))throw new RangeError("Annotation coordinates must be finite f32 pairs.");return[a[0],a[1]]}function st(a){let e={color:"#334155",fontSize:12,alpha:1,align:"left",rotation:0,offset:[0,0],arrow:!1,lineWidth:1,headSize:6,...a};if(typeof e.color!="string"||!e.color.trim()||!["left","center","right"].includes(e.align)||typeof e.arrow!="boolean")throw new TypeError("Invalid annotation appearance.");for(let[n,t,i]of[["fontSize",6,96],["alpha",0,1],["lineWidth",0,32],["headSize",0,64]])if(!Number.isFinite(e[n])||e[n]<t||e[n]>i)throw new RangeError(`Annotation ${n} must be between ${t} and ${i}.`);if(!Number.isFinite(e.rotation))throw new RangeError("Annotation rotation must be finite.");return e.offset=ee(e.offset),e}var N=class{constructor(e,n,t,i={},r=t){this.axes=e;this.position=ee(t),this.target=ee(r),this.value=lt(n),this.options=st(i)}position;target;value;options;removed=!1;alive(){if(this.axes.assertAlive(),this.removed)throw new Error("This annotation has been removed.")}setText(e){return this.alive(),this.value=lt(e),this.axes.redraw(),this}setPosition(e){return this.alive(),this.position=ee(e),this.axes.redraw(),this}set(e){return this.alive(),this.options=st({...this.options,...e}),this.axes.redraw(),this}remove(){this.alive(),this.removed=!0,this.axes.removeAnnotation(this)}detach(){this.removed=!0}};function lt(a){if(typeof a!="string"||a.length>4096)throw new TypeError("Annotation text must be a string of at most 4096 characters.");return a}var ct=["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],S={left:76,right:24,top:42,bottom:62};function D(a,e){if(!Number.isFinite(a)||a<=0)throw new RangeError(`${e} must be positive and finite.`);return a}function dt(a,e,n){if(a.length!==2||!a.every(Number.isFinite)||!(a[1]>a[0])||!Number.isFinite((a[1]-a[0])*1e6))throw new RangeError(`${n} needs two finite, increasing endpoints within the supported range.`);if(e==="log"&&a[0]<=0)throw new RangeError(`${n} must be positive on a log axis.`);return[a[0],a[1]]}function W(a,e){return e==="log"?a>0?Math.log10(a):NaN:a}function ut(a,e){return e==="log"?10**a:a}function E(a,e){if(!a||!Number.isSafeInteger(a.length)||a.length<0)throw new TypeError(`${e} must be an array or typed array of numbers.`);return Array.from(a,n=>{if(typeof n!="number")throw new TypeError(`${e} must contain numbers. Use NaN for missing values.`);if(Number.isFinite(n)&&Math.abs(n)>3402823466e29)throw new RangeError(`${e} exceeds the finite f32 range used by TypeShade.`);return n})}function _(a,e){let n=E(a,"data");if(e===void 0)return{x:n.map((i,r)=>r),y:n};let t=typeof e=="function"?n.map(e):E(e,"y");if(n.length!==t.length)throw new RangeError("x and y must have the same length.");if(t.some(i=>typeof i!="number"))throw new TypeError("The plot callback must return numbers.");return{x:n,y:t}}function mt(a){return a!==null&&typeof a=="object"&&"length"in a}function ft(a,e,n){let t={label:a.label??"",color:a.color??ct[e%ct.length],lineWidth:a.lineWidth??1.8,lineStyle:a.lineStyle??"-",parameter:a.parameter??"auto",dashPeriod:a.dashPeriod??0,dashOffset:a.dashOffset??0,marker:a.marker??(n==="scatter"?"o":"none"),markerSize:a.markerSize??3.5,alpha:a.alpha??1,visible:a.visible??!0,baseline:a.baseline??0,capSize:a.capSize??4,where:a.where??"pre",width:a.width??.8};if(!["auto","x","index"].includes(t.parameter))throw new TypeError("Unknown curve parameter.");if(a.dashPeriod!==void 0&&D(a.dashPeriod,"dashPeriod"),!Number.isFinite(t.dashOffset))throw new RangeError("dashOffset must be finite.");if(D(t.lineWidth,"lineWidth"),D(t.markerSize,"markerSize"),D(t.width,"width"),!Number.isFinite(t.alpha)||t.alpha<0||t.alpha>1)throw new RangeError("alpha must be between zero and one.");if(!["-","--",":","none"].includes(t.lineStyle))throw new TypeError("Unknown lineStyle.");if(!["o","s","none"].includes(t.marker))throw new TypeError("Unknown marker.");if(typeof t.visible!="boolean")throw new TypeError("visible must be a boolean.");if(!Number.isFinite(t.baseline)||Math.abs(t.baseline)>3402823466e29)throw new RangeError("baseline must be a finite f32.");if(!Number.isFinite(t.capSize)||t.capSize<0||t.capSize>64)throw new RangeError("capSize must be between zero and 64 CSS pixels.");if(!["pre","post","mid"].includes(t.where))throw new TypeError("where must be pre, post or mid.");if(typeof t.color!="string"||!t.color.trim())throw new TypeError("color must be a CSS color.");return t}var pe=class{constructor(e,n,t,i,r){this.axes=e;this.kind=n;this.data=t,this.style=ft(i,r,n)}data;style;edges;removed=!1;setData(e,n){if(this.axes.assertAlive(),this.removed)throw new Error("This series has been removed.");if(this.edges)throw new Error("Remove and recreate a histogram to change its bins.");if(this.kind==="fill"||this.kind==="error")throw new Error("Use setBandData or recreate error bars to update their full bounds.");let t=_(e,n),i=this.data;this.data=t;try{this.axes.refresh()}catch(r){throw this.data=i,r}return this}setBandData(e,n,t=0){if(this.axes.assertAlive(),this.removed||this.kind!=="fill")throw new Error("setBandData requires a live fillBetween series.");let i=_(e,n),r=typeof t=="number"?i.x.map(()=>t):E(t,"second");if(r.length!==i.x.length)throw new RangeError("Band arrays must have the same length.");let s=this.data;this.data={...i,lower:r};try{this.axes.refresh()}catch(o){throw this.data=s,o}return this}setStyle(e){if(this.axes.assertAlive(),this.removed)throw new Error("This series has been removed.");let n=ft({...this.style,dashPeriod:this.style.dashPeriod||void 0,...e},0,this.kind),t={...this.style};Object.assign(this.style,n);try{e.baseline!==void 0?this.axes.refresh():this.axes.presentationChanged()}catch(i){throw Object.assign(this.style,t),i}return this}setVisible(e){return this.setStyle({visible:e})}setAlpha(e){return this.setStyle({alpha:e})}remove(){this.axes.assertAlive(),!this.removed&&(this.removed=!0,this.axes.removeSeries(this))}detach(){this.removed=!0}},he=class{constructor(e,n){this.figure=e;this.index=n;let t=e.element.ownerDocument;this.canvas=t.createElement("canvas"),this.canvas.style.cssText="display:block;width:100%;height:100%;min-width:0;min-height:0;background:transparent",this.canvas.setAttribute("role","img"),this.canvas.setAttribute("aria-label",`Subplot ${n+1}`),this.canvas.title="Drag to pan; scroll to zoom; double-click or Home to reset; Escape stops inertia; arrow keys move; +/\u2212 zoom.",this.canvas.textContent="Chart. Provide a data table or description alongside this figure for access to the underlying values.",this.controller=Ye(this.canvas,{x:[0,1],y:[0,1]},()=>this.redraw(),e.options.interactive!==!1,()=>{let i=this.canvas.getBoundingClientRect();return{left:i.left+S.left,top:i.top+S.top,width:Math.max(1,i.width-S.left-S.right),height:Math.max(1,i.height-S.top-S.bottom)}},{inertia:e.options.inertia,doubleClickReset:e.options.doubleClickReset}),this.canvas.addEventListener("focus",this.redraw),this.canvas.addEventListener("blur",this.redraw),this.picker=new J(this.canvas,i=>this.pick(i),i=>e.reportError(i))}canvas;controller;artists=[];fields=[];annotations=[];settings={};gridFade=new V(0);fadeFrame=0;htmlLegend;legendSignature="";colorIndex=0;disposed=!1;picker;assertAlive(){if(this.disposed)throw new Error("This axes has been destroyed.")}plot(e,n,t={}){let i=typeof n=="function"||mt(n);return this.add("line",_(e,i?n:void 0),i?t:n??{})}scatter(e,n,t={}){return this.add("scatter",_(e,n),t)}bar(e,n,t={}){return this.add("bar",_(e,n),t)}barh(e,n,t={}){return this.add("barh",_(n,e),t)}step(e,n,t={}){return this.add("step",_(e,n),t)}stem(e,n,t={}){return this.add("stem",_(e,n),{marker:"o",...t})}fillBetween(e,n,t=0,i={}){let r=_(e,n),s=typeof t=="number"?r.x.map(()=>t):E(t,"second");if(s.length!==r.x.length)throw new RangeError("Band arrays must have the same length.");return this.add("fill",{...r,lower:s},{alpha:.3,...i})}errorbar(e,n,t={}){let i=_(e,n),r=(c,u)=>{let p=m=>{let h=typeof m=="number"||m===void 0?i.x.map(()=>m??0):E(m,u);if(h.length!==i.x.length||h.some(f=>!Number.isFinite(f)||f<0))throw new RangeError(`${u} must contain nonnegative finite errors matching the data.`);return h};return c&&typeof c=="object"&&"lower"in c?[p(c.lower),p(c.upper)]:[p(c),p(c)]},[s,o]=r(t.xError,"xError"),[d,l]=r(t.yError,"yError");return this.add("error",{...i,...t.xError!==void 0?{xLow:i.x.map((c,u)=>c-s[u]),xHigh:i.x.map((c,u)=>c+o[u])}:{},...t.yError!==void 0?{yLow:i.y.map((c,u)=>c-d[u]),yHigh:i.y.map((c,u)=>c+l[u])}:{}},{marker:"o",...t})}imshow(e,n){return this.addField(e,n,"image")}text(e,n,t,i={}){this.assertAlive();let r=new N(this,t,[e,n],i);return this.annotations.push(r),this.redraw(),r}annotate(e,n,t={}){this.assertAlive();let{xyText:i=n,...r}=t,s=new N(this,e,i,r,n);return this.annotations.push(s),this.redraw(),s}removeAnnotation(e){let n=this.annotations.indexOf(e);n>=0&&this.annotations.splice(n,1),this.redraw()}contour(e,n){return this.addField(e,n,"contour")}contourf(e,n){return this.addField(e,n,"contourf")}addField(e,n,t){this.assertAlive();let i=new U(this,e,n,t);this.fields.push(i);try{this.refresh()}catch(r){throw this.fields.pop(),r}return i}colorbar(e,n=!0){if(this.assertAlive(),!this.fields.includes(e))throw new Error("The colorbar field must belong to this axes.");for(let t of this.fields)t.set({colorBar:t===e&&n});return this}removeField(e){let n=this.fields.indexOf(e);n>=0&&this.fields.splice(n,1),this.refresh()}async pick(e,n=8){this.assertAlive();let t=await this.figure.pickAxes(this.index,e,n);this.assertAlive();let i=t?.artist;if(!t||!i)return null;if(i instanceof U){if(!this.fields.includes(i)||i.values!==t.data||t.index>=i.values.length)return null;let[r,s]=i.options.shape,[o,d,l,c]=i.options.extent,u=Math.floor(t.index/s),p=t.index%s;return{axes:this,series:i,index:t.index,x:o+(p+.5)/s*(d-o),y:l+(i.options.origin==="upper"?r-u-.5:u+.5)/r*(c-l),value:i.values[t.index]}}return!this.artists.includes(i)||i.data!==t.data||t.index>=i.data.x.length?null:{axes:this,series:i,index:t.index,x:i.data.x[t.index],y:i.data.y[t.index]}}on(e,n){return this.assertAlive(),this.picker.on(e,n),this}off(e,n){return this.picker.off(e,n),this}histogram(e,n={}){this.assertAlive();let t=E(e,"values").filter(Number.isFinite),i=n.bins??10,r;if(typeof i=="number"){if(!Number.isSafeInteger(i)||i<1||i>1e4)throw new RangeError("bins must be an integer from 1 to 10000, or increasing bin edges.");let l=1/0,c=-1/0;for(let u of t)l=Math.min(l,u),c=Math.max(c,u);if(t.length||(l=0,c=1),l===c){let u=Math.max(.5,Math.abs(l)*.05);l-=u,c+=u}dt([l,c],"linear","histogram range"),r=Array.from({length:i+1},(u,p)=>l+(c-l)*(p/i)),r[i]=c}else r=E(i,"bins");if(r.length<2||r.some((l,c)=>!Number.isFinite(l)||c>0&&l<=r[c-1]))throw new RangeError("Histogram edges must be finite and strictly increasing.");let s=new Array(r.length-1).fill(0),o=0;for(let l of t){if(l<r[0]||l>r[r.length-1])continue;let c=0,u=r.length-1;for(;u-c>1;){let p=c+u>>>1;l<r[p]?u=p:c=p}s[Math.min(c,s.length-1)]++,o++}if(n.density&&o)for(let l=0;l<s.length;l++)s[l]/=o*(r[l+1]-r[l]);let d=this.add("bar",{x:s.map((l,c)=>r[c]/2+r[c+1]/2),y:[...s]},n,r);return{counts:s,bins:[...r],series:d}}add(e,n,t,i){this.assertAlive();let r=new pe(this,e,n,t,this.colorIndex);r.edges=i,this.artists.push(r);try{this.refresh()}catch(s){throw this.artists.pop(),s}return this.colorIndex++,r}set(e){this.assertAlive();let n={...this.settings,...e};for(let i of["x","y"]){let r=n[`${i}Scale`]??"linear";if(r!=="linear"&&r!=="log")throw new TypeError("Axis scale must be linear or log.");let s=n[`${i}Limits`];s&&(n[`${i}Limits`]=dt(s,r,`${i}Limits`))}for(let[i,r,s]of[["labelSize",6,24],["tickDensity",.25,4],["labelHalo",0,2]]){let o=n[i];if(o!==void 0&&(!Number.isFinite(o)||o<r||o>s))throw new RangeError(`${i} must be between ${r} and ${s}.`)}if(n.labelBackground!==void 0&&typeof n.labelBackground!="boolean")throw new TypeError("labelBackground must be a boolean.");if(n.legend!==void 0&&n.legend!==!0&&n.legend!==!1&&n.legend!=="html")throw new TypeError("legend must be a boolean or html.");let t=this.settings;this.settings=n;try{if(e.legend!==void 0&&this.updateHtmlLegend(),e.grid!==void 0){let i=this.canvas.ownerDocument.defaultView;this.gridFade.set(e.grid?1:0,i.performance.now(),i.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1)}["xLimits","yLimits","xScale","yScale"].some(i=>Object.hasOwn(e,i))?this.refresh():(this.updateLabel(),this.redraw())}catch(i){throw this.settings=t,i}return this}setTitle(e){return this.set({title:e})}setXLabel(e){return this.set({xLabel:e})}setYLabel(e){return this.set({yLabel:e})}setXLimits(e,n){return this.set({xLimits:[e,n]})}setYLimits(e,n){return this.set({yLimits:[e,n]})}setXScale(e){return this.set({xScale:e})}setYScale(e){return this.set({yScale:e})}grid(e=!0){return this.set({grid:e})}legend(e=!0){return this.assertAlive(),this.settings.legend===e?this:this.set({legend:e})}autoscale(){return this.assertAlive(),this.settings={...this.settings,xLimits:void 0,yLimits:void 0},this.refresh(),this}clear(){return this.assertAlive(),this.artists.forEach(e=>e.detach()),this.fields.forEach(e=>e.detach()),this.fields.length=0,this.annotations.forEach(e=>e.detach()),this.annotations.length=0,this.htmlLegend?.remove(),this.htmlLegend=void 0,this.artists.length=0,this.colorIndex=0,this.settings={},this.refresh(),this}reset(){return this.assertAlive(),this.controller.reset(),this}bounds(){this.assertAlive();let e=this.controller.bounds();return{x:e.x.map(n=>ut(n,this.settings.xScale??"linear")),y:e.y.map(n=>ut(n,this.settings.yScale??"linear"))}}removeSeries(e){let n=this.artists.indexOf(e);n>=0&&this.artists.splice(n,1),this.refresh()}refresh(){let e={x:[1/0,-1/0],y:[1/0,-1/0]},n={x:this.settings.xScale??"linear",y:this.settings.yScale??"linear"},t=(i,r)=>{let s=W(r,n[i]);Number.isFinite(s)&&(e[i][0]=Math.min(e[i][0],s),e[i][1]=Math.max(e[i][1],s))};for(let i of this.fields){let[r,s,o,d]=i.options.extent;t("x",r),t("x",s),t("y",o),t("y",d)}for(let i of this.artists)for(let r=0;r<i.data.x.length;r++){let s=i.data.x[r],o=i.data.y[r];if(i.kind==="fill"){let d=i.data.lower[r];Number.isFinite(W(s,n.x))&&Number.isFinite(o)&&Number.isFinite(d)&&(t("x",s),t("y",o),t("y",d));continue}!Number.isFinite(W(s,n.x))||!Number.isFinite(W(o,n.y))||(t("x",s),t("y",o),i.data.lower&&t("y",i.data.lower[r]),i.data.xLow&&(t("x",i.data.xLow[r]),t("x",i.data.xHigh[r])),i.data.yLow&&(t("y",i.data.yLow[r]),t("y",i.data.yHigh[r])),i.kind==="bar"&&(t("x",i.edges?.[r]??s-i.style.width/2),t("x",i.edges?.[r+1]??s+i.style.width/2),(n.y==="linear"||i.style.baseline>0)&&t("y",i.style.baseline)),i.kind==="barh"&&(t("y",o-i.style.width/2),t("y",o+i.style.width/2),t("x",i.style.baseline)),i.kind==="stem"&&t("y",i.style.baseline))}for(let i of["x","y"]){let r=this.settings[`${i}Limits`];if(r){e[i]=r.map(l=>W(l,n[i]));continue}let[s,o]=e[i];if(!Number.isFinite(s)){e[i]=[0,1];continue}let d=s===o?Math.max(Math.abs(s)*.05,n[i]==="log"?.5:.05):(o-s)*.05;s-=d,o+=d,e[i]=[s,o]}for(let i of[e.x,e.y])if((i[1]-i[0])*1e6>3402823466e29)throw new RangeError("Plot range exceeds the f32 interaction range.");this.controller.setBounds(e),this.updateLabel()}updateLabel(){let e=[this.settings.title,this.settings.xLabel&&`x: ${this.settings.xLabel}`,this.settings.yLabel&&`y: ${this.settings.yLabel}`,...this.artists.map(n=>n.style.label),...this.fields.map(n=>`${n.mode}, ${n.options.shape[0]} rows by ${n.options.shape[1]} columns`)].filter(Boolean);this.canvas.setAttribute("aria-label",e.join(". ")||`Subplot ${this.index+1}, ${this.artists.length} series`)}redraw=()=>{this.picker?.invalidate(),this.disposed||this.figure.redraw()};presentationChanged(){this.updateLabel(),this.updateHtmlLegend(),this.redraw()}updateHtmlLegend(){if(this.settings.legend!=="html"){this.htmlLegend?.remove(),this.htmlLegend=void 0,this.legendSignature="";return}let e=this.artists.filter(t=>t.style.label&&!t.style.label.startsWith("_")),n=JSON.stringify(e.map(t=>[t.style.label,t.style.color,t.style.lineStyle,t.style.alpha]));if(!this.htmlLegend){let t=this.canvas.ownerDocument.createElement("ul");this.htmlLegend=t,t.className="typeplot-html-legend",t.setAttribute("aria-label","Legend"),t.style.cssText="position:absolute;z-index:2;list-style:none;margin:0;padding:6px 9px;border:1px solid #dce2e9;border-radius:6px;background:#ffffffef;color:#334155;font:12px system-ui,sans-serif;transform:translateX(-100%);max-width:45%;pointer-events:auto",this.canvas.parentElement?.appendChild(t)}if(n!==this.legendSignature){this.htmlLegend.replaceChildren();for(let t of e){let i=this.canvas.ownerDocument.createElement("li");i.style.cssText="display:flex;align-items:center;gap:8px;padding:3px 0";let r=this.canvas.ownerDocument.createElement("span");r.setAttribute("aria-hidden","true"),r.style.cssText=`display:inline-block;flex:0 0 18px;border-top:2px ${t.style.lineStyle==="--"?"dashed":t.style.lineStyle===":"?"dotted":"solid"}`,r.style.borderColor=t.style.color,r.style.opacity=String(t.style.alpha);let s=this.canvas.ownerDocument.createElement("span");s.textContent=t.style.label,i.append(r,s),this.htmlLegend.appendChild(i)}this.legendSignature=n}this.htmlLegend.hidden=!e.length,this.htmlLegend.style.left=`${this.canvas.offsetLeft+this.canvas.clientWidth-S.right-8}px`,this.htmlLegend.style.top=`${this.canvas.offsetTop+S.top+8}px`}snapshot(e=!1){e||this.updateHtmlLegend();let n=this.canvas.ownerDocument.defaultView.performance.now();return!e&&this.gridFade.active(n)&&!this.fadeFrame&&(this.fadeFrame=this.canvas.ownerDocument.defaultView.requestAnimationFrame(()=>{this.fadeFrame=0,this.redraw()})),{gridOpacity:e?this.settings.grid?1:0:this.gridFade.value(n),bounds:this.controller.bounds(),settings:{...this.settings,...this.settings.xLimits?{xLimits:[...this.settings.xLimits]}:{},...this.settings.yLimits?{yLimits:[...this.settings.yLimits]}:{},...this.settings.legend==="html"?{legend:e}:{}},series:this.artists.map(t=>({key:t,kind:t.kind,data:t.data,style:{...t.style},edges:t.edges})),fields:this.fields.map(t=>({key:t,values:t.values,mode:t.mode,options:{...t.options,shape:[...t.options.shape],extent:[...t.options.extent],valueRange:[...t.options.valueRange],levels:[...t.options.levels]}})),annotations:this.annotations.map(t=>({value:t.value,position:[...t.position],target:[...t.target],options:{...t.options,offset:[...t.options.offset]}})),focused:this.canvas.matches(":focus-visible")}}destroy(){this.disposed||(this.disposed=!0,this.fadeFrame&&this.canvas.ownerDocument.defaultView.cancelAnimationFrame(this.fadeFrame),this.controller.destroy(),this.picker.destroy(),this.canvas.removeEventListener("focus",this.redraw),this.canvas.removeEventListener("blur",this.redraw),this.artists.length=0,this.fields.forEach(e=>e.detach()),this.fields.length=0,this.annotations.forEach(e=>e.detach()),this.annotations.length=0,this.canvas.remove())}},te=class{element;axes;options;pixelRatio;observer;win;disposed=!1;rows;cols;surface;stage;renderer;frames;ready;get backend(){return this.renderer?.backend}report=e=>{if(this.disposed)return;let n=e instanceof Error?e:new Error(String(e));if(this.element.setAttribute("data-error",n.message),this.options.onError)try{this.options.onError(n)}catch(t){console.error("[typeplot] onError failed",t)}else this.element.dispatchEvent(new CustomEvent("typeploterror",{detail:n,bubbles:!0}))};reportError(e){this.report(e)}async pickAxes(e,n,t){if(this.disposed)throw new Error("This figure has been destroyed.");if(await this.ready,this.disposed)throw new Error("This figure has been destroyed.");let i=this.stage.getBoundingClientRect(),r=this.snapshot(i.width,i.height),s=[...r.axes[e].fields,...r.axes[e].series],o=s.map(c=>c.key),d=s.map(c=>"values"in c?c.values:c.data),l=await this.renderer.pick(r,e,n,t);return l&&o[l.series]?{artist:o[l.series],data:d[l.series],index:l.index}:null}constructor(e,n,t={}){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(n)||e<1||n<1||e*n>100)throw new RangeError("Subplots need positive integer rows/columns, with at most 100 axes.");if(typeof document>"u")throw new Error("TypePlot figures need a browser document. Create them after mounting the view.");let i=typeof t.target=="string"?document.querySelector(t.target):t.target??document.body;if(!i||typeof i.appendChild!="function")throw new TypeError("Figure target must resolve to a container element.");let r=i.ownerDocument,s=r.defaultView;if(!s)throw new Error("Figure target needs a browser window.");let o=D(t.width??640*n,"width"),d=D(t.height??400*e,"height"),l=D(t.pixelRatio??Math.min(s.devicePixelRatio||1,4,16384/Math.max(o,d+(t.title?42:0)),Math.sqrt(16777216/(o*(d+(t.title?42:0))))),"pixelRatio");if(l>4||Math.ceil(o*l)*Math.ceil(d*l)>16777216||Math.max(o,d)*l>16384)throw new RangeError("Figure exceeds the 16 megapixel or 16384 pixel dimension limit, or pixelRatio exceeds four.");this.options={...t,width:o,height:d},this.pixelRatio=l,this.win=s,this.frames=new ye(s,async()=>{if(this.disposed||!this.renderer)return;let m=this.stage.getBoundingClientRect();m.width>0&&m.height>0&&await this.renderer.render(this.snapshot(m.width,m.height),this.pixelRatio)},this.report),this.rows=e,this.cols=n,this.element=r.createElement("div"),this.element.style.cssText=`overflow:auto;width:min(100%, ${o}px);font:13px system-ui,sans-serif;color:#0f172a;background:${t.background??"#ffffff"}`,this.element.setAttribute("role","group"),this.element.setAttribute("aria-label",t.title||"TypePlot figure");let c=t.title?42:0;this.stage=r.createElement("div"),this.stage.style.cssText=`position:relative;width:100%;min-width:${Math.min(o,280*n)}px;aspect-ratio:${o}/${d+c}`,this.surface=r.createElement("canvas"),this.surface.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none",this.surface.setAttribute("aria-hidden","true"),this.stage.appendChild(this.surface);let u=r.createElement("div");u.style.cssText=`position:absolute;inset:${c/(d+c)*100}% 0 0;display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));grid-template-rows:repeat(${e},minmax(0,1fr))`,this.stage.appendChild(u),this.element.appendChild(this.stage);let p=[];this.axes=p,this.ready=Promise.resolve().then(async()=>{let m=await Q.create(this.surface,t.backend);if(this.disposed)throw m.destroy(),new Error("This figure has been destroyed.");this.renderer=m,await this.paint()}),this.ready.catch(this.report);try{for(let m=0;m<e*n;m++){let h=new he(this,m);p.push(h),u.appendChild(h.canvas)}if(t.toolbar!==!1){let m=r.createElement("div");m.setAttribute("role","group"),m.setAttribute("aria-label","Figure controls"),m.style.cssText="display:flex;gap:8px;align-items:center;padding:8px 12px;flex-wrap:wrap";let h=r.createElement("span");h.setAttribute("role","status");let f=r.createElement("button");f.type="button",f.textContent="Reset view",f.onclick=()=>this.axes.forEach(y=>y.reset());let v=r.createElement("button");v.type="button",v.textContent="Save PNG",v.onclick=()=>{this.saveImage().catch(y=>{h.textContent=y instanceof Error?y.message:String(y)})},m.append(f,v,h),this.element.appendChild(m)}i.appendChild(this.element),typeof s.ResizeObserver=="function"&&(this.observer=new s.ResizeObserver(this.redraw),this.observer.observe(u)),s.addEventListener("resize",this.redraw)}catch(m){throw this.destroy(),m}}redraw=()=>{this.disposed||this.frames.request()};snapshot(e,n,t=!1){return{width:e,height:n,rows:this.rows,cols:this.cols,titleHeight:this.options.title?n*42/(this.options.height+42):0,title:this.options.title,background:this.options.background,axes:this.axes.map(i=>i.snapshot(t))}}paint(){return this.disposed||!this.renderer?Promise.resolve():this.frames.flush()}async toBlob(e={}){if(this.disposed)throw new Error("This figure has been destroyed.");await this.ready;let n=D(e.pixelRatio??this.pixelRatio,"pixelRatio"),t=this.options.width,i=this.options.height+(this.options.title?42:0);if(Math.ceil(t*n)*Math.ceil(i*n)>16777216||Math.max(t,i)*n>16384)throw new RangeError("PNG export exceeds the 16 megapixel or 16384 pixel dimension limit.");if(this.disposed)throw new Error("This figure has been destroyed.");let r=await this.renderer.pixels(this.snapshot(t,i,!0),n);return at(r.bytes,r.width,r.height)}async saveImage(e="typeplot.png",n={}){if(!e.toLowerCase().endsWith(".png"))throw new TypeError("saveImage currently supports .png files.");let t=await this.toBlob(n);if(this.disposed)throw new Error("This figure has been destroyed.");let i=URL.createObjectURL(t),r=this.element.ownerDocument.createElement("a");r.href=i,r.download=e,r.hidden=!0,this.element.appendChild(r);try{r.click()}finally{r.remove(),this.win.setTimeout(()=>URL.revokeObjectURL(i),1e3)}}destroy(){this.disposed||(this.disposed=!0,this.observer?.disconnect(),this.frames.stop(),this.renderer?.destroy(),this.win.removeEventListener("resize",this.redraw),this.axes.forEach(e=>e.destroy()),this.element.remove())}};function Et(a={}){return new te(1,1,a)}function Ln(a=1,e=1,n={}){let t=new te(a,e,n);return{fig:t,axes:t.axes}}function An(a,e,n=50){if(!Number.isFinite(a)||!Number.isFinite(e))throw new RangeError("linspace endpoints must be finite.");if(!Number.isSafeInteger(n)||n<0||n>1e7)throw new RangeError("linspace count must be an integer from zero to ten million.");return Float64Array.from({length:n},(t,i)=>n===1?a:i===n-1?e:a*(1-i/(n-1))+e*(i/(n-1)))}function On(a,e,n={}){let t=typeof e=="function"||mt(e),i=t?n:e??{},r=Et({...i,title:void 0});try{let s=r.axes[0];return s.set(i),t?s.plot(a,e,i):s.plot(a,i),r}catch(s){throw r.destroy(),s}}export{Y as a,Z as b,J as c,at as d,V as e,U as f,N as g,pe as h,he as i,te as j,Et as k,Ln as l,An as m,On as n};
