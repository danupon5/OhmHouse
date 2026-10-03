import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {houseDimensions,layoutDimensions,annotatePlan,createPlanViewport} from '../dist/plan-dimensions.js';

const root=new URL('../',import.meta.url),scene=JSON.parse(await readFile(new URL('dist/scene.json',root),'utf8'));
const of=type=>Object.values(scene.nodes).filter(n=>n.type===type&&n.visible!==false);
const walls=of('wall').map((w,i)=>({...w,code:`WL${String(i+1).padStart(2,'0')}`,L:Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1]),angle:Math.atan2(w.end[1]-w.start[1],w.end[0]-w.start[0])}));
const openings=['door','window'].flatMap(type=>of(type).map((o,i)=>{
  const wall=walls.find(w=>w.id===o.wallId),s=o.position[0],sill=o.position[1]-o.height/2;
  return {...o,wall,s,sill,head:sill+o.height,code:`${type==='door'?'D':'W'}${String(i+1).padStart(2,'0')}`,left:s-o.width/2,right:wall.L-s-o.width/2,x:wall.start[0]+Math.cos(wall.angle)*s,z:wall.start[1]+Math.sin(wall.angle)*s,issues:[]};
}));
const model={walls,openings,rooms:of('zone'),slab:of('slab')[0]};
const all={overall:true,walls:true,openings:true,rooms:true};
const dimensions=houseDimensions(model,all);

test('overall dimensions come from the slab, not fixed display constants',()=>{
  const overall=houseDimensions(model,{overall:true});
  assert.deepEqual(overall.map(d=>d.value),[12.79,12.88]);
  const changed={...model,slab:{polygon:[[2,3],[8,3],[8,12],[2,12]]}};
  assert.deepEqual(houseDimensions(changed,{overall:true}).map(d=>d.value),[6,9]);
});
test('all visible walls and all three opening dimensions are included',()=>{
  for(const w of walls)assert.equal(dimensions.find(d=>d.id===w.id).value,w.L);
  for(const o of openings){
    const rows=dimensions.filter(d=>d.id.startsWith(o.code+'-'));
    assert.equal(rows.length,3);
    assert.ok(Math.abs(rows.reduce((s,d)=>s+d.value,0)-o.wall.L)<1e-8);
  }
  assert.ok(dimensions.find(d=>d.id==='D09-right').value<0,'Retain a real opening overrun, never turn it into a positive gap');
});
test('L-shaped rooms use their actual edges and the invalid zone is excluded',()=>{
  const bedroom=model.rooms.find(r=>r.name==='นอน1');
  const rows=dimensions.filter(d=>d.group==='rooms'&&d.id.startsWith(bedroom.id+'-'));
  assert.equal(rows.length,6);
  assert.deepEqual(rows.map(d=>Number(d.value.toFixed(3))),[3.5,2.94,2,2.06,5.5,5]);
  const invalid=model.rooms.find(r=>r.name==='Zone 8');
  assert.ok(!dimensions.some(d=>d.id.startsWith(invalid.id+'-')));
});
test('filters independently remove groups, including all-off',()=>{
  for(const group of Object.keys(all))assert.ok(houseDimensions(model,{[group]:true}).every(d=>d.group===group));
  assert.equal(houseDimensions(model,{}).length,0);
});
test('dimension labels do not overlap each other and fit the SVG viewBox',()=>{
  const {labels,viewBox:[x,y,w,h]}=layoutDimensions(dimensions,[{x:0,y:0,w:600,h:40}]);
  for(let i=0;i<labels.length;i++){
    const a=labels[i].box;
    assert.ok(a.x>=x&&a.y>=y&&a.x+a.w<=x+w&&a.y+a.h<=y+h);
    for(let j=0;j<i;j++){
      const b=labels[j].box;
      assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y);
    }
  }
});

