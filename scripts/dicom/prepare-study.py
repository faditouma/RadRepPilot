"""Create OHIF 3.11 DICOM JSON from one verified, fully acquired IDC study.
No pixel changes, clinical diagnoses, synthetic images or approval records.
"""
import argparse,json,hashlib,math,statistics,collections,shutil,html,re
from pathlib import Path
import pydicom
from pydicom.uid import CTImageStorage

def sha(b):return hashlib.sha256(b).hexdigest()
def plain(s):return html.unescape(re.sub('<[^>]*>','',s))
def normalize(v):
 if isinstance(v,(list,tuple,pydicom.multival.MultiValue)):return [normalize(x)for x in v]
 if isinstance(v,(pydicom.valuerep.DSfloat,pydicom.valuerep.DSdecimal)):return float(v)
 if isinstance(v,pydicom.valuerep.IS):return int(v)
 if isinstance(v,(str,int,float)):return v
 return str(v)
def projection(d):
 orient=[float(x)for x in d.ImageOrientationPatient];pos=[float(x)for x in d.ImagePositionPatient]
 normal=[orient[1]*orient[5]-orient[2]*orient[4],orient[2]*orient[3]-orient[0]*orient[5],orient[0]*orient[4]-orient[1]*orient[3]]
 if abs(math.sqrt(sum(n*n for n in normal))-1)>1e-3:raise ValueError('Invalid orientation direction cosines')
 return sum(x*y for x,y in zip(pos,normal))
def order_key(d):return (round(projection(d),5),str(d.get('TemporalPositionIdentifier','')),int(d.get('AcquisitionNumber',0)),str(d.get('AcquisitionTime','')),int(d.get('InstanceNumber',0)),str(d.SOPInstanceUID))
fields=['SOPClassUID','SOPInstanceUID','StudyInstanceUID','SeriesInstanceUID','FrameOfReferenceUID','Modality','ImageType','Rows','Columns','InstanceNumber','SamplesPerPixel','PhotometricInterpretation','BitsAllocated','BitsStored','HighBit','PixelRepresentation','PixelSpacing','ImageOrientationPatient','ImagePositionPatient','SliceThickness','SpacingBetweenSlices','RescaleIntercept','RescaleSlope','RescaleType','WindowCenter','WindowWidth','NumberOfFrames','PlanarConfiguration','ConvolutionKernel']

