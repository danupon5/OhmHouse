import * as T from 'three';

// Intersect each planar roof face with the existing trimmed footprint. Exact
// break lines avoid the diagonal stair steps of the old sampled hip surface.
export function roofGeometry(seg) {
  const w=seg.width/2, d=seg.depth/2, tr=seg.trim||{};
  const xmin=-w+(tr.left||0), xmax=w-(tr.right||0);
  const slope=Math.tan(seg.pitch*Math.PI/180), base=seg.wallHeight||0;
  const planes=seg.roofType==='shed'?[[0,-1,d]]:
    seg.roofType==='hip'?[[0,-1,d],[0,1,d],[-1,0,w],[1,0,w]]:[[0,-1,d],[0,1,d]];
  const height=(p,x,z)=>p[0]*x+p[1]*z+p[2];
  const positions=[];
  if(xmax<=xmin||d<=0) return new T.BufferGeometry();
  for(const plane of planes) {
    let polygon=[[xmin,-d],[xmax,-d],[xmax,d],[xmin,d]];
    for(const other of planes) {
      if(other===plane) continue;
      const clipped=[];
      for(let i=0;i<polygon.length;i++) {
        const a=polygon[i], b=polygon[(i+1)%polygon.length];
        const da=height(plane,...a)-height(other,...a), db=height(plane,...b)-height(other,...b);
        if(da<=0) clipped.push(a);
        if((da<0&&db>0)||(da>0&&db<0)) {
          const t=da/(da-db); clipped.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);
        }
      }
      polygon=clipped;
    }
    for(let i=1;i<polygon.length-1;i++) {
      const triangle=[polygon[0],polygon[i+1],polygon[i]];
      const [a,b,c]=triangle;
      if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-9) continue;
      for(const [x,z] of triangle) positions.push(x,base+Math.max(0,height(plane,x,z))*slope,z);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.computeVertexNormals();
  return geometry;
}

export function buildRoof(seg,parent,roofGroup,originalMaterial) {
  const group=new T.Group();
  group.position.set(parent.position[0]+seg.position[0],3+seg.position[1],parent.position[2]+seg.position[2]);
  group.rotation.y=(parent.rotation||0)+(seg.rotation||0);
  roofGroup.add(group);
  const geometry=roofGeometry(seg), mesh=new T.Mesh(geometry,originalMaterial);
  mesh.castShadow=true;
  group.add(mesh);
  const readingMaterial=new T.MeshStandardMaterial({color:'#9caeb9',roughness:1,side:T.DoubleSide,flatShading:true});
  const edges=new T.Group(), edgeMaterial=new T.MeshBasicMaterial({color:'#283c47'});
  const outline=new T.EdgesGeometry(geometry,1), p=outline.getAttribute('position');
  const w=seg.width/2,d=seg.depth/2,xmin=-w+(seg.trim?.left||0),xmax=w-(seg.trim?.right||0);
  for(let i=0;i<p.count;i+=2) {
    const a=new T.Vector3().fromBufferAttribute(p,i), b=new T.Vector3().fromBufferAttribute(p,i+1);
    const delta=b.clone().sub(a), length=delta.length();
    if(length<1e-5) continue;
    const boundary=[xmin,xmax].some(x=>Math.abs(a.x-x)<1e-4&&Math.abs(b.x-x)<1e-4)||
      [-d,d].some(z=>Math.abs(a.z-z)<1e-4&&Math.abs(b.z-z)<1e-4);
    // Small solid strokes keep their width in exported images on all browsers.
    // Normal depth testing hides edges behind other roof surfaces.
    const radius=boundary?.018:.012;
    const line=new T.Mesh(new T.CylinderGeometry(radius,radius,length,6),edgeMaterial);
    line.position.copy(a).add(b).multiplyScalar(.5);
    line.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
    edges.add(line);
  }
  outline.dispose();
  group.add(edges);
  return {mesh,edges,readingMaterial,originalMaterial};
}

