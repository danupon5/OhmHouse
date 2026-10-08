import bpy,json,os,hashlib,sys,time
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
os.makedirs(ROOT+'/assets',exist_ok=True)
source=bpy.data.filepath
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=1
scene.render.bake.use_pass_direct=False
scene.render.bake.use_pass_indirect=False
scene.render.bake.use_pass_color=True
scene.render.bake.margin=4
report={'source':os.path.basename(source),'sha256':hashlib.sha256(open(source,'rb').read()).hexdigest(),'bakedObjects':[],'meshCount':0,'roofObjects':[]}
for o in scene.objects:
    o['webLabel']=o.name
    parents=[]; p=o
    while p:
        parents.append(p);p=p.parent
    roof=any(any('หลังคา' in c.name for c in p.users_collection) or p.get('kind')=='roof' or p.name.startswith(('ฝ้า','ช่องลมจั่ว')) for p in parents)
    o['webRoof']=roof
    if roof and o.type=='MESH':report['roofObjects'].append(o.name)
    if o.type!='MESH':continue
    report['meshCount']+=1
    procedural=any(m and m.use_nodes and any(n.type in ('TEX_BRICK','TEX_NOISE') for n in m.node_tree.nodes) for m in o.data.materials)
    if not procedural:continue
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    o.data=o.data.copy()
    # Bake colour in each object's original coordinate system before glTF conversion.
    uv=o.data.uv_layers.new(name='WebBake')
    o.data.uv_layers.active=uv;uv.active_render=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(island_margin=0.025);bpy.ops.object.mode_set(mode='OBJECT')
    resolution=1024 if max(o.dimensions)>4 else 512
    img=bpy.data.images.new('web_'+o.name,width=resolution,height=resolution,alpha=False)
    mats=[]
    for i,m in enumerate(o.data.materials):
        if not m:continue
        m=m.copy();o.data.materials[i]=m
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=img
        m.node_tree.nodes.active=node;node.select=True
        mats.append((m,node))
    bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'})
    img.pack()
    for m,node in mats:
        bsdf=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if bsdf:
            for link in list(bsdf.inputs['Base Color'].links):m.node_tree.links.remove(link)
            m.node_tree.links.new(node.outputs['Color'],bsdf.inputs['Base Color'])
            uvnode=m.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map=uv.name;m.node_tree.links.new(uvnode.outputs['UV'],node.inputs['Vector'])
    report['bakedObjects'].append(o.name)
    print('BAKED',len(report['bakedObjects']),o.name,flush=True)
bpy.ops.object.select_all(action='SELECT')
result=bpy.ops.export_scene.gltf(filepath=ROOT+'/assets/house-stable-v412.glb',export_format='GLB',export_apply=True,export_yup=True,export_extras=True,export_animations=False,export_cameras=False,export_lights=False)
report['exportResult']=list(result)
report['bytes']=os.path.getsize(ROOT+'/assets/house-stable-v412.glb')
open(ROOT+'/assets/model-info.json','w').write(json.dumps(report,ensure_ascii=False,indent=2))
print('EXPORT_COMPLETE',json.dumps(report,ensure_ascii=False),flush=True)