def prepare(args):
 repo=Path(args.repo);case_id=getattr(args,'case_id','ct-001');record_path=repo/'docs/ohif'/f'{case_id}-source-rights.json';previous=json.loads(record_path.read_text());index=json.loads(Path(args.index).read_text());rows=index['rows']
 if previous.get('rightsReviewStatus')!='verified':raise ValueError('Independent rights review is required before processing')
 if not rows or not all(r['license_short_name']=='CC BY 3.0' for r in rows):raise ValueError('Rights not approved for this curated CC BY 3.0 import')
 if {r['StudyInstanceUID'] for r in rows}!={previous['studyInstanceUID']}:raise ValueError('Unexpected study: independent source/rights review required')
 group=collections.defaultdict(list);files={}
 for p in Path(args.source).glob('*.dcm'):
  raw=p.read_bytes();d=pydicom.dcmread(p)
  if str(d.SOPClassUID)!=str(CTImageStorage) or d.Modality!='CT':raise ValueError('Non-CT object excluded; choose a CT-only study to claim complete study')
  if str(d.StudyInstanceUID)!=rows[0]['StudyInstanceUID']:raise ValueError('Mixed study')
  if str(d.get('BurnedInAnnotation','')).upper()=='YES':raise ValueError('Burned-in identifying annotation declared')
  if not all(x in d for x in ['ImageOrientationPatient','ImagePositionPatient','PixelSpacing']):raise ValueError('Missing calibration or geometry')
  if not all(float(x)>0 for x in d.PixelSpacing):raise ValueError('Invalid pixel spacing')
  if str(d.SOPInstanceUID)in files:raise ValueError('Duplicate SOP instance')
  files[str(d.SOPInstanceUID)]=(p,raw);group[str(d.SeriesInstanceUID)].append(d)
 assert set(group)=={r['SeriesInstanceUID']for r in rows},'Series missing or unexpectedly added'
 out=repo/('.dicom-study/delivery' if case_id=='ct-001' else f'.dicom-study/{case_id}/delivery');out.mkdir(parents=True,exist_ok=True)
 series=[];inventory=[];geometries=[]
 # Axial reconstructions precede scouts; acquisition ordering uses actual SeriesNumber.
 row_order=sorted(rows,key=lambda r:('SCOUT'in str(r.get('SeriesDescription','')).upper(),int(r.get('SeriesNumber')or 0)))
 for number,row in enumerate(row_order,1):
  ds=group[row['SeriesInstanceUID']];assert len(ds)==row['instanceCount'],'Incomplete series'
  localizer=any('LOCALIZER'in list(d.get('ImageType',[]))for d in ds)
  if not localizer and len({tuple(d.ImageOrientationPatient)for d in ds})!=1:raise ValueError('Mixed slice orientation')
  ds=sorted(ds,key=order_key);instances=[];positions=[projection(d)for d in ds]
  intervals=[round(b-a,5)for a,b in zip(positions,positions[1:])]
  geometries.append({'seriesUID':row['SeriesInstanceUID'],'originalDescription':row['SeriesDescription'],'count':len(ds),'localizer':localizer,'uniquePositions':len(set(positions)),'projectionRange':[min(positions),max(positions)],'spacingAlongNormal':sorted(set(intervals)),'pixelSpacing':[float(x)for x in ds[0].PixelSpacing],'ordering':'geometry dot(ImagePositionPatient,cross(rowCosines,columnCosines)); acquisition/temporal metadata for ties'})
  for frame,d in enumerate(ds):
   p,raw=files[str(d.SOPInstanceUID)];pixel_hash=sha(d.PixelData)
   # Keep acquisition identifiers/geometry and pixel calibration; remove descriptive/identifier metadata.
   d.remove_private_tags()
   for keyword in ['PatientName','PatientID','PatientBirthDate','PatientAddress','OtherPatientIDs','OtherPatientNames','AccessionNumber','InstitutionName','InstitutionAddress','ReferringPhysicianName','PerformingPhysicianName','OperatorsName','StudyID','StudyDescription','SeriesDescription','ProtocolName','PatientComments','AdditionalPatientHistory','StudyDate','SeriesDate','AcquisitionDate','ContentDate','InstanceCreationDate']:
    if keyword in d:del d[keyword]
   d.PatientName='';d.PatientID=case_id.upper();d.PatientIdentityRemoved='YES';d.DeidentificationMethod=['TCIA/IDC source; delivery metadata minimized','Pixel privacy approval pending']
   d.SeriesDescription=('Scout'if localizer else 'CT acquisition')+f' {number}'
   filename=sha(str(d.SOPInstanceUID).encode())[:32]+'.dcm';dest=out/filename
   d.save_as(dest,enforce_file_format=True);delivery=dest.read_bytes();assert sha(pydicom.dcmread(dest).PixelData)==pixel_hash,'Pixels changed'
   metadata={k:normalize(getattr(d,k))for k in fields if k in d};metadata['SeriesNumber']=int(row.get('SeriesNumber')or number);metadata['TransferSyntaxUID']=str(d.file_meta.TransferSyntaxUID)
   instances.append({'metadata':metadata,'url':f'dicomweb:/imaging/{case_id}/'+filename})
   inventory.append({'file':filename,'SOPInstanceUID':str(d.SOPInstanceUID),'SeriesInstanceUID':str(d.SeriesInstanceUID),'sourceFile':p.name,'sourceSHA256':sha(raw),'deliverySHA256':sha(delivery),'pixelSHA256':pixel_hash,'sourceBytes':len(raw),'deliveryBytes':len(delivery),'frame':frame,'projection':projection(d)})
  label=('Scout'if localizer else 'CT acquisition')+f' {number}'
  series.append({'SeriesInstanceUID':row['SeriesInstanceUID'],'SeriesNumber':int(row.get('SeriesNumber')or number),'SeriesDescription':label,'Modality':'CT','instances':instances})
 study={'StudyInstanceUID':rows[0]['StudyInstanceUID'],'StudyDescription':f'CT study {case_id[3:]}','PatientName':'','PatientID':case_id.upper(),'StudyDate':'','StudyTime':'','AccessionNumber':'','PatientAge':'','PatientSex':'','NumInstances':len(files),'Modalities':'CT','series':series}
 (out/'manifest.json').write_text(json.dumps({'studies':[study]},indent=2))
 (out/'checksums.json').write_text(json.dumps(inventory,indent=2))
 records=repo/'docs/ohif';records.mkdir(parents=True,exist_ok=True)
 previous_path=record_path
 previous=json.loads(previous_path.read_text()) if previous_path.exists() else {}
 rights={**previous,'caseId':case_id,'studyInstanceUID':study['StudyInstanceUID'],'collection':previous['collection'],'source':'IDC current REST index / TCIA original data','sourceDOIs':sorted({r['source_DOI']for r in rows}),'licence':{'name':'CC BY 3.0','version':'3.0','url':'https://creativecommons.org/licenses/by/3.0/'},'series':rows,'accessDate':'2026-10-13','commercial':{'status':'allowed','evidence':'IDC individual series license_short_name'},'adaptation':{'status':'allowed','evidence':'CC BY 3.0; attribution/modification notice retained'},'redistribution':{'status':'allowed','evidence':'CC BY 3.0'},'AIInference':{'status':'unknown','evidence':'Not assessed; disabled'},'training':{'status':'prohibited','evidence':'Platform default'},'clinicalReview':None,'privacyReview':{'status':'editorial preview only; unknown BurnedInAnnotation requires pixel inspection before publication','approval':None},'modifications':['Removed private tags and descriptive/identifier/date fields from delivery copies','Neutral delivery filenames and display labels','Pixel bytes, orientation, calibration and SOP identifiers preserved'],'completeness':{'status':'all indexed procedural CT series' if case_id=='ct-001' else 'selected diagnostic CT series; answer-revealing derived objects excluded','series':len(series),'instances':len(files),'sourceExpectedInstances':sum(r['instanceCount']for r in rows),'excludedObjects':[]},'geometry':geometries,'checksums':inventory}
 for key,file in [('licenceEvidence','licenses'),('attribution','citations')]:
  p=Path('/tmp/radrep-ct-'+file+'.json') if case_id=='ct-001' else Path('/private/tmp/radrep-lidc/'+file+'.json')
  if p.exists():rights[key]=json.loads(p.read_text())
  elif key in previous:rights[key]=previous[key]
  else:raise ValueError('Missing independently reviewed '+key+' evidence')
 (records/f'{case_id}-source-rights.json').write_text(json.dumps(rights,indent=2))
 catalog={'id':case_id,'version':2 if case_id=='ct-001' else 1,'title':'Interventional CT demonstration 001' if case_id=='ct-001' else 'Chest CT study 002','status':'draft','modality':'CT','history':'Interventional source study labelled CT LUNG BIOPSY, with DYNAMIC MODE acquisition. Imaging demonstration only; not a routine diagnostic chest CT or an approved assessment task.' if case_id=='ct-001' else 'Describe the supplied diagnostic chest CT series, including pulmonary observations and technical limitations. Source clinical history and comparison are not supplied. This focused teaching candidate awaits clinical review.','historyProvenance':'Original educational task; no fictional patient details added','studyInstanceUID':study['StudyInstanceUID'],'manifestPath':f'/imaging/{case_id}/manifest.json','series':[{k:s[k]for k in ['SeriesInstanceUID','SeriesNumber','SeriesDescription']}|{'count':len(s['instances'])}for s in series],'instanceCount':len(files),'completeness':'All source-listed procedural CT images; not a complete routine diagnostic chest CT.' if case_id=='ct-001' else 'Selected diagnostic CT series: 101 images. Derived answer annotations are withheld. Not presented as a complete clinical study.','preferredSeriesUID':series[0]['SeriesInstanceUID'],'displayPreset':'soft-tissue' if case_id=='ct-001' else 'lung','purpose':'demonstration' if case_id=='ct-001' else 'diagnostic_candidate','workflow':'nodule','viewerVersion':'3.11.1+radrep.1','assessmentEligible':False,'clinicalReview':None,'licence':rights['licence'],'attribution':rights.get('attribution',{}),'modifications':rights['modifications']}
 (records/f'{case_id}-catalog.json').write_text(json.dumps(catalog,indent=2));print(json.dumps({'instances':len(files),'series':len(series),'geometry':geometries},indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--source',required=True);p.add_argument('--index',required=True);p.add_argument('--case-id',default='ct-001',choices=['ct-001','ct-002']);prepare(p.parse_args())