export function setupRoofView({scene,camera,renderer,controls,groups,grid,highlight,roofs,version}) {
  const $=s=>document.querySelector(s), panel=$('#roof-tools'), workspace=$('.workspace');
  let clean=false, savedVisibility=null, savedCamera=null, view='angled', mode='3d';
  const originalBackground=scene.background.clone();
  const captureButton=$('#roof-capture'), downloadButton=$('#roof-download');
  const status=$('#roof-status');
  function applyStyle() {
    const reading=$('#roof-style').value==='reading';
    for(const roof of roofs) {
      roof.mesh.material=reading?roof.readingMaterial:roof.originalMaterial;
      roof.edges.visible=$('#roof-edges').checked;
    }
  }
  function settle() {
    const damping=controls.enableDamping;
    controls.enableDamping=false; controls.update(); controls.enableDamping=damping;
  }
  function fit(direction) {
    settle();
    const bounds=new T.Box3().setFromObject(groups.roof);
    if(bounds.isEmpty()) return;
    bounds.min.y=Math.min(bounds.min.y,-.1);
    const center=bounds.getCenter(new T.Vector3()), size=bounds.getSize(new T.Vector3());
    const rect=$('#viewer').getBoundingClientRect();
    camera.aspect=rect.width/Math.max(1,rect.height);
    // Fit all eight box corners into the perspective frustum with breathing room.
    const forward=direction.clone().normalize(), right=new T.Vector3().crossVectors(camera.up,forward).normalize();
    const up=new T.Vector3().crossVectors(forward,right).normalize();
    const tanY=Math.tan(T.MathUtils.degToRad(camera.fov/2)), tanX=tanY*camera.aspect;
    let distance=8;
    for(const x of [-.5,.5]) for(const y of [-.5,.5]) for(const z of [-.5,.5]) {
      const corner=new T.Vector3(size.x*x,size.y*y,size.z*z), depth=corner.dot(forward);
      distance=Math.max(distance,depth+1.25*Math.abs(corner.dot(right))/tanX,depth+1.25*Math.abs(corner.dot(up))/tanY);
    }
    controls.maxDistance=Math.max(60,distance*1.5);
    controls.target.copy(center);camera.position.copy(center).addScaledVector(forward,distance);
    camera.updateProjectionMatrix();settle();
  }
  function setView(name) {
    view=name;
    const directions={angled:new T.Vector3(1,.95,1.2),top:new T.Vector3(0,1,.0001),side:new T.Vector3(0,.025,1)};
    fit(directions[name]);
    panel.querySelectorAll('[data-roof-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.roofView===name)));
  }
  controls.addEventListener('start',()=>{
    view='custom';panel.querySelectorAll('[data-roof-view]').forEach(button=>button.setAttribute('aria-pressed','false'));
  });
  function setClean(enabled) {
    if(clean===enabled)return;
    clean=enabled;
    if(enabled) {
      savedVisibility=[groups.labels.visible,grid.visible,highlight.visible];
      savedCamera={position:camera.position.clone(),target:controls.target.clone()};
      groups.labels.visible=grid.visible=highlight.visible=false;
      scene.background=new T.Color('#f5f7f8');
    } else {
      [groups.labels.visible,grid.visible,highlight.visible]=savedVisibility;
      scene.background=originalBackground.clone();
    }
    document.body.classList.toggle('roof-capture-mode',enabled);
    captureButton.textContent=enabled?'ออกจากโหมดแคป':'โหมดแคป';
    captureButton.setAttribute('aria-pressed',String(enabled));
    if(enabled) fit(camera.position.clone().sub(controls.target));
    else {
      settle();camera.position.copy(savedCamera.position);controls.target.copy(savedCamera.target);settle();
    }
  }
  function sync(nextMode=mode) {
    mode=nextMode;
    const active=mode==='3d'&&groups.roof.visible;
    if(!active&&clean)setClean(false);
    panel.hidden=!active;
    // Allow a true overhead view while retaining the normal orbit floor limit.
    controls.minPolarAngle=0;
    applyStyle();
  }
  async function download() {
    if(downloadButton.disabled)return;
    downloadButton.disabled=true;status.textContent='กำลังบันทึกภาพ…';
    const visibility=[groups.labels.visible,grid.visible,highlight.visible], background=scene.background;
    let output, restored=false;
    try {
      const rect=renderer.domElement.getBoundingClientRect(), aspect=rect.width/rect.height;
      const width=aspect>=1?2400:Math.round(2400*aspect), height=aspect>=1?Math.round(2400/aspect):2400;
      output=new T.WebGLRenderer({antialias:true,alpha:false});
      output.setPixelRatio(1);output.setSize(width,height);
      output.outputColorSpace=renderer.outputColorSpace;
      output.shadowMap.enabled=true;output.shadowMap.type=renderer.shadowMap.type;
      groups.labels.visible=grid.visible=highlight.visible=false;scene.background=new T.Color('#f5f7f8');
      const exportCamera=camera.clone();exportCamera.aspect=width/height;exportCamera.updateProjectionMatrix();
      output.render(scene,exportCamera);
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d');ctx.drawImage(output.domElement,0,0);
      [groups.labels.visible,grid.visible,highlight.visible]=visibility;scene.background=background;restored=true;
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw Error('PNG export failed');
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`ohm-roof-v${version}-${view}.png`;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      status.textContent='บันทึก PNG แล้ว · ด้านยาว 2,400 พิกเซล';
    } catch(error) {
      console.error('Roof export failed',error);status.textContent='บันทึกภาพไม่สำเร็จ ลองอีกครั้งหรือใช้โหมดแคป';
    } finally {
      if(!restored){[groups.labels.visible,grid.visible,highlight.visible]=visibility;scene.background=background;}
      output?.dispose();output?.forceContextLoss();downloadButton.disabled=false;
    }
  }
  $('#roof-style').addEventListener('change',applyStyle);
  $('#roof-edges').addEventListener('change',applyStyle);
  panel.querySelectorAll('[data-roof-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.roofView)));
  captureButton.addEventListener('click',()=>setClean(!clean));
  downloadButton.addEventListener('click',download);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&clean){setClean(false);captureButton.focus();}});
  sync();
  return {sync,isClean:()=>clean};
}
