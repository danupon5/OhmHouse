import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../dist/vendor/three.module.js';

// Browser import maps are not available in Node; resolve the same vendored Three.
const source=await readFile(new URL('../dist/roof-view.js',import.meta.url),'utf8');
const moduleSource=source.replace("from 'three'",`from '${new URL('../dist/vendor/three.module.js',import.meta.url).href}'`);
const {roofGeometry,buildRoof}=await import('data:text/javascript;base64,'+Buffer.from(moduleSource).toString('base64'));
const data=JSON.parse(await readFile(new URL('../dist/scene.json',import.meta.url),'utf8'));
const segments=Object.values(data.nodes).filter(n=>n.type==='roof-segment');

for(const segment of segments) test(`roof surface and creases: ${segment.id}`,()=>{
  const geometry=roofGeometry(segment), positions=geometry.getAttribute('position');
  assert.ok(positions.count>0&&positions.count<=24,'Only actual roof planes, without a dense triangle grid');
  const w=segment.width/2,d=segment.depth/2,slope=Math.tan(segment.pitch*Math.PI/180);
  const xmin=-w+(segment.trim?.left||0),xmax=w-(segment.trim?.right||0);
  const material=new T.MeshBasicMaterial({side:T.DoubleSide});
  const mesh=new T.Mesh(geometry,material);mesh.updateMatrixWorld();
  const ray=new T.Raycaster();
  for(let ix=0;ix<11;ix++)for(let iz=0;iz<11;iz++) {
    const x=xmin+(xmax-xmin)*(ix+.37)/11,z=-d+2*d*(iz+.43)/11;
    const h=segment.roofType==='shed'?d-z:segment.roofType==='hip'?Math.max(0,Math.min(d-Math.abs(z),w-Math.abs(x))):d-Math.abs(z);
    ray.set(new T.Vector3(x,100,z),new T.Vector3(0,-1,0));
    const hits=ray.intersectObject(mesh);
    assert.ok(hits.length,'No holes in the clipped surface');
    assert.ok(Math.abs(hits[0].point.y-((segment.wallHeight||0)+h*slope))<2e-5,'Height agrees with the existing roof formula');
  }
  const normals=geometry.getAttribute('normal');
  for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>0,'All face normals point upwards');
  const edges=new T.EdgesGeometry(geometry,1).getAttribute('position');
  // Every non-boundary edge is an actual slope change, never a flat-face diagonal.
  for(let i=0;i<edges.count;i+=2){
    const a=new T.Vector3().fromBufferAttribute(edges,i),b=new T.Vector3().fromBufferAttribute(edges,i+1);
    const boundary=[xmin,xmax].some(x=>Math.abs(a.x-x)<1e-4&&Math.abs(b.x-x)<1e-4)||[-d,d].some(z=>Math.abs(a.z-z)<1e-4&&Math.abs(b.z-z)<1e-4);
    if(!boundary){
      assert.notEqual(segment.roofType,'shed');
      if(segment.roofType==='gable')assert.ok(Math.abs(a.z)<1e-5&&Math.abs(b.z)<1e-5);
      else for(const p of [a,b])assert.ok(Math.abs((d-Math.abs(p.z))-(w-Math.abs(p.x)))<1e-4||Math.abs(p.z)<1e-5||Math.abs(p.x)<1e-5);
    }
  }
  const parent=data.nodes[segment.parentId],group=new T.Group();
  const roof=buildRoof(segment,parent,group,material);
  assert.equal(roof.edges.children.length,edges.count/2);
  for(const edge of roof.edges.children)assert.equal(edge.material.depthTest,true,'Hidden edges must remain occluded');
});

test('invalid empty trim produces no surface',()=>{
  const geo=roofGeometry({width:4,depth:4,pitch:25,roofType:'gable',trim:{left:4}});
  assert.equal(geo.getAttribute('position'),undefined);
});

test('GitHub Pages and Sites share the roof implementation',async()=>{
  assert.equal(await readFile(new URL('../docs/roof-view.js',import.meta.url),'utf8'),source);
});
