import{a as rt,b as ne,c as Te,f as At,g as Ft,i as De,l as zt,m as Lt,t as Pe}from"./chunk-L32ENMLK.js";import{a as Bt,b as le,g as j}from"./chunk-JKDKZGGD.js";import{a as Ot,b as Ee}from"./chunk-UQPTWQHA.js";import{a as Ct}from"./chunk-DDPNJOPS.js";import{b as et}from"./chunk-3T5N3NYN.js";import{a as dt,f as xt,h as N,i as _t,j as wt,n as kt,p as St,q as Rt,r as Tt,s as Dt,t as Pt,u as Et,v as Re}from"./chunk-HDF6HTS7.js";import{$ as ae,F as _e,G as ct,L as K,N as ft,Q as ut,R as we,U as Y,V as mt,W as pt,X as ke,Y as ht,Z as Se,a as tt,aa as vt,b as nt,c as it,d as H,e as O,f as ie,h as at,ia as oe,j as ot,ja as se,k as st,ka as yt,l as re,la as gt,ma as R,pa as bt,q as k,v as lt}from"./chunk-RXKZOUUI.js";var ce=class{from;target;started=-1/0;constructor(e){this.from=e,this.target=e}value(e){let t=Math.max(0,Math.min(1,(e-this.started)/160));return this.from+(this.target-this.from)*t*t*(3-2*t)}set(e,t,n){e!==this.target&&(this.from=n?e:this.value(t),this.target=e,this.started=t)}active(e){return this.from!==this.target&&e-this.started<160}};var P={MAP_READ:1,COPY_SRC:4,COPY_DST:8,INDEX:16,VERTEX:32,UNIFORM:64,STORAGE:128,INDIRECT:256},X={COPY_SRC:1,COPY_DST:2,TEXTURE_BINDING:4,STORAGE_BINDING:8,RENDER_ATTACHMENT:16},Ut=1,Ae={"map-read":P.MAP_READ,"copy-src":P.COPY_SRC,"copy-dst":P.COPY_DST,index:P.INDEX,vertex:P.VERTEX,uniform:P.UNIFORM,storage:P.STORAGE,indirect:P.INDIRECT},kn={"copy-src":X.COPY_SRC,"copy-dst":X.COPY_DST,sampled:X.TEXTURE_BINDING,storage:X.STORAGE_BINDING,render:X.RENDER_ATTACHMENT},Mt=(a,e)=>e.reduce((t,n)=>t|a[n],0);function Nt(){return globalThis.navigator?.gpu}var w=a=>a,b=a=>a,C=class{constructor(e){this.native=e}beginRenderPass(e){let t=e.depthStencilAttachment;return w(this.native.beginRenderPass({colorAttachments:e.colorAttachments.map(n=>({view:b(n.view),loadOp:n.loadOp,storeOp:n.storeOp,clearValue:n.clearValue})),...t!==void 0?{depthStencilAttachment:{...t,view:b(t.view)}}:{}}))}beginComputePass(){return w(this.native.beginComputePass())}copyBufferToBuffer(e,t,n,i,r){this.native.copyBufferToBuffer(b(e),t,b(n),i,r)}};function Sn(a){let e=a.bias,t=a.stencil;return{format:a.format,depthCompare:a.compare,depthWriteEnabled:a.write,...e.constant!==0?{depthBias:e.constant}:{},...e.slopeScale!==0?{depthBiasSlopeScale:e.slopeScale}:{},...e.clamp!==0?{depthBiasClamp:e.clamp}:{},...t!==void 0?{stencilFront:{...t.front},stencilBack:{...t.back},stencilReadMask:t.readMask,stencilWriteMask:t.writeMask}:{}}}var Rn=a=>a.count===1&&a.mask===4294967295?{}:{multisample:{...a.count!==1?{count:a.count}:{},...a.mask!==4294967295?{mask:a.mask}:{}}},Fe=(a,e)=>typeof a[e]=="function",Tn={buffer:a=>"mapAsync"in a&&"getMappedRange"in a,texture:a=>"createView"in a,view:()=>!0,sampler:()=>!0,canvas:a=>"getCurrentTexture"in a,encoder:a=>a instanceof C||Fe(a,"finish"),"compute-pass":a=>"dispatchWorkgroups"in a,"render-pass":a=>Fe(a,"setPipeline")&&Fe(a,"draw")},ze=class{constructor(e){this.native=e;let t=e;this.caps={compute:"native",shaderLanguage:"wgsl",immediate:!1,get limits(){return H(t.limits)},hasFeature:n=>t.features.has(n)}}backend="webgpu";caps;createBuffer(e){return w(this.native.createBuffer({size:e.size,usage:Mt(Ae,e.usage)}))}writeBuffer(e,t,n){this.native.queue.writeBuffer(b(e),t,n)}async readBuffer(e){let t=b(e);await t.mapAsync(Ut);let n=t.getMappedRange().slice(0);return t.unmap(),n}destroyBuffer(e){b(e).destroy()}createTexture(e){return w(this.native.createTexture({size:e.size,format:e.format,...e.dimension!==void 0?{dimension:e.dimension}:{},...e.sampleCount!==void 0?{sampleCount:e.sampleCount}:{},usage:Mt(kn,e.usage)}))}writeTexture(e,t,n,i,r){this.native.queue.writeTexture({texture:b(e)},t,{bytesPerRow:n},[i,r,1])}async readTexture(e,t){let{width:n,height:i,format:r}=e,o=n*t,s=Math.ceil(o/256)*256,d=this.native.createBuffer({size:s*i,usage:Ae["map-read"]|Ae["copy-dst"]}),l=this.native.createCommandEncoder();l.copyTextureToBuffer({texture:b(e),...r==="depth32float"?{aspect:"depth-only"}:{}},{buffer:d,bytesPerRow:s},[n,i,1]),this.native.queue.submit([l.finish()]),await d.mapAsync(Ut);let c=new Uint8Array(d.getMappedRange()),f=new Uint8Array(o*i);for(let m=0;m<i;m++)f.set(c.subarray(m*s,m*s+o),m*o);return d.unmap(),d.destroy(),f}destroyTexture(e){b(e).destroy()}createView(e){return w(b(e).createView())}currentTexture(e){return w(b(e).getCurrentTexture())}createSampler(e){return w(this.native.createSampler({...e}))}createShaderModule(e){if(typeof e!="string")throw new TypeError("The WebGPU backend runs WGSL text; it got a module's CPU program.");return w(this.native.createShaderModule({code:e}))}createBindGroupLayout(e){return w(this.native.createBindGroupLayout({entries:e.map(({name:t,label:n,samplerBinding:i,...r})=>r)}))}createBindGroup(e,t){return w(this.native.createBindGroup({layout:b(e),entries:t.map(({binding:n,resource:i})=>({binding:n,resource:"buffer"in i?{buffer:b(i.buffer),...i.size!==void 0?{size:i.size}:{}}:"view"in i?b(i.view):"sampler"in i?b(i.sampler):i.native}))}))}#e(e){return this.native.createPipelineLayout({bindGroupLayouts:e.map(t=>b(t))})}async createComputePipeline(e){let t={layout:this.#e(e.layouts),compute:{module:b(e.module),entryPoint:e.entryPoint,...e.constants!==void 0?{constants:e.constants}:{}}},n=this.native;return w(typeof n.createComputePipelineAsync=="function"?await n.createComputePipelineAsync(t):n.createComputePipeline(t))}async createRenderPipeline(e){let t=b(e.module),n=e.constants===void 0?{}:{constants:e.constants},{vertex:i,fragment:r,primitive:o,depthStencil:s}=e;return w(await this.native.createRenderPipelineAsync({layout:this.#e(e.layouts),vertex:{module:t,entryPoint:i.entryPoint,buffers:i.buffers,...n},...r!==void 0?{fragment:{module:r.module===void 0?t:b(r.module),entryPoint:r.entryPoint,targets:r.targets,...n}}:{},primitive:{topology:o.topology,cullMode:o.cullMode,frontFace:o.frontFace},...s!==void 0?{depthStencil:Sn(s)}:{},...Rn(e.multisample)}))}createCommandEncoder(){return new C(this.native.createCommandEncoder())}submit(e){this.native.queue.submit(e.map(n=>n.native.finish()));let t=this.native.queue;return typeof t.onSubmittedWorkDone=="function"?t.onSubmittedWorkDone.call(this.native.queue):Promise.resolve()}pushValidationScope(){this.native.pushErrorScope("validation")}async popValidationScope(){let e=await this.native.popErrorScope();return e===null?null:e.message}fromNative(e,t){if(Tn[e](t))return e==="encoder"&&!(t instanceof C)?new C(t):w(t)}toNative(e){return e instanceof C?e.native:e}destroy(){this.native.destroy?.()}};function Z(a){return new ze(a)}var Dn=1<<20,Pn="load(): the CPU tier runs a module's CPU program, which this manifest does not carry; a manifest read from JSON or made by packModule() has none. Load the default export of the module's host import (change 0120, O2 (a)).",de=class{constructor(e,t,n,i={}){this.rhi=e;this.pool=new Et(e),this.info=re(e.backend==="cpu"?"cpu":"webgpu",e.native),this.limits=e.caps.limits,this.#e=typeof t.console=="function"?t.console:void 0,this.#t=t.consoleBytes??Dn,this.#o=n,this.#r=t.emit,this.#s=i}info;limits;pool;#e;#t;#n=[];#i=new Map;#a;#o;#r;#s;limitRemedy(e,t){return this.#o?this.#s[e]===t?"This adapter supports no more.":"Pass the program in createRuntime({ programs }), or raise the limit with createRuntime({ limits }).":"Request the limit in requestDevice({ requiredLimits }) for the device the runtime was given."}get tier(){return this.rhi.backend==="cpu"?"cpu":"webgpu"}get device(){return this.rhi.native??this.rhi}load(e,t={}){if(wt(e),this.rhi.backend==="cpu"){if(dt(e)===void 0)throw new TypeError(Pn);return new Re(this,e,!1)}for(let i of e.features)if(!this.rhi.caps.hasFeature(i))throw new TypeError(`The program needs the "${i}" feature, which this device lacks; request it, or pass the program in createRuntime({ programs }).`);let n=t.console??e.console!==void 0;if(n&&e.console===void 0){if(this.#r===void 0||e.ir===void 0)throw new TypeError(this.#r===void 0?"load({ console: true }): this manifest carries no recorded variant; build it with packModule(m, { console: true }) or in vite dev, or pass the load-time emitter, createRuntime({ emit: repack }), with a manifest that carries its IR.":"load({ console: true }): this manifest carries no recorded variant and no IR to emit one from; build it with packModule(m, { ir: true }) or typeshade({ ir: true }).");e=this.#r(e,{console:!0})}return new Re(this,e,n)}texture(e){return new N(this.rhi,e)}sampler(e){return new _t(this.rhi,e)}frame(){return new Le(this)}bindGroup(e,t,n){let i=this.#i.get(e);i===void 0&&this.#i.set(e,i=new Map);let r=i.get(t);return r===void 0&&(i.size>4096&&i.clear(),i.set(t,r=this.rhi.createBindGroup(e,n))),r}guardView(){if(this.#a===void 0){let e=this.rhi.createTexture({size:[1,1,1],format:"rgba8unorm",usage:["sampled","copy-dst"]});this.rhi.writeTexture(e,new Uint8Array([255,255,255,255]),4,1,1),this.#a=this.rhi.createView(e)}return this.#a}consoleBuffer(e,t){let n=this.#t,i=this.pool.take(n,["storage","copy-src","copy-dst"]);return this.rhi.writeBuffer(i,0,new Uint32Array(2)),this.#n.push({buffer:i,log:e,entry:t,size:n}),i}takeConsole(e){let t=this.#n;if(this.#n=[],t.length===0)return;let n=t.map(i=>{let r=this.pool.take(i.size,["map-read","copy-dst"]);return e.copyBufferToBuffer(i.buffer,0,r,0,i.size),{...i,staging:r}});return async()=>{let i=[];for(let r of n){let o=new Uint32Array(await this.rhi.readBuffer(r.staging)),{events:s,dropped:d}=tt(o,r.log);if(this.#e!==void 0)for(let l of s)this.#e(l);else{for(let l of s)nt(l,"GPU");it(r.entry,d)}i.push({entry:r.entry,lines:s.length,dropped:d})}return i}}async submit(...e){if(e.length===0)throw new TypeError("submit() takes the GPUCommandEncoders to submit.");let t=e.map(o=>{let s=typeof o=="object"&&o!==null?this.rhi.fromNative("encoder",o):void 0;if(s===void 0)throw new TypeError("submit() takes the GPUCommandEncoders to submit.");return s}),n=this.takeConsole(t[t.length-1]),i=this.rhi.submit(t);this.pool.release(i);let r=n===void 0?[]:await n();return await i,{console:r}}destroy(){this.pool.destroy(),this.#i.clear(),this.#o&&this.rhi.destroy()}},Le=class{constructor(e){this.rt=e;e.rhi.pushValidationScope(),this.#e=e.rhi.createCommandEncoder()}#e;#t=!1;get encoder(){return this.rt.rhi.toNative(this.#e)}dispatch(e,t,n){e.dispatch(this.#e,t,n)}pass(e,t){let n=this.rt.rhi,i=St(e,En(n)),r,o=i.color.map(m=>{let p=jt(n,m.target);return r??=p.size,{view:p.view,loadOp:m.load,storeOp:m.store,clearValue:m.clear}}),s=i.depth,d=s===void 0?void 0:jt(n,s.target);r??=d?.size;let l=this.#e.beginRenderPass({colorAttachments:o,...s!==void 0&&d!==void 0?{depthStencilAttachment:Rt(d.view,s)}:{}}),c=this.rt.limits.maxTextureDimension2D??8192,f=new Be(l,n.toNative(l),c,r,{depthFormat:s?.format,depthReadOnly:s?.depth.readOnly??!1,stencilReadOnly:s?.stencil?.readOnly??!1});try{t(f)}finally{l.end()}}async submit(){if(this.#t)throw new TypeError("This frame was submitted already; make a new one with rt.frame().");this.#t=!0;let e=this.rt.takeConsole(this.#e),t=this.rt.rhi.submit([this.#e]),n=this.rt.rhi.popValidationScope();this.rt.pool.release(t);let i=await n;if(i!==null)throw this.rt.rhi.backend==="cpu"&&await t,new Error(`The frame did not validate: ${i}`);let r=e===void 0?[]:await e();return await t,{console:r}}};function jt(a,e){if(e instanceof N)return{view:e.view(),size:{width:e.width,height:e.height}};let t=a.fromNative("canvas",e);if(t!==void 0){let i=a.currentTexture(t);return{view:a.createView(i),size:{width:i.width,height:i.height}}}let n=a.fromNative("texture",e);return n!==void 0?{view:a.createView(n)}:{view:a.fromNative("view",e)}}var En=a=>({isTexture:e=>e instanceof N,isCanvas:e=>a.fromNative("canvas",e)!==void 0,formatOf:e=>e.format}),Be=class{constructor(e,t,n,i,r){this.rhiPass=e;this.raw=t;this.limit=n;this.size=i;this.passState={...r,blend:[0,0,0,0],blendDeclared:!1,stencilReference:0}}passState;draw(e,t,n){e.draw(this,t,n)}setViewport(e,t,n,i,r,o){let s=Tt(e,t,n,i,r,o,this.limit);this.rhiPass.setViewport(...s.rect,s.minDepth,s.maxDepth)}setScissorRect(e,t,n,i){this.rhiPass.setScissorRect(...Dt(e,t,n,i,this.size))}setBlendConstant(e){let t=Pt(e);this.rhiPass.setBlendConstant(t),this.passState.blend=t,this.passState.blendDeclared=!1}setStencilReference(e){let t=kt(e);this.rhiPass.setStencilReference(t),this.passState.stencilReference=t}};function An(a){let e=a;return typeof e.getParameter=="function"&&typeof e.createTransformFeedback=="function"}async function $t(a,e){let{GlRuntimeImpl:t}=await import("./chunk-SY7F6XHA.js");return new t(a,e)}async function fe(a={}){let e=a.limits;if(e!==void 0&&ie(e),a.device!==void 0){if(An(a.device)){if(e!==void 0)throw new TypeError("createRuntime({ limits }): the device is a WebGL2 context, which has no WebGPU limits. Omit limits, or pass a GPUDevice.");return await $t(a.device,!1)}let i=Z(a.device);return e!==void 0&&Ln(e,i.caps.limits),new de(i,a,!1)}let t=a.prefer??["webgpu","webgl2"];if(!Array.isArray(t)||t.length===0)throw new TypeError("createRuntime(): prefer takes a non-empty list of tiers.");for(let i of t)if(i!=="webgpu"&&i!=="webgl2")throw new TypeError(`createRuntime(): "${String(i)}" is not a tier of the program runtime; its tiers are webgpu and webgl2.`);if(new Set(t).size!==t.length)throw new TypeError("createRuntime(): prefer names a tier twice.");let n=[];for(let i of t){if(i==="webgl2"){let p=rt();if(p!==null)return await $t(p,!0);n.push("webgl2: the environment makes no WebGL2 context");continue}let r=Nt();if(r===void 0){n.push("webgpu: navigator.gpu is undefined");continue}let o=await r.requestAdapter();if(o===null){n.push("webgpu: WebGPU gave no adapter");continue}let s=new Set((a.programs??[]).flatMap(p=>p.features)),d=[...s].find(p=>!o.features.has(p));if(d!==void 0){n.push(`webgpu: the adapter lacks the "${d}" feature a program needs`);continue}let l=H(o.limits),c=e===void 0?void 0:Fn(e,l,n);if(c==="refused")continue;let f=zn(a,l,c),m=await o.requestDevice({requiredFeatures:[...s],...Object.keys(f).length>0?{requiredLimits:f}:{}});return st(m,o),new de(Z(m),a,!0,l)}throw new Error(`createRuntime(): no tier it may use is here (${n.join("; ")}).`)}function Fn(a,e,t){if(Object.keys(e).length===0)return a;for(let n of Object.keys(a)){if(!Object.hasOwn(e,n))throw new TypeError(`createRuntime({ limits }): "${n}" is not a limit this adapter reports.`);let i=a[n],r=e[n];if(O(n)?i<r:i>r)return t.push(`webgpu: the adapter supports ${n} ${O(n)?"down to":"up to"} ${r}, and createRuntime({ limits }) asks for ${i}`),"refused"}return a}function zn(a,e,t){let n={};if(Object.keys(e).length===0)return n;for(let[i,r]of Object.entries(xt(a.programs??[],a.emit!==void 0)))Object.hasOwn(e,i)&&(n[i]=Math.min(r,e[i]));for(let[i,r]of Object.entries(t??{}))n[i]=O(i)?r:Math.max(n[i]??0,r);for(let i of["maxStorageBufferBindingSize","maxUniformBufferBindingSize"]){let r=t?.[i];r===void 0||!Object.hasOwn(e,"maxBufferSize")||(n.maxBufferSize=Math.max(n.maxBufferSize??0,Math.min(r,e.maxBufferSize)))}return n}function Ln(a,e){let t=H(e);if(Object.keys(t).length!==0)for(let n of Object.keys(a)){if(!Object.hasOwn(t,n))throw new TypeError(`createRuntime({ limits }): "${n}" is not a limit this device reports.`);let i=a[n],r=t[n];if(O(n)?i<r:i>r)throw new TypeError(`The device has ${n} ${r}; createRuntime({ limits }) asks for ${i}. Request the limit in requestDevice({ requiredLimits }) for this device, or omit device so the runtime requests it.`)}}var Q=[];function qt(a){let e={device:a,done:!1};return Q.push(e),e}function It(a){if(a.done)return;a.done=!0;let e=Q.lastIndexOf(a);e>=0&&Q.splice(e,1)}function ue(){return Q[Q.length-1]?.device}var Oe=(a,e)=>Math.ceil(a/e)*e;function Wt(a,e,t){if(t)try{let n=ArrayBuffer,i=new n(a,{maxByteLength:Math.max(a,e)});if(i.resizable===!0)return i}catch{}return new ArrayBuffer(a)}var Ce=class{#e;#t=0;#n=[];#i;constructor(e=65536,t=!0){this.#i=t,this.#e=Wt(Oe(Math.max(e,16),16),268435456,t)}get buffer(){return this.#e}get generation(){return this.#t}get used(){let e=0;for(let t of this.#n)e+=t.size;return e}get count(){return this.#n.length}allocate(e){let t=Oe(e,16),n={offset:0,size:t,freed:!1};if(t===0)return n;let i=this.#a(t);if(i===void 0&&(this.#e.byteLength-this.used>=t&&this.#r(),i=this.#a(t)),i===void 0){let r=this.#o();this.#s(r+t),i={index:this.#n.length,offset:r}}return n.offset=i.offset,this.#n.splice(i.index,0,n),new Uint8Array(this.#e,n.offset,t).fill(0),n}free(e){if(e.freed||(e.freed=!0,e.size===0))return;let t=this.#n.indexOf(e);t>=0&&this.#n.splice(t,1)}#a(e){let t=0;for(let n=0;n<this.#n.length;n++){let i=this.#n[n];if(i.offset-t>=e)return{index:n,offset:t};t=i.offset+i.size}if(this.#e.byteLength-t>=e)return{index:this.#n.length,offset:t}}#o(){let e=this.#n[this.#n.length-1];return e===void 0?0:e.offset+e.size}#r(){let e=new Uint8Array(this.#e),t=0;for(let n of this.#n)n.offset!==t&&(e.copyWithin(t,n.offset,n.offset+n.size),n.offset=t),t+=n.size;this.#t++}#s(e){let t=Oe(Math.max(e,this.#e.byteLength*2),65536),n=this.#e;if(n.resizable===!0&&n.resize!==void 0&&t<=(n.maxByteLength??0)){n.resize(t);return}let i=Wt(t,Math.max(268435456,t*2),this.#i);new Uint8Array(i).set(new Uint8Array(this.#e)),this.#e=i,this.#t++}},Bn;function Ue(){return Bn??=new Ce}var Me=16,J=class{region;slot;name;remedy;stride;#e;#t=0;bytes;ahead;states=new Map;owner=Ft();constructor(e,t,n,i,r=0){this.region=e,this.slot={region:e,range:e.allocate(t)},this.name=n,this.remedy=i,this.bytes=t,this.stride=r,this.#e=new Float64Array(r>0?2*(Me+1):2),this.markAll()}get range(){return this.slot.range}get dirty(){return this.#t>0}ranges(){let e=[];for(let t=0;t<this.#t;t++)e.push([this.#e[2*t],this.#e[2*t+1]]);return e}span(){return this.#t===0?void 0:{from:this.#e[0],to:this.#e[2*this.#t-1]}}markAll(){this.#e[0]=0,this.#e[1]=this.range.size,this.#t=1}clean(){this.#t=0}resize(e,t){let n=this.slot.range,i=this.region.allocate(e);t>0&&new Uint8Array(this.region.buffer).copyWithin(i.offset,n.offset,n.offset+t),this.region.free(n),this.slot.range=i,this.bytes=e,this.markAll()}current(e){if(this.ahead!==void 0)throw new TypeError(`${e}: a call wrote ${this.name}, and its values are on the device until \`await ${this.name}.read()\` brings them back; await it first.`)}error(){for(let e of this.states.values())if(e.error!==void 0)return e.error;return this.kept}kept;live(){if(this.range.freed)throw new TypeError(`${this.name} was disposed; its fields cannot be read or set. Make a new one with ${this.remedy}.`)}mark(e,t){let n=this.#e,i=this.stride;i>0&&(e=Math.floor(e/i)*i,t=Math.ceil(t/i)*i);let r=this.#t;if(r===0){n[0]=e,n[1]=t,this.#t=1;return}if(i===0){e<n[0]&&(n[0]=e),t>n[1]&&(n[1]=t);return}let o=0;for(;o<r&&n[2*o+1]<e;)o++;if(o===r||n[2*o]>t)n.copyWithin(2*o+2,2*o,2*r),n[2*o]=e,n[2*o+1]=t,r++;else{let s=o;for(;s+1<r&&n[2*(s+1)]<=t;)s++;e<n[2*o]&&(n[2*o]=e),n[2*o+1]=Math.max(n[2*s+1],t),s>o&&(n.copyWithin(2*o+2,2*s+2,2*r),r-=s-o)}r>Me&&(n[1]=n[2*r-1],r=1),this.#t=r}},$=new WeakMap,Ht=typeof FinalizationRegistry=="function"?new FinalizationRegistry(({region:a,range:e})=>a.free(e)):void 0;function Kt(a,e){$.set(a,e),Ht?.register(a,e.slot,e)}function Ne(a){a.range.freed||(a.region.free(a.range),Ht?.unregister(a))}function Gt(a,e,t){return t==="f64"?a.getFloat32(e,!0)+a.getFloat32(e+4,!0):t==="f32"?a.getFloat32(e,!0):t==="i32"?a.getInt32(e,!0):a.getUint32(e,!0)}function E(a,e,t,n,i=!1){switch(t.k){case"s":{let r=Gt(a,e,t.t);return i?t.b===1?r!==0:t.m!==void 0?t.m[r]:r:r}case"v":{let r=[];for(let o=0;o<t.n;o++){let s=t.t==="f64"?a.getFloat32(e+4*o,!0)+a.getFloat32(e+(t.lo??0)+4*o,!0):Gt(a,e+4*o,t.t);r.push(i&&t.b===1?s!==0:s)}return r}case"m":{let r=[];for(let o=0;o<t.c;o++)for(let s=0;s<t.r;s++)r.push(a.getFloat32(e+o*t.cs+4*s,!0));return r}case"a":{let r=[];for(let o=0;o<(t.n??0);o++)r.push(E(a,e+o*t.st,t.e,void 0,i));return r}case"o":{let r=n===void 0?{}:Object.create(n);for(let[o,s,d]of t.f)r[o]=E(a,e+s,d,void 0,i);return r}}}var me=class extends pt{layout;proto;length=0;captured=-1;handle;checking;pending=[];#e;constructor(e,t,n){super(void 0),this.layout=e,this.proto=t,this.#e=n}measure(){return this.checking??this.length}view(){if(this.checking===void 0)return this.host;let e=E(new DataView(new ArrayBuffer(this.layout.st)),0,this.layout.e,this.proto);return new Array(this.checking).fill(e)}failed(){this.#e.ahead===this&&(this.#e.ahead=void 0)}apply(e){let t=this.layout.st,n=this.layout.e;if("full"in e){let d=new DataView(e.full),l=[];for(let c=0;c<e.length;c++)l.push(E(d,c*t,n,this.proto));this.host=l,this.length=e.length,this.fresh="host";return}let i=this.gpu,r=i!==void 0&&this.fresh!=="host";if(r)for(let[d,l]of e.ranges)i.d.queue.writeBuffer(i.buffer,d,l.slice().buffer);if(this.fresh==="device"&&i!==void 0)return;let o=this.host;for(let[d,l]of e.ranges){let c=new DataView(l.buffer,l.byteOffset,l.byteLength);for(let f=0;f+t<=l.byteLength;f+=t)o[(d+f)/t]=E(c,f,n,this.proto)}let s=this.fresh==="both"&&r;this.fresh="host",s&&(this.fresh="both")}};function Vt(a){let e=[...a].sort((n,i)=>n[0]-i[0]),t=[];for(let[n,i]of e){let r=t[t.length-1];r!==void 0&&n<=r[1]?r[1]=Math.max(r[1],i):t.push([n,i])}return t.length>Me?[[t[0][0],t[t.length-1][1]]]:t}function Yt(a,e,t){a.live();let n=a.region,i=a.range.offset,r=t*e.layout.st,o=a.ranges(),s=()=>{if(o.length>0)for(let l of a.states.values())l!==e&&(l.pending=Vt([...l.pending,...o]));e.pending=[],a.clean()};if(e.captured!==t){e.captured=t;let l=new Uint8Array(n.buffer,i,r).slice().buffer;return s(),{full:l,length:t}}if(o.length===0&&e.pending.length===0)return;let d=Vt([...e.pending,...o]).map(([l,c])=>[l,new Uint8Array(n.buffer,i+l,Math.max(0,Math.min(c,r)-l)).slice()]).filter(([,l])=>l.byteLength>0);return s(),{ranges:d}}var On=Symbol.for("typeshade.layout");function Cn(a,e){let t=typeof a=="function"&&typeof a.name=="string"&&a.name!==""?a.name:void 0,n=typeof a=="function"?a[On]:void 0;if(t===void 0||typeof n!="object"||n===null)throw new TypeError(`${e}: takes a class a shader module exports (an import of a .shade.ts), got ${typeof a=="function"?`the function ${t??"(anonymous)"}, which no shader module made`:k(a)}.`);let i=n;if(i.a===1)throw new TypeError(`${e}: ${t} is abstract, so it has no layout of its own; pass a class that extends it.`);return{...i,name:t}}var Qt={f32:Float32Array,f64:Float32Array,i32:Int32Array,u32:Uint32Array};function Un(a,e,t,n){if(typeof e=="number"){if(a==="f32")return Math.fround(e);if(a==="f64"||Number.isInteger(e)&&(a==="i32"?e>=-2147483648&&e<=2147483647:e>=0&&e<=4294967295))return e}let i=n<0?t:`${t}[${n}]`;throw new TypeError(typeof e=="number"?`${i}: got ${e}, which is not a whole number in the ${a} range.`:`${i}: takes a number (${a}), got ${k(e)}.`)}var je=class{#e;#t;#n;#i;#a;#o;#r;#s;#l;#c=-1;constructor(e,t,n,i){this.#e=e,this.#t=t,this.#n=n,this.#i=i,this.#a=n.k==="s"?1:n.k==="v"?n.n:n.c*n.r,this.#o=n.k==="m"?"f32":n.t}#d(){let e=this.#e;e.live();let t=e.region;if(this.#r===void 0||this.#c!==t.generation||this.#s!==t.buffer||this.#l!==e.range){let n=this.#n,i=n.k==="s"?n.t==="f64"?2:1:n.k==="v"?n.t==="f64"?(n.lo??0)/4+n.n:n.n:n.c*n.cs/4-(n.cs/4-n.r);if(this.#t+4*i>e.bytes)throw this.#r=void 0,new TypeError(`${this.#i}: ${e.name} was resized, and this element is no longer in it. Take the accessor again with at().`);this.#r=new Qt[this.#o](t.buffer,e.range.offset+this.#t,i),this.#s=t.buffer,this.#l=e.range,this.#c=t.generation}return this.#r}#f(e){let t=this.#n;return t.k==="m"?Math.floor(e/t.r)*(t.cs/4)+e%t.r:e}#p(e,t){let n=this.#n,i=t<0?this.#i:`${this.#i}[${t}]`;if(n.k!=="m"&&n.b===1){if(typeof e!="boolean")throw new TypeError(`${i}: takes a boolean, got ${k(e)}.`);return e?1:0}if(n.k==="s"&&n.m!==void 0){let r=typeof e=="string"?n.m.indexOf(e):-1;if(r<0)throw new TypeError(`${i}: takes one of ${n.m.map(o=>`'${o}'`).join(", ")}, got ${k(e)}.`);return r}return Un(this.#o,e,this.#i,t)}#m(e,t,n){if(this.#o==="f64"){let r=Math.fround(n),o=Math.fround(n-r),s=this.#n.k==="v"?t:2*t,d=this.#n.k==="v"?(this.#n.lo??0)/4+t:s+1;return Object.is(e[s],r)&&Object.is(e[d],o)?!1:(e[s]=r,e[d]=o,!0)}let i=this.#f(t);return Object.is(e[i],n)?!1:(e[i]=n,!0)}#v(e){this.#e.mark(this.#t,this.#t+e.byteLength)}set(){let e=this.#d();this.#e.current(`${this.#i}.set()`);let t=this.#a,n=arguments.length,i=!1;if(n===1&&typeof arguments[0]=="object"&&arguments[0]!==null&&t>1){let r=arguments[0];if(r.length!==t)throw new TypeError(`${this.#i}.set(): takes ${t} numbers, got ${k(r)}${Array.isArray(r)?"":` of length ${String(r.length)}`}.`);for(let o=0;o<t;o++)this.#m(e,o,this.#p(r[o],o))&&(i=!0)}else if(n===t)for(let r=0;r<t;r++)this.#m(e,r,this.#p(arguments[r],t>1?r:-1))&&(i=!0);else throw new TypeError(t===1?`${this.#i}.set(): takes one number, got ${n} arguments.`:`${this.#i}.set(): takes ${t} numbers or one array of ${t}, got ${n} arguments.`);i&&this.#v(e)}get(){let e=this.#d();if(this.#e.current(`${this.#i}.get()`),this.#o==="f64"){if(this.#n.k==="s")return e[0]+e[1];let n=new Float64Array(this.#a),i=(this.#n.lo??0)/4;for(let r=0;r<n.length;r++)n[r]=e[r]+e[i+r];return n}let t=this.#n;return t.k!=="m"&&t.b===1?t.k==="s"?e[0]!==0:Array.from(e,n=>n!==0):t.k==="s"&&t.m!==void 0?t.m[e[0]]:t.k==="s"?e[0]:e}},$e=class{#e;#t;#n;#i;#a=[];length;constructor(e,t,n,i){this.#e=e,this.#t=t,this.#n=n,this.#i=i,this.length=n.n??0}at(e){if(this.#e.live(),!Number.isInteger(e)||e<0||e>=this.length)throw new RangeError(`${this.#i}.at(): takes a whole number from 0 to ${this.length-1}, got ${String(e)}.`);return this.#a[e]??=en(this.#e,this.#t+e*this.#n.st,this.#n.e,`${this.#i}[${e}]`)}set(e){this.#e.live(),this.#e.current(`${this.#i}.set()`);let t=e;if(typeof e!="object"||e===null||t.length!==this.length)throw new TypeError(`${this.#i}.set(): takes an array of ${this.length} values, got ${k(e)}.`);for(let n=0;n<this.length;n++)this.at(n).set(t[n])}get(){let e=this.#e;e.live(),e.current(`${this.#i}.get()`);let t=this.#n.e;if(t.k!=="s"&&t.k!=="v"||t.t==="f64")throw new TypeError(`${this.#i}.get(): this array has no one view; read each element with at(i).get().`);return new Qt[t.t](e.region.buffer,e.range.offset+this.#t,this.length*this.#n.st/4)}},qe=Symbol("field"),Ge=["set","constructor"],ki=[...Ge,"needsUpdate","dispose"],ee=class{#e;#t;#n;#i;#a=new Map;constructor(e,t,n,i){this.#e=e,this.#t=t,this.#n=n,this.#i=i}[qe](e){this.#e.live();let t=this.#a.get(e);if(t===void 0){let n=this.#n.f.find(([i])=>i===e);t=en(this.#e,this.#t+n[1],n[2],`${this.#i}.${e}`),this.#a.set(e,t)}return t}set(e){if(this.#e.live(),this.#e.current(`${this.#i}.set()`),typeof e!="object"||e===null||Array.isArray(e)||ArrayBuffer.isView(e))throw new TypeError(`${this.#i}.set(): takes an object of its fields, got ${k(e)}.`);let t=e;for(let n in t){if(!this.#n.f.some(([i])=>i===n))throw new TypeError(`${this.#i}.set(): ${JSON.stringify(n)} is not a field; the fields are ${this.#n.f.map(([i])=>i).join(", ")}.`);this[qe](n).set(t[n])}}},Xt=new Map;function Jt(a,e,t,n){let i=Xt.get(a);i===void 0&&Xt.set(a,i=new WeakMap);let r=i.get(e);if(r===void 0){r=class extends a{};for(let[o]of e.f){if(t.includes(o))throw new TypeError(`${n}: the field ${JSON.stringify(o)} has the name of the accessor's own ${o==="constructor"?"property":"method"}, so a host cannot reach it; rename the field in the shader.`);Object.defineProperty(r.prototype,o,{get(){return this[qe](o)},enumerable:!0})}i.set(e,r)}return r}function en(a,e,t,n){switch(t.k){case"a":if(t.n===null)throw new TypeError(`${n}: an array with no size has no field accessor.`);return new $e(a,e,t,n);case"o":return new(Jt(ee,t,Ge,n))(a,e,t,n);default:return new je(a,e,t,n)}}var Ie=class extends ee{get needsUpdate(){let e=$.get(this);return e.live(),e.dirty}set needsUpdate(e){let t=$.get(this);t.live(),e?t.markAll():t.clean()}dispose(){Ne($.get(this))}},q=class{#e;#t;#n;#i;#a;#o;#r;constructor(e,t,n,i,r){this.#e=e,this.#t=t,this.#r=n,this.#i=i,this.#a=r.fixed,this.#o=r.unset,this.#n=Jt(ee,t.e,Ge,e.name),Kt(this,e)}get length(){return this.#r}#s(e){if(this.#e.live(),this.#o!==void 0){let t=this.#e.name;throw new TypeError(`${t}.${e}: ${t} is a storage array with no size that ${this.#o} exports, and its length is not set. Call ${t}.resize(n) or ${t}.set(data) first.`)}}#l(e,t){let n=this.#a;if(n!==void 0&&t!==n.length){let i=this.#e.name;throw new TypeError(`${i}.${e}: ${i} is a storage array of ${n.length} elements in ${n.module}, which states its size, so it cannot hold ${t}. Declare it storage<array<T>>, with no size, for a length the host sets.`)}}at(e){if(this.#s("at()"),!Number.isInteger(e)||e<0||e>=this.#r)throw new RangeError(`${this.#e.name}.at(): takes a whole number from 0 to ${this.#r-1}, got ${String(e)}.`);return new this.#n(this.#e,e*this.#t.st,this.#t.e,`${this.#e.name}[${e}]`)}read(){let e=this.#e;this.#s("read()");try{we()}catch(t){return Promise.reject(t)}return R.submit(),e.states.size===0?Promise.resolve(this.#d(e.region.buffer,e.range.offset)):(async()=>{await R.idle(),we();let t=e.error();if(t!==void 0)throw t;let n=e.ahead;if(n===void 0)return this.#d(e.region.buffer,e.range.offset);let i=await this.#c(n);return this.#d(i,0,n.length)})()}async#c(e){let t=this.#e;await e.fenced(),await e.sync(!0),t.live();let n=this.#t.st,i=e.length*n,r=new ArrayBuffer(Math.max(4,i));if(lt(new DataView(r),0,{...this.#t,n:e.length},e.host,""),!t.dirty&&e.length===this.#r&&t.ahead===e){new Uint8Array(t.region.buffer,t.range.offset,i).set(new Uint8Array(r,0,i)),t.ahead=void 0;for(let o of t.states.values())o!==e&&(o.captured=-1)}return r}async forget(e){let t=this.#e,n=t.states.get(e);if(n!==void 0){if(t.ahead===n&&n.error===void 0&&!t.range.freed)try{await this.#c(n)}catch(i){t.kept=i,ut(i)}t.ahead===n&&(t.ahead=void 0),n.error!==void 0&&(t.kept??=n.error),t.states.delete(e),n.handle?.dispose()}}#d(e,t,n=this.#r){let i=new DataView(e,t,n*this.#t.st),r=[];for(let o=0;o<n;o++)r.push(E(i,o*this.#t.st,this.#t.e,this.#i,!0));return r}prepare(e,t){let n=this.#e;this.#s("a call");let i=n.states.get(t);i===void 0&&(i=new me(this.#t,this.#i,n),i.ownedBy=t,n.states.set(t,i)),i.handle??=oe(i);let r=n.error();if(r!==void 0)throw r;if(n.ahead!==void 0&&n.ahead!==i){let s=n.name;throw new TypeError(`${s}: a call on ${n.ahead.ownedBy?.label??"another device"} wrote ${s}, and its values are on that device until \`await ${s}.read()\` brings them back; await it first. A call on ${t.label} takes it after that read.`)}let o=this.#r;return i.checking=o,{handle:i.handle,layout:this.#t,name:n.name,done:()=>{i.checking=void 0},commit:()=>{let s=Yt(n,i,o);return e&&(n.ahead=i),s===void 0?void 0:()=>i.apply(s)}}}resize(e){let t=this.#e;t.live(),t.current(`${t.name}.resize()`);let n=t.name;if(typeof e!="number"||!Number.isInteger(e)||e<0||e>4294967295)throw new TypeError(`${n}.resize(): takes a length that is a whole number from 0 to 4294967295, got ${k(e)}.`);this.#l("resize()",e),t.resize(e*this.#t.st,Math.min(e,this.#r)*this.#t.st),this.#r=e,this.#o=void 0,this.#f()}#f(){this.#e.kept=void 0;for(let e of this.#e.states.values())e.error=void 0,e.captured=-1}set(e){let t=this.#e;t.live(),t.current(`${t.name}.set()`);let n=t.name,i=e;if(typeof e!="object"||e===null||typeof i.length!="number"||!Number.isInteger(i.length)||i.length<0)throw new TypeError(`${n}.set(): takes an array of the elements' values, got ${k(e)}.`);let r=i.length;this.#l("set()",r);let o=t.slot.range,s=t.bytes,d=t.region.allocate(r*this.#t.st);t.slot.range=d,t.bytes=r*this.#t.st;try{let l=this.#t.e;for(let c=0;c<r;c++)new this.#n(t,c*this.#t.st,l,`${n}[${c}]`).set(i[c])}catch(l){throw t.slot.range=o,t.bytes=s,t.region.free(d),l}t.region.free(o),t.markAll(),this.#r=r,this.#o=void 0,this.#f()}get needsUpdate(){return this.#e.live(),this.#e.dirty}set needsUpdate(e){this.#e.live(),this.#e.current(`${this.#e.name}.needsUpdate`),e?this.#e.markAll():this.#e.clean()}dispose(){Ne(this.#e);for(let e of this.#e.states.values())e.handle?.dispose()}},Zt=Symbol.dispose;if(typeof Zt=="symbol")for(let a of[Ie,q])Object.defineProperty(a.prototype,Zt,{value(){this.dispose()}});function Mn(a,e,t,n,i,r,o={}){let s=Cn(e,i);if(s.s===void 0||s.s.e.k!=="o")throw new TypeError(`${i}: ${s.name} has no storage layout a host can write: ${s.sn??"it is no struct"}.`);if(typeof t!="number"||!Number.isInteger(t)||t<0||t>4294967295)throw new TypeError(`${i}: takes a length that is a whole number from 0 to 4294967295, got ${k(t)}.`);let d=r??`Buffer<${s.name}>`,l=new J(a,t*s.s.st,d,`zeros(${s.name}, ${t})`,s.s.st),c=new q(l,s.s,t,e.prototype,o);if(n!==void 0){let f=n;for(let m=0;m<t;m++)c.at(m).set(f[m])}return l.markAll(),c}function Ve(...a){let[e,t]=a;if(typeof e=="function"&&a.length===2){if(typeof t!="object"||t===null||typeof t.length!="number")throw new TypeError(`array(): takes an array of the elements' values, got ${k(t)}.`);return Mn(Ue(),e,t.length,t,"array()")}let n=ue();return n!==void 0?n.arrayAs("array()",a):ae("array()",a)}function tn(a){if(typeof a!="object"||a===null)return;let e=$.get(a);if(e===void 0)return;if(a instanceof q)return{kind:"buffer",name:e.name,owner:e.owner,prepare:(n,i)=>a.prepare(n,i)};let t=Nn.get(a);if(t!==void 0)return{kind:"uniform",name:e.name,owner:void 0,value:()=>(e.live(),E(new DataView(e.region.buffer,e.range.offset,t.sz),0,t))}}ft.push(a=>{let e=tn(a);return e===void 0?void 0:e.kind==="uniform"?"Uniform":"Buffer"});var Nn=new WeakMap;De.of=tn;function We(a,e){switch(a.k){case"s":return a.b===1?e===!0?1:0:a.m!==void 0?a.m.indexOf(e):e;case"v":return Array.from(e,t=>a.b===1?t===!0?1:0:t);case"m":return Array.from(e);case"a":return Array.from(e,t=>We(a.e,t));case"o":{let t={};for(let[n,,i]of a.f)t[n]=We(i,e[n]);return t}}}De.structs=(a,e,t,n,i)=>{let r=new J(Ue(),n*a.st,t,"array(Class, data)",a.st),o=new q(r,a,n,e,{}),s=o.prepare(!0,i);s.done();let d=s.commit(),l=r.states.get(i);return{value:o,state:l,upload:d,fill:c=>{l.host=c.map(f=>We(a.e,f)),l.length=n,l.fresh="host"}}};var jn=new Set;async function nn(a){for(let e of jn)await e.forget(a)}function rn(a,e,t,n=1){if(a===void 0)return Math.max(1,Math.min(t,n));let i=Math.floor(e*.8/a.msPerUnit);return Math.min(t,Math.max(1,n,Math.min(i,a.lastUnits*4)))}function an(a,e,t){let n=Math.max(1,e),i=Math.max(.001,t)/n;return Object.freeze({msPerUnit:a===void 0?i:.5*a.msPerUnit+.5*i,chunks:(a?.chunks??0)+1,longestMs:Math.max(a?.longestMs??0,t),lastUnits:n})}var $n=64*1024*1024,qn=250,on=6e4;function sn(a){if(a instanceof Float32Array)return"f32";if(a instanceof Int32Array)return"i32";if(a instanceof Uint32Array)return"u32";if(a instanceof Float64Array)return"f64"}var ln={f32:4,i32:4,u32:4,f64:8},In=0,A=class{info;tier;fp64Flavor;timeBudgetMs;skipped;limits;lost;label;owner;#e;#t;#n;#i=new Map;#a=new Map;#o=new Set;#r=new WeakMap;#s=0;#l=0;#c=0;#d=0;#f=0;#p=0;#m=new Map;#v=new Map;#h;#y=new Set;constructor(e,t,n,i,r,o,s,d,l=null){this.tier=e;let c=i??(e==="webgl2"?ne():null);this.info=re(e,c,l),this.fp64Flavor=s==="auto"?ot(e,c,this.info):s,this.timeBudgetMs=d,this.skipped=Object.freeze(n.map(f=>Object.freeze({...f}))),this.#e=i,this.#t=r,this.#n=o,this.label=`Device #${++In}`,this.limits=i===null?Object.freeze({}):_e(i).limits,this.lost=i===null?new Promise(()=>{}):i.lost.then(f=>{let m=f??{};return Object.freeze({reason:typeof m.reason=="string"?m.reason:"unknown",message:typeof m.message=="string"?m.message:"the WebGPU device was lost"})}),this.owner=Object.freeze({label:this.label,tiers:()=>t,device:()=>Promise.resolve(i),fp64Flavor:()=>this.fp64Flavor,subgroupFolds:()=>this.info.subgroups!==null,dispatched:(f,m)=>{this.#v.set(f,m)},assertCall:()=>this.#u("call()"),scratchBuffer:(f,m,p)=>this.#T(f,m,p),releaseScratch:f=>this.#D(f),result:f=>this.#R(f)})}get statistics(){return Object.freeze({live:this.#i.size,liveBytes:this.#l,pooledBytes:this.#s,allocations:this.#c,variants:Object.freeze(Object.fromEntries(this.#v)),reuses:this.#d,uploadBytes:this.#f,readBytes:this.#p})}array(...e){return this.arrayAs(`${this.label}.array()`,e)}arrayAs(e,t){this.#u("array()");let n=t.length>=2,[i,r]=t,o=n?void 0:vt(i,e),s=n?i:o??i,d=ae(e,n?[s,r]:[s]),l=Se(d),c=n?r:o!==void 0?"f32":sn(s),f=n?s:c!==void 0?s.length:0,m=c===void 0?void 0:`${c}:${f}`,p=c===void 0?0:f*ln[c];!n&&c!==void 0&&(this.#f+=p);let h=m===void 0?void 0:this.#_(m);if(h!==void 0)return se(l),this.#d++,n?this.#P(h,c,f):yt(h.state,s),this.#b(h);let u={state:l,key:m,element:c,length:f,bytes:p,pooled:!1};return l.ownedBy=this.owner,this.#i.set(l,u),this.#l+=p,this.#c++,this.#b(u)}texture(e){this.#u("texture()");let t=`${this.label}.texture()`;if(typeof e!="object"||e===null)throw new TypeError(`${t}: takes an options object, { size: [width, height], format }.`);let{size:n,format:i,storage:r}=e;if(!Array.isArray(n)||n.length!==2||!n.every(s=>Number.isSafeInteger(s)&&s>=1))throw new TypeError(`${t}: size takes [width, height], two whole numbers of 1 or more.`);if(typeof i!="string"||i==="")throw new TypeError(`${t}: format takes a WebGPU texture format, such as "rgba8unorm".`);if(r!==void 0&&typeof r!="boolean")throw new TypeError(`${t}: storage takes true or false.`);if(this.#e===null){let s=zt(i);if(s!==void 0)throw new TypeError(`${t}: ${s}.`);let d=new Lt(n[0],n[1],i);return Te.set(d,this.owner),d}let o=new N(Z(this.#e),{size:[n[0],n[1]],format:i,...r===!0?{storage:!0}:{}});return Te.set(o,this.owner),this.#y.add(o),o}release(e){this.#u("release()");let t=this.#E(e,"release()");this.#x(t)}#x(e){if(e.pooled)return;if(e.key===void 0||e.bytes>this.#n||e.bytes===0){this.#w(e);return}e.pooled=!0;let t=this.#a.get(e.key);t===void 0?this.#a.set(e.key,[e]):t.push(e),this.#o.add(e),this.#s+=e.bytes;for(let n of this.#o){if(this.#s<=this.#n)break;this.#w(n)}}get chunkRates(){return Object.freeze(Object.fromEntries(this.#m))}chunkSize(e,t,n=1){this.#u("chunkSize()"),fn(`${this.label}.chunkSize()`,"key",e);for(let[i,r]of[["max",t],["min",n]])if(!Number.isSafeInteger(r)||r<1)throw new RangeError(`${this.label}.chunkSize(): ${i} takes a whole number of 1 or more.`);return this.tier==="cpu"?t:rn(this.#m.get(e),this.timeBudgetMs,t,n)}fuse(e,t){let n;try{this.#u("fuse()"),n=Wn(`${this.label}.fuse()`,t)}catch(i){return Promise.reject(i)}return n===void 0?Pe(e,this.owner):this.#S(Pe,e,n)}#S(e,t,n){let i;try{i=R.run(()=>this.#g())}catch(s){return Promise.reject(s)}let r=e(t,this.owner),o=R.run(()=>this.#g());return Promise.all([i,r,o]).then(([s,d,l])=>{let c=l-s;return this.#m.set(n.key,an(this.#m.get(n.key),n.units,c)),{...d,chunk:Object.freeze({key:n.key,units:n.units,elapsedMs:c})}})}async#g(){let e=this.#e?.queue;return typeof e?.onSubmittedWorkDone=="function"&&await e.onSubmittedWorkDone(),performance.now()}async wait(){this.#u("wait()"),await R.idle(),await this.#g()}use(){this.#u("use()");let e=qt(this),t=()=>It(e),n={dispose:t},i=Symbol.dispose;return typeof i=="symbol"&&Object.defineProperty(n,i,{value:t}),n}dispose(){return this.#h!==void 0?this.#h:(this.#h=(async()=>{await R.idle(),await nn(this.owner);for(let e of this.#i.values())se(e.state);this.#i.clear(),this.#a.clear(),this.#o.clear(),this.#s=0,this.#l=0;for(let e of this.#y)e.destroy();if(this.#y.clear(),this.#t&&this.#e!==null){let e=this.#e;R.whenIdle(()=>e.destroy?.())}})(),this.#h)}#b(e){return oe(e.state,{read:t=>{ArrayBuffer.isView(t)&&(this.#p+=t.byteLength)},set:t=>{this.#f+=t.byteLength},dispose:()=>{this.#i.has(e.state)&&this.#k(e)}})}#R(e){let t=e.elem===void 0?sn(e.host):void 0,n=t!==void 0?e.host.length:0,i={state:e,key:t===void 0?void 0:`${t}:${n}`,element:t,length:n,bytes:t===void 0?0:n*ln[t],pooled:!1};return e.ownedBy=this.owner,this.#i.set(e,i),this.#l+=i.bytes,this.#c++,this.#b(i)}#_(e,t=()=>!0){let n=this.#a.get(e),i=n?.findIndex(t)??-1;if(i<0)return;let r=n.splice(i,1)[0];return n.length===0&&this.#a.delete(e),this.#o.delete(r),this.#s-=r.bytes,r.pooled=!1,r}#T(e,t,n){if(this.#r.has(e)||t!==this.#e)return;let i=`${e.element}:${e.length}`,r=e.length*4,o=this.#_(i,d=>d.state.gpu===void 0||d.state.gpu.d===t&&d.state.gpu.size===r);if(o===void 0){let d=new ht(e.length,e.element);d.ownedBy=this.owner,o={state:d,key:i,element:e.element,length:e.length,bytes:r,pooled:!1},this.#i.set(d,o),this.#l+=r}this.#r.set(e,o);let s=o.state;e.gpu=s.gpu,s.gpu=void 0,s.host=void 0,s.error=void 0,s.clearPending=!1,e.gpu!==void 0&&(e.gpu={...e.gpu,layout:n},K.delete(e.gpu.buffer),e.host===void 0&&(e.fresh="device",e.clearPending=!0,K.set(e.gpu.buffer,e)))}#D(e){let t=this.#r.get(e);return t===void 0?!1:(this.#r.delete(e),e.gpu!==void 0&&K.delete(e.gpu.buffer),e.clearPending=!1,t.state.gpu=e.gpu,t.state.fresh=e.gpu===void 0?"host":"device",this.#x(t),!0)}#P(e,t,n){let i=e.state;gt(i);let r=ke[t](n);i.next=r,R.whenIdle(()=>{i.next===r&&(i.next=void 0),i.error=void 0;let o=ke[t](n),s=this.#e;if(i.gpu!==void 0&&s!==null&&i.gpu.d===s){i.host=o,i.fresh="device",i.clearPending=!0,K.set(i.gpu.buffer,i);return}i.assign(o)})}#w(e){this.#k(e),se(e.state)}#k(e){if(e.pooled){e.pooled=!1,this.#o.delete(e),this.#s-=e.bytes;let t=this.#a.get(e.key);if(t!==void 0){let n=t.indexOf(e);n>=0&&t.splice(n,1),t.length===0&&this.#a.delete(e.key)}}this.#i.delete(e.state),this.#l-=e.bytes}#E(e,t){let n=Se(e);if(n===void 0)throw new TypeError(`${this.label}.${t}: takes a Buffer this device made with array().`);let i=this.#i.get(n);if(i===void 0)throw new TypeError(n.ownedBy===this.owner?`${this.label}.${t}: this Buffer was disposed.`:`${this.label}.${t}: this Buffer belongs to ${n.ownedBy?.label??"the default owner (array())"}, not to ${this.label}.`);return i}#u(e){if(this.#h!==void 0)throw new TypeError(`${this.label}.${e}: this Device was disposed. Make a new one with createDevice().`)}};function fn(a,e,t){if(typeof t!="string"||t==="")throw new TypeError(`${a}: ${e} takes a non-empty string that names the kernel loop.`)}function Wn(a,e){if(e===void 0)return;if(typeof e!="object"||e===null)throw new TypeError(`${a}: the second argument takes an object, { chunk: { key, units } }.`);let t=e.chunk;if(t===void 0)return;if(typeof t!="object"||t===null)throw new TypeError(`${a}: chunk takes an object, { key, units }.`);let{key:n,units:i}=t;if(fn(a,"chunk.key",n),typeof i!="number"||!Number.isSafeInteger(i)||i<1)throw new TypeError(`${a}: chunk.units takes a whole number of 1 or more.`);return{key:n,units:i}}function cn(a){let e=a;return typeof e.getParameter=="function"&&typeof e.createTransformFeedback=="function"}At.of=()=>{let a=ue();return a instanceof A?a.owner:void 0};async function He(a={}){if(typeof a!="object"||a===null)throw new TypeError("createDevice(): takes an options object.");let e=["prefer","device","runtime"].filter(l=>a[l]!==void 0);if(e.length>1)throw new TypeError(`createDevice(): ${e.map(l=>`"${l}"`).join(" and ")} are exclusive; pass one of prefer, device and runtime.`);let t=Gn(a),n=a.poolBytes??$n;if(!Number.isSafeInteger(n)||n<0)throw new TypeError("createDevice(): poolBytes takes a whole number of bytes, 0 or more.");let i=a.timeBudgetMs??qn;if(typeof i!="number"||!Number.isFinite(i)||i<1||i>on)throw new RangeError(`createDevice(): timeBudgetMs takes a finite number of milliseconds from 1 to ${on}.`);let r=a.fp64Flavor===void 0?"auto":bt("createDevice({ fp64Flavor })",a.fp64Flavor);if(a.subgroups!==void 0&&a.subgroups!=="auto"&&a.subgroups!=="off")throw new TypeError(`createDevice({ subgroups }): ${JSON.stringify(a.subgroups)} is not a setting; the choices are 'auto' and 'off'.`);let o=l=>a.subgroups==="off"?Promise.resolve(null):at(l);if(a.device!==void 0){if(typeof a.device!="object"||a.device===null||cn(a.device))throw new TypeError("createDevice({ device }): device takes a GPUDevice.");return dn(a.device,t),new A("webgpu",Y,[],a.device,!1,n,r,i,await o(a.device))}if(a.runtime!==void 0){let l=a.runtime;if(typeof l!="object"||l===null||typeof l.device!="object"||l.device===null)throw new TypeError("createDevice({ runtime }): runtime takes a runtime from createRuntime().");if(l.tier==="webgl2"||cn(l.device))throw new TypeError("createDevice({ runtime }): runtime takes a WebGPU runtime; on WebGL2 the calls use a context of their own.");return dn(l.device,t),new A("webgpu",Y,[],l.device,!1,n,r,i,await o(l.device))}let s=a.prefer??Y;if(!Array.isArray(s)||s.length===0)throw new TypeError("createDevice(): prefer takes a non-empty list of tiers.");for(let l of s)if(!Y.includes(l))throw new TypeError(`createDevice(): "${String(l)}" is not a tier; the tiers are ${mt()}.`);if(new Set(s).size!==s.length)throw new TypeError("createDevice(): prefer names a tier twice.");let d=[];for(let[l,c]of s.entries()){let f=s.slice(l);if(c==="webgpu"){let m;try{m=await ct(t,"createDevice")}catch(p){d.push({tier:c,reason:p instanceof Error?p.message:String(p)});continue}if(m!==null)return new A(c,f,d,m,!0,n,r,i,await o(m));d.push({tier:c,reason:"there is no WebGPU device"})}else if(c==="webgl2"){if(ne()!==null)return new A(c,f,d,null,!1,n,r,i);d.push({tier:c,reason:"there is no WebGL2 context"})}else return new A(c,f,d,null,!1,n,r,i)}throw new Error(`createDevice(): no tier of prefer opened (${d.map(l=>`${l.tier}: ${l.reason}`).join("; ")}).`)}function Gn(a){if(a.limits!==void 0){if(typeof a.limits!="object"||a.limits===null||Array.isArray(a.limits))throw new TypeError("createDevice({ limits }): limits takes an object of limit values.");ie(a.limits,"createDevice({ limits })")}if(a.features!==void 0&&(!Array.isArray(a.features)||a.features.some(e=>typeof e!="string")))throw new TypeError("createDevice({ features }): features takes a list of feature names.");return{limits:Object.freeze({...a.limits}),features:Object.freeze([...new Set(a.features??[])])}}function dn(a,e){let t=_e(a).limits;for(let[n,i]of Object.entries(e.limits)){let r=t[n];if(r===void 0)throw new TypeError(`createDevice({ limits }): "${n}" is not a limit this device reports.`);if(O(n)?i<r:i>r)throw new TypeError(`The device has ${n} ${r}; createDevice({ limits }) asks for ${i}. Enable the limit when requesting this device, or omit device and runtime.`)}for(let n of e.features)if(a.features?.has(n)!==!0)throw new TypeError(`createDevice({ features }): the supplied device has not enabled "${n}". Enable it when requesting this device, or omit device and runtime.`)}var pe=class{constructor(e,t){this.win=e;this.gl=t}stopped=!1;pending=new Set;wait(){let e=this.gl;if(!e||this.stopped||e.isContextLost())return Promise.resolve();let t=e.fenceSync(e.SYNC_GPU_COMMANDS_COMPLETE,0);return t?(e.flush(),new Promise(n=>{let i=0,r=()=>{this.win.clearTimeout(i),e.deleteSync(t),this.pending.delete(r),n()},o=()=>{if(this.stopped||e.isContextLost()){r();return}e.clientWaitSync(t,0,0)===e.TIMEOUT_EXPIRED?i=this.win.setTimeout(o,4):r()};this.pending.add(r),o()})):Promise.resolve()}destroy(){this.stopped=!0;for(let e of[...this.pending])e()}};var he=class{constructor(e,t){this.runtime=e;this.completion=new pe(t,e.tier==="webgl2"?e.device:void 0)}scope=new Bt;completion;arrays=new Set;device;preparing;retirement;run(e){return this.scope.run(e)}prepareData(){return this.preparing||(this.preparing=this.run(async()=>{this.runtime.tier==="webgpu"&&(this.device=await He({runtime:this.runtime}))})),this.preparing}array(e){if(this.scope.assertOpen(),this.runtime.tier==="webgpu"&&!this.device)throw new Error("Prepare the session's data owner before allocating resident inputs.");let t=this.device?this.device.array(e):Ve(e);return this.arrays.add(t),t}release(e){this.arrays.delete(e)&&(this.device?this.device.release(e):e.dispose())}present(e){return this.run(async()=>{await e.submit(),await this.completion.wait()})}retire(e){if(!this.retirement){let t=this.scope.close();this.completion.destroy(),this.retirement=t.then(async()=>{let n=[],i=r=>{try{r()}catch(o){n.push(o)}};try{await e()}catch(r){n.push(r)}for(let r of[...this.arrays])i(()=>this.release(r));try{await this.device?.dispose()}catch(r){n.push(r)}if(i(()=>this.runtime.destroy()),n.length)throw new AggregateError(n,"Rendering resources could not all be disposed.")})}return this.retirement}};var Ke={schema:2,compiler:"0.1.0",wgsl:`struct FontUniforms {
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

struct _spec3_result {
  distance: f32,
}

struct _spec8_result {
  value: f32,
  valid: bool,
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

fn numberFormat_into(_dst: ptr<function, NumberFormat>, input: f32, spacing: f32) {
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
  let distance = _flow3_shared(q, q.x, q.y);
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
  return max((u.resolution - vec2<f32>(100.0, 104.0)), vec2<f32>(1.0));
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
  let _licm6 = vec2<f32>(1.0, 0.0);
  let _licm7 = u.labelStyle.x;
  let _licm8 = u.resolution.x;
  let _licm9 = u.labelStyle.z;
  let _licm10 = u.labelStyle.w;
  let _licm13 = vec2<f32>(0.0, 1.0);
  let _licm14 = (u.labelStyle.x * 1.6);
  let _licm15 = (u.labelStyle.x * 2.2);
  let _licm18 = (u.labelStyle.x * 0.75);
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let size = extent();
  let lo = vec2<f32>(76.0, 42.0);
  let hi = (lo + size);
  let inside = ((((p.x >= 76.0) && (p.x <= hi.x)) && (p.y >= 42.0)) && (p.y <= hi.y));
  let value = (u.lower + (vec2<f32>(((p.x - 76.0) / size.x), (1.0 - ((p.y - 42.0) / size.y))) * u.span));
  let xLevels = _spec0_dataTickLevels(_licm0, _licm1, size.x, u.logarithmic.x);
  let yLevels = _spec1_dataTickLevels(_licm2, _licm3, size.y, u.logarithmic.y);
  var grid: f32 = 0.0;
  var labels: vec3<f32> = vec3<f32>(0.0);
  let _lc0 = vec2<f32>(hi.x, 42.0);
  let _lc1 = vec2<f32>(76.0, hi.y);
  var coverage: f32 = max(max(line(p, lo, _lc0, 0.5), line(p, lo, _lc1, 0.5)), max(line(p, hi, _lc1, 0.5), line(p, hi, _lc0, 0.5)));
  let _cse0 = (u.logarithmic.x > 0.0);
  let _cse1 = (u.logarithmic.y > 0.0);
  for (var level: i32 = 0; (level < 2); level = (level + 1)) {
    let _gv0 = (level == 0);
    let spacing = select(vec2<f32>(xLevels.y, yLevels.y), vec2<f32>(xLevels.x, yLevels.x), _gv0);
    let nearest = (floor(((value / spacing) + 0.5)) * spacing);
    let tick = (lo + (vec2<f32>(((nearest.x - _licm0) / _licm1), (1.0 - ((nearest.y - _licm2) / _licm3))) * size));
    var _sel0: vec2<f32>;
    if (_gv0) {
      _sel0 = vec2<f32>(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels));
    } else {
      _sel0 = vec2<f32>(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels));
    }
    let weights = _sel0;
    grid = max(grid, max((line(p, vec2<f32>(tick.x, 42.0), vec2<f32>(tick.x, hi.y), 0.5) * weights.x), (line(p, vec2<f32>(76.0, tick.y), vec2<f32>(hi.x, tick.y), 0.5) * weights.y)));
    if (_licm4) {
      if (((tick.x >= 75.99) && (tick.x <= (hi.x + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2<f32>(tick.x, (hi.y + 2.5)), _licm6, 2.5, 1.0) * weights.x));
        let n = select(nearest.x, pow(10.0, nearest.x), _cse0);
        let step = select(xLevels.x, max((n * (pow(10.0, xLevels.x) - 1.0)), 1e-30), _cse0);
        let width = numberWidth(n, step, _licm7);
        let _lc2 = (width * 0.5);
        let room = min(((tick.x - _lc2) - 4.0), (((_licm8 - tick.x) - _lc2) - 4.0));
        let fit = smoothstep((width + 6.0), (width + 14.0), ((spacing.x / _licm1) * size.x));
        let opacity = ((weights.x * fit) * smoothstep(0.0, 5.0, room));
        let local = (p - vec2<f32>(tick.x, (hi.y + 6.0)));
        labels = max(labels, (vec3<f32>(tickNumberLayers(local, n, step, 0.5, _licm7, _licm9), (numberPlate(local, n, step, 0.5, _licm7) * _licm10)) * opacity));
      }
      if (((tick.y >= 41.99) && (tick.y <= (hi.y + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2<f32>(73.5, tick.y), _licm13, 2.5, 1.0) * weights.y));
        let n_1 = select(nearest.y, pow(10.0, nearest.y), _cse1);
        let step_1 = select(yLevels.x, max((n_1 * (pow(10.0, yLevels.x) - 1.0)), 1e-30), _cse1);
        let width_1 = numberWidth(n_1, step_1, _licm7);
        let fit_1 = smoothstep(_licm14, _licm15, ((spacing.y / _licm3) * size.y));
        let opacity_1 = ((weights.y * fit_1) * smoothstep(0.0, 5.0, (63.0 - width_1)));
        let local_1 = (p - vec2<f32>(67.0, (tick.y - _licm18)));
        labels = max(labels, (vec3<f32>(tickNumberLayers(local_1, n_1, step_1, 1.0, _licm7, _licm9), (numberPlate(local_1, n_1, step_1, 1.0, _licm7) * _licm10)) * opacity_1));
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
  if (((u.focus > 0.0) && (min(min(p.x, p.y), min((_licm8 - p.x), (u.resolution.y - p.y))) < 2.0))) {
    color = vec4<f32>(0.09, 0.42, 0.92, 1.0);
  }
  return color;
}

fn sampleAt(index: u32) -> vec4<f32> {
  let i = (index * 8u);
  let _gv0 = points[(i + 3u)];
  let p = vec4<f32>(points[i], points[(i + 1u)], points[(i + 2u)], 0.0);
  let valid = (((((_gv0 > 0.0) && (abs(points[i]) <= 3.4028234e+38)) && (abs(points[(i + 1u)]) <= 3.4028234e+38)) && ((u.logarithmic.x <= 0.0) || (points[i] > 0.0))) && (((u.logarithmic.y <= 0.0) || (points[(i + 1u)] > 0.0)) || (s.kind == 6.0)));
  return vec4<f32>(p.xyz, select(0.0, 1.0, valid));
}

fn segmentDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> f32 {
  let delta = (b - a);
  let t = _flow7_shared(p, a, delta);
  return length(((p - a) - (t * delta)));
}

fn boxDistance(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>) -> f32 {
  let q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2<f32>(0.0))) + min(max(q.x, q.y), 0.0));
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
  let along = _flow7_shared(p, a, delta);
  let parameter = mix(_licm1, parameters.y, along);
  let on = select(0.6, 0.0, (s.dash > 1.5));
  let phase = ((parameter - _licm0) / period);
  let cycle = floor(((phase - (on * 0.5)) + 0.5));
  let difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    var _sel1: f32;
    if ((fract(phase) <= on)) {
      _sel1 = _cse0;
    } else {
      _sel1 = 100000000000000000000.0;
    }
    return _sel1;
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
  return ((all((abs(p) <= vec2<f32>(3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
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

fn seriesHit_into(_dst: ptr<function, DataHit>, p: vec2<f32>, search: f32) {
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
      } else if ((all((p >= (min(point, other) - vec2<f32>(radius)))) && all((p <= (max(point, other) + vec2<f32>(radius)))))) {
        var _sel2: f32;
        if (_cse0) {
          _sel2 = stepDistance(p, a, b, period);
        } else {
          _sel2 = pathDistance(p, point, other, vec2<f32>(a.z, b.z), period);
        }
        candidate = (_sel2 - _cse1);
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
  (*_dst) = DataHit(distance, selected);
}

@fragment
fn seriesFragment(v: Surface) -> @location(0) vec4<f32> {
  let p = (vec2<f32>(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  let _cse0 = vec2<f32>(76.0, 42.0);
  if ((any((p < _cse0)) || any((p > (_cse0 + extent()))))) {
    return vec4<f32>(0.0);
  }
  var hit: _spec3_result;
  _spec2_seriesHit_into(&hit, p, 0.0);
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
  var hit: DataHit;
  seriesHit_into(&hit, p, query.radius);
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
  let q = ((abs((textLocal(p) - text.box.xy)) - text.box.zw) + vec2<f32>(3.0));
  let distance = _flow3_shared(q, q.x, q.y);
  let aa = (pixelWidth() * 0.5);
  let coverage = (1.0 - smoothstep((-aa), aa, distance));
  let border = (1.0 - smoothstep((-0.7 - aa), (-0.7 + aa), distance));
  let fill = mix(u.background.rgb, vec3<f32>(0.995), 0.8);
  return vec4<f32>(mix(vec3<f32>(0.8, 0.84, 0.9), fill, border), (coverage * 0.94));
}

fn fieldAt(column: i32, row: i32) -> f32 {
  let x = u32(clamp(column, 0, (i32(field.shape.y) - 1)));
  let y = u32(clamp(row, 0, (i32(field.shape.x) - 1)));
  return points[((y * field.shape.y) + x)];
}

fn fieldSample_into(_dst: ptr<function, FieldSample>, pixel: vec2<f32>) {
  let _cse0 = extent();
  let position = ((pixel - vec2<f32>(76.0, 42.0)) / _cse0);
  let scaled = (u.lower + (vec2<f32>(position.x, (1.0 - position.y)) * u.span));
  let _cse1 = (u.logarithmic.x > 0.0);
  let _cse2 = (u.logarithmic.y > 0.0);
  let value = vec2<f32>(select(scaled.x, pow(10.0, scaled.x), _cse1), select(scaled.y, pow(10.0, scaled.y), _cse2));
  let _cse3 = (field.bounds.zw - field.bounds.xy);
  let fraction = ((value - field.bounds.xy) / _cse3);
  let _cse7 = f32(field.shape.x);
  let _cse4 = vec2<f32>(f32(field.shape.y), _cse7);
  var coordinate: vec2<f32> = ((fraction * _cse4) - vec2<f32>(0.5));
  if ((field.origin != 0u)) {
    coordinate.y = ((_cse7 - 1.0) - coordinate.y);
  }
  let nearest = _flow11_shared(coordinate, field.shape.y, field.shape.x);
  let index = ((nearest.y * field.shape.y) + nearest.x);
  var sample: f32 = points[index];
  let _cse5 = vec2<f32>(0.0);
  var gradient: vec2<f32> = _cse5;
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
    let _cse6 = log(10.0);
    let dataRate = ((u.span / _cse0) * vec2<f32>(select(1.0, (value.x * _cse6), _cse1), select(1.0, (value.y * _cse6), _cse2)));
    gradient = (((vec2<f32>(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  (*_dst) = FieldSample(sample, ((all((fraction >= _cse5)) && all((fraction <= vec2<f32>(1.0)))) && (abs(sample) <= 3.4028234e+38)), index, gradient);
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
    return vec4<f32>(0.0);
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
  var sample: _spec8_result;
  _spec7_fieldSample_into(&sample, p);
  let magnitude = max(abs(sample.gradient.x), abs(sample.gradient.y));
  let rate = select(0.0, (magnitude * length((sample.gradient / max(magnitude, 1e-30)))), (magnitude > 0.0));
  let _cse0 = vec2<f32>(76.0, 42.0);
  if (((any((p < _cse0)) || any((p > (_cse0 + extent())))) || (sample.valid == false))) {
    return vec4<f32>(0.0);
  }
  let tint = fieldColors(sample.value);
  let distance = (nearestLevel(sample.value) / max(rate, 1e-30));
  let aa = (pixelWidth() * 0.5);
  var _sel3: f32;
  if (((rate > 1e-30) && (rate < 3.4028234e+38))) {
    let _cse1 = (field.lineWidth * 0.5);
    _sel3 = (1.0 - smoothstep(max(0.0, (_cse1 - aa)), (_cse1 + aa), distance));
  } else {
    _sel3 = 0.0;
  }
  let coverage = select(1.0, _sel3, (field.mode == 1u));
  return vec4<f32>(tint.rgb, ((tint.a * field.alpha) * coverage));
}

@fragment
fn fieldPickFragment(v: Surface) -> @location(0) vec4<u32> {
  let p = query.pixel;
  var sample: FieldSample;
  fieldSample_into(&sample, p);
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
  let _cse0 = (u.resolution.x - 40.0);
  let lo = vec2<f32>(_cse0, 58.0);
  let hi = (lo + vec2<f32>(10.0, height));
  let fraction = clamp((1.0 - ((p.y - 58.0) / height)), 0.0, 1.0);
  let value = mix(_licm0, _licm1, fraction);
  let tint = fieldColors(value);
  let distance = boxDistance(p, lo, hi);
  let aa = (pixelWidth() * 0.5);
  let coverage = ((1.0 - smoothstep((-aa), aa, distance)) * tint.a);
  var layers: vec2<f32> = vec2<f32>(0.0);
  let _licm6 = (_cse0 - 5.0);
  for (var i: i32 = 0; (i < 3); i = (i + 1)) {
    let t = (f32(i) * 0.5);
    let n = mix(_licm0, _licm1, t);
    let local = (p - vec2<f32>(_licm6, ((58.0 + ((1.0 - t) * height)) - _licm2)));
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
    return vec4<f32>(0.0);
  }
  let direction = (_gv0 / lengthToTarget);
  let normal = vec2<f32>((-direction.y), direction.x);
  let size = min(text.arrow.z, (lengthToTarget * 0.5));
  let back = (target_1 - (direction * size));
  let aa = (pixelWidth() * 0.5);
  var _sel4: f32;
  if ((size > 0.0)) {
    let _lc0 = ((normal * size) * 0.4);
    _sel4 = (1.0 - smoothstep((-aa), aa, triangleDistance(p, target_1, (back + _lc0), (back - _lc0))));
  } else {
    _sel4 = 0.0;
  }
  let head = _sel4;
  var _sel5: f32;
  if ((text.arrow.y > 0.0)) {
    _sel5 = line(p, start, back, (text.arrow.y * 0.5));
  } else {
    _sel5 = 0.0;
  }
  let shaft = _sel5;
  return vec4<f32>(text.color.rgb, (text.color.a * max(shaft, head)));
}

fn _spec0_dataTickLevels(lower: f32, span: f32, pixels: f32, logarithmic: f32) -> vec3<f32> {
  let size = u.labelStyle.x;
  let rough = (((span * size) * 4.0) / max(pixels, 1.0));
  var gap: f32 = (size * 2.6);
  let _cse0 = (logarithmic > 0.0);
  let low = select(lower, pow(10.0, lower), _cse0);
  let _cse1 = (lower + span);
  let high = select(_cse1, pow(10.0, _cse1), _cse0);
  var _sel6: f32;
  if (_cse0) {
    _sel6 = max((low * (pow(10.0, min(rough, 20.0)) - 1.0)), 1e-30);
  } else {
    _sel6 = rough;
  }
  let step = _sel6;
  gap = max((size * 3.5), (max(numberWidth(low, step, size), numberWidth(high, step, size)) + (size * 1.3)));
  var raw: f32 = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if ((_cse0 && (span >= 2.0))) {
    raw = max(raw, 1.0);
  }
  return tickLevels(raw);
}

fn _spec1_dataTickLevels(lower: f32, span: f32, pixels: f32, logarithmic: f32) -> vec3<f32> {
  let size = u.labelStyle.x;
  var gap: f32 = (size * 2.6);
  var raw: f32 = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if (((logarithmic > 0.0) && (span >= 2.0))) {
    raw = max(raw, 1.0);
  }
  return tickLevels(raw);
}

fn _spec2_seriesHit_into(_dst: ptr<function, _spec3_result>, p: vec2<f32>, search: f32) {
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
      } else if ((all((p >= (min(point, other) - vec2<f32>(radius)))) && all((p <= (max(point, other) + vec2<f32>(radius)))))) {
        var _sel7: f32;
        if (_cse0) {
          _sel7 = stepDistance(p, a, b, period);
        } else {
          _sel7 = pathDistance(p, point, other, vec2<f32>(a.z, b.z), period);
        }
        candidate = (_sel7 - _cse1);
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
    }
  }
  let _spec5_field = distance;
  (*_dst) = _spec3_result(_spec5_field);
}

fn _spec7_fieldSample_into(_dst: ptr<function, _spec8_result>, pixel: vec2<f32>) {
  let _cse0 = extent();
  let position = ((pixel - vec2<f32>(76.0, 42.0)) / _cse0);
  let scaled = (u.lower + (vec2<f32>(position.x, (1.0 - position.y)) * u.span));
  let _cse1 = (u.logarithmic.x > 0.0);
  let _cse2 = (u.logarithmic.y > 0.0);
  let value = vec2<f32>(select(scaled.x, pow(10.0, scaled.x), _cse1), select(scaled.y, pow(10.0, scaled.y), _cse2));
  let _cse3 = (field.bounds.zw - field.bounds.xy);
  let fraction = ((value - field.bounds.xy) / _cse3);
  let _cse7 = f32(field.shape.x);
  let _cse4 = vec2<f32>(f32(field.shape.y), _cse7);
  var coordinate: vec2<f32> = ((fraction * _cse4) - vec2<f32>(0.5));
  if ((field.origin != 0u)) {
    coordinate.y = ((_cse7 - 1.0) - coordinate.y);
  }
  let nearest = _flow11_shared(coordinate, field.shape.y, field.shape.x);
  let index = ((nearest.y * field.shape.y) + nearest.x);
  var sample: f32 = points[index];
  let _cse5 = vec2<f32>(0.0);
  var gradient: vec2<f32> = _cse5;
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
    let _cse6 = log(10.0);
    let dataRate = ((u.span / _cse0) * vec2<f32>(select(1.0, (value.x * _cse6), _cse1), select(1.0, (value.y * _cse6), _cse2)));
    gradient = (((vec2<f32>(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  let _spec10_field = sample;
  let _spec11_field = ((all((fraction >= _cse5)) && all((fraction <= vec2<f32>(1.0)))) && (abs(sample) <= 3.4028234e+38));
  let _spec13_field = gradient;
  (*_dst) = _spec8_result(_spec10_field, _spec11_field, _spec13_field);
}

fn _flow3_shared(_flow0_input: vec2<f32>, _flow1_input: f32, _flow2_input: f32) -> f32 {
  return ((length(max(_flow0_input, vec2<f32>(0.0))) + min(max(_flow1_input, _flow2_input), 0.0)) - 3.0);
}

fn _flow7_shared(_flow4_input: vec2<f32>, _flow5_input: vec2<f32>, _flow6_input: vec2<f32>) -> f32 {
  return clamp((dot((_flow4_input - _flow5_input), _flow6_input) / max(dot(_flow6_input, _flow6_input), 1e-20)), 0.0, 1.0);
}

fn _flow11_shared(_flow8_input: vec2<f32>, _flow9_input: u32, _flow10_input: u32) -> vec2<u32> {
  return vec2<u32>(clamp(floor((_flow8_input + vec2<f32>(0.5))), vec2<f32>(0.0), vec2<f32>((f32(_flow9_input) - 1.0), (f32(_flow10_input) - 1.0))));
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
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
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

float _flow3_shared(vec2 _flow0_input, float _flow1_input, float _flow2_input) {
  return ((length(max(_flow0_input, vec2(0.0))) + min(max(_flow1_input, _flow2_input), 0.0)) - 3.0);
}

float numberPlate(vec2 p, float value, float spacing, float align, float size) {
  float width = numberWidth(value, spacing, size);
  vec2 center = vec2((width * (0.5 - align)), (size * 0.76));
  vec2 half_ = vec2(((width * 0.5) + 3.5), ((size * 0.55) + 2.0));
  vec2 q = ((abs((p - center)) - half_) + vec2(3.0));
  float distance = _flow3_shared(q, q.x, q.y);
  float _cse0 = pixelWidth();
  return (1.0 - smoothstep(((-_cse0) * 0.5), (_cse0 * 0.5), distance));
}

float coarseTickOpacity(float value, vec3 levels) {
  float multiple = (value / levels.x);
  return ((abs((multiple - floor((multiple + 0.5)))) < 0.001) ? 1.0 : (1.0 - levels.z));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
}

float line(vec2 p, vec2 a, vec2 b, float radius) {
  vec2 d = (b - a);
  vec2 _cse0 = (p - a);
  float t = clamp((dot(_cse0, d) / max(dot(d, d), 0.00001)), 0.0, 1.0);
  float aa = (pixelWidth() * 0.5);
  return (1.0 - smoothstep(max(0.0, (radius - aa)), (radius + aa), length((_cse0 - (t * d)))));
}

vec3 _spec0_dataTickLevels(float lower, float span, float pixels, float logarithmic) {
  float size = u.labelStyle.x;
  float rough = (((span * size) * 4.0) / max(pixels, 1.0));
  float gap = (size * 2.6);
  bool _cse0 = (logarithmic > 0.0);
  float low = (_cse0 ? pow(10.0, lower) : lower);
  float _cse1 = (lower + span);
  float high = (_cse0 ? pow(10.0, _cse1) : _cse1);
  float _sel6;
  if (_cse0) {
    _sel6 = max((low * (pow(10.0, min(rough, 20.0)) - 1.0)), 1e-30);
  } else {
    _sel6 = rough;
  }
  float step = _sel6;
  gap = max((size * 3.5), (max(numberWidth(low, step, size), numberWidth(high, step, size)) + (size * 1.3)));
  float raw = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if ((_cse0 && (span >= 2.0))) {
    raw = max(raw, 1.0);
  }
  return tickLevels(raw);
}

vec3 _spec1_dataTickLevels(float lower, float span, float pixels, float logarithmic) {
  float size = u.labelStyle.x;
  float gap = (size * 2.6);
  float raw = ((span * gap) / max((pixels * u.labelStyle.y), 1.0));
  if (((logarithmic > 0.0) && (span >= 2.0))) {
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
  vec2 _licm6 = vec2(1.0, 0.0);
  float _licm7 = u.labelStyle.x;
  float _licm8 = u.resolution.x;
  float _licm9 = u.labelStyle.z;
  float _licm10 = u.labelStyle.w;
  vec2 _licm13 = vec2(0.0, 1.0);
  float _licm14 = (u.labelStyle.x * 1.6);
  float _licm15 = (u.labelStyle.x * 2.2);
  float _licm18 = (u.labelStyle.x * 0.75);
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  vec2 size = extent();
  vec2 lo = vec2(76.0, 42.0);
  vec2 hi = (lo + size);
  bool inside = ((((p.x >= 76.0) && (p.x <= hi.x)) && (p.y >= 42.0)) && (p.y <= hi.y));
  vec2 value = (u.lower + (vec2(((p.x - 76.0) / size.x), (1.0 - ((p.y - 42.0) / size.y))) * u.span));
  vec3 xLevels = _spec0_dataTickLevels(_licm0, _licm1, size.x, u.logarithmic.x);
  vec3 yLevels = _spec1_dataTickLevels(_licm2, _licm3, size.y, u.logarithmic.y);
  float grid = 0.0;
  vec3 labels = vec3(0.0);
  vec2 _lc0 = vec2(hi.x, 42.0);
  vec2 _lc1 = vec2(76.0, hi.y);
  float coverage = max(max(line(p, lo, _lc0, 0.5), line(p, lo, _lc1, 0.5)), max(line(p, hi, _lc1, 0.5), line(p, hi, _lc0, 0.5)));
  bool _cse0 = (u.logarithmic.x > 0.0);
  bool _cse1 = (u.logarithmic.y > 0.0);
  for (int level = 0; (level < 2); level = (level + 1)) {
    bool _gv0 = (level == 0);
    vec2 spacing = (_gv0 ? vec2(xLevels.x, yLevels.x) : vec2(xLevels.y, yLevels.y));
    vec2 nearest = (floor(((value / spacing) + 0.5)) * spacing);
    vec2 tick = (lo + (vec2(((nearest.x - _licm0) / _licm1), (1.0 - ((nearest.y - _licm2) / _licm3))) * size));
    vec2 _sel0;
    if (_gv0) {
      _sel0 = vec2(tickOpacity(nearest.x, xLevels), tickOpacity(nearest.y, yLevels));
    } else {
      _sel0 = vec2(coarseTickOpacity(nearest.x, xLevels), coarseTickOpacity(nearest.y, yLevels));
    }
    vec2 weights = _sel0;
    grid = max(grid, max((line(p, vec2(tick.x, 42.0), vec2(tick.x, hi.y), 0.5) * weights.x), (line(p, vec2(76.0, tick.y), vec2(hi.x, tick.y), 0.5) * weights.y)));
    if (_licm4) {
      if (((tick.x >= 75.99) && (tick.x <= (hi.x + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2(tick.x, (hi.y + 2.5)), _licm6, 2.5, 1.0) * weights.x));
        float n = (_cse0 ? pow(10.0, nearest.x) : nearest.x);
        float step = (_cse0 ? max((n * (pow(10.0, xLevels.x) - 1.0)), 1e-30) : xLevels.x);
        float width = numberWidth(n, step, _licm7);
        float _lc2 = (width * 0.5);
        float room = min(((tick.x - _lc2) - 4.0), (((_licm8 - tick.x) - _lc2) - 4.0));
        float fit = smoothstep((width + 6.0), (width + 14.0), ((spacing.x / _licm1) * size.x));
        float opacity = ((weights.x * fit) * smoothstep(0.0, 5.0, room));
        vec2 local = (p - vec2(tick.x, (hi.y + 6.0)));
        labels = max(labels, (vec3(tickNumberLayers(local, n, step, 0.5, _licm7, _licm9), (numberPlate(local, n, step, 0.5, _licm7) * _licm10)) * opacity));
      }
      if (((tick.y >= 41.99) && (tick.y <= (hi.y + 0.01)))) {
        coverage = max(coverage, (tickMark(p, vec2(73.5, tick.y), _licm13, 2.5, 1.0) * weights.y));
        float n_1 = (_cse1 ? pow(10.0, nearest.y) : nearest.y);
        float step_1 = (_cse1 ? max((n_1 * (pow(10.0, yLevels.x) - 1.0)), 1e-30) : yLevels.x);
        float width_1 = numberWidth(n_1, step_1, _licm7);
        float fit_1 = smoothstep(_licm14, _licm15, ((spacing.y / _licm3) * size.y));
        float opacity_1 = ((weights.y * fit_1) * smoothstep(0.0, 5.0, (63.0 - width_1)));
        vec2 local_1 = (p - vec2(67.0, (tick.y - _licm18)));
        labels = max(labels, (vec3(tickNumberLayers(local_1, n_1, step_1, 1.0, _licm7, _licm9), (numberPlate(local_1, n_1, step_1, 1.0, _licm7) * _licm10)) * opacity_1));
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
  if (((u.focus > 0.0) && (min(min(p.x, p.y), min((_licm8 - p.x), (u.resolution.y - p.y))) < 2.0))) {
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

struct _spec3_result {
  float distance;
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
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
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

float _flow7_shared(vec2 _flow4_input, vec2 _flow5_input, vec2 _flow6_input) {
  return clamp((dot((_flow4_input - _flow5_input), _flow6_input) / max(dot(_flow6_input, _flow6_input), 1e-20)), 0.0, 1.0);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  float t = _flow7_shared(p, a, delta);
  return length(((p - a) - (t * delta)));
}

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
  float along = _flow7_shared(p, a, delta);
  float parameter = mix(_licm1, parameters.y, along);
  float on = ((s.dash > 1.5) ? 0.0 : 0.6);
  float phase = ((parameter - _licm0) / period);
  float cycle = floor(((phase - (on * 0.5)) + 0.5));
  float difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    float _sel1;
    if ((fract(phase) <= on)) {
      _sel1 = _cse0;
    } else {
      _sel1 = 100000000000000000000.0;
    }
    return _sel1;
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
  return ((all(lessThanEqual(abs(p), vec2(3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
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

_spec3_result _spec2_seriesHit(vec2 p, float search) {
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
      } else if ((all(greaterThanEqual(p, (min(point, other) - vec2(radius)))) && all(lessThanEqual(p, (max(point, other) + vec2(radius)))))) {
        float _sel7;
        if (_cse0) {
          _sel7 = stepDistance(p, a, b, period);
        } else {
          _sel7 = pathDistance(p, point, other, vec2(a.z, b.z), period);
        }
        candidate = (_sel7 - _cse1);
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
    }
  }
  float _spec5_field = distance;
  return _spec3_result(_spec5_field);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 seriesFragment_impl(Surface v) {
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  vec2 _cse0 = vec2(76.0, 42.0);
  if ((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent()))))) {
    return vec4(0.0);
  }
  _spec3_result hit = _spec2_seriesHit(p, 0.0);
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
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
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

float _flow7_shared(vec2 _flow4_input, vec2 _flow5_input, vec2 _flow6_input) {
  return clamp((dot((_flow4_input - _flow5_input), _flow6_input) / max(dot(_flow6_input, _flow6_input), 1e-20)), 0.0, 1.0);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  float t = _flow7_shared(p, a, delta);
  return length(((p - a) - (t * delta)));
}

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
  float along = _flow7_shared(p, a, delta);
  float parameter = mix(_licm1, parameters.y, along);
  float on = ((s.dash > 1.5) ? 0.0 : 0.6);
  float phase = ((parameter - _licm0) / period);
  float cycle = floor(((phase - (on * 0.5)) + 0.5));
  float difference = (parameters.y - _licm1);
  if ((abs(difference) < 1e-20)) {
    float _sel1;
    if ((fract(phase) <= on)) {
      _sel1 = _cse0;
    } else {
      _sel1 = 100000000000000000000.0;
    }
    return _sel1;
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
  return ((all(lessThanEqual(abs(p), vec2(3.4028234e+38))) && ((u.logarithmic.x <= 0.0) || (p.x > 0.0))) && ((u.logarithmic.y <= 0.0) || (p.y > 0.0)));
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
      } else if ((all(greaterThanEqual(p, (min(point, other) - vec2(radius)))) && all(lessThanEqual(p, (max(point, other) + vec2(radius)))))) {
        float _sel2;
        if (_cse0) {
          _sel2 = stepDistance(p, a, b, period);
        } else {
          _sel2 = pathDistance(p, point, other, vec2(a.z, b.z), period);
        }
        candidate = (_sel2 - _cse1);
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
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
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

float _flow3_shared(vec2 _flow0_input, float _flow1_input, float _flow2_input) {
  return ((length(max(_flow0_input, vec2(0.0))) + min(max(_flow1_input, _flow2_input), 0.0)) - 3.0);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

void main() {
  vec2 p = (vec2(uv.x, (1.0 - uv.y)) * u.resolution);
  vec2 q = ((abs((textLocal(p) - text.box.xy)) - text.box.zw) + vec2(3.0));
  float distance = _flow3_shared(q, q.x, q.y);
  float aa = (pixelWidth() * 0.5);
  float coverage = (1.0 - smoothstep((-aa), aa, distance));
  float border = (1.0 - smoothstep((-0.7 - aa), (-0.7 + aa), distance));
  vec3 fill = mix(u.background.rgb, vec3(0.995), 0.8);
  _ret = vec4(mix(vec3(0.8, 0.84, 0.9), fill, border), (coverage * 0.94));
}
`,blocks:{u:"DataUniforms",text:"TextUniforms",font:"FontUniforms"},samplers:{}},fieldFragment:{fragment:`#version 300 es
precision highp float;
precision highp int;

struct Surface {
  vec4 position;
  vec2 uv;
};

struct _spec8_result {
  float value;
  bool valid;
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

float pixelWidth() {
  return (1.0 / max(font.pixelRatio, 0.0001));
}

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
}

float fieldAt(int column, int row) {
  uint x = uint(clamp(column, 0, (int(field.shape.y) - 1)));
  uint y = uint(clamp(row, 0, (int(field.shape.x) - 1)));
  return _sfetch(points, int(((y * field.shape.y) + x)));
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
    return vec4(0.0);
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

uvec2 _flow11_shared(vec2 _flow8_input, uint _flow9_input, uint _flow10_input) {
  return _f2u(clamp(floor((_flow8_input + vec2(0.5))), vec2(0.0), vec2((float(_flow9_input) - 1.0), (float(_flow10_input) - 1.0))));
}

_spec8_result _spec7_fieldSample(vec2 pixel) {
  vec2 _cse0 = extent();
  vec2 position = ((pixel - vec2(76.0, 42.0)) / _cse0);
  vec2 scaled = (u.lower + (vec2(position.x, (1.0 - position.y)) * u.span));
  bool _cse1 = (u.logarithmic.x > 0.0);
  bool _cse2 = (u.logarithmic.y > 0.0);
  vec2 value = vec2((_cse1 ? pow(10.0, scaled.x) : scaled.x), (_cse2 ? pow(10.0, scaled.y) : scaled.y));
  vec2 _cse3 = (field.bounds.zw - field.bounds.xy);
  vec2 fraction = ((value - field.bounds.xy) / _cse3);
  float _cse7 = float(field.shape.x);
  vec2 _cse4 = vec2(float(field.shape.y), _cse7);
  vec2 coordinate = ((fraction * _cse4) - vec2(0.5));
  if ((field.origin != 0u)) {
    coordinate.y = ((_cse7 - 1.0) - coordinate.y);
  }
  uvec2 nearest = _flow11_shared(coordinate, field.shape.y, field.shape.x);
  uint index = ((nearest.y * field.shape.y) + nearest.x);
  float sample_ = _sfetch(points, int(index));
  vec2 _cse5 = vec2(0.0);
  vec2 gradient = _cse5;
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
    float _cse6 = log(10.0);
    vec2 dataRate = ((u.span / _cse0) * vec2((_cse1 ? (value.x * _cse6) : 1.0), (_cse2 ? (value.y * _cse6) : 1.0)));
    gradient = (((vec2(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  float _spec10_field = sample_;
  bool _spec11_field = ((all(greaterThanEqual(fraction, _cse5)) && all(lessThanEqual(fraction, vec2(1.0)))) && (abs(sample_) <= 3.4028234e+38));
  vec2 _spec13_field = gradient;
  return _spec8_result(_spec10_field, _spec11_field, _spec13_field);
}
in vec2 uv;
layout(location = 0) out vec4 _ret;

vec4 fieldFragment_impl(Surface v) {
  vec2 p = (vec2(v.uv.x, (1.0 - v.uv.y)) * u.resolution);
  _spec8_result sample_ = _spec7_fieldSample(p);
  float magnitude = max(abs(sample_.gradient.x), abs(sample_.gradient.y));
  float rate = ((magnitude > 0.0) ? (magnitude * length((sample_.gradient / max(magnitude, 1e-30)))) : 0.0);
  vec2 _cse0 = vec2(76.0, 42.0);
  if (((any(lessThan(p, _cse0)) || any(greaterThan(p, (_cse0 + extent())))) || (sample_.valid == false))) {
    return vec4(0.0);
  }
  vec4 tint = fieldColors(sample_.value);
  float distance = (nearestLevel(sample_.value) / max(rate, 1e-30));
  float aa = (pixelWidth() * 0.5);
  float _sel3;
  if (((rate > 1e-30) && (rate < 3.4028234e+38))) {
    float _cse1 = (field.lineWidth * 0.5);
    _sel3 = (1.0 - smoothstep(max(0.0, (_cse1 - aa)), (_cse1 + aa), distance));
  } else {
    _sel3 = 0.0;
  }
  float coverage = ((field.mode == 1u) ? _sel3 : 1.0);
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

vec2 extent() {
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
}

float fieldAt(int column, int row) {
  uint x = uint(clamp(column, 0, (int(field.shape.y) - 1)));
  uint y = uint(clamp(row, 0, (int(field.shape.x) - 1)));
  return _sfetch(points, int(((y * field.shape.y) + x)));
}

uvec2 _flow11_shared(vec2 _flow8_input, uint _flow9_input, uint _flow10_input) {
  return _f2u(clamp(floor((_flow8_input + vec2(0.5))), vec2(0.0), vec2((float(_flow9_input) - 1.0), (float(_flow10_input) - 1.0))));
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
  float _cse7 = float(field.shape.x);
  vec2 _cse4 = vec2(float(field.shape.y), _cse7);
  vec2 coordinate = ((fraction * _cse4) - vec2(0.5));
  if ((field.origin != 0u)) {
    coordinate.y = ((_cse7 - 1.0) - coordinate.y);
  }
  uvec2 nearest = _flow11_shared(coordinate, field.shape.y, field.shape.x);
  uint index = ((nearest.y * field.shape.y) + nearest.x);
  float sample_ = _sfetch(points, int(index));
  vec2 _cse5 = vec2(0.0);
  vec2 gradient = _cse5;
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
    float _cse6 = log(10.0);
    vec2 dataRate = ((u.span / _cse0) * vec2((_cse1 ? (value.x * _cse6) : 1.0), (_cse2 ? (value.y * _cse6) : 1.0)));
    gradient = (((vec2(mix((b - a), (d - c), t.y), mix((c - a), (d - b), t.x)) * _cse4) / _cse3) * dataRate);
  }
  return FieldSample(sample_, ((all(greaterThanEqual(fraction, _cse5)) && all(lessThanEqual(fraction, vec2(1.0)))) && (abs(sample_) <= 3.4028234e+38)), index, gradient);
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
    return vec4(0.0);
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
  int d = (b == 0 || (a == int(0x80000000u) && b == -1)) ? 1 : b;
  return a - (a / d) * d;
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

float boxDistance(vec2 p, vec2 a, vec2 b) {
  vec2 q = (abs((p - ((a + b) * 0.5))) - (abs((b - a)) * 0.5));
  return (length(max(q, vec2(0.0))) + min(max(q.x, q.y), 0.0));
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
    return vec4(0.0);
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
  float _cse0 = (u.resolution.x - 40.0);
  vec2 lo = vec2(_cse0, 58.0);
  vec2 hi = (lo + vec2(10.0, height));
  float fraction = clamp((1.0 - ((p.y - 58.0) / height)), 0.0, 1.0);
  float value = mix(_licm0, _licm1, fraction);
  vec4 tint = fieldColors(value);
  float distance = boxDistance(p, lo, hi);
  float aa = (pixelWidth() * 0.5);
  float coverage = ((1.0 - smoothstep((-aa), aa, distance)) * tint.a);
  vec2 layers = vec2(0.0);
  float _licm6 = (_cse0 - 5.0);
  for (int i = 0; (i < 3); i = (i + 1)) {
    float t = (float(i) * 0.5);
    float n = mix(_licm0, _licm1, t);
    vec2 local = (p - vec2(_licm6, ((58.0 + ((1.0 - t) * height)) - _licm2)));
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
  return max((u.resolution - vec2(100.0, 104.0)), vec2(1.0));
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

float _flow7_shared(vec2 _flow4_input, vec2 _flow5_input, vec2 _flow6_input) {
  return clamp((dot((_flow4_input - _flow5_input), _flow6_input) / max(dot(_flow6_input, _flow6_input), 1e-20)), 0.0, 1.0);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 delta = (b - a);
  float t = _flow7_shared(p, a, delta);
  return length(((p - a) - (t * delta)));
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
    return vec4(0.0);
  }
  vec2 direction = (_gv0 / lengthToTarget);
  vec2 normal = vec2((-direction.y), direction.x);
  float size = min(text.arrow.z, (lengthToTarget * 0.5));
  vec2 back = (target - (direction * size));
  float aa = (pixelWidth() * 0.5);
  float _sel4;
  if ((size > 0.0)) {
    vec2 _lc0 = ((normal * size) * 0.4);
    _sel4 = (1.0 - smoothstep((-aa), aa, triangleDistance(p, target, (back + _lc0), (back - _lc0))));
  } else {
    _sel4 = 0.0;
  }
  float head = _sel4;
  float _sel5;
  if ((text.arrow.y > 0.0)) {
    _sel5 = line(p, start, back, (text.arrow.y * 0.5));
  } else {
    _sel5 = 0.0;
  }
  float shaft = _sel5;
  return vec4(text.color.rgb, (text.color.a * max(shaft, head)));
}

void main() {
  Surface v;
  v.position = gl_FragCoord;
  v.uv = uv;
  _ret = annotationFragment_impl(v);
}
`,blocks:{u:"DataUniforms",text:"TextUniforms",font:"FontUniforms"},samplers:{}}}}};var Hn={color:{srcFactor:"src-alpha",dstFactor:"one-minus-src-alpha",operation:"add"},alpha:{srcFactor:"one",dstFactor:"one-minus-src-alpha",operation:"add"}};function un(a,e){return(a>=12592&&a<=55203?16:10)*e/16}function Ye(a,e){return Array.from(a).reduce((t,n)=>t+un(n.codePointAt(0),e),0)}function Kn(a,e,t,n,i=0,r=!1){let o=[],s=-Ye(a,n)*i;for(let d of a){let l=d.codePointAt(0);for(let[c,f]of[[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])o.push(e+(r?0:s),t+(r?-s:0),l,n,r?1:0,c,f);s+=un(l,n)}return new Float32Array(o)}var ve=class a{constructor(e,t,n,i){this.canvas=e;this.runtime=t;this.target=n;this.format=i;this.session=new he(t,e.ownerDocument.defaultView)}axes;series;text;labelPlate;picking;fieldPipeline;fieldPicking;colorBar;annotationLine;glyphs;fullGlyphs=!1;glyphUpgrade;program;samples=new Map;fields=new Map;destroyed=!1;session;get backend(){return this.runtime.tier}static async create(e,t="auto"){if(!["auto","webgpu","webgl2"].includes(t))throw new TypeError("Unknown plot backend.");let n=e.ownerDocument.defaultView,i=Ke,r=Ot();if(t!=="webgl2"){let l,c;try{l=await fe({prefer:["webgpu"],programs:[i]});let f=n.navigator.gpu.getPreferredCanvasFormat();c=new a(e,l,void 0,f),await c.initialize(r);let m=e.getContext("webgpu");if(!m)throw new Error("This canvas has no WebGPU context.");return m.configure({device:l.device,format:f,alphaMode:"premultiplied"}),c.target=m,c}catch(f){if(c?c.destroy():l?.destroy(),t==="webgpu")throw f}}let o=e.getContext("webgl2",{alpha:!0,antialias:!1});if(!o)throw new Error("TypePlot requires WebGPU or WebGL2 in this browser.");let s=await fe({device:o,programs:[i]}),d=new a(e,s,o,"rgba8unorm");try{return await d.initialize(r),d}catch(l){throw d.destroy(),l}}async initialize(e){this.program=this.runtime.load(Ke);let t=this.session.run(()=>Ee(this.runtime,!1,void 0,()=>!this.destroyed,e).then(r=>{this.glyphs=r}));await Promise.resolve();let i=(await Promise.allSettled([this.pipeline("axesFragment").then(r=>{this.axes=r}),this.pipeline("seriesFragment").then(r=>{this.series=r}),this.pipeline("textFragment","textVertex").then(r=>{this.text=r}),t,this.session.prepareData()])).find(r=>r.status==="rejected");if(i?.status==="rejected")throw i.reason}pipeline(e,t="surfaceVertex",n=!1){return this.session.run(()=>this.program.render({vertex:t,fragment:e,targets:n?["rgba32uint"]:[{format:this.format,blend:Hn}]}))}async prepareScene(e){let t=[this.ensureGlyphs(e)];!this.fieldPipeline&&e.axes.some(n=>n.fields.length)&&t.push(this.pipeline("fieldFragment").then(n=>{this.fieldPipeline=n})),!this.colorBar&&e.axes.some(n=>n.fields.some(i=>i.options.colorBar))&&t.push(this.pipeline("colorBarFragment").then(n=>{this.colorBar=n})),!this.labelPlate&&e.axes.some(n=>n.settings.labelBackground)&&t.push(this.pipeline("labelPlateFragment").then(n=>{this.labelPlate=n})),!this.annotationLine&&e.axes.some(n=>n.annotations.some(i=>i.options.arrow))&&t.push(this.pipeline("annotationFragment").then(n=>{this.annotationLine=n})),await Promise.all(t)}async ensureGlyphs(e){if(this.fullGlyphs)return;let t=/[\uac00-\ud7a3]/;(t.test(e.title??"")||e.axes.some(i=>[i.settings.title,i.settings.xLabel,i.settings.yLabel].some(r=>t.test(r??""))||i.series.some(r=>t.test(r.style.label))||i.annotations.some(r=>t.test(r.value))))&&(this.glyphUpgrade||(this.glyphUpgrade=this.session.run(()=>Ee(this.runtime,!0,this.glyphs,()=>!this.destroyed)).then(()=>{this.fullGlyphs=!0}).finally(()=>{this.glyphUpgrade=void 0})),await this.glyphUpgrade)}uniform(e,t,n,i,r){return{resolution:[t,n],lower:[e.bounds.x[0],e.bounds.y[0]],span:[e.bounds.x[1]-e.bounds.x[0],e.bounds.y[1]-e.bounds.y[0]],logarithmic:[e.settings.xScale==="log"?1:0,e.settings.yScale==="log"?1:0],grid:e.gridOpacity,labelStyle:[e.settings.labelSize??11,e.settings.tickDensity??1,e.settings.labelHalo??.8,e.settings.labelBackground?1:0],layer:0,background:i,legend:r,focus:e.focused?1:0}}sampleResource(e){let t=this.samples.get(e.key);if(t?.data===e.data&&t.parameter===e.style.parameter)return t;t&&this.release(t.points);let{x:n,y:i}=e.data,r=n.every((u,v)=>Number.isFinite(u)&&(v===0||u>n[v-1])),o=e.style.parameter==="x"||e.style.parameter==="auto"&&r,s=new Float32Array(n.length*8),d=1/0,l=-1/0,c=1/0,f=1/0,m=-1/0,p=-1/0;for(let u=0;u<n.length;u++){let v=o?n[u]:u,y=[0,0,0,0];e.kind==="bar"?y=[e.edges?.[u]??n[u]-e.style.width/2,e.edges?.[u+1]??n[u]+e.style.width/2,0,0]:e.kind==="barh"?y=[i[u]-e.style.width/2,i[u]+e.style.width/2,0,0]:e.kind==="fill"?y[0]=e.data.lower[u]:e.kind==="error"&&(y=[e.data.xLow?.[u]??NaN,e.data.xHigh?.[u]??NaN,e.data.yLow?.[u]??NaN,e.data.yHigh?.[u]??NaN]),s.set([n[u],i[u],v,1,...y],u*8),Number.isFinite(n[u])&&Number.isFinite(i[u])&&(c=Math.min(c,n[u]),m=Math.max(m,n[u]),f=Math.min(f,i[u]),p=Math.max(p,i[u])),Number.isFinite(v)&&(d=Math.min(d,v),l=Math.max(l,v))}let h={data:e.data,points:this.session.array(s),count:n.length,ordered:r,period:Math.max((l-d)/60,1e-20),parameter:e.style.parameter,parameterRange:Number.isFinite(l-d)?l-d:0,xParameter:o,bounds:Number.isFinite(c)?[c,f,m,p]:[0,0,0,0]};return this.samples.set(e.key,h),h}release(e){this.session.release(e)}prune(e){let t=new Set(e.axes.flatMap(i=>i.series.map(r=>r.key)));for(let[i,r]of this.samples)t.has(i)||(this.release(r.points),this.samples.delete(i));let n=new Set(e.axes.flatMap(i=>i.fields.map(r=>r.key)));for(let[i,r]of this.fields)n.has(i)||(this.release(r.points),this.fields.delete(i))}fieldResource(e){let t=JSON.stringify(e.options.levels),n=this.fields.get(e.key);if(n?.values===e.values&&n.levels===t)return n.points;n&&this.release(n.points);let i=new Float32Array(e.values.length+e.options.levels.length);i.set(e.values),i.set(e.options.levels,e.values.length);let r=this.session.array(i);return this.fields.set(e.key,{values:e.values,levels:t,points:r}),r}drawField(e,t,n,i,r,o=!1){let s=n.options;if(!s.visible||s.alpha<=0)return;let[d,l,c,f]=s.extent,m={bounds:[d,c,l,f],range:s.valueRange,shape:s.shape,palette:le.indexOf(s.colorMap),origin:s.origin==="upper"?1:0,mode:["image","contour","contourf"].indexOf(n.mode),interpolation:s.interpolation==="linear"?1:0,alpha:s.alpha,levels:s.levels.length,lineWidth:s.lineWidth};e.draw(r?this.fieldPicking:o?this.colorBar:this.fieldPipeline,{u:t,field:m,points:this.fieldResource(n),...r?{}:{font:{pixelRatio:i}},...o?{glyphAtlas:this.glyphs}:{},...r?{query:r}:{}},{count:3})}drawSeries(e,t,n,i,r,o){let s=i.style;if(!s.visible||s.alpha<=0)return;let d=j(s.color,this.canvas.ownerDocument);if(d[3]*=s.alpha,d[3]<=0)return;let l=c=>{let f=this.sampleResource(i);if(!f.count)return;let m={color:d,kind:c,width:c===1?s.markerSize:s.lineWidth,dash:c===0||c===4?s.lineStyle==="--"?1:s.lineStyle===":"?2:0:0,marker:s.marker==="s"?1:0,count:f.count,ordered:f.ordered&&(t.settings.xScale!=="log"||i.data.x[0]>0)?1:0,period:s.dashPeriod||f.period,offset:s.dashOffset,automatic:s.dashPeriod>0?0:1,parameterRange:f.parameterRange,xParameter:f.xParameter?1:0,dataBounds:f.bounds,baseline:s.baseline,capSize:s.capSize,where:["pre","post","mid"].indexOf(s.where)};e.draw(o?this.picking:this.series,{u:n,s:m,points:f.points,font:{pixelRatio:r},...o?{query:o}:{}},{count:3})};i.kind==="bar"?l(2):i.kind==="barh"?l(3):i.kind==="fill"?l(6):((i.kind==="line"||i.kind==="step"||i.kind==="error")&&s.lineStyle!=="none"&&l(i.kind==="step"?4:0),i.kind==="stem"&&l(5),i.kind==="error"&&l(7),s.marker!=="none"&&l(1))}pick(e,t,n,i){return this.session.run(()=>this.pickFrame(e,t,n,i))}async pickFrame(e,t,n,i){if(this.destroyed)throw new Error("This renderer has been destroyed.");if(!Array.isArray(n)||n.length!==2||!n.every(Number.isFinite)||!Number.isFinite(i)||i<0||i>64)throw new RangeError("Picking needs a finite CSS-pixel position and radius between zero and 64.");let r=e.axes[t];if(!r)throw new RangeError("Unknown subplot.");let o=[];if(!this.picking&&r.series.length&&o.push(this.pipeline("pickFragment","surfaceVertex",!0).then(c=>{this.picking=c})),!this.fieldPicking&&r.fields.length&&o.push(this.pipeline("fieldPickFragment","surfaceVertex",!0).then(c=>{this.fieldPicking=c})),await Promise.all(o),this.destroyed)return null;let s=e.width/e.cols,d=(e.height-(e.titleHeight??0))/e.rows;if(n[0]<0||n[1]<0||n[0]>s||n[1]>d)return null;let l=this.runtime.texture({size:[1,1],format:"rgba32uint"});try{let c=this.uniform(r,s,d,j(e.background??"#fff",this.canvas.ownerDocument),[0,0,0,0]),f=this.runtime.frame();f.pass({color:[{target:l,clear:[0,0,0,0]}]},h=>{r.fields.forEach((u,v)=>this.drawField(h,c,u,1,{pixel:n,radius:i,series:v})),r.series.forEach((u,v)=>this.drawSeries(h,r,c,u,1,{pixel:n,radius:i,series:v+r.fields.length}))}),await f.submit();let m=await l.read(),p=new Uint32Array(m.buffer,m.byteOffset,4);return p[3]?{series:p[0]-1,index:p[1]-1}:null}finally{l.destroy()}}scene(e,t,n,i){let r=n/t.width,o=i/t.height,s=t.title?t.titleHeight??42:0,d=t.width/t.cols,l=(t.height-s)/t.rows,c=this.canvas.ownerDocument,f=j(t.background??"#fff",c),m=[.06,.09,.16,1],p=(h,u,v,y,S,M=0,D=!1,V=m,x)=>{if(!u)return;let _=h,L=Ye(u,S),g=D?[v+S*.76,y-L*(.5-M)]:[v+L*(.5-M),y+S*.76],B=D?[S*.55+2,L*.5+3.5]:[L*.5+3.5,S*.55+2],wn=[...g,...B],xe={color:V,box:wn,anchor:x?[...x.position,1,x.options.rotation]:[0,0,0,0],offset:x?.options.offset??[0,0],target:x?.target??[0,0],arrow:x?[x.options.arrow?1:0,x.options.lineWidth,x.options.headSize,0]:[0,0,0,0]};x?.options.arrow&&e.draw(this.annotationLine,{u:h,text:xe,font:{pixelRatio:Math.min(r,o)}},{count:3}),_.labelStyle[3]>0&&u!=="\u2014"&&e.draw(this.labelPlate,{u:h,text:xe,font:{pixelRatio:Math.min(r,o)}},{count:3});let Je=Kn(u,v,y,S,M,D);e.draw(this.text,{u:h,text:xe,glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,o)}},{vertices:Je,count:Je.length/7})};if(t.axes.forEach((h,u)=>{let v=Math.round(u%t.cols*d*r),y=Math.round((u%t.cols+1)*d*r),S=Math.round((s+Math.floor(u/t.cols)*l)*o),M=Math.round((s+(Math.floor(u/t.cols)+1)*l)*o);e.setViewport(v,S,y-v,M-S),e.setScissorRect(v,S,y-v,M-S);let D=h.settings.legend?h.series.filter(g=>g.style.label&&!g.style.label.startsWith("_")):[],V=D.length?Math.min(d-120,Math.max(...D.map(g=>Ye(g.style.label,12)))+48):0,x=V>50?[d-32-V,50,V,D.length*22+12]:[0,0,0,0],_=this.uniform(h,d,l,f,x);e.draw(this.axes,{u:_,glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,o)}},{count:3});for(let g of h.fields)this.drawField(e,_,g,Math.min(r,o));for(let g of h.series)this.drawSeries(e,h,_,g,Math.min(r,o));for(let g of h.annotations){let B=j(g.options.color,c);B[3]*=g.options.alpha,p(_,g.value,0,0,g.options.fontSize,["left","center","right"].indexOf(g.options.align)*.5,!1,B,g)}e.draw(this.axes,{u:{..._,layer:1},glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,o)}},{count:3}),p(_,h.settings.title??"",(76+d-24)/2,6,14,.5);let L=[...h.fields].reverse().find(g=>g.options.colorBar&&g.options.visible);L&&this.drawField(e,_,L,Math.min(r,o),void 0,!0),p(_,h.settings.xLabel??"",(76+d-24)/2,l-29,13,.5),p(_,h.settings.yLabel??"",2,(42+l-62)/2,13,.5,!0),x[2]>0&&D.forEach((g,B)=>{p(_,"\u2014",x[0]+8,x[1]+4+B*22,12,0,!1,j(g.style.color,c)),p(_,g.style.label,x[0]+36,x[1]+4+B*22,12)})}),t.title){e.setViewport(0,0,n,Math.round(s*o)),e.setScissorRect(0,0,n,Math.round(s*o));let h=this.uniform(t.axes[0],t.width,s,f,[0,0,0,0]);e.draw(this.axes,{u:{...h,grid:0},glyphAtlas:this.glyphs,font:{pixelRatio:Math.min(r,o)}},{count:3}),p(h,t.title,t.width/2,8,16,.5)}}render(e,t){return this.destroyed?Promise.resolve():this.session.run(()=>this.renderFrame(e,t))}async renderFrame(e,t){if(this.destroyed||(await this.prepareScene(e),this.destroyed))return;let n=Math.max(1,Math.round(e.width*t)),i=Math.max(1,Math.round(e.height*t));this.canvas.width!==n&&(this.canvas.width=n),this.canvas.height!==i&&(this.canvas.height=i);let r=this.runtime.frame();this.prune(e),r.pass({color:[{target:this.target,clear:[0,0,0,0]}]},o=>this.scene(o,e,n,i)),await this.session.present(r)}pixels(e,t){return this.session.run(()=>this.readPixels(e,t))}async readPixels(e,t){if(this.destroyed)throw new Error("This renderer has been destroyed.");if(await this.prepareScene(e),this.destroyed)throw new Error("This renderer has been destroyed.");let n=Math.ceil(e.width*t),i=Math.ceil(e.height*t),r=this.runtime.texture({size:[n,i],format:this.format});try{let o=this.runtime.frame();this.prune(e),o.pass({color:[{target:r,clear:[0,0,0,0]}]},d=>this.scene(d,e,n,i)),await o.submit();let s=await r.read();if(this.format.startsWith("bgra"))for(let d=0;d<s.length;d+=4){let l=s[d];s[d]=s[d+2],s[d+2]=l}for(let d=0;d<s.length;d+=4){let l=s[d+3];if(l>0&&l<255)for(let c=0;c<3;c++)s[d+c]=Math.min(255,Math.round(s[d+c]*255/l))}return{bytes:s,width:n,height:i}}finally{r.destroy()}}destroy(){this.destroyed||(this.destroyed=!0,this.backend==="webgpu"&&this.target?.unconfigure(),this.session.retire(()=>{this.glyphs?.destroy(),this.samples.clear(),this.fields.clear()}).catch(e=>console.error("[typeplot] Resource disposal failed",e)))}};async function mn(a,e,t){let n=new Uint8Array((e*4+1)*t);for(let l=0;l<t;l++)n.set(a.subarray(l*e*4,(l+1)*e*4),l*(e*4+1)+1);let i=new Uint8Array(await new Response(new Blob([n]).stream().pipeThrough(new CompressionStream("deflate"))).arrayBuffer()),r=new TextEncoder;function o(l,c){let f=new Uint8Array(c.length+12),m=new DataView(f.buffer);m.setUint32(0,c.length),f.set(r.encode(l),4),f.set(c,8);let p=4294967295;for(let h=4;h<c.length+8;h++){p^=f[h];for(let u=0;u<8;u++)p=p>>>1^(p&1?3988292384:0)}return m.setUint32(c.length+8,(p^4294967295)>>>0),f}let s=new Uint8Array(13),d=new DataView(s.buffer);return d.setUint32(0,e),d.setUint32(4,t),s[8]=8,s[9]=6,new Blob([new Uint8Array([137,80,78,71,13,10,26,10]),o("IHDR",s),o("IDAT",i),o("IEND",new Uint8Array)],{type:"image/png"})}var ye=class{constructor(e,t,n){this.canvas=e;this.query=t;this.report=n;this.win=e.ownerDocument.defaultView,e.addEventListener("pointermove",this.move),e.addEventListener("pointerleave",this.leave),e.addEventListener("pointerdown",this.down),e.addEventListener("pointercancel",this.cancel),e.addEventListener("click",this.click)}listeners={hover:new Set,click:new Set};win;frame=0;busy=!1;disposed=!1;generation=0;pending;pressed;dragged=!1;on(e,t){if(this.disposed)throw new Error("This picker has been destroyed.");if(!this.listeners[e]||typeof t!="function")throw new TypeError("Picking needs a hover/click event and a listener.");this.listeners[e].add(t)}off(e,t){this.listeners[e]?.delete(t)}position(e){let t=this.canvas.getBoundingClientRect();return[e.clientX-t.left,e.clientY-t.top]}emit(e,t,n,i){if(!this.disposed)for(let r of this.listeners[e])try{r({type:e,result:t,position:n,originalEvent:i})}catch(o){this.report(o)}}down=e=>{this.pressed=[e.clientX,e.clientY],this.dragged=!1,this.invalidate(),this.emit("hover",null,this.position(e),e)};cancel=()=>{this.pressed=void 0,this.dragged=!0,this.invalidate()};move=e=>{this.pressed&&e.buttons&&Math.hypot(e.clientX-this.pressed[0],e.clientY-this.pressed[1])>4&&(this.dragged=!0),!(e.buttons||e.pointerType==="touch"||!this.listeners.hover.size)&&(this.pending={event:e,position:this.position(e),generation:++this.generation},this.schedule())};schedule(){!this.disposed&&!this.busy&&this.pending&&!this.frame&&(this.frame=this.win.requestAnimationFrame(()=>{this.frame=0,this.flush()}))}async flush(){let e=this.pending;if(this.pending=void 0,!(!e||this.disposed||!this.listeners.hover.size)){this.busy=!0;try{let t=await this.query(e.position);e.generation===this.generation&&this.emit("hover",t,e.position,e.event)}catch(t){this.disposed||this.report(t)}finally{this.busy=!1,this.schedule()}}}leave=e=>{this.invalidate(),this.emit("hover",null,this.position(e),e)};click=e=>{if(e.button!==0||e.detail!==0&&this.dragged||!this.listeners.click.size)return;let t=this.position(e);this.query(t).then(n=>this.emit("click",n,t,e)).catch(n=>{this.disposed||this.report(n)})};invalidate(){this.generation++,this.pending=void 0}destroy(){this.disposed=!0,this.invalidate(),this.frame&&this.win.cancelAnimationFrame(this.frame),this.listeners.hover.clear(),this.listeners.click.clear(),this.canvas.removeEventListener("pointermove",this.move),this.canvas.removeEventListener("pointerleave",this.leave),this.canvas.removeEventListener("pointerdown",this.down),this.canvas.removeEventListener("pointercancel",this.cancel),this.canvas.removeEventListener("click",this.click)}};var I=3402823466e29;function Xe(a,e,t){let n=a.shape;if(!Array.isArray(n)||n.length!==2||n.some(u=>!Number.isSafeInteger(u)||u<1)||n[0]*n[1]>4194304)throw new RangeError("Field shape needs positive rows/columns with at most 4194304 values.");if(!e||e.length!==n[0]*n[1])throw new RangeError("Field data length must equal rows times columns.");let i=1/0,r=-1/0,o=Array.from(e,u=>{if(typeof u!="number"||Number.isFinite(u)&&Math.abs(u)>I)throw new RangeError("Field data must contain f32 numbers; NaN/Infinity are missing values.");return Number.isFinite(u)&&(i=Math.min(i,Math.fround(u)),r=Math.max(r,Math.fround(u))),u});if(i===1/0&&(i=0,r=1),i===r){let u=Math.max(Math.abs(i)*.05,.5);i=Math.max(-I,i-u),r=Math.min(I,r+u)}let s=a.extent??[-.5,n[1]-.5,-.5,n[0]-.5];if(!Array.isArray(s)||s.length!==4||!s.every(u=>Number.isFinite(u)&&Math.abs(u)<=3402823466e23)||!(s[1]>s[0]&&s[3]>s[2]))throw new RangeError("Field extent needs finite, increasing x/y ranges.");let d=a.valueRange??[i,r];if(!Array.isArray(d)||d.length!==2||!d.every(u=>Number.isFinite(u)&&Math.abs(u)<=I)||!(Math.fround(d[1])>Math.fround(d[0]))||d[1]-d[0]>I)throw new RangeError("valueRange needs two distinguishable, increasing f32 values.");let l=a.colorMap??"viridis";if(!le.includes(l))throw new TypeError("Unknown colorMap.");let c=a.interpolation??(t==="image"?"nearest":"linear"),f=a.origin??"upper";if(!["nearest","linear"].includes(c)||!["lower","upper"].includes(f))throw new TypeError("Unknown field interpolation or origin.");if(t==="contour"&&c!=="linear")throw new TypeError("Contour lines require linear interpolation.");let m=a.alpha??1,p=a.lineWidth??1;if(!Number.isFinite(m)||m<0||m>1||!Number.isFinite(p)||p<=0||p>32)throw new RangeError("Field alpha must be 0\u20131 and lineWidth must be 0\u201332 CSS pixels.");if(a.colorBar!==void 0&&typeof a.colorBar!="boolean"||a.visible!==void 0&&typeof a.visible!="boolean")throw new TypeError("colorBar and visible must be booleans.");let h=[];if(t!=="image"){let u=a.levels??10;if(typeof u=="number"){if(!Number.isSafeInteger(u)||u<2||u>64)throw new RangeError("levels must be 2\u201364 or an increasing array.");h=Array.from({length:u},(v,y)=>d[0]*(1-y/(u-1))+d[1]*y/(u-1))}else h=Array.from(u);if(h.length<2||h.length>64||h.some((v,y)=>!Number.isFinite(v)||Math.abs(v)>I||y>0&&Math.fround(v)<=Math.fround(h[y-1])))throw new RangeError("Contour levels must contain 2\u201364 distinguishable, increasing finite f32 values.")}return{values:o,options:{shape:[n[0],n[1]],extent:[s[0],s[1],s[2],s[3]],valueRange:[d[0],d[1]],colorMap:l,interpolation:c,origin:f,alpha:m,colorBar:a.colorBar??!1,levels:h,lineWidth:p,visible:a.visible??!0}}}function pn(a){return{...a,shape:[...a.shape],...a.extent?{extent:[...a.extent]}:{},...a.valueRange?{valueRange:[...a.valueRange]}:{},...a.levels!==void 0&&typeof a.levels!="number"?{levels:Array.from(a.levels)}:{}}}var W=class{constructor(e,t,n,i){this.axes=e;this.mode=i;let r=Xe(n,t,i);this.values=r.values,this.options=r.options,this.input=pn(n)}values;options;removed=!1;input;alive(){if(this.axes.assertAlive(),this.removed)throw new Error("This field has been removed.")}setData(e){this.alive();let t=Xe(this.input,e,this.mode);return this.values=t.values,this.options=t.options,this.axes.presentationChanged(),this}set(e){if(this.alive(),Object.hasOwn(e,"shape"))throw new TypeError("Recreate a field to change its shape.");let t=pn({...this.input,...e}),n=Xe(t,this.values,this.mode),i=this.input,r=this.options;this.input=t,this.options=n.options;try{e.extent?this.axes.refresh():this.axes.presentationChanged()}catch(o){throw this.input=i,this.options=r,o}return this}remove(){this.alive(),this.removed=!0,this.axes.removeField(this)}detach(){this.removed=!0}};function ge(a){if(!Array.isArray(a)||a.length!==2||a.some(e=>!Number.isFinite(e)||Math.abs(e)>3402823466e29))throw new RangeError("Annotation coordinates must be finite f32 pairs.");return[a[0],a[1]]}function hn(a){let e={color:"#334155",fontSize:12,alpha:1,align:"left",rotation:0,offset:[0,0],arrow:!1,lineWidth:1,headSize:6,...a};if(typeof e.color!="string"||!e.color.trim()||!["left","center","right"].includes(e.align)||typeof e.arrow!="boolean")throw new TypeError("Invalid annotation appearance.");for(let[t,n,i]of[["fontSize",6,96],["alpha",0,1],["lineWidth",0,32],["headSize",0,64]])if(!Number.isFinite(e[t])||e[t]<n||e[t]>i)throw new RangeError(`Annotation ${t} must be between ${n} and ${i}.`);if(!Number.isFinite(e.rotation))throw new RangeError("Annotation rotation must be finite.");return e.offset=ge(e.offset),e}var G=class{constructor(e,t,n,i={},r=n){this.axes=e;this.position=ge(n),this.target=ge(r),this.value=vn(t),this.options=hn(i)}position;target;value;options;removed=!1;alive(){if(this.axes.assertAlive(),this.removed)throw new Error("This annotation has been removed.")}setText(e){return this.alive(),this.value=vn(e),this.axes.redraw(),this}setPosition(e){return this.alive(),this.position=ge(e),this.axes.redraw(),this}set(e){return this.alive(),this.options=hn({...this.options,...e}),this.axes.redraw(),this}remove(){this.alive(),this.removed=!0,this.axes.removeAnnotation(this)}detach(){this.removed=!0}};function vn(a){if(typeof a!="string"||a.length>4096)throw new TypeError("Annotation text must be a string of at most 4096 characters.");return a}var yn=["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],F={left:76,right:24,top:42,bottom:62};function z(a,e){if(!Number.isFinite(a)||a<=0)throw new RangeError(`${e} must be positive and finite.`);return a}function gn(a,e,t){if(a.length!==2||!a.every(Number.isFinite)||!(a[1]>a[0])||!Number.isFinite((a[1]-a[0])*1e6))throw new RangeError(`${t} needs two finite, increasing endpoints within the supported range.`);if(e==="log"&&a[0]<=0)throw new RangeError(`${t} must be positive on a log axis.`);return[a[0],a[1]]}function te(a,e){return e==="log"?a>0?Math.log10(a):NaN:a}function bn(a,e){return e==="log"?10**a:a}function U(a,e){if(!a||!Number.isSafeInteger(a.length)||a.length<0)throw new TypeError(`${e} must be an array or typed array of numbers.`);return Array.from(a,t=>{if(typeof t!="number")throw new TypeError(`${e} must contain numbers. Use NaN for missing values.`);if(Number.isFinite(t)&&Math.abs(t)>3402823466e29)throw new RangeError(`${e} exceeds the finite f32 range used by TypeShade.`);return t})}function T(a,e){let t=U(a,"data");if(e===void 0)return{x:t.map((i,r)=>r),y:t};let n=typeof e=="function"?t.map(e):U(e,"y");if(t.length!==n.length)throw new RangeError("x and y must have the same length.");if(n.some(i=>typeof i!="number"))throw new TypeError("The plot callback must return numbers.");return{x:t,y:n}}function _n(a){return a!==null&&typeof a=="object"&&"length"in a}function xn(a,e,t){let n={label:a.label??"",color:a.color??yn[e%yn.length],lineWidth:a.lineWidth??1.8,lineStyle:a.lineStyle??"-",parameter:a.parameter??"auto",dashPeriod:a.dashPeriod??0,dashOffset:a.dashOffset??0,marker:a.marker??(t==="scatter"?"o":"none"),markerSize:a.markerSize??3.5,alpha:a.alpha??1,visible:a.visible??!0,baseline:a.baseline??0,capSize:a.capSize??4,where:a.where??"pre",width:a.width??.8};if(!["auto","x","index"].includes(n.parameter))throw new TypeError("Unknown curve parameter.");if(a.dashPeriod!==void 0&&z(a.dashPeriod,"dashPeriod"),!Number.isFinite(n.dashOffset))throw new RangeError("dashOffset must be finite.");if(z(n.lineWidth,"lineWidth"),z(n.markerSize,"markerSize"),z(n.width,"width"),!Number.isFinite(n.alpha)||n.alpha<0||n.alpha>1)throw new RangeError("alpha must be between zero and one.");if(!["-","--",":","none"].includes(n.lineStyle))throw new TypeError("Unknown lineStyle.");if(!["o","s","none"].includes(n.marker))throw new TypeError("Unknown marker.");if(typeof n.visible!="boolean")throw new TypeError("visible must be a boolean.");if(!Number.isFinite(n.baseline)||Math.abs(n.baseline)>3402823466e29)throw new RangeError("baseline must be a finite f32.");if(!Number.isFinite(n.capSize)||n.capSize<0||n.capSize>64)throw new RangeError("capSize must be between zero and 64 CSS pixels.");if(!["pre","post","mid"].includes(n.where))throw new TypeError("where must be pre, post or mid.");if(typeof n.color!="string"||!n.color.trim())throw new TypeError("color must be a CSS color.");return n}var Ze=class{constructor(e,t,n,i,r){this.axes=e;this.kind=t;this.data=n,this.style=xn(i,r,t)}data;style;edges;removed=!1;setData(e,t){if(this.axes.assertAlive(),this.removed)throw new Error("This series has been removed.");if(this.edges)throw new Error("Remove and recreate a histogram to change its bins.");if(this.kind==="fill"||this.kind==="error")throw new Error("Use setBandData or recreate error bars to update their full bounds.");let n=T(e,t),i=this.data;this.data=n;try{this.axes.refresh()}catch(r){throw this.data=i,r}return this}setBandData(e,t,n=0){if(this.axes.assertAlive(),this.removed||this.kind!=="fill")throw new Error("setBandData requires a live fillBetween series.");let i=T(e,t),r=typeof n=="number"?i.x.map(()=>n):U(n,"second");if(r.length!==i.x.length)throw new RangeError("Band arrays must have the same length.");let o=this.data;this.data={...i,lower:r};try{this.axes.refresh()}catch(s){throw this.data=o,s}return this}setStyle(e){if(this.axes.assertAlive(),this.removed)throw new Error("This series has been removed.");let t=xn({...this.style,dashPeriod:this.style.dashPeriod||void 0,...e},0,this.kind),n={...this.style};Object.assign(this.style,t);try{e.baseline!==void 0?this.axes.refresh():this.axes.presentationChanged()}catch(i){throw Object.assign(this.style,n),i}return this}setVisible(e){return this.setStyle({visible:e})}setAlpha(e){return this.setStyle({alpha:e})}remove(){this.axes.assertAlive(),!this.removed&&(this.removed=!0,this.axes.removeSeries(this))}detach(){this.removed=!0}},Qe=class{constructor(e,t){this.figure=e;this.index=t;let n=e.element.ownerDocument;this.canvas=n.createElement("canvas"),this.canvas.style.cssText="display:block;width:100%;height:100%;min-width:0;min-height:0;background:transparent",this.canvas.setAttribute("role","img"),this.canvas.setAttribute("aria-label",`Subplot ${t+1}`),this.canvas.title="Drag to pan; scroll to zoom; double-click or Home to reset; Escape stops inertia; arrow keys move; +/\u2212 zoom.",this.canvas.textContent="Chart. Provide a data table or description alongside this figure for access to the underlying values.",this.controller=Ct(this.canvas,{x:[0,1],y:[0,1]},()=>this.redraw(),e.options.interactive!==!1,()=>{let i=this.canvas.getBoundingClientRect();return{left:i.left+F.left,top:i.top+F.top,width:Math.max(1,i.width-F.left-F.right),height:Math.max(1,i.height-F.top-F.bottom)}},{inertia:e.options.inertia,doubleClickReset:e.options.doubleClickReset}),this.canvas.addEventListener("focus",this.redraw),this.canvas.addEventListener("blur",this.redraw),this.picker=new ye(this.canvas,i=>this.pick(i),i=>e.reportError(i))}canvas;controller;artists=[];fields=[];annotations=[];settings={};gridFade=new ce(0);fadeFrame=0;htmlLegend;legendSignature="";colorIndex=0;disposed=!1;picker;assertAlive(){if(this.disposed)throw new Error("This axes has been destroyed.")}plot(e,t,n={}){let i=typeof t=="function"||_n(t);return this.add("line",T(e,i?t:void 0),i?n:t??{})}scatter(e,t,n={}){return this.add("scatter",T(e,t),n)}bar(e,t,n={}){return this.add("bar",T(e,t),n)}barh(e,t,n={}){return this.add("barh",T(t,e),n)}step(e,t,n={}){return this.add("step",T(e,t),n)}stem(e,t,n={}){return this.add("stem",T(e,t),{marker:"o",...n})}fillBetween(e,t,n=0,i={}){let r=T(e,t),o=typeof n=="number"?r.x.map(()=>n):U(n,"second");if(o.length!==r.x.length)throw new RangeError("Band arrays must have the same length.");return this.add("fill",{...r,lower:o},{alpha:.3,...i})}errorbar(e,t,n={}){let i=T(e,t),r=(c,f)=>{let m=p=>{let h=typeof p=="number"||p===void 0?i.x.map(()=>p??0):U(p,f);if(h.length!==i.x.length||h.some(u=>!Number.isFinite(u)||u<0))throw new RangeError(`${f} must contain nonnegative finite errors matching the data.`);return h};return c&&typeof c=="object"&&"lower"in c?[m(c.lower),m(c.upper)]:[m(c),m(c)]},[o,s]=r(n.xError,"xError"),[d,l]=r(n.yError,"yError");return this.add("error",{...i,...n.xError!==void 0?{xLow:i.x.map((c,f)=>c-o[f]),xHigh:i.x.map((c,f)=>c+s[f])}:{},...n.yError!==void 0?{yLow:i.y.map((c,f)=>c-d[f]),yHigh:i.y.map((c,f)=>c+l[f])}:{}},{marker:"o",...n})}imshow(e,t){return this.addField(e,t,"image")}text(e,t,n,i={}){this.assertAlive();let r=new G(this,n,[e,t],i);return this.annotations.push(r),this.redraw(),r}annotate(e,t,n={}){this.assertAlive();let{xyText:i=t,...r}=n,o=new G(this,e,i,r,t);return this.annotations.push(o),this.redraw(),o}removeAnnotation(e){let t=this.annotations.indexOf(e);t>=0&&this.annotations.splice(t,1),this.redraw()}contour(e,t){return this.addField(e,t,"contour")}contourf(e,t){return this.addField(e,t,"contourf")}addField(e,t,n){this.assertAlive();let i=new W(this,e,t,n);this.fields.push(i);try{this.refresh()}catch(r){throw this.fields.pop(),r}return i}colorbar(e,t=!0){if(this.assertAlive(),!this.fields.includes(e))throw new Error("The colorbar field must belong to this axes.");for(let n of this.fields)n.set({colorBar:n===e&&t});return this}removeField(e){let t=this.fields.indexOf(e);t>=0&&this.fields.splice(t,1),this.refresh()}async pick(e,t=8){this.assertAlive();let n=await this.figure.pickAxes(this.index,e,t);this.assertAlive();let i=n?.artist;if(!n||!i)return null;if(i instanceof W){if(!this.fields.includes(i)||i.values!==n.data||n.index>=i.values.length)return null;let[r,o]=i.options.shape,[s,d,l,c]=i.options.extent,f=Math.floor(n.index/o),m=n.index%o;return{axes:this,series:i,index:n.index,x:s+(m+.5)/o*(d-s),y:l+(i.options.origin==="upper"?r-f-.5:f+.5)/r*(c-l),value:i.values[n.index]}}return!this.artists.includes(i)||i.data!==n.data||n.index>=i.data.x.length?null:{axes:this,series:i,index:n.index,x:i.data.x[n.index],y:i.data.y[n.index]}}on(e,t){return this.assertAlive(),this.picker.on(e,t),this}off(e,t){return this.picker.off(e,t),this}histogram(e,t={}){this.assertAlive();let n=U(e,"values").filter(Number.isFinite),i=t.bins??10,r;if(typeof i=="number"){if(!Number.isSafeInteger(i)||i<1||i>1e4)throw new RangeError("bins must be an integer from 1 to 10000, or increasing bin edges.");let l=1/0,c=-1/0;for(let f of n)l=Math.min(l,f),c=Math.max(c,f);if(n.length||(l=0,c=1),l===c){let f=Math.max(.5,Math.abs(l)*.05);l-=f,c+=f}gn([l,c],"linear","histogram range"),r=Array.from({length:i+1},(f,m)=>l+(c-l)*(m/i)),r[i]=c}else r=U(i,"bins");if(r.length<2||r.some((l,c)=>!Number.isFinite(l)||c>0&&l<=r[c-1]))throw new RangeError("Histogram edges must be finite and strictly increasing.");let o=new Array(r.length-1).fill(0),s=0;for(let l of n){if(l<r[0]||l>r[r.length-1])continue;let c=0,f=r.length-1;for(;f-c>1;){let m=c+f>>>1;l<r[m]?f=m:c=m}o[Math.min(c,o.length-1)]++,s++}if(t.density&&s)for(let l=0;l<o.length;l++)o[l]/=s*(r[l+1]-r[l]);let d=this.add("bar",{x:o.map((l,c)=>r[c]/2+r[c+1]/2),y:[...o]},t,r);return{counts:o,bins:[...r],series:d}}add(e,t,n,i){this.assertAlive();let r=new Ze(this,e,t,n,this.colorIndex);r.edges=i,this.artists.push(r);try{this.refresh()}catch(o){throw this.artists.pop(),o}return this.colorIndex++,r}set(e){this.assertAlive();let t={...this.settings,...e};for(let i of["x","y"]){let r=t[`${i}Scale`]??"linear";if(r!=="linear"&&r!=="log")throw new TypeError("Axis scale must be linear or log.");let o=t[`${i}Limits`];o&&(t[`${i}Limits`]=gn(o,r,`${i}Limits`))}for(let[i,r,o]of[["labelSize",6,24],["tickDensity",.25,4],["labelHalo",0,2]]){let s=t[i];if(s!==void 0&&(!Number.isFinite(s)||s<r||s>o))throw new RangeError(`${i} must be between ${r} and ${o}.`)}if(t.labelBackground!==void 0&&typeof t.labelBackground!="boolean")throw new TypeError("labelBackground must be a boolean.");if(t.legend!==void 0&&t.legend!==!0&&t.legend!==!1&&t.legend!=="html")throw new TypeError("legend must be a boolean or html.");let n=this.settings;this.settings=t;try{if(e.legend!==void 0&&this.updateHtmlLegend(),e.grid!==void 0){let i=this.canvas.ownerDocument.defaultView;this.gridFade.set(e.grid?1:0,i.performance.now(),i.matchMedia?.("(prefers-reduced-motion: reduce)").matches??!1)}["xLimits","yLimits","xScale","yScale"].some(i=>Object.hasOwn(e,i))?this.refresh():(this.updateLabel(),this.redraw())}catch(i){throw this.settings=n,i}return this}setTitle(e){return this.set({title:e})}setXLabel(e){return this.set({xLabel:e})}setYLabel(e){return this.set({yLabel:e})}setXLimits(e,t){return this.set({xLimits:[e,t]})}setYLimits(e,t){return this.set({yLimits:[e,t]})}setXScale(e){return this.set({xScale:e})}setYScale(e){return this.set({yScale:e})}grid(e=!0){return this.set({grid:e})}legend(e=!0){return this.assertAlive(),this.settings.legend===e?this:this.set({legend:e})}autoscale(){return this.assertAlive(),this.settings={...this.settings,xLimits:void 0,yLimits:void 0},this.refresh(),this}clear(){return this.assertAlive(),this.artists.forEach(e=>e.detach()),this.fields.forEach(e=>e.detach()),this.fields.length=0,this.annotations.forEach(e=>e.detach()),this.annotations.length=0,this.htmlLegend?.remove(),this.htmlLegend=void 0,this.artists.length=0,this.colorIndex=0,this.settings={},this.refresh(),this}reset(){return this.assertAlive(),this.controller.reset(),this}bounds(){this.assertAlive();let e=this.controller.bounds();return{x:e.x.map(t=>bn(t,this.settings.xScale??"linear")),y:e.y.map(t=>bn(t,this.settings.yScale??"linear"))}}removeSeries(e){let t=this.artists.indexOf(e);t>=0&&this.artists.splice(t,1),this.refresh()}refresh(){let e={x:[1/0,-1/0],y:[1/0,-1/0]},t={x:this.settings.xScale??"linear",y:this.settings.yScale??"linear"},n=(i,r)=>{let o=te(r,t[i]);Number.isFinite(o)&&(e[i][0]=Math.min(e[i][0],o),e[i][1]=Math.max(e[i][1],o))};for(let i of this.fields){let[r,o,s,d]=i.options.extent;n("x",r),n("x",o),n("y",s),n("y",d)}for(let i of this.artists)for(let r=0;r<i.data.x.length;r++){let o=i.data.x[r],s=i.data.y[r];if(i.kind==="fill"){let d=i.data.lower[r];Number.isFinite(te(o,t.x))&&Number.isFinite(s)&&Number.isFinite(d)&&(n("x",o),n("y",s),n("y",d));continue}!Number.isFinite(te(o,t.x))||!Number.isFinite(te(s,t.y))||(n("x",o),n("y",s),i.data.lower&&n("y",i.data.lower[r]),i.data.xLow&&(n("x",i.data.xLow[r]),n("x",i.data.xHigh[r])),i.data.yLow&&(n("y",i.data.yLow[r]),n("y",i.data.yHigh[r])),i.kind==="bar"&&(n("x",i.edges?.[r]??o-i.style.width/2),n("x",i.edges?.[r+1]??o+i.style.width/2),(t.y==="linear"||i.style.baseline>0)&&n("y",i.style.baseline)),i.kind==="barh"&&(n("y",s-i.style.width/2),n("y",s+i.style.width/2),n("x",i.style.baseline)),i.kind==="stem"&&n("y",i.style.baseline))}for(let i of["x","y"]){let r=this.settings[`${i}Limits`];if(r){e[i]=r.map(l=>te(l,t[i]));continue}let[o,s]=e[i];if(!Number.isFinite(o)){e[i]=[0,1];continue}let d=o===s?Math.max(Math.abs(o)*.05,t[i]==="log"?.5:.05):(s-o)*.05;o-=d,s+=d,e[i]=[o,s]}for(let i of[e.x,e.y])if((i[1]-i[0])*1e6>3402823466e29)throw new RangeError("Plot range exceeds the f32 interaction range.");this.controller.setBounds(e),this.updateLabel()}updateLabel(){let e=[this.settings.title,this.settings.xLabel&&`x: ${this.settings.xLabel}`,this.settings.yLabel&&`y: ${this.settings.yLabel}`,...this.artists.map(t=>t.style.label),...this.fields.map(t=>`${t.mode}, ${t.options.shape[0]} rows by ${t.options.shape[1]} columns`)].filter(Boolean);this.canvas.setAttribute("aria-label",e.join(". ")||`Subplot ${this.index+1}, ${this.artists.length} series`)}redraw=()=>{this.picker?.invalidate(),this.disposed||this.figure.redraw()};presentationChanged(){this.updateLabel(),this.updateHtmlLegend(),this.redraw()}updateHtmlLegend(){if(this.settings.legend!=="html"){this.htmlLegend?.remove(),this.htmlLegend=void 0,this.legendSignature="";return}let e=this.artists.filter(n=>n.style.label&&!n.style.label.startsWith("_")),t=JSON.stringify(e.map(n=>[n.style.label,n.style.color,n.style.lineStyle,n.style.alpha]));if(!this.htmlLegend){let n=this.canvas.ownerDocument.createElement("ul");this.htmlLegend=n,n.className="typeplot-html-legend",n.setAttribute("aria-label","Legend"),n.style.cssText="position:absolute;z-index:2;list-style:none;margin:0;padding:6px 9px;border:1px solid #dce2e9;border-radius:6px;background:#ffffffef;color:#334155;font:12px system-ui,sans-serif;transform:translateX(-100%);max-width:45%;pointer-events:auto",this.canvas.parentElement?.appendChild(n)}if(t!==this.legendSignature){this.htmlLegend.replaceChildren();for(let n of e){let i=this.canvas.ownerDocument.createElement("li");i.style.cssText="display:flex;align-items:center;gap:8px;padding:3px 0";let r=this.canvas.ownerDocument.createElement("span");r.setAttribute("aria-hidden","true"),r.style.cssText=`display:inline-block;flex:0 0 18px;border-top:2px ${n.style.lineStyle==="--"?"dashed":n.style.lineStyle===":"?"dotted":"solid"}`,r.style.borderColor=n.style.color,r.style.opacity=String(n.style.alpha);let o=this.canvas.ownerDocument.createElement("span");o.textContent=n.style.label,i.append(r,o),this.htmlLegend.appendChild(i)}this.legendSignature=t}this.htmlLegend.hidden=!e.length,this.htmlLegend.style.left=`${this.canvas.offsetLeft+this.canvas.clientWidth-F.right-8}px`,this.htmlLegend.style.top=`${this.canvas.offsetTop+F.top+8}px`}snapshot(e=!1){e||this.updateHtmlLegend();let t=this.canvas.ownerDocument.defaultView.performance.now();return!e&&this.gridFade.active(t)&&!this.fadeFrame&&(this.fadeFrame=this.canvas.ownerDocument.defaultView.requestAnimationFrame(()=>{this.fadeFrame=0,this.redraw()})),{gridOpacity:e?this.settings.grid?1:0:this.gridFade.value(t),bounds:this.controller.bounds(),settings:{...this.settings,...this.settings.xLimits?{xLimits:[...this.settings.xLimits]}:{},...this.settings.yLimits?{yLimits:[...this.settings.yLimits]}:{},...this.settings.legend==="html"?{legend:e}:{}},series:this.artists.map(n=>({key:n,kind:n.kind,data:n.data,style:{...n.style},edges:n.edges})),fields:this.fields.map(n=>({key:n,values:n.values,mode:n.mode,options:{...n.options,shape:[...n.options.shape],extent:[...n.options.extent],valueRange:[...n.options.valueRange],levels:[...n.options.levels]}})),annotations:this.annotations.map(n=>({value:n.value,position:[...n.position],target:[...n.target],options:{...n.options,offset:[...n.options.offset]}})),focused:this.canvas.matches(":focus-visible")}}destroy(){this.disposed||(this.disposed=!0,this.fadeFrame&&this.canvas.ownerDocument.defaultView.cancelAnimationFrame(this.fadeFrame),this.controller.destroy(),this.picker.destroy(),this.canvas.removeEventListener("focus",this.redraw),this.canvas.removeEventListener("blur",this.redraw),this.artists.length=0,this.fields.forEach(e=>e.detach()),this.fields.length=0,this.annotations.forEach(e=>e.detach()),this.annotations.length=0,this.canvas.remove())}},be=class{element;axes;options;pixelRatio;observer;win;disposed=!1;rows;cols;surface;stage;renderer;frames;ready;get backend(){return this.renderer?.backend}report=e=>{if(this.disposed)return;let t=e instanceof Error?e:new Error(String(e));if(this.element.setAttribute("data-error",t.message),this.options.onError)try{this.options.onError(t)}catch(n){console.error("[typeplot] onError failed",n)}else this.element.dispatchEvent(new CustomEvent("typeploterror",{detail:t,bubbles:!0}))};reportError(e){this.report(e)}async pickAxes(e,t,n){if(this.disposed)throw new Error("This figure has been destroyed.");if(await this.ready,this.disposed)throw new Error("This figure has been destroyed.");let i=this.stage.getBoundingClientRect(),r=this.snapshot(i.width,i.height),o=[...r.axes[e].fields,...r.axes[e].series],s=o.map(c=>c.key),d=o.map(c=>"values"in c?c.values:c.data),l=await this.renderer.pick(r,e,t,n);return l&&s[l.series]?{artist:s[l.series],data:d[l.series],index:l.index}:null}constructor(e,t,n={}){if(!Number.isSafeInteger(e)||!Number.isSafeInteger(t)||e<1||t<1||e*t>100)throw new RangeError("Subplots need positive integer rows/columns, with at most 100 axes.");if(typeof document>"u")throw new Error("TypePlot figures need a browser document. Create them after mounting the view.");let i=typeof n.target=="string"?document.querySelector(n.target):n.target??document.body;if(!i||typeof i.appendChild!="function")throw new TypeError("Figure target must resolve to a container element.");let r=i.ownerDocument,o=r.defaultView;if(!o)throw new Error("Figure target needs a browser window.");let s=z(n.width??640*t,"width"),d=z(n.height??400*e,"height"),l=z(n.pixelRatio??Math.min(o.devicePixelRatio||1,4,16384/Math.max(s,d+(n.title?42:0)),Math.sqrt(16777216/(s*(d+(n.title?42:0))))),"pixelRatio");if(l>4||Math.ceil(s*l)*Math.ceil(d*l)>16777216||Math.max(s,d)*l>16384)throw new RangeError("Figure exceeds the 16 megapixel or 16384 pixel dimension limit, or pixelRatio exceeds four.");this.options={...n,width:s,height:d},this.pixelRatio=l,this.win=o,this.frames=new et(o,async()=>{if(this.disposed||!this.renderer)return;let p=this.stage.getBoundingClientRect();p.width>0&&p.height>0&&await this.renderer.render(this.snapshot(p.width,p.height),this.pixelRatio)},this.report),this.rows=e,this.cols=t,this.element=r.createElement("div"),this.element.style.cssText=`overflow:auto;width:min(100%, ${s}px);font:13px system-ui,sans-serif;color:#0f172a;background:${n.background??"#ffffff"}`,this.element.setAttribute("role","group"),this.element.setAttribute("aria-label",n.title||"TypePlot figure");let c=n.title?42:0;this.stage=r.createElement("div"),this.stage.style.cssText=`position:relative;width:100%;min-width:${Math.min(s,280*t)}px;aspect-ratio:${s}/${d+c}`,this.surface=r.createElement("canvas"),this.surface.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none",this.surface.setAttribute("aria-hidden","true"),this.stage.appendChild(this.surface);let f=r.createElement("div");f.style.cssText=`position:absolute;inset:${c/(d+c)*100}% 0 0;display:grid;grid-template-columns:repeat(${t},minmax(0,1fr));grid-template-rows:repeat(${e},minmax(0,1fr))`,this.stage.appendChild(f),this.element.appendChild(this.stage);let m=[];this.axes=m,this.ready=Promise.resolve().then(async()=>{let p=await ve.create(this.surface,n.backend);if(this.disposed)throw p.destroy(),new Error("This figure has been destroyed.");this.renderer=p,await this.paint()}),this.ready.catch(this.report);try{for(let p=0;p<e*t;p++){let h=new Qe(this,p);m.push(h),f.appendChild(h.canvas)}if(n.toolbar!==!1){let p=r.createElement("div");p.setAttribute("role","group"),p.setAttribute("aria-label","Figure controls"),p.style.cssText="display:flex;gap:8px;align-items:center;padding:8px 12px;flex-wrap:wrap";let h=r.createElement("span");h.setAttribute("role","status");let u=r.createElement("button");u.type="button",u.textContent="Reset view",u.onclick=()=>this.axes.forEach(y=>y.reset());let v=r.createElement("button");v.type="button",v.textContent="Save PNG",v.onclick=()=>{this.saveImage().catch(y=>{h.textContent=y instanceof Error?y.message:String(y)})},p.append(u,v,h),this.element.appendChild(p)}i.appendChild(this.element),typeof o.ResizeObserver=="function"&&(this.observer=new o.ResizeObserver(this.redraw),this.observer.observe(f)),o.addEventListener("resize",this.redraw)}catch(p){throw this.destroy(),p}}redraw=()=>{this.disposed||this.frames.request()};snapshot(e,t,n=!1){return{width:e,height:t,rows:this.rows,cols:this.cols,titleHeight:this.options.title?t*42/(this.options.height+42):0,title:this.options.title,background:this.options.background,axes:this.axes.map(i=>i.snapshot(n))}}paint(){return this.disposed||!this.renderer?Promise.resolve():this.frames.flush()}async toBlob(e={}){if(this.disposed)throw new Error("This figure has been destroyed.");await this.ready;let t=z(e.pixelRatio??this.pixelRatio,"pixelRatio"),n=this.options.width,i=this.options.height+(this.options.title?42:0);if(Math.ceil(n*t)*Math.ceil(i*t)>16777216||Math.max(n,i)*t>16384)throw new RangeError("PNG export exceeds the 16 megapixel or 16384 pixel dimension limit.");if(this.disposed)throw new Error("This figure has been destroyed.");let r=await this.renderer.pixels(this.snapshot(n,i,!0),t);return mn(r.bytes,r.width,r.height)}async saveImage(e="typeplot.png",t={}){if(!e.toLowerCase().endsWith(".png"))throw new TypeError("saveImage currently supports .png files.");let n=await this.toBlob(t);if(this.disposed)throw new Error("This figure has been destroyed.");let i=URL.createObjectURL(n),r=this.element.ownerDocument.createElement("a");r.href=i,r.download=e,r.hidden=!0,this.element.appendChild(r);try{r.click()}finally{r.remove(),this.win.setTimeout(()=>URL.revokeObjectURL(i),1e3)}}destroy(){this.disposed||(this.disposed=!0,this.observer?.disconnect(),this.frames.stop(),this.renderer?.destroy(),this.win.removeEventListener("resize",this.redraw),this.axes.forEach(e=>e.destroy()),this.element.remove())}};function Yn(a={}){return new be(1,1,a)}function kr(a=1,e=1,t={}){let n=new be(a,e,t);return{fig:n,axes:n.axes}}function Sr(a,e,t=50){if(!Number.isFinite(a)||!Number.isFinite(e))throw new RangeError("linspace endpoints must be finite.");if(!Number.isSafeInteger(t)||t<0||t>1e7)throw new RangeError("linspace count must be an integer from zero to ten million.");return Float64Array.from({length:t},(n,i)=>t===1?a:i===t-1?e:a*(1-i/(t-1))+e*(i/(t-1)))}function Rr(a,e,t={}){let n=typeof e=="function"||_n(e),i=n?t:e??{},r=Yn({...i,title:void 0});try{let o=r.axes[0];return o.set(i),n?o.plot(a,e,i):o.plot(a,i),r}catch(o){throw r.destroy(),o}}export{fe as a,he as b,ye as c,mn as d,ce as e,W as f,G as g,Ze as h,Qe as i,be as j,Yn as k,kr as l,Sr as m,Rr as n};
