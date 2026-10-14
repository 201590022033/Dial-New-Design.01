"""Hash-gated local component promotion and measured gallery download budgets."""
import argparse, hashlib, json, shutil, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from realism_contract import read,stats
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--run',required=True);p.add_argument('--promote',action='store_true');args=p.parse_args();repo=Path(args.repo).resolve();run=Path(args.run).resolve()
    inputs=json.loads((repo/'docs/realism/VR0-INPUT-MANIFEST.json').read_text());expected=[f for f in inputs['files']if f['eligible']]
    contract=json.loads((run/'reports/full-contract.json').read_text());assert contract['passed']and len(contract['files'])==len(expected)==101,'Preservation gate incomplete'
    validated=json.loads((run/'reports/validator/summary.json').read_text());assert validated['errors']==0 and validated['warnings']==0 and len(validated['files'])==101,'Khronos gate incomplete'
    checks={str(Path(f['candidate']).resolve()):f for f in contract['files']};records=[]
    prior_path=run/'reports/promotion-manifest.json';prior=json.loads(prior_path.read_text())if prior_path.exists()else{'files':[]};prior_hashes={f['path']:f['candidateSha256']for f in prior['files']}
    for item in expected:
        source=repo/item['path'];candidate=run/'web'/item['path'];check=checks[str(candidate.resolve())]
        assert sha(candidate)==check['after']['sha256'],'Candidate changed after contract validation: '+item['path']
        assert sha(source)in(item['sha256'],sha(candidate),prior_hashes.get(item['path'])),'Source changed since frozen baseline/last verified promotion: '+item['path']
        records.append({'path':item['path'],'sourceSha256':item['sha256'],'candidateSha256':sha(candidate),'bytesBefore':item['bytes'],'bytesAfter':candidate.stat().st_size,'contractPassed':check['passed']})
    assemblies=json.loads((run/'assembly-manifest.json').read_text());budgets=[]
    for style in assemblies['styles']:
        paths=sorted({'public'+c['descriptor']['assetPath']for c in style['components']if c['visible']and c['placement']['glb']})
        transfer=sum((run/'web'/path).stat().st_size for path in paths)
        count=sum(stats(read(run/'web'/path)[0],run/'web'/path)['trianglesInstantiated']for path in paths)
        budgets.append({'style':style['id'],'componentPaths':paths,'distinctDownloadBytes':transfer,'sourceInstantiatedTrianglesIncludingHiddenArtwork':count,'download8MiBTarget':transfer<=8*1024**2,'triangle180kTarget':count<=180000,'triangle250kCeiling':count<=250000})
    if args.promote:
        for item in records:
            shutil.copy2(run/'web'/item['path'],repo/item['path']);assert sha(repo/item['path'])==item['candidateSha256']
    report={'schema':'dial-designer/realism-release/v1','sourceCommit':inputs['source_commit'],'assetRevision':'watch-realism-v2','localPromotion':args.promote,'committed':False,'pushed':False,'inputManifestSha256':sha(repo/'docs/realism/VR0-INPUT-MANIFEST.json'),'files':records,'galleryBudgets':budgets}
    (run/'reports/promotion-manifest.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'files':len(records),'promoted':args.promote,'styles':len(budgets)}))
if __name__=='__main__':main()
