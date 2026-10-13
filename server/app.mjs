import { createServer } from 'node:http';
import { readFile,stat } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { openStore,storage,asset,content,listContent,saveContent,audit } from './store.mjs';
import { learnerCase,publicationProblems,assessmentSummary } from './domain.mjs';
import { importCommons } from '../scripts/education/import.mjs';
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const editors=new Set(['author','reviewer','administrator']);
const profiles=new Set(['student','resident','referrer']);
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
async function body(req) {
 if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'JSON body required');let size=0,chunks=[];
 for await(const b of req){size+=b.length;if(size>65536)fail(413,'Request too large');chunks.push(b);}
 try{return JSON.parse(Buffer.concat(chunks).toString());}catch{fail(400,'Invalid JSON');}
}
export function createApp({db=openStore(),authenticate,root=storage,development=false}={}) {
 const supabase=process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(url,options)=>fetch(url,{...options,signal:AbortSignal.timeout(10000)})}}):null;
 const buckets=new Map();
 const auth=authenticate||async function(req) {
  if(development&&process.env.NODE_ENV!=='production'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return {id:'local-editor',role:'author'};
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token||!supabase)fail(401,'Sign in required; education server auth must be configured');
  const {data,error}=await supabase.auth.getUser(token);if(error||!data.user)fail(401,'Invalid session');
  const id=data.user.id;const has=name=>(process.env[name]||'').split(',').includes(id);
  const role=has('EDUCATION_ADMINS')?'administrator':has('EDUCATION_REVIEWERS')?'reviewer':has('EDUCATION_AUTHORS')?'author':'learner';return {id,role};
 };
 const requireEditor=u=>{if(!editors.has(u.role))fail(403,'Editorial permission required');};
 const caseAssets=c=>[...new Set(c.series?.flatMap(s=>s.assetIds)||[])].map(id=>asset(db,id)).filter(Boolean);
 const canRead=(u,c)=>c.status==='published'||editors.has(u.role);
 return createServer(async(req,res)=>{
  try {
   if(req.headers.origin && req.headers.origin!==process.env.EDUCATION_ORIGIN && !(development&&/^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(req.headers.origin)))fail(403,'Origin not allowed');
   const path=new URL(req.url,'http://localhost').pathname;
   if(process.env.EDUCATION_REQUEST_LOG==='true')console.log(req.method,path);
   if(path==='/api/education/health')return json(res,200,{ready:true,localEditorialPreview:development,aiEnabled:false});
   if(!path.startsWith('/api/education/')) {
    if(req.method!=='GET')fail(405,'Method not supported');
    const requested=path==='/'?'index.html':decodeURIComponent(path.slice(1));const full=resolve('dist',requested);
    if(!full.startsWith(resolve('dist')+'/'))fail(404,'Not found');
    const bytes=await readFile(full).catch(()=>null);if(!bytes)fail(404,'Not found');
    res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'})[extname(full)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(bytes);return;
   }
   const u=await auth(req);if(!u?.id)fail(401,'Sign in required');
   const now=Date.now(),b=buckets.get(u.id)||{start:now,count:0};if(now-b.start>60000){b.start=now;b.count=0;}if(++b.count>120)fail(429,'Rate limit exceeded');buckets.set(u.id,b);if(buckets.size>10000)for(const [key,value]of buckets)if(now-value.start>60000)buckets.delete(key);
   const suffix=path.slice('/api/education/'.length).split('/');
   if(path==='/api/education/me')return json(res,200,{id:u.id,role:u.role,localEditorialPreview:development,aiEnabled:false});
   if(path==='/api/education/cases'&&req.method==='GET')return json(res,200,listContent(db).filter(c=>canRead(u,c)&&c.status!=='retired').map(c=>learnerCase(c,caseAssets(c))));
   if(suffix[0]==='cases'&&suffix.length>=3) {
    const c=content(db,suffix[1],Number(suffix[2]));if(!c||!canRead(u,c)||c.status==='retired')fail(404,'Case unavailable');
    const action=suffix[3];
    if(!action&&req.method==='GET')return json(res,200,learnerCase(c,caseAssets(c)));
    if(action==='hints'&&req.method==='GET') {
     const mode=new URL(req.url,'http://localhost').searchParams.get('mode');if(mode!=='learning')fail(403,'Hints are unavailable in assessment');
     const prior=db.prepare('SELECT data FROM drafts WHERE user_id=? AND case_id=? AND version=? AND mode=?').get(u.id,c.id,c.version,'learning');const d=prior?JSON.parse(prior.data):{};
     const count=Math.min((d.hintsUsed||0)+1,c.answer.hints.length);d.hintsUsed=count;db.prepare('INSERT INTO drafts VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,case_id,version,mode) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(u.id,c.id,c.version,'learning',JSON.stringify(d),new Date().toISOString());
     return json(res,200,{hints:c.answer.hints.slice(0,count),hintsUsed:count});
    }
    if(action==='draft') {
     const mode=new URL(req.url,'http://localhost').searchParams.get('mode')||'learning';if(!['learning','assessment'].includes(mode))fail(400,'Invalid mode');
     if(mode==='assessment'&&!c.assessmentEligible)fail(409,'Attribution/clinical review prevents assessment mode');
     const old=db.prepare('SELECT data FROM drafts WHERE user_id=? AND case_id=? AND version=? AND mode=?').get(u.id,c.id,c.version,mode);
     if(req.method==='GET')return json(res,200,old?JSON.parse(old.data):{});
     if(req.method==='PUT') {
      const input=await body(req);const prior=old?JSON.parse(old.data):{};const d=cleanReport(input);d.hintsUsed=prior.hintsUsed||0;
      db.prepare('INSERT INTO drafts VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,case_id,version,mode) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').run(u.id,c.id,c.version,mode,JSON.stringify(d),new Date().toISOString());return json(res,200,{saved:true,hintsUsed:d.hintsUsed});
     }
    }
    if(action==='submit'&&req.method==='POST') {
     const input=await body(req);const mode=input.mode||'learning';if(!['learning','assessment'].includes(mode))fail(400,'Invalid mode');if(mode==='assessment'&&!c.assessmentEligible)fail(409,'Assessment unavailable');
     const report=cleanReport(input);if(!report.findings.trim()&&!report.impression.trim()&&!report.decision)fail(400,'Write a report or imaging decision before submitting');
     const prior=db.prepare('SELECT data FROM drafts WHERE user_id=? AND case_id=? AND version=? AND mode=?').get(u.id,c.id,c.version,mode);const hintsUsed=prior?JSON.parse(prior.data).hintsUsed||0:0;
     const id=crypto.randomUUID(),date=new Date().toISOString();db.prepare('INSERT INTO attempts(id,user_id,case_id,version,rubric_version,mode,assisted,profile,submitted_at,due_at,snapshot,report) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,u.id,c.id,c.version,c.answer.rubricVersion,mode,(hintsUsed>0||db.prepare('SELECT 1 FROM attempts WHERE user_id=? AND case_id=? AND assisted=1').get(u.id,c.id)||db.prepare("SELECT 1 FROM drafts WHERE user_id=? AND case_id=? AND json_extract(data,'$.hintsUsed')>0").get(u.id,c.id))?1:0,report.profile,date,new Date(Date.now()+86400000).toISOString(),JSON.stringify(c),JSON.stringify({...report,hintsUsed}));
     db.prepare('DELETE FROM drafts WHERE user_id=? AND case_id=? AND version=? AND mode=?').run(u.id,c.id,c.version,mode);return json(res,201,{id,caseId:c.id,version:c.version,answer:c.answer,clinicalReferences:c.clinicalReferences,status:c.status,ai:{status:'disabled',fallback:'Expert example and structured self-assessment'},assets:caseAssets(c)});
    }
   }
   if(suffix[0]==='assets'&&suffix.length===2&&req.method==='GET') {
    const a=asset(db,suffix[1]);if(!a)fail(404,'Image unavailable');
    const eligible=listContent(db).some(c=>canRead(u,c)&&c.status!=='retired'&&c.series?.some(s=>s.assetIds.includes(a.id)));
    const ownAttempt=db.prepare('SELECT snapshot FROM attempts WHERE user_id=?').all(u.id).some(r=>JSON.parse(r.snapshot).series?.some(s=>s.assetIds.includes(a.id)));
    if(!eligible&&!ownAttempt)fail(404,'Image unavailable');
    if(a.rights.display?.status!=='allowed')fail(403,'Display permission unresolved');
    const bytes=await readFile(resolve(root,'images',`${a.id}.png`));res.writeHead(200,{'Content-Type':'image/png','Content-Disposition':`inline; filename="${a.id}.png"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});return res.end(bytes);
   }
   if(suffix[0]==='attempts') {
    if(suffix.length===1&&req.method==='GET')return json(res,200,db.prepare('SELECT id,case_id,version,mode,assisted,profile,submitted_at,due_at,assessment,report FROM attempts WHERE user_id=? ORDER BY submitted_at DESC').all(u.id).map(r=>({...r,assessment:r.assessment&&JSON.parse(r.assessment),report:JSON.parse(r.report)})));
    const a=db.prepare('SELECT * FROM attempts WHERE id=? AND user_id=?').get(suffix[1],u.id);if(!a)fail(404,'Attempt unavailable');const snapshot=JSON.parse(a.snapshot);
    if(suffix.length===2&&req.method==='GET')return json(res,200,{...a,assets:caseAssets(snapshot),snapshot,answer:snapshot.answer,report:JSON.parse(a.report),assessment:a.assessment&&JSON.parse(a.assessment)});
    if(suffix[2]==='assessment'&&req.method==='POST') {
     const input=await body(req);let summary;try{summary=assessmentSummary(snapshot.answer.rubric,input.ratings||{});}catch(e){fail(400,e.message);}
     const concerns=['unsupportedFindings','laterality','prioritization','uncertainty','urgentCommunication'];summary.concerns=Object.fromEntries(concerns.map(k=>[k,Boolean(input.concerns?.[k])]));summary.notes=String(input.notes||'').slice(0,3000);
     const missed=summary.items.some(i=>i.rating==='missed'||i.rating==='uncertain')||concerns.some(k=>summary.concerns[k]);const due=new Date(Date.now()+(missed?1:7)*86400000).toISOString();db.prepare('UPDATE attempts SET assessment=?,due_at=? WHERE id=? AND user_id=?').run(JSON.stringify(summary),due,a.id,u.id);return json(res,200,{...summary,dueAt:due});
    }
    if(suffix[2]==='flag'&&req.method==='POST') {const input=await body(req);const comment=String(input.comment||'').trim().slice(0,3000);if(!comment)fail(400,'Describe the issue');db.prepare('INSERT INTO feedback_flags VALUES(?,?,?,?,?)').run(crypto.randomUUID(),a.id,u.id,comment,new Date().toISOString());return json(res,201,{recorded:true});}
   }
   if(suffix[0]==='editor') {
    requireEditor(u);
    if(suffix[1]==='inventory'&&req.method==='GET')return json(res,200,{cases:listContent(db).map(c=>({...c,publicationProblems:publicationProblems(c,caseAssets(c))})),assets:db.prepare('SELECT data FROM assets').all().map(r=>JSON.parse(r.data)),reviews:db.prepare('SELECT * FROM reviews ORDER BY reviewed_at DESC').all(),flags:db.prepare('SELECT * FROM feedback_flags ORDER BY created_at DESC').all()});
    if(suffix[1]==='import'&&req.method==='POST') {const input=await body(req);const r=await importCommons(db,input.title);audit(db,u.id,'import',r.asset.id);return json(res,201,r);}
    if(suffix[1]==='assets'&&req.method==='PUT') {
     if(!['reviewer','administrator'].includes(u.role))fail(403,'Reviewer role required');const a=asset(db,suffix[2]);if(!a)fail(404,'Asset unavailable');const input=await body(req);
     const checklist=['metadata','burnedIn','facialRisk','orientation','sequence','resolution','findingsCorrespondence'];if(!checklist.every(k=>input[k]===true)||!String(input.comment||'').trim())fail(400,'Complete every inspection and describe evidence');
     a.privacyReview={...Object.fromEntries(checklist.map(k=>[k,true])),approved:true,reviewer:u.id,date:new Date().toISOString(),comment:String(input.comment).slice(0,3000)};
     if(input.rightsApproved===true){for(const use of ['commercial','adaptation','redistribution','display'])if(a.rights[use]?.status!=='allowed'||!a.rights[use].evidence)fail(409,'Unknown rights cannot be approved');a.rightsReviewStatus='approved';}
     db.prepare('UPDATE assets SET data=? WHERE id=?').run(JSON.stringify(a),a.id);audit(db,u.id,'asset-review',a.id);return json(res,200,a);
    }
    if(suffix[1]==='cases'&&suffix.length===2&&req.method==='POST') {
     const input=await body(req);if(!/^rr-[a-z0-9-]{3,60}$/.test(input.id||'')||content(db,input.id,1))fail(400,'Use a unique neutral rr- identifier');
     const c={...input,id:input.id,version:1,kind:'report',status:'draft',clinicalReview:null,rightsReview:null,assessmentEligible:false};validateCase(c);
     if(!c.series?.length||caseAssets(c).length!==new Set(c.series.flatMap(s=>s.assetIds)).size)fail(400,'Link actual imported assets before creating a reporting case');
     saveContent(db,c);audit(db,u.id,'create',c.id);return json(res,201,c);
    }
    if(suffix[1]==='cases') {
     const c=content(db,suffix[2],Number(suffix[3]));if(!c)fail(404,'Case unavailable');const action=suffix[4];
     if(action==='revise'&&req.method==='POST') {const next=Math.max(...listContent(db).filter(x=>x.id===c.id).map(x=>x.version))+1;const revised={...c,version:next,status:'draft',clinicalReview:null,rightsReview:null};saveContent(db,revised);audit(db,u.id,'revise',`${c.id}:${next}`);return json(res,201,revised);}
     if(!action&&req.method==='PUT') {
      if(c.status!=='draft')fail(409,'Only drafts can be edited; create a new version');const input=await body(req);
      const fields=['title','audience','difficulty','objectives','vignette','answer','clinicalReferences','assessmentEligible','learningOnly','series','studyCompleteness'];for(const k of fields)if(input[k]!==undefined)c[k]=input[k];validateCase(c);if(c.kind==='report'&&caseAssets(c).length!==new Set(c.series?.flatMap(s=>s.assetIds)||[]).size)fail(400,'Missing imported assets');c.clinicalReview=null;c.rightsReview=null;saveContent(db,c);audit(db,u.id,'edit',`${c.id}:${c.version}`);return json(res,200,c);
     }
     if(action==='transition'&&req.method==='POST') {
      const input=await body(req),target=input.status;const transitions={draft:['clinical_review'],clinical_review:['draft','rights_review'],rights_review:['draft','published'],published:['retired'],retired:[]};if(!transitions[c.status]?.includes(target))fail(409,'Invalid workflow transition');
      const reviewing=['rights_review','published'].includes(target);if(reviewing&&!['reviewer','administrator'].includes(u.role))fail(403,'Reviewer role required');if(target==='retired'&&u.role!=='administrator')fail(403,'Administrator required');
      if(reviewing) {
       if(!String(input.comment||'').trim())fail(400,'Review evidence/comment required');if(target==='rights_review'&&input.clinicalAttestation!==true)fail(400,'Clinician must attest personal clinical review');
       const record={approved:true,reviewer:u.id,date:new Date().toISOString(),comment:String(input.comment).slice(0,3000)};
       if(target==='rights_review')c.clinicalReview=record;else c.rightsReview=record;
       if(target==='published'){const problems=publicationProblems(c,caseAssets(c));if(problems.length)fail(409,problems.join('; '));}
       db.prepare('INSERT INTO reviews VALUES(?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),c.id,c.version,u.id,target==='rights_review'?'clinical':'rights','approved',record.comment,record.date);
      }
      if(target==='draft'){c.clinicalReview=null;c.rightsReview=null;}
      c.status=target;
      db.exec('BEGIN IMMEDIATE');try{saveContent(db,c);if(target==='published')db.prepare('INSERT INTO published_versions VALUES(?,?,?)').run(c.id,c.version,JSON.stringify(c));audit(db,u.id,target,`${c.id}:${c.version}`);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
      return json(res,200,c);
     }
    }
   }
   fail(404,'Endpoint unavailable');
  }catch(e){json(res,e.status||500,{error:e.status?e.message:'Server operation failed; inspect server logs'});if(!e.status)console.error(e.message);}
 });
}
function cleanReport(input) {
 const out={};for(const k of ['technique','comparison','findings','impression','communication','decision','exam','contrast','urgency','question','additionalInformation','branchCondition']){if(input[k]!==undefined&&typeof input[k]!=='string')fail(400,'Report fields must be text');if((input[k]||'').length>8000)fail(400,'Report field exceeds 8,000 characters');out[k]=input[k]||'';}
 out.confidence=input.confidence==null||input.confidence===''?null:Number(input.confidence);if(out.confidence!==null&&(!Number.isFinite(out.confidence)||out.confidence<0||out.confidence>100))fail(400,'Invalid confidence');
 out.profile=profiles.has(input.profile)?input.profile:'resident';out.elapsedSeconds=Math.max(0,Math.min(Number(input.elapsedSeconds)||0,86400));return out;
}
function validateCase(c) {
 if(c.series && (!Array.isArray(c.series)||c.series.some(s=>typeof s.id!=='string'||typeof s.label!=='string'||s.format!=='raster'||!Array.isArray(s.assetIds)||s.assetIds.some(id=>!/^img-[a-f0-9-]{36}$/.test(id)))))fail(400,'Invalid series manifest');
 if(typeof c.title!=='string'||c.title.length>200||!Array.isArray(c.objectives)||!Array.isArray(c.clinicalReferences)||!c.answer||typeof c.answer.referenceReport!=='string'||!Array.isArray(c.answer.rubric)||!Array.isArray(c.answer.hints)||!Array.isArray(c.answer.annotations)||typeof c.vignette?.text!=='string')fail(400,'Invalid case schema');
 for(const ref of c.clinicalReferences){try{if(new URL(ref.url).protocol!=='https:')fail(400,'Clinical references require HTTPS source links');}catch(e){if(e.status)throw e;fail(400,'Invalid clinical reference URL');}}
 const ids=new Set();for(const r of c.answer.rubric){if(!r.id||ids.has(r.id)||typeof r.expectedConcept!=='string'||!['critical','major','minor'].includes(r.importance)||typeof r.assessable!=='boolean')fail(400,'Invalid rubric item');ids.add(r.id);}
 for(const a of c.answer.annotations){if(!c.series?.some(s=>s.assetIds.includes(a.assetId))||![a.x,a.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||typeof a.label!=='string')fail(400,'Annotations require normalized image coordinates and an attached asset');}
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const development=process.env.EDUCATION_LOCAL_PREVIEW==='true';if(development&&process.env.NODE_ENV==='production')throw new Error('Local preview is prohibited in production');
 const server=createApp({development});server.requestTimeout=15000;server.headersTimeout=10000;server.listen(Number(process.env.EDUCATION_PORT||8787),development?'127.0.0.1':process.env.EDUCATION_HOST||'127.0.0.1',()=>console.log(`Education server listening on ${process.env.EDUCATION_PORT||8787}; local editorial preview=${development}`));
}
