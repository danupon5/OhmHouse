import * as T from 'three';
// Nominal 4-inch visible trim diameter. Product-specific ceiling cutout is not defined.
export const downlightDiameter=0.1016;
export function resizeDownlights(root){
 root.updateMatrixWorld(true);
 const fixtures=[];
 root.traverse(o=>{if(/^ไฟหลุม_/.test(o.userData.webLabel||o.name))fixtures.push(o)});
 for(const fixture of fixtures){
  let rim=null;fixture.traverse(o=>{if(o.isMesh&&/^ขอบไฟหลุม_/.test(o.userData.webLabel||o.name))rim=o});
  if(!rim)continue;
  const size=new T.Box3().setFromObject(rim).getSize(new T.Vector3());
  const diameter=Math.max(size.x,size.z);if(!Number.isFinite(diameter)||diameter<=0)continue;
  const ratio=downlightDiameter/diameter;
  fixture.scale.x*=ratio;fixture.scale.z*=ratio;
  fixture.userData.nominalSizeInches=4;fixture.userData.trimDiameterMetres=downlightDiameter;
  fixture.updateMatrixWorld(true);
 }
 return fixtures.length;
}
