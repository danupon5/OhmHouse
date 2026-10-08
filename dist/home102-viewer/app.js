import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';

const host = document.querySelector('#canvas-host');
const $ = (id) => document.getElementById(id);
const labels = { iso: 'มุมมองสามมิติ', front: 'ด้านหน้า · ทิศเหนือ', back: 'ด้านหลัง · ทิศใต้', left: 'ด้านซ้าย · ทิศตะวันออก', right: 'ด้านขวา · ทิศตะวันตก', top: 'ด้านบน · ทิศเหนืออยู่ด้านบน' };
let renderer, controls, camera, model, bounds, radius = 12, currentView = 'iso';
const scene = new THREE.Scene();
scene.background = new THREE.Color('#e9eee9');
const perspective = new THREE.PerspectiveCamera(38, 1, .05, 500);
const orthographic = new THREE.OrthographicCamera(-20,20,20,-20,.05,500);
const center = new THREE.Vector3();
const roofParts = [];
let grid;
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w,h);
  perspective.aspect = w/h;
  perspective.updateProjectionMatrix();
  if (radius) {
    const half = radius * 1.12;
    orthographic.left = -half * Math.max(w/h,1);
    orthographic.right = -orthographic.left;
    orthographic.top = half * Math.max(h/w,1);
    orthographic.bottom = -orthographic.top;
    orthographic.updateProjectionMatrix();
  }
}
function setView(view) {
  if (!model) return;
  currentView = view;
  $('rotate').checked = false;
  controls.autoRotate = false;
  camera = view === 'iso' ? perspective : orthographic;
  controls.object = camera;
  controls.target.copy(center);
  camera.up.set(0,1,0);
  const dirs = {iso:[-1,.85,1], front:[0,0,-1],back:[0,0,1],left:[1,0,0],right:[-1,0,0],top:[0,1,0]};
  if (view === 'top') camera.up.set(0,0,-1);
  const limitingFov = Math.min(THREE.MathUtils.degToRad(perspective.fov)/2,Math.atan(Math.tan(THREE.MathUtils.degToRad(perspective.fov)/2)*perspective.aspect));
  const distance = camera.isPerspectiveCamera ? radius/Math.sin(limitingFov)*1.08 : radius*3;
  camera.position.copy(center).add(new THREE.Vector3(...dirs[view]).normalize().multiplyScalar(distance));
  camera.zoom = 1;
  camera.updateProjectionMatrix();
  camera.lookAt(center);
  controls.enableRotate = view === 'iso';
  controls.update();
  $('view-label').textContent = labels[view];
  document.querySelectorAll('[data-view]').forEach(b => {b.classList.toggle('active',b.dataset.view === view);b.setAttribute('aria-pressed',String(b.dataset.view === view));});
}
async function start() {
  if (location.protocol === 'file:') return;
  renderer = new THREE.WebGLRenderer({ antialias:true,alpha:false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',event => {event.preventDefault();window.showModelError('การแสดงผล 3D หยุดทำงาน กรุณาลองเปิดหน้าใหม่');});
  camera = perspective;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .08;
  controls.maxPolarAngle = Math.PI/2 - .015;
  controls.minDistance = 2;
  controls.maxDistance = 130;
  controls.minZoom = .3;
  controls.maxZoom = 8;
  controls.autoRotateSpeed = .65;
  controls.listenToKeyEvents(host);
  controls.addEventListener('start',() => {$('rotate').checked=false;controls.autoRotate=false;});
  scene.add(new THREE.HemisphereLight(0xe9f3ff,0xa3ad94,1.5));
  const sun = new THREE.DirectionalLight(0xfff5e7,2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.bias = -.0002;
  sun.shadow.normalBias = .025;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xdceaff,.8);
  fill.position.set(-12,8,10);scene.add(fill);
  resize();
  new ResizeObserver(() => {resize();if(model)setView(currentView);}).observe(host);
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(new URL('./assets/house-stable-v412.glb',import.meta.url).href,event => {
    if(event.total) $('loading-text').textContent=`กำลังโหลดโมเดล ${Math.round(event.loaded/event.total*100)}%`;
  });
  model = gltf.scene;
  let meshCount=0;
  model.traverse(o => {
    let roofPart = Boolean(o.userData.webRoof);
    for (let p = o; p; p = p.parent) {
      if (/^(ฝ้า|ช่องลมจั่ว)/.test(p.userData.webLabel || p.name)) roofPart = true;
    }
    if (roofPart) roofParts.push(o);
    if(o.isMesh){meshCount++;o.castShadow=true;o.receiveShadow=true;}
  });
  scene.add(model);
  // Site ground extends beyond the house: frame the building itself.
  const building = model.getObjectByProperty('name', 'building_gzbrplsp2443oiqt') || model;
  model.traverse(o => { if (o.isMesh && o.parent?.userData.kind === 'site') o.visible = false; });
  bounds = new THREE.Box3().setFromObject(building);
  bounds.getCenter(center);
  radius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
  const size = bounds.getSize(new THREE.Vector3());
  $('mesh-count').textContent=meshCount.toLocaleString('th-TH');
  $('model-size').textContent=`${size.x.toFixed(2)} × ${size.z.toFixed(2)} × ${size.y.toFixed(2)} ม.`;
  const groundSize = Math.ceil(Math.max(size.x,size.z)*2.3);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize,groundSize),new THREE.MeshStandardMaterial({color:0xe9eee9,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.position.set(center.x,bounds.min.y-.035,center.z);ground.receiveShadow=true;scene.add(ground);
  grid = new THREE.GridHelper(groundSize,groundSize,0xc3cdc2,0xd0d9ce);
  grid.position.copy(ground.position);grid.position.y+=.01;grid.material.opacity=.5;grid.material.transparent=true;scene.add(grid);
  sun.position.copy(center).add(new THREE.Vector3(-12,22,-10));
  sun.target.position.copy(center);scene.add(sun.target);
  const reach = radius*1.6;
  Object.assign(sun.shadow.camera,{left:-reach,right:reach,top:reach,bottom:-reach,near:.5,far:100});
  sun.shadow.camera.updateProjectionMatrix();
  resize();setView('iso');
  $('loading').hidden=true;
  $('view-controls').disabled=false;$('layer-controls').disabled=false;$('reset').disabled=false;$('capture').disabled=false;
  $('roof').addEventListener('change',() => roofParts.forEach(o=>o.visible=$('roof').checked));
  $('grid').addEventListener('change',() => grid.visible=$('grid').checked);
  $('rotate').addEventListener('change',() => {const enabled=$('rotate').checked;if(enabled&&currentView!=='iso')setView('iso');$('rotate').checked=enabled;controls.autoRotate=enabled;});
  $('reset').addEventListener('click',() => {roofParts.forEach(o=>o.visible=true);$('roof').checked=true;$('grid').checked=true;grid.visible=true;setView('iso');});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  $('capture').addEventListener('click',()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`Home102-v412-${currentView}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');});
  const north = new THREE.Vector3(0,0,-1);
  const right = new THREE.Vector3(),up = new THREE.Vector3();
  renderer.setAnimationLoop(()=>{
    controls.update();renderer.render(scene,camera);
    right.setFromMatrixColumn(camera.matrixWorld,0);up.setFromMatrixColumn(camera.matrixWorld,1);
    $('compass-arrow').style.transform=`rotate(${Math.atan2(north.dot(right),north.dot(up))*180/Math.PI}deg)`;
  });
  // Read-only diagnostic summary used by local QA.
  window.home102={version:412,meshCount,roofCount:roofParts.filter(o=>o.isMesh).length,bounds:{x:size.x,y:size.y,z:size.z},get view(){return currentView;},get roofVisible(){return roofParts.every(o=>o.visible);},get cameraPosition(){return camera.position.toArray();}};
}
start().catch(error=>{console.error(error);window.showModelError('ตรวจสอบว่าไฟล์โมเดลและโฟลเดอร์ home102-viewer อยู่ครบ แล้วลองเปิดหน้านี้อีกครั้ง');});
