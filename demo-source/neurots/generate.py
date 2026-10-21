"""Generate browser playback data with the official NeuroTS package (no browser backend).

Run with Python 3.12, NeuroTS 3.7.0, TMD 2.4.3. Inputs are the authors' example
files at openbraininstitute/NeuroTS commit 5ee2931192c12337b34be27ac0aa61353e136284.
Only the apical dendrite is grown, using the supplied path-distance TMD settings.
The recording follows the same NeuronGrower growth loop as grow(), preserving
actual iteration numbers for playback. These are algorithm steps, not biological time.
"""
import importlib.metadata
import json
from pathlib import Path
import logging
import neurots
import numpy as np
import tmd

logging.getLogger().setLevel(logging.ERROR)
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(__file__).resolve().parent
ASSETS=ROOT/'site/assets'
params=json.loads((SOURCE/'bio_params.json').read_text())
params['grow_types']=['apical_dendrite']
distributions=json.loads((SOURCE/'bio_distr.json').read_text())
target=sorted([[row[1],row[0]] for row in distributions['apical_dendrite']['persistence_diagram'][0]])
recordings=[]

def key(p): return tuple(round(float(np.float32(v)),5) for v in p)

def record_neuron(seed, input_distributions):
    grower=neurots.NeuronGrower(input_parameters=params,input_distributions=input_distributions,rng_or_seed=seed)
    grower._grow_soma()
    times={}
    step=0
    def record():
        for section in grower.neuron.sections.values():
            for p in section.points: times.setdefault(key(p),step)
        for tree in grower.active_neurites:
            for section in tree.active_sections:
                for p in section.points: times.setdefault(key(p),step)
    record()
    while grower.active_neurites:
        step+=1
        if step>10000: raise RuntimeError('Unexpectedly long NeuroTS run')
        grower.next()
        record()
    grower._post_grow()
    grower._diametrize()
    out=ASSETS/f'neurots-apical-{seed}.swc'
    grower.neuron.write(out)
    # Use actual final section geometry; duplicate branch junctions share vertices.
    vertices=[];indices={};edges=[]
    def vertex(p):
        k=key(p)
        if k not in indices:
            assert k in times, f'Missing growth timestamp: {k}'
            indices[k]=len(vertices)
            vertices.append([round(float(v),3) for v in p]+[times[k]])
        return indices[k]
    for section in grower.neuron.sections.values():
        ids=[vertex(p) for p in section.points]
        edges.extend([[a,b] for a,b in zip(ids,ids[1:]) if a!=b])
    neuron=tmd.io.load_neuron(str(out))
    barcode=tmd.methods.get_persistence_diagram(neuron.apical_dendrite[0],feature='path_distances')
    recovered=sorted([[round(float(p[1]),3),round(float(p[0]),3)] for p in barcode])
    result={'seed':seed,'steps':step,'vertices':vertices,'edges':edges,'barcode':recovered,'tips':len(recovered),'sections':len(grower.neuron.sections),'swc':out.name}
    print('Seed',seed,':',step,'steps,',len(vertices),'points,',len(recovered),'tips',flush=True)
    return result

reference=record_neuron(42,distributions)
reference_tree=tmd.io.load_neuron(str(ASSETS/reference['swc'])).apical_dendrite[0]
# Extract both the TMD and its associated branch-angle properties from THIS tree.
source_ph=tmd.methods.get_ph_angles(reference_tree,feature='path_distances')
distributions['apical_dendrite']['persistence_diagram']=[source_ph]
target=sorted([[float(row[1]),float(row[0])] for row in source_ph])
assert all(abs(a-b)<.01 for pair,other in zip(target,reference['barcode']) for a,b in zip(pair,other))
for seed in (137,271,459): recordings.append(record_neuron(seed,distributions))

data={'reference':reference,'software':'NeuroTS '+importlib.metadata.version('neurots'),'tmdSoftware':'TMD '+importlib.metadata.version('TMD'),'sourceCommit':'5ee2931192c12337b34be27ac0aa61353e136284','metric':'path distance','target':target,'recordings':recordings}
(ASSETS/'neurots-growth.js').write_text('/* Generated with official NeuroTS; see demo-source/neurots/generate.py. */\nwindow.AeroNeuroTSRecordings='+json.dumps(data,separators=(',',':'),allow_nan=False)+';\n')
print('Browser playback asset:',(ASSETS/'neurots-growth.js').stat().st_size,'bytes')
