import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { mkdir, readFile, writeFile, rename, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { openStore, storage } from '../../server/store.mjs';
const hosts=new Set(['commons.wikimedia.org','upload.wikimedia.org']);
export function validateUrl(value) {
 const u=new URL(value);
 if(u.protocol!=='https:' || u.port || u.username || u.password || !hosts.has(u.hostname) || isIP(u.hostname)) throw new Error('Only HTTPS Commons/API and original Wikimedia image hosts are supported');
 return u;
}
export function publicAddress(ip) {
 if(isIP(ip)===4) {const n=ip.split('.').map(Number); return !(n[0]===0||n[0]===10||n[0]===127||n[0]>=224||(n[0]===169&&n[1]===254)||(n[0]===172&&n[1]>=16&&n[1]<=31)||(n[0]===192&&[0,168].includes(n[1]))||(n[0]===100&&n[1]>=64&&n[1]<=127)||(n[0]===198&&[18,19].includes(n[1])));}
 // Use IPv4 only; fail closed for IPv6/mapped addresses.
 return false;
}
export async function download(url,max=20*1024*1024) {
 const u=validateUrl(url); const addresses=await lookup(u.hostname,{all:true,family:4});
 if(!addresses.length||addresses.some(a=>!publicAddress(a.address))) throw new Error('Non-public DNS response');
 const pinned=addresses[0];
 return await new Promise((resolveResult,reject)=>{
  const req=https.get(u,{headers:{'User-Agent':'RadRepPilotEducation/1.0 (educational asset rights review)','Accept-Encoding':'identity'},lookup:(_host,_options,cb)=>_options.all?cb(null,[pinned]):cb(null,pinned.address,4)},res=>{
   if(res.statusCode!==200) {res.resume(); reject(new Error(`Download HTTP ${res.statusCode}; redirects are not followed`)); return;}
   if(Number(res.headers['content-length'])>max) {req.destroy(new Error('File exceeds size limit')); return;}
   let size=0; const chunks=[];res.on('data',b=>{size+=b.length; if(size>max) req.destroy(new Error('File exceeds streamed size limit')); else chunks.push(b);});
   res.on('end',()=>resolveResult(Buffer.concat(chunks)));res.on('error',reject);
  }); const timer=setTimeout(()=>req.destroy(new Error('Download timeout')),30000); req.on('error',reject);req.on('close',()=>clearTimeout(timer));
 });
}
const hash=b=>createHash('sha256').update(b).digest('hex');
const plain=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
export async function importCommons(db,title) {
 if(!/^File:[^\r\n]{1,220}\.(png|jpe?g)$/i.test(title)) throw new Error('Provide a Commons File: PNG/JPEG identifier, not an arbitrary URL or archive');
 const q=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata|size|sha1',titles:title});
 const evidence=JSON.parse((await download(`https://commons.wikimedia.org/w/api.php?${q}`,2*1024*1024)).toString());
 const page=Object.values(evidence.query?.pages||{})[0],info=page?.imageinfo?.[0];
 if(!info) throw new Error('No supported original image found');
 const meta=info.extmetadata||{},license=plain(meta.LicenseShortName?.value),licenseUrl=plain(meta.LicenseUrl?.value).replace(/^http:/,'https:');
 if(!/^(CC0|CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0))$/.test(license)||!licenseUrl.startsWith('https://creativecommons.org/')||plain(meta.Restrictions?.value)) throw new Error(`Unsupported/unclear licence or restrictions: ${license}`);
 if(meta.NonFree?.value==='true') throw new Error('Non-free asset rejected');
 if(info.size>20*1024*1024 || info.width*info.height>40e6 || info.width<400 || info.height<400) throw new Error('Asset outside size/resolution limits');
 const original=await download(info.url), checksum=hash(original);
 const existing=db.prepare('SELECT data FROM assets WHERE checksum=?').get(checksum);
 if(existing) {const a=JSON.parse(existing.data);await access(resolve(storage,'images',`${a.id}.png`));return {asset:a,duplicate:true};}
 const decoded=sharp(original,{limitInputPixels:40e6,failOn:'warning'}); const m=await decoded.metadata();
 if(!['jpeg','png'].includes(m.format)||m.pages>1) throw new Error('Unsupported raster; DICOM and archives require a dedicated adapter');
 const delivery=await decoded.png().toBuffer(); // Full decode; default strips EXIF/XMP. Does not establish de-identification.
 const id=`img-${randomUUID()}`; const sourceUrl=`https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ','_'))}`;
 const evidenceUrl=`${sourceUrl}#Licensing`,use={status:'allowed',evidence:evidenceUrl};
 const artist=plain(meta.Artist?.value), sa=license.includes('-SA');
 if(!artist) throw new Error('Missing creator/attribution');
 const a={id,sourceUrl,stableIdentifier:`commons:pageid:${page.pageid}`,sourceTitle:page.title,creator:artist,attribution:`${page.title.replace(/^File:/,'')} — ${artist}. ${license}. Delivery copy converted to PNG; metadata removed.`,attributionRevealsAnswer:true,
 license:{name:license,version:license==='CC0'?'1.0':license.split(' ').at(-1),url:licenseUrl,shareAlike:sa,obligations:sa?'Adapted image material must retain same/compatible licence, attribution, source link and modification notice; application code has separate licensing.':'Retain credit, source and licence link and indicate modifications for CC BY.'},
 rights:{commercial:use,adaptation:use,redistribution:use,display:use,retrievalIndexing:{status:'unknown',evidence:'Not reviewed separately'},aiInference:{status:'unknown',evidence:'Not reviewed separately'},training:{status:'prohibited',evidence:'Platform policy: no training by default'}},
 collectionDOI:null,requiredPublications:[],accessDate:new Date().toISOString(),rightsReviewStatus:'pending',modifications:['Converted validated delivery copy to PNG','Removed EXIF/XMP metadata; burned-in information not removed'],checksum,deliveryChecksum:hash(delivery),bytes:original.length,deliveryBytes:delivery.length,width:m.width,height:m.height,originalFormat:m.format,sourceDescription:plain(meta.ImageDescription?.value),privacyReview:null,downloadUrl:info.url};
 await mkdir(resolve(storage,'images'),{recursive:true,mode:0o700});await mkdir(resolve(storage,'originals'),{recursive:true,mode:0o700});
 await writeFile(resolve(storage,'originals',`${id}.${m.format}`),original,{mode:0o600});
 await writeFile(resolve(storage,'originals',`${id}.evidence.json`),JSON.stringify(evidence,null,2),{mode:0o600});
 const tmp=resolve(storage,'images',`${id}.tmp`);await writeFile(tmp,delivery,{mode:0o600});await rename(tmp,resolve(storage,'images',`${id}.png`));
 db.prepare('INSERT INTO assets VALUES(?,?,?)').run(id,checksum,JSON.stringify(a));return {asset:a,duplicate:false};
}
export async function importBatch(db,titles) {
 const results=[]; for(const title of titles) {try {const r=await importCommons(db,title);results.push({title,id:r.asset.id,status:r.duplicate?'existing':'imported'});}catch(e){results.push({title,status:'failed',error:e.message});}}
 const manifest=db.prepare('SELECT data FROM assets').all().map(r=>JSON.parse(r.data));
 await mkdir(resolve('docs/education'),{recursive:true});await writeFile(resolve('docs/education/asset-manifest.json'),JSON.stringify({generatedAt:new Date().toISOString(),assets:manifest},null,2));
 return results;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const db=openStore();const input=JSON.parse(await readFile(new URL('../../server/content/import-candidates.json',import.meta.url)));
 const titles=process.argv[2]?[process.argv[2]]:input.map(x=>x.title);
 const results=await importBatch(db,titles);console.log(JSON.stringify(results,null,2));db.close();if(results.some(r=>r.status==='failed'))process.exitCode=1;
}
