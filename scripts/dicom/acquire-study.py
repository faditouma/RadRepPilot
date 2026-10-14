"""Supported IDC acquisition: index evidence -> vetted S3 manifest -> s5cmd.
Install requirements: idc-index==0.13.0 pydicom==3.0.2. No private APIs.
"""
import argparse,json,re,subprocess,os,hashlib
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--repo',default='.');p.add_argument('--case-id',default='ct-001',choices=['ct-001','ct-002']);p.add_argument('--s5cmd',default='s5cmd');a=p.parse_args();root=Path(a.repo).resolve();record=json.loads((root/f'docs/ohif/{a.case_id}-source-rights.json').read_text());rows=record['series']
assert sum(r['series_size_MB']for r in rows)<100,'Unexpected acquisition size'
assert len(rows)<=10
for r in rows:
 if r['Modality']!='CT' or r['license_short_name']!='CC BY 3.0':raise ValueError('Unknown or unapproved study rights')
 if not re.fullmatch(r's3://idc-open-data/[a-f0-9-]{36}/\*',r['series_aws_url']):raise ValueError('Unsafe or unsupported source path')
dest=root/('.dicom-study/source' if a.case_id=='ct-001' else f'.dicom-study/{a.case_id}/source');dest.mkdir(parents=True,exist_ok=True)
manifest=root/f'.dicom-study/{a.case_id}-idc.s5cmd';manifest.write_text('\n'.join('cp '+r['series_aws_url']+' '+str(dest)+'/'for r in rows)+'\n')
subprocess.run([a.s5cmd,'--no-sign-request','run',str(manifest)],check=True,timeout=300)
for item in record['checksums']:
 source=dest/item['sourceFile']
 assert source.is_file() and hashlib.sha256(source.read_bytes()).hexdigest()==item['sourceSHA256'],'Source differs from reviewed import'
assert len(list(dest.glob('*.dcm')))==len(record['checksums']),'Unexpected imported instances'
index=root/f'.dicom-study/{a.case_id}-source-index.json';index.write_text(json.dumps({'rows':rows},indent=2))
subprocess.run([os.sys.executable,str(root/'scripts/dicom/prepare-study.py'),'--repo',str(root),'--case-id',a.case_id,'--source',str(dest),'--index',str(index)],check=True)
