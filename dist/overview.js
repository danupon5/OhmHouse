import {resizeDownlights} from './downlight-size.js';
import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './home102-viewer/vendor/GLTFLoader.js';
import {deviceLayers,classifyDevice} from './device-layers.js';
const $=s=>document.querySelector(s),mobile=matchMedia('(max-width:700px)').matches,reducedMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
let mode='3d',currentView='exterior',tween=null,frame=0,renderCount=0,quality='auto',dimensionsEnabled=false;
const scene=new T.Scene();scene.background=new T.Color('#f2f0eb');scene.fog=new T.Fog('#f2f0eb',130,250);
const camera=new T.PerspectiveCamera(38,1,.08,300),renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.type=T.PCFSoftShadowMap;$('#model').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.085;controls.maxPolarAngle=Math.PI*.78;controls.minDistance=.35;controls.maxDistance=150;controls.autoRotateSpeed=.45;
const views={
 exterior:{eye:[-15,12,27],target:[6,2,6.5],roof:true,title:'บ้านในทุกมุม',subtitle:'แสงธรรมชาติ วัสดุ และพื้นที่ที่เชื่อมต่อกัน'},
 front:{eye:[-13,5.4,20],target:[5.5,2.3,8.2],roof:true,title:'ยินดีต้อนรับกลับบ้าน',subtitle:'ระเบียงทางเข้า และพื้นที่หน้าบ้าน'},
 dollhouse:{eye:[-7,23,25],target:[6.3,1.1,6.3],roof:false,title:'มองเห็นทุกพื้นที่',subtitle:'เปิดหลังคา สำรวจห้องและการเชื่อมต่อภายในบ้าน'},
 interior:{eye:[6.5,1.85,10.2],target:[9.2,1.65,7.7],roof:true,title:'ก้าวเข้ามาข้างใน',subtitle:'ห้องนั่งเล่น · ลากเพื่อมองรอบตัว'},
 porch:{eye:[.2,1.7,12.5],target:[4.04,3.38,8.7],roof:true,title:'รายละเอียดใต้ชายคา',subtitle:'ฝ้าเมทัลชีทลอน และไฟหลุมลานหน้าบ้าน 6 ดวง'}
};
const roomViews={living:views.interior,kitchen:{eye:[8,1.8,7.3],target:[11.7,1.65,6.4],roof:true,title:'พื้นที่ครัว',subtitle:'มองจากพื้นที่ส่วนกลางไปยังเคาน์เตอร์ครัว'},bed1:{eye:[2.7,1.85,4.3],target:[2.5,1.5,1.5],roof:true,title:'ห้องนอน 1',subtitle:'สำรวจพื้นที่พักผ่อนในระดับสายตา'},bed2:{eye:[8.1,1.8,4.2],target:[9.4,1.65,1.5],roof:true,title:'ห้องนอน 2',subtitle:'สำรวจพื้นที่พักผ่อนในระดับสายตา'}};
const layerDefs=[['roof','หลังคา / ฝ้า',true],['walls','ผนัง',true],['columns','เสา',true],['openings','ประตู / หน้าต่าง',true],...deviceLayers],groups=Object.fromEntries(layerDefs.map(([key,,visible])=>{const g=new T.Group();g.visible=visible;scene.add(g);return[key,g]}));
const dimensionGroup=new T.Group();dimensionGroup.visible=false;scene.add(dimensionGroup);
const hemi=new T.HemisphereLight(0xfffcf2,0xa9b5a5,.9);scene.add(hemi);
const sun=new T.DirectionalLight(0xfff1d9,3.2);sun.position.set(-8,22,15);sun.target.position.set(6,0,6);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:65});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun,sun.target);
const fill=new T.DirectionalLight(0xe4eeff,.35);fill.position.set(18,10,-10);scene.add(fill);
const ground=new T.Mesh(new T.PlaneGeometry(300,300),new T.MeshStandardMaterial({color:0xf0eee8,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(6,-.08,6);ground.receiveShadow=true;scene.add(ground);
// A locally generated studio environment supplies reflections without another download.
const studio=new T.Scene();studio.background=new T.Color(0xb8bdb7);const panels=[];
for(const [position,scale,intensity] of [[[0,18,0],[30,.1,30],4],[[-18,7,0],[.1,14,24],2],[[17,8,-8],[.1,16,22],1.5]]){const p=new T.Mesh(new T.BoxGeometry(...scale),new T.MeshBasicMaterial({color:new T.Color().setScalar(intensity)}));p.position.set(...position);studio.add(p);panels.push(p)}
const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.05);scene.environment=environment.texture;scene.environmentIntensity=.35;pmrem.dispose();for(const p of panels){p.geometry.dispose();p.material.dispose()}
function invalidate(){if(!frame&&mode==='3d'&&!document.hidden)frame=requestAnimationFrame(draw)}
function draw(time){frame=0;if(mode!=='3d'||document.hidden)return;let moving=false;
 if(tween){const p=Math.min(1,(time-tween.start)/tween.duration),k=p*p*(3-2*p);camera.position.lerpVectors(tween.fromEye,tween.eye,k);controls.target.lerpVectors(tween.fromTarget,tween.target,k);if(p===1)tween=null;else moving=true}
 const changed=controls.update();renderer.render(scene,camera);renderCount++;if(moving||changed||controls.autoRotate)invalidate();
}
controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{tween=null});
function resize(){const high=quality==='high'||(quality==='auto'&&!mobile);renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.75:1.25));camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);invalidate()}
function setQuality(value){quality=value;const size=value==='high'||(value==='auto'&&!mobile)?2048:1024;sun.shadow.mapSize.set(size,size);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}sun.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;resize()}
$('#quality').onchange=e=>setQuality(e.target.value);setQuality('auto');addEventListener('resize',resize);document.addEventListener('visibilitychange',invalidate);
function setRoof(visible){groups.roof.visible=visible;const input=document.querySelector('[data-layer="roof"]');if(input)input.checked=visible;renderer.shadowMap.needsUpdate=true;invalidate()}
function setDimensions(visible){if(mode==='3d'){dimensionsEnabled=visible;dimensionGroup.visible=visible;$('#dimensions3d').checked=visible}else{$('#dimensions').checked=visible;const plan=$('#plan-dimensions');if(plan)plan.style.display=visible?'':'none'}invalidate()}
$('#dimensions3d').onchange=e=>setDimensions(e.target.checked);
let outlinesEnabled=false;const outlineObjects=[];
$('#layer-options').innerHTML=layerDefs.map(([key,label,visible])=>`<label><input data-layer="${key}" type="checkbox" ${visible?'checked':''}> ${label}</label>`).join('');for(const input of document.querySelectorAll('[data-layer]'))input.onchange=()=>{if(input.dataset.layer==='roof')setRoof(input.checked);else groups[input.dataset.layer].visible=input.checked;renderer.shadowMap.needsUpdate=true;invalidate()};
$('#outlines').onchange=e=>{outlinesEnabled=e.target.checked;for(const edge of outlineObjects)edge.visible=outlinesEnabled;invalidate()};
$('#auto-rotate').onchange=e=>{controls.autoRotate=e.target.checked;tween=null;invalidate()};
function settings(open){$('#layers').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(open))}
$('#settings-toggle').onclick=()=>settings($('#layers').hidden);$('#settings-close').onclick=()=>{settings(false);$('#settings-toggle').focus()};addEventListener('keydown',e=>{if(e.key==='Escape')settings(false)});
function setMode(value){mode=value;document.body.dataset.mode=value;$('#views3d').hidden=value!=='3d';$('#plan-controls').hidden=value!=='2d';$('#model').hidden=value!=='3d';$('#plan').hidden=value!=='2d';$('#options3d').hidden=value!=='3d';$('#options2d').hidden=value!=='2d';for(const v of ['2d','3d'])$('#mode'+v).setAttribute('aria-pressed',String(v===value));$('#help').textContent=value==='3d'?'ลากเพื่อหมุน · เลื่อนเพื่อซูม · สองนิ้วบนมือถือ':'ลากเพื่อเลื่อนผัง · เลื่อนเพื่อซูม';if(value==='3d')invalidate()}
function goView(key,custom=null,instant=false){setMode('3d');const v=custom||views[key];camera.fov=key==='interior'?62:key==='porch'?48:38;camera.updateProjectionMatrix();currentView=key;document.body.dataset.sceneView=key;setRoof(v.roof);groups.lighting.visible=true;document.querySelector('[data-layer="lighting"]').checked=true;controls.autoRotate=false;$('#auto-rotate').checked=false;controls.enablePan=key!=='interior';controls.rotateSpeed=key==='interior'?.45:.8;$('#view-title').textContent=v.title;$('#view-subtitle').textContent=v.subtitle;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===key)));
 const eye=new T.Vector3(...v.eye),target=new T.Vector3(...v.target);if(!custom&&innerWidth<700&&key!=='interior'&&key!=='porch')eye.sub(target).multiplyScalar(2.6).add(target);
 if(instant||reducedMotion){tween=null;camera.position.copy(eye);controls.target.copy(target);controls.update()}else tween={start:performance.now(),duration:1000,fromEye:camera.position.clone(),fromTarget:controls.target.clone(),eye,target};invalidate();
}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>goView(b.dataset.view);
$('#enter-room').onclick=()=>{goView('interior',roomViews[$('#room-view').value]);settings(false)};
$('#mode2d').onclick=()=>setMode('2d');$('#mode3d').onclick=()=>setMode('3d');$('#reset').onclick=()=>{if(mode==='3d')goView('exterior');else{planView=[...initialView];view()}};
$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#help').textContent='เบราว์เซอร์นี้ไม่รองรับเต็มหน้าจอ'}};
let planView=[-1.6,-1.6,16,16],pan=null;const initialView=[...planView];function view(){const svg=$('#plan svg');if(svg)svg.setAttribute('viewBox',planView.join(' '))}
$('#plan').onwheel=e=>{e.preventDefault();const k=Math.exp(Math.sign(e.deltaY)*.12),w=planView[2]*k;if(w<3||w>60)return;const r=$('#plan').getBoundingClientRect(),scale=Math.min(r.width/planView[2],r.height/planView[3]),x=(e.clientX-r.left-(r.width-planView[2]*scale)/2)/scale,y=(e.clientY-r.top-(r.height-planView[3]*scale)/2)/scale;planView=[planView[0]+x*(1-k),planView[1]+y*(1-k),w,planView[3]*k];view()};
$('#plan').onpointerdown=e=>{pan={x:e.clientX,y:e.clientY,v:[...planView]};$('#plan').setPointerCapture(e.pointerId)};$('#plan').onpointermove=e=>{if(!pan)return;const r=$('#plan').getBoundingClientRect(),s=Math.min(r.width/pan.v[2],r.height/pan.v[3]);planView=[pan.v[0]-(e.clientX-pan.x)/s,pan.v[1]-(e.clientY-pan.y)/s,pan.v[2],pan.v[3]];view()};$('#plan').onpointerup=$('#plan').onpointercancel=()=>pan=null;
for(const [id,k] of [['zoomin',.8],['zoomout',1.25]])$('#'+id).onclick=()=>{const w=planView[2]*k;if(w<3||w>60)return;planView=[planView[0]+planView[2]*(1-k)/2,planView[1]+planView[3]*(1-k)/2,w,planView[3]*k];view()};
goView('exterior',null,true);
try{
 const data=await fetch('./scene-v413.json?rev=e901fc04130d').then(r=>{if(!r.ok)throw Error('อ่านผังไม่ได้');return r.json()}),nodes=Object.values(data.nodes),cols=nodes.filter(n=>n.type==='column'&&n.visible!==false),walls=nodes.filter(n=>n.type==='wall'&&n.visible!==false);
 const xs=[0,2.572,3.5,5.5,7.5,11,12.79],ys=[0,2.94,5,7.44,9.38,12.88];
 const line=(x1,y1,x2,y2,style='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${style}/>`;const text=(x,y,t,extra='')=>`<text x="${x}" y="${y}" ${extra}>${t}</text>`;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${planView.join(' ')}" role="img" aria-label="ผังบ้าน v413 แนวผนัง เสา กริด และระยะ"><g stroke="#ccc" stroke-width=".09">${walls.map(w=>line(...w.start,...w.end)).join('')}</g><g id="plan-grid" stroke="#e45b4d" stroke-width=".009" stroke-dasharray=".12 .12">${xs.map(x=>line(x,-.5,x,13.8)).join('')}${ys.map(y=>line(-.5,y,13.5,y)).join('')}</g><g fill="#ad3327">${cols.map(c=>`<rect x="${c.position[0]-.07}" y="${c.position[2]-.07}" width=".14" height=".14"/>`).join('')}</g><g id="plan-labels" font-family="sans-serif" font-size=".24" fill="#922b20">${cols.map(c=>text(c.position[0]+.19,c.position[2]-.15,c.metadata.columnLabel||c.name)).join('')}</g><g id="plan-dimensions" fill="#005cff" stroke="#005cff" stroke-width=".012" font-family="sans-serif" font-size=".24" text-anchor="middle">`;
 const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const wallMeasurements=walls.map(w=>({w,length:Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1]),x:(w.start[0]+w.end[0])/2,y:(w.start[1]+w.end[1])/2}));
 const rooms=nodes.filter(n=>n.type==='zone'&&n.visible!==false&&Array.isArray(n.polygon)).map(n=>{
  const p=n.polygon;let twiceArea=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];twiceArea+=a[0]*b[1]-b[0]*a[1]}
  const minX=Math.min(...p.map(p=>p[0])),maxX=Math.max(...p.map(p=>p[0])),minY=Math.min(...p.map(p=>p[1])),maxY=Math.max(...p.map(p=>p[1]));
  return {n,area:Math.abs(twiceArea)/2,x:(minX+maxX)/2,y:(minY+maxY)/2,width:maxX-minX,depth:maxY-minY,rectangular:p.length===4};
 }).filter(r=>r.area>.01);
 for(const {w,length,x,y} of wallMeasurements){
  const vertical=Math.abs(w.end[1]-w.start[1])>Math.abs(w.end[0]-w.start[0]),tx=x+(vertical?.22:0),ty=y+(vertical?0:-.22);
  svg+=text(tx,ty,length.toFixed(2)+' ม.',`stroke="white" stroke-width=".07" paint-order="stroke" fill="#005cff" transform="rotate(${vertical?-90:0} ${tx} ${ty})"`);
 }
 for(const r of rooms)svg+=text(r.x,r.y,esc(r.n.name), 'stroke="white" stroke-width=".08" paint-order="stroke" fill="#213941"')+text(r.x,r.y+.32,r.rectangular?r.width.toFixed(2)+' × '+r.depth.toFixed(2)+' ม.':r.area.toFixed(2)+' ตร.ม. (ห้องรูปตัว L)','stroke="white" stroke-width=".08" paint-order="stroke" fill="#213941"');
 svg+='</g><g id="plan-grid-labels" fill="white" stroke="#e45b4d" stroke-width=".018" font-size=".25" font-family="sans-serif" text-anchor="middle">';for(let i=0;i<xs.length;i++)svg+=`<circle cx="${xs[i]}" cy="14" r=".23"/>`+text(xs[i],14.08,String.fromCharCode(65+i),'fill="#c23b2d" stroke="none"');for(let i=0;i<ys.length;i++)svg+=`<circle cx="14" cy="${ys[i]}" r=".23"/>`+text(14,ys[i]+.08,i+1,'fill="#c23b2d" stroke="none"');svg+='</g></svg>';$('#plan').innerHTML=svg;
 for(const [key,ids] of [['grid',['plan-grid','plan-grid-labels']],['labels',['plan-labels']],['dimensions',['plan-dimensions']]])$('#'+key).onchange=e=>{if(key==='dimensions')setDimensions(e.target.checked);else ids.forEach(id=>$('#'+id).style.display=e.target.checked?'':'none')};
 function addDimensionLabel(label,x,z,y,color='#005cff'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(255,255,255,.92)';ctx.fillRect(0,0,768,128);ctx.fillStyle=color;ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,384,64);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:true,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(2.4,.4,1);sprite.renderOrder=10;dimensionGroup.add(sprite);
 }
 for(const {w,length,x,y} of wallMeasurements){
  const offset=.16,dx=w.end[0]-w.start[0],dz=w.end[1]-w.start[1],nx=-dz/length*offset,nz=dx/length*offset,level=data.nodes[w.parentId]?.baseElevation??.5,height=level+w.height+.12;
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(w.start[0]+nx,height,w.start[1]+nz),new T.Vector3(w.end[0]+nx,height,w.end[1]+nz)]);
  dimensionGroup.add(new T.Line(geometry,new T.LineBasicMaterial({color:0x005cff})));addDimensionLabel(length.toFixed(2)+' ม.',x+nx,y+nz,height+.22);
 }
 for(const r of rooms)addDimensionLabel(r.n.name+' · '+(r.rectangular?r.width.toFixed(2)+' × '+r.depth.toFixed(2)+' ม.':r.area.toFixed(2)+' ตร.ม.'),r.x,r.y,.65,'#213941');
 dimensionGroup.visible=dimensionsEnabled;
 const model=await new GLTFLoader().loadAsync('./home102-viewer/assets/house-v413-e901fc04130d.glb',event=>{if(event.total){const percent=Math.round(event.loaded/event.total*100);$('#load-progress').textContent=`กำลังโหลดโมเดล ${percent}%`;$('#load-bar').style.width=percent+'%'}});resizeDownlights(model.scene);scene.add(model.scene);model.scene.updateMatrixWorld(true);
 const entries=[],materials=new Set();model.scene.traverse(o=>{if(!o.isMesh)return;let category=null,site=false,names=[];for(let p=o;p;p=p.parent){const e=p.userData;names.push(e.webLabel||p.name);if(e.kind==='site'&&o.parent===p)site=true;if(e.webRoof||e.kind==='ceiling'||/^(ฝ้า|ช่องลมจั่ว)/.test(e.webLabel||p.name))category='roof';else if(!category&&e.kind==='wall')category='walls';else if(!category&&e.kind==='column')category='columns';else if(!category&&(e.kind==='door'||e.kind==='window'))category='openings'}entries.push({o,site,category:category||classifyDevice(names)})});
 for(const {o,site,category} of entries){if(site){o.visible=false;continue}if(category)groups[category].attach(o);o.castShadow=true;o.receiveShadow=true;for(const mat of Array.isArray(o.material)?o.material:[o.material]){materials.add(mat);if(mat.isMeshStandardMaterial)mat.envMapIntensity=.65;if(mat.transparent&&mat.opacity<.6){o.castShadow=false;mat.depthWrite=false}}}
 // Keep the model's exported PBR colours, texture maps, metal and glass properties.
 const outlineMaterial=new T.LineBasicMaterial({color:0x374a40,transparent:true,opacity:.4,depthWrite:false});
 for(const {o,site} of entries){if(site||!o.visible||o.isSkinnedMesh)continue;const geometry=new T.EdgesGeometry(o.geometry,35);if(!geometry.getAttribute('position').count){geometry.dispose();continue}const edge=new T.LineSegments(geometry,outlineMaterial);edge.name='overview-outline';edge.visible=false;edge.raycast=()=>{};o.add(edge);outlineObjects.push(edge)}
 $('#loading').remove();renderer.shadowMap.needsUpdate=true;invalidate();
 window.overviewQA={version:413,revision:'studio-v1',groups,mode:()=>mode,view:()=>currentView,cols,dimensionGroup,wallMeasurements,rooms,outlines:outlineObjects,outlinesEnabled:()=>outlinesEnabled,renderCount:()=>renderCount,quality:()=>quality,shadowSize:()=>sun.shadow.mapSize.x,camera,controls,materialCount:materials.size,goView};
}catch(e){$('#load-progress').textContent='โหลดแบบไม่ได้ กรุณารีเฟรชหน้า';$('#load-bar').style.width='0';console.error(e)}
