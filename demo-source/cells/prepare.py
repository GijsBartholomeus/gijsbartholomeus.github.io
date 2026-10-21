"""Prepare biological NeuroTS example morphologies for the browser TMD comparison.

Inputs: openbraininstitute/NeuroTS revision 5ee2931192c12337b34be27ac0aa61353e136284,
examples/data/neurons/{C220197A-P2,Fluo55_left}.h5. Data are kept unchanged.
The coloured arbor is the apical dendrite; basal dendrites provide grey context.
Path-distance descriptors are checked against TMD 2.4.3. Zero-length samples are
collapsed without changing the metric tree. No biological cell-type labels are inferred.
"""
from pathlib import Path
import json
import numpy as np
import tmd
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).resolve().parent
cells=[]
for filename,key in [('C220197A-P2.h5','c220'),('Fluo55_left.h5','fluo55')]:
    neuron=tmd.io.load_neuron(str(SOURCE/filename))
    tree=neuron.apical_dendrite[0]
    distance=tree.get_point_path_distances()
    origin=np.array([tree.x[0],tree.y[0],tree.z[0]])
    nodes=[];alias={}
    for i,parent in enumerate(tree.p):
        if parent>=0 and abs(distance[i]-distance[parent])<1e-8:
            alias[i]=alias[int(parent)];continue
        alias[i]=len(nodes)
        xyz=np.array([tree.x[i],tree.y[i],tree.z[i]])-origin
        nodes.append({'id':len(nodes),'parent':-1 if parent<0 else alias[int(parent)],'r':float(distance[i]),'x':float(xyz[0]),'y':float(xyz[1]),'z':float(xyz[2]),'source':-1})
    children=[[] for _ in nodes]
    for n in nodes[1:]:children[n['parent']].append(n['id'])
    bars=[]
    survivors_by_node=[None]*len(nodes)
    for i in range(len(nodes)-1,-1,-1):
        if not children[i]:survivors_by_node[i]=(nodes[i]['r'],i)
        else:
            survivors=sorted((survivors_by_node[c] for c in children[i]),key=lambda p:(-p[0],p[1]))
            for end,tip in survivors[1:]:bars.append((nodes[i]['r'],end,tip))
            survivors_by_node[i]=survivors[0]
    end,tip=survivors_by_node[0];bars.append((0,end,tip));bars.sort(key=lambda b:(b[0],-b[1]))
    for label,(_,_,tip) in enumerate(bars):nodes[tip]['source']=label
    official=sorted([[float(b),float(a)] for a,b in tmd.methods.get_persistence_diagram(tree,feature='path_distances') if abs(a-b)>1e-8])
    actual=sorted([[b,e] for b,e,_ in bars])
    assert len(actual)==len(official)
    assert np.allclose(actual,official,atol=1e-5)
    ghost=[]
    for arbor in neuron.basal_dendrite:
        for i,parent in enumerate(arbor.p):
            if parent>=0:
                a=np.array([arbor.x[parent],arbor.y[parent],arbor.z[parent]])-origin
                b=np.array([arbor.x[i],arbor.y[i],arbor.z[i]])-origin
                ghost.append([*a.tolist(),*b.tolist()])
    def rounded(v):return round(float(v),6)
    for n in nodes:
        for field in ('r','x','y','z'):n[field]=rounded(n[field])
    cells.append({'key':key,'name':Path(filename).stem,'nodes':nodes,'ghost':[[rounded(x) for x in g] for g in ghost],'official':official,'tips':len(bars),'metric':'path distance','source':'https://github.com/openbraininstitute/NeuroTS/blob/5ee2931192c12337b34be27ac0aa61353e136284/examples/data/neurons/'+filename})
    print(filename,':',len(nodes),'points,',len(bars),'bars; official TMD agrees',flush=True)
asset=ROOT/'site/assets/tmd-cells.js'
asset.write_text('/* Biological example morphologies from NeuroTS; see demo-source/cells/prepare.py and README. */\nwindow.AeroTMDCells='+json.dumps(cells,separators=(',',':'),allow_nan=False)+';\n')
print('Asset:',asset.stat().st_size,'bytes')
