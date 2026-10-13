import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {GLTFLoader} from './home102-viewer/vendor/GLTFLoader.js';
import {deviceLayers,classifyDevice} from './device-layers.js';
const $=s=>document.querySelector(s);let mode='3d';
const scene=new T.Scene();scene.background=new T.Color('#eef2f3');
const camera=new T.PerspectiveCamera(38,1,.1,150),renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;$('#model').append(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=3;controls.maxDistance=80;
function reset3d(){camera.position.set(-16,22,29);controls.target.set(6.2,.7,6.1);controls.update()}reset3d();scene.add(new T.HemisphereLight(0xffffff,0x8b9da5,2));const sun=new T.DirectionalLight(0xfff4df,2.5);sun.position.set(-8,25,12);scene.add(sun);
const layerDefs=[['roof','หลังคา / ฝ้า',true],['walls','ผนัง',true],['columns','เสา',true],['openings','ประตู / หน้าต่าง',true],...deviceLayers],groups=Object.fromEntries(layerDefs.map(([key,,visible])=>{const g=new T.Group();g.visible=visible;scene.add(g);return[key,g]}));
const dimensionGroup=new T.Group();scene.add(dimensionGroup);let dimensionsEnabled=true;
function setDimensions(visible){dimensionsEnabled=visible;dimensionGroup.visible=visible;$('#dimensions').checked=visible;$('#dimension-toggle').setAttribute('aria-pressed',String(visible));const plan=$('#plan-dimensions');if(plan)plan.style.display=visible?'':'none'}
function setRoof(visible){groups.roof.visible=visible;document.querySelector('[data-layer="roof"]').checked=visible;$('#roof-toggle').setAttribute('aria-pressed',String(visible))}
$('#roof-toggle').onclick=()=>setRoof(!groups.roof.visible);
$('#dimension-toggle').onclick=()=>setDimensions(!dimensionsEnabled);
let outlinesEnabled=true;const outlineObjects=[];
$('#options3d').innerHTML='<label><input id="outlines" type="checkbox" checked> เส้นขอบโมเดล</label>'+layerDefs.map(([key,label,visible])=>`<label><input data-layer="${key}" type="checkbox" ${visible?'checked':''}> ${label}</label>`).join('');for(const input of document.querySelectorAll('[data-layer]'))input.onchange=()=>{if(input.dataset.layer==='roof')setRoof(input.checked);else groups[input.dataset.layer].visible=input.checked};
$('#outlines').onchange=e=>{outlinesEnabled=e.target.checked;for(const edge of outlineObjects)edge.visible=outlinesEnabled};
let planView=[-1.6,-1.6,16,16],pan=null;const initialView=[...planView];function view(){const svg=$('#plan svg');if(svg)svg.setAttribute('viewBox',planView.join(' '))}
$('#plan').onwheel=e=>{e.preventDefault();const k=Math.exp(Math.sign(e.deltaY)*.12),w=planView[2]*k;if(w<3||w>60)return;const r=$('#plan').getBoundingClientRect(),scale=Math.min(r.width/planView[2],r.height/planView[3]),x=(e.clientX-r.left-(r.width-planView[2]*scale)/2)/scale,y=(e.clientY-r.top-(r.height-planView[3]*scale)/2)/scale;planView=[planView[0]+x*(1-k),planView[1]+y*(1-k),w,planView[3]*k];view()};
$('#plan').onpointerdown=e=>{pan={x:e.clientX,y:e.clientY,v:[...planView]};$('#plan').setPointerCapture(e.pointerId)};$('#plan').onpointermove=e=>{if(!pan)return;const r=$('#plan').getBoundingClientRect(),s=Math.min(r.width/pan.v[2],r.height/pan.v[3]);planView=[pan.v[0]-(e.clientX-pan.x)/s,pan.v[1]-(e.clientY-pan.y)/s,pan.v[2],pan.v[3]];view()};$('#plan').onpointerup=$('#plan').onpointercancel=()=>pan=null;
function setMode(value){mode=value;$('#roof-toggle').hidden=value!=='3d';$('#zoomin').hidden=$('#zoomout').hidden=value!=='2d';$('#model').hidden=value!=='3d';$('#plan').hidden=value!=='2d';$('#options3d').hidden=value!=='3d';$('#options2d').hidden=value!=='2d';for(const v of ['2d','3d'])$('#mode'+v).setAttribute('aria-pressed',String(v===value));$('#help').textContent=value==='3d'?'ลากเพื่อหมุน · เลื่อนเพื่อซูม':'ลากเพื่อเลื่อน · เลื่อนเพื่อซูม'}$('#mode2d').onclick=()=>setMode('2d');$('#mode3d').onclick=()=>setMode('3d');$('#reset').onclick=()=>{if(mode==='3d')reset3d();else{planView=[...initialView];view()}};for(const [id,k] of [['zoomin',.8],['zoomout',1.25]])$('#'+id).onclick=()=>{const w=planView[2]*k;if(w<3||w>60)return;planView=[planView[0]+planView[2]*(1-k)/2,planView[1]+planView[3]*(1-k)/2,w,planView[3]*k];view()};$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{$('#help').textContent='เบราว์เซอร์นี้ไม่รองรับเต็มหน้าจอ'}};
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}addEventListener('resize',resize);resize();function animate(){requestAnimationFrame(animate);if(mode==='3d'){controls.update();renderer.render(scene,camera)}}animate();
try{
 const data=await fetch('./scene-v413.json').then(r=>{if(!r.ok)throw Error('อ่านผังไม่ได้');return r.json()}),nodes=Object.values(data.nodes),cols=nodes.filter(n=>n.type==='column'&&n.visible!==false),walls=nodes.filter(n=>n.type==='wall'&&n.visible!==false);
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
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(2.4,.4,1);sprite.renderOrder=10;dimensionGroup.add(sprite);
 }
 for(const {w,length,x,y} of wallMeasurements){
  const offset=.16,dx=w.end[0]-w.start[0],dz=w.end[1]-w.start[1],nx=-dz/length*offset,nz=dx/length*offset,level=data.nodes[w.parentId]?.baseElevation??.5,height=level+w.height+.12;
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(w.start[0]+nx,height,w.start[1]+nz),new T.Vector3(w.end[0]+nx,height,w.end[1]+nz)]);
  dimensionGroup.add(new T.Line(geometry,new T.LineBasicMaterial({color:0x005cff})));addDimensionLabel(length.toFixed(2)+' ม.',x+nx,y+nz,height+.22);
 }
 for(const r of rooms)addDimensionLabel(r.n.name+' · '+(r.rectangular?r.width.toFixed(2)+' × '+r.depth.toFixed(2)+' ม.':r.area.toFixed(2)+' ตร.ม.'),r.x,r.y,.65,'#213941');
 setDimensions(dimensionsEnabled);
 const model=await new GLTFLoader().loadAsync('./home102-viewer/assets/house-stable-v413.glb');scene.add(model.scene);model.scene.updateMatrixWorld(true);const entries=[];model.scene.traverse(o=>{if(!o.isMesh)return;let category=null,site=false,names=[];for(let p=o;p;p=p.parent){const e=p.userData;names.push(e.webLabel||p.name);if(e.kind==='site'&&o.parent===p)site=true;if(e.webRoof||e.kind==='ceiling'||/^(ฝ้า|ช่องลมจั่ว)/.test(e.webLabel||p.name))category='roof';else if(!category&&e.kind==='wall')category='walls';else if(!category&&e.kind==='column')category='columns';else if(!category&&(e.kind==='door'||e.kind==='window'))category='openings'}entries.push({o,site,category:category||classifyDevice(names)})});for(const {o,site,category} of entries){if(site)o.visible=false;else if(category)groups[category].attach(o)}// Add edges after traversal so helpers are never classified as model meshes.
// Parenting each outline to its mesh preserves transforms and layer visibility.
const outlineMaterial=new T.LineBasicMaterial({color:0x26343b,transparent:true,opacity:.65,depthWrite:false});
for(const {o,site} of entries){
 if(site||!o.visible||o.isSkinnedMesh)continue;
 const geometry=new T.EdgesGeometry(o.geometry,30);
 if(!geometry.getAttribute('position').count){geometry.dispose();continue}
 const edge=new T.LineSegments(geometry,outlineMaterial);edge.name='overview-outline';edge.visible=outlinesEnabled;edge.raycast=()=>{};o.add(edge);outlineObjects.push(edge);
}
$('#loading').remove();window.overviewQA={version:413,groups,mode:()=>mode,cols,dimensionGroup,wallMeasurements,rooms,outlines:outlineObjects,outlinesEnabled:()=>outlinesEnabled};
}catch(e){$('#loading').textContent='โหลดแบบไม่ได้ กรุณารีเฟรชหน้า';console.error(e)}
