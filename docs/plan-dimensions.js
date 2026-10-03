const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const point=(p,scale)=>[60+p[0]*scale,60+p[1]*scale];
const length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0)/2);
const colors={overall:'#204f65',walls:'#446672',openings:'#976224',rooms:'#506e43'};

// Coordinates and values stay in model metres until the SVG projection step.
// Room dimensions follow every polygon edge, including concave L-shaped rooms.
export function houseDimensions({slab,walls,openings,rooms},filters) {
  const records=[],p=slab.polygon;
  const minX=Math.min(...p.map(v=>v[0])),maxX=Math.max(...p.map(v=>v[0]));
  const minZ=Math.min(...p.map(v=>v[1])),maxZ=Math.max(...p.map(v=>v[1]));
  const add=(id,group,a,b,label,offset=15,value=length(a,b))=>{
    if(!Number.isFinite(value))return;
    const title=`${label} ${value.toFixed(3)}`;
    const compact=group==='openings'?(id.endsWith('-width')?label.split(' ')[0]:`${label.split(' ')[0]} ${id.endsWith('-left')?'A':'B'}`):group==='rooms'?label.replace(' ช่วง ', '·'):label;
    records.push({id,group,a,b,value,title,label:`${compact} ${value.toFixed(3)}`.trim(),offset});
  };
  if(filters.overall) {
    add('overall-x','overall',[minX,minZ],[maxX,minZ],'ขอบพื้น X',-62);
    add('overall-z','overall',[maxX,minZ],[maxX,maxZ],'ขอบพื้น Z',-62);
  }
  if(filters.walls) {
    p.forEach((a,i)=>add(`floor-${i}`,'walls',a,p[(i+1)%p.length],`พื้น ${i+1}`,-32));
    walls.forEach(w=>add(w.id,'walls',w.start,w.end,w.code,14));
  }
  if(filters.openings) for(const o of openings) {
    const w=o.wall,theta=Math.atan2(w.end[1]-w.start[1],w.end[0]-w.start[0]);
    const along=d=>[w.start[0]+Math.cos(theta)*d,w.start[1]+Math.sin(theta)*d];
    const start=o.left,end=o.s+o.width/2;
    add(`${o.code}-left`,'openings',along(0),along(start),`${o.code} A→ขอบ`,-14,start);
    add(`${o.code}-width`,'openings',along(start),along(end),`${o.code} กว้าง`,-14,o.width);
    add(`${o.code}-right`,'openings',along(end),w.end,`${o.code} ขอบ→B`,-14,o.right);
  }
  if(filters.rooms) rooms.filter(r=>r.polygon.length>=3&&area(r.polygon)>.001).forEach(r=>{
    r.polygon.forEach((a,i)=>add(`${r.id}-${i}`,'rooms',a,r.polygon[(i+1)%r.polygon.length],`${r.name} ช่วง ${i+1}`,28));
  });
  return records;
}

const overlap=(a,b)=>a.x<b.x+b.w+3&&a.x+a.w+3>b.x&&a.y<b.y+b.h+3&&a.y+a.h+3>b.y;
// Reserve the existing floor-plan labels, then place each dimension label in a
// free slot near its measurement. Leader lines keep displaced labels anchored.
export function layoutDimensions(records,reserved=[],{scale=36,baseWidth=600,baseHeight=620}={}) {
  const occupied=reserved.map(r=>({...r})),labels=[];
  for(const record of records) {
    const a=point(record.a,scale),b=point(record.b,scale),dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    const normal=len>1e-8?[-dy/len,dx/len]:[0,-1];
    const q=a.map((v,i)=>v+normal[i]*record.offset),r=b.map((v,i)=>v+normal[i]*record.offset);
    const mid=[(q[0]+r[0])/2,(q[1]+r[1])/2];
    const width=Array.from(record.label).length*7+14,height=20;
    let box;
    for(let ring=0;!box;ring++) {
      const candidates=ring===0?[[0,-13]]:[[0,-13-ring*25],[0,13+ring*25],[-ring*28,-13],[ring*28,-13],[-ring*28,-13-ring*25],[ring*28,13+ring*25]];
      for(const [x,y] of candidates) {
        const candidate={x:mid[0]+x-width/2,y:mid[1]+y-height/2,w:width,h:height};
        if(!occupied.some(other=>overlap(candidate,other))){box=candidate;break;}
      }
    }
    occupied.push(box);labels.push({...record,a,b,q,r,normal,mid,box});
  }
  const xs=labels.flatMap(d=>[d.box.x,d.box.x+d.box.w,d.q[0],d.r[0]]);
  const ys=labels.flatMap(d=>[d.box.y,d.box.y+d.box.h,d.q[1],d.r[1]]);
  const minX=Math.min(0,...xs)-18,minY=Math.min(0,...ys)-18;
  const maxX=Math.max(baseWidth,...xs)+18,maxY=Math.max(baseHeight,...ys)+18;
  return {labels,viewBox:[minX,minY,maxX-minX,maxY-minY]};
}