for(const directory of ['dist','docs'])test(`${directory}: selection, all-house filters, and print use the same state`,async()=>{
  const source=await readFile(new URL(`${directory}/app.js`,root),'utf8');
  const elements=new Map(),filterInputs=Object.keys(all).map(key=>({dataset:{dimFilter:key},checked:true}));
  const $=selector=>{if(!elements.has(selector))elements.set(selector,{hidden:false,checked:false,innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(k,v){this[k]=v;},querySelectorAll(){return filterInputs;}});return elements.get(selector);};
  const context=vm.createContext({...model,cols:of('column'),selected:openings[0],showDimensions:false,mode:'2d',data:scene,$,houseDimensions,annotatePlan,
    createPlanViewport:()=>({mount(markup){$('#plan').innerHTML=markup;},fit(){},resize(){}}),
    roofView:{sync(){}},select(){},reset(){},table(){},esc:s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;'),
    f:n=>Number(n).toFixed(3),short:n=>Number(n).toFixed(2),area:p=>Math.abs(p.reduce((s,a,i)=>{let b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2),
    kind:()=>'',structureTable:()=>'',elevation:()=>'',window:{print(){this.printed=true;}}
  });
  const start=source.indexOf('function dimensionMarkup('),end=source.indexOf("\n$('#mode3d').onclick",start);
  vm.runInContext(source.slice(start,end),context);
  vm.runInContext('plan()',context);assert.ok(!$('#plan').innerHTML.includes('house-dimensions'));
  $('#dimensions-all').onclick();
  assert.equal($('#dimensions').checked,true);
  assert.equal($('#dimensions-all')['aria-pressed'],'true');
  assert.equal(($('#plan').innerHTML.match(/data-dimension=/g)||[]).length,dimensions.length);
  filterInputs.find(i=>i.dataset.dimFilter==='rooms').checked=false;
  filterInputs.find(i=>i.dataset.dimFilter==='rooms').onchange();
  assert.ok(!$('#plan').innerHTML.includes('data-group="rooms"'));
  vm.runInContext(source.split('\n').find(line=>line.startsWith("$('#print').onclick=")),context);
  $('#print').onclick();assert.ok(context.window.printed);
  assert.ok($('#print-sheet').innerHTML.includes('house-dimensions'));
  assert.ok(!$('#print-sheet').innerHTML.includes('data-group="rooms"'));
  $('#dimensions-selected').onclick();
  assert.ok($('#plan').innerHTML.includes('dimension-layer'));
  assert.ok(!$('#plan').innerHTML.includes('house-dimensions'));
  $('#print').onclick();assert.ok($('#print-sheet').innerHTML.includes('dimension-layer'));
  vm.runInContext('showDimensions=false;plan()',context);
  assert.ok(!$('#plan').innerHTML.includes('dimension-layer'));
  $('#print').onclick();assert.ok(!$('#print-sheet').innerHTML.includes('dimension-layer'));
  if(process.env.DIMENSION_SVG&&directory==='dist'){
    filterInputs.forEach(input=>{input.checked=true;input.onchange();});$('#dimensions-all').onclick();
    await writeFile(process.env.DIMENSION_SVG,$('#plan').innerHTML);
  }
});

test('viewport zoom limits, fit, selection and drag suppression',()=>{
  const handlers={},svg={style:{},getAttribute:()=>'-100 -100 800 800'},sheet={style:{}};
  const container={hidden:false,clientWidth:600,clientHeight:400,scrollLeft:0,scrollTop:0,firstElementChild:sheet,
    addEventListener:(name,fn)=>handlers[name]=fn,querySelector:()=>svg,setPointerCapture(){}};
  const previous=globalThis.ResizeObserver;globalThis.ResizeObserver=class{observe(){}};
  let currentZoom,selected;
  try{
    const view=createPlanViewport(container,{onZoom:z=>currentZoom=z,onSelect:c=>selected=c});
    view.mount('<svg/>');assert.equal(svg.style.width,'400px');
    for(let i=0;i<20;i++)view.zoomIn();assert.equal(currentZoom,8);
    view.fit();assert.equal(currentZoom,1);assert.equal(container.scrollLeft,0);
    const event={target:{closest:()=>({dataset:{code:'D01'}})}};
    handlers.click(event);assert.equal(selected,'D01');selected=null;
    handlers.pointerdown({pointerType:'mouse',button:0,clientX:0,clientY:0,pointerId:1});
    handlers.pointermove({clientX:20,clientY:0,pointerId:1,preventDefault(){}});handlers.pointerup();handlers.click(event);
    assert.equal(selected,null);handlers.click(event);assert.equal(selected,'D01');
  }finally{globalThis.ResizeObserver=previous;}
});

test('both published folders use the same dimension module',async()=>{
  assert.equal(await readFile(new URL('docs/plan-dimensions.js',root),'utf8'),await readFile(new URL('dist/plan-dimensions.js',root),'utf8'));
});