export function annotatePlan(base,records,options={}) {
  const reserved=[];
  // Existing SVG uses numeric x/y attributes. Oversized reservations also cover
  // rotated labels and nearby opening markers without relying on browser fonts.
  for(const match of base.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const x=Number(match[1].match(/\bx="([\d.-]+)"/)?.[1]),y=Number(match[1].match(/\by="([\d.-]+)"/)?.[1]);
    if(Number.isFinite(x)&&Number.isFinite(y)) {
      const w=match[2].replace(/<[^>]*>/g,'').length*7+12;
      reserved.push({x:x-w/2,y:y-14,w,h:28});
    }
  }
  const layout=layoutDimensions(records,reserved,options),vb=layout.viewBox;
  const line=(a,b,extra='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" ${extra}/>`;
  // Draw all strokes first, then opaque labels, so leaders cannot cross text.
  let strokes='',texts='';
  for(const d of layout.labels) {
    const color=colors[d.group],tick=p=>line([p[0]-d.normal[0]*4,p[1]-d.normal[1]*4],[p[0]+d.normal[0]*4,p[1]+d.normal[1]*4]);
    const center=[d.box.x+d.box.w/2,d.box.y+d.box.h/2];
    const target=[Math.max(d.box.x,Math.min(d.mid[0],d.box.x+d.box.w)),Math.max(d.box.y,Math.min(d.mid[1],d.box.y+d.box.h))];
    strokes+=`<g stroke="${color}" fill="none">${line(d.a,d.q,'opacity=".32"')}${line(d.b,d.r,'opacity=".32"')}${line(d.q,d.r)}${tick(d.q)}${tick(d.r)}${line(d.mid,target,'stroke-dasharray="2 3" opacity=".6"')}</g>`;
    const interactive=d.group==='openings'?`data-code="${esc(d.id.split('-')[0])}" tabindex="0" role="button" aria-label="${esc(d.title)} เมตร"`:``;
    texts+=`<g pointer-events="all" ${interactive} data-dimension="${esc(d.id)}" data-group="${d.group}"><title>${esc(d.title)} เมตร</title><rect x="${d.box.x}" y="${d.box.y}" width="${d.box.w}" height="${d.box.h}" rx="3" fill="#fff" stroke="${color}" stroke-opacity=".3"/><text x="${center[0]}" y="${center[1]}" text-anchor="middle" dominant-baseline="central" fill="${color}">${esc(d.label)}</text></g>`;
  }
  return base.replace(/viewBox="[^"]*"/,`viewBox="${vb.join(' ')}"`).replace(/<rect width="[\d.]+" height="[\d.]+" fill="#f1f5f6"\/>/,`<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#f1f5f6"/>`).replace('</svg>',`<g class="house-dimensions" font-family="sans-serif" font-size="11" stroke-width=".8" pointer-events="none">${strokes}${texts}</g></svg>`);
}

export function createPlanViewport(container,{onSelect,onZoom}) {
  let zoom=1,svg=null,box=[0,0,600,620],drag=null,suppressClick=false;
  function renderSize() {
    if(!svg||container.hidden)return;
    const width=container.clientWidth,height=container.clientHeight;
    const fit=Math.min(width/box[2],height/box[3]);
    const w=box[2]*fit*zoom,h=box[3]*fit*zoom;
    svg.style.width=`${w}px`;svg.style.height=`${h}px`;
    const sheet=container.firstElementChild;
    sheet.style.width=`${Math.max(width,w)}px`;sheet.style.height=`${Math.max(height,h)}px`;
    onZoom(zoom);
  }
  function setZoom(next) {
    const previous=zoom,cx=(container.scrollLeft+container.clientWidth/2),cy=(container.scrollTop+container.clientHeight/2);
    zoom=Math.max(1,Math.min(8,next));renderSize();
    container.scrollLeft=cx*zoom/previous-container.clientWidth/2;
    container.scrollTop=cy*zoom/previous-container.clientHeight/2;
  }
  container.addEventListener('click',event=>{
    if(suppressClick){suppressClick=false;return;}
    const target=event.target.closest('[data-code]');if(target)onSelect(target.dataset.code);
  });
  container.addEventListener('keydown',event=>{
    const target=event.target.closest('[data-code]');
    if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();onSelect(target.dataset.code);return;}
    if(event.key==='+'||event.key==='='){event.preventDefault();setZoom(zoom*1.4);}
    if(event.key==='-'){event.preventDefault();setZoom(zoom/1.4);}
    if(event.key==='Home'){event.preventDefault();setZoom(1);}
  });
  container.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'||event.button!==0)return;
    suppressClick=false;drag={x:event.clientX,y:event.clientY,left:container.scrollLeft,top:container.scrollTop,id:event.pointerId,moved:false};
  });
  container.addEventListener('pointermove',event=>{
    if(!drag)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.hypot(dx,dy)>5){drag.moved=true;container.setPointerCapture(event.pointerId);}
    if(drag.moved){container.scrollLeft=drag.left-dx;container.scrollTop=drag.top-dy;event.preventDefault();}
  });
  const release=()=>{if(drag){suppressClick=drag.moved;drag=null;}};
  container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);
  container.addEventListener('lostpointercapture',release);
  container.addEventListener('wheel',event=>{if(event.ctrlKey){event.preventDefault();setZoom(zoom*(event.deltaY<0?1.15:1/1.15));}},{passive:false});
  new ResizeObserver(renderSize).observe(container);
  return {
    mount(markup){const x=container.scrollLeft,y=container.scrollTop;container.innerHTML=`<div class="plan-sheet">${markup}</div>`;svg=container.querySelector('svg');box=svg.getAttribute('viewBox').split(/\s+/).map(Number);renderSize();container.scrollLeft=x;container.scrollTop=y;},
    zoomIn(){setZoom(zoom*1.4);},zoomOut(){setZoom(zoom/1.4);},fit(){setZoom(1);container.scrollLeft=container.scrollTop=0;},resize:renderSize
  };
}
