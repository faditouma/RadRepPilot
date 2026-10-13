export const rightsUses=['commercial','adaptation','redistribution','display'];
export function publicationProblems(c,assets) {
 const p=[];
 if (!c.clinicalReview?.reviewer || !c.clinicalReview?.date || !c.clinicalReview?.approved) p.push('Clinical approval required');
 if (!c.rightsReview?.reviewer || !c.rightsReview?.date || !c.rightsReview?.approved) p.push('Rights approval required');
 if (!c.answer?.referenceReport || !c.answer?.rubric?.length || !c.clinicalReferences?.length) p.push('Reference report, rubric and clinical evidence required');
 if(c.kind==='report') {
  if(assets.some(a=>a.attributionRevealsAnswer) && c.assessmentEligible) p.push('Required attribution reveals the answer; exclude from assessment');
  if(!c.series?.length || !assets.length) p.push('Actual imported imaging required');
  if(assets.length!==new Set(c.series.flatMap(s=>s.assetIds)).size) p.push('Missing series assets');
  for(const a of assets) {
   for(const use of rightsUses) if(a.rights?.[use]?.status!=='allowed' || !a.rights[use].evidence) p.push(`${a.id}: ${use} rights unresolved`);
   if(a.rightsReviewStatus!=='approved') p.push(`${a.id}: asset rights review pending`);
   if(!a.privacyReview?.approved || !a.privacyReview?.reviewer || !a.privacyReview?.date || !['metadata','burnedIn','facialRisk','orientation','sequence','resolution','findingsCorrespondence'].every(k=>a.privacyReview[k]===true)) p.push(`${a.id}: complete privacy/quality inspection required`);
   if(!a.deliveryChecksum) p.push(`${a.id}: validated delivery copy required`);
  }
 }
 if(c.assessmentEligible!==true && c.learningOnly!==true) p.push('Assessment eligibility or explicitly learning-only mode must be reviewed');
 return [...new Set(p)];
}
export function learnerCase(c,assets=[]) {
 // Explicit projection, never spread editorial content into learner responses.
 return {id:c.id,version:c.version,kind:c.kind,title:c.title,audience:c.audience,modality:c.modality,bodySystem:c.bodySystem,difficulty:c.difficulty,objectives:c.objectives,vignette:c.vignette,studyCompleteness:c.studyCompleteness,status:c.status,assessmentEligible:c.assessmentEligible,learningOnly:c.learningOnly,series:c.series?.map(s=>({id:s.id,label:s.label,assetIds:s.assetIds,orientation:s.orientation||null,format:s.format})),questions:c.questions,options:c.options,additionalInfo:c.additionalInfo,assets:assets.map(a=>({id:a.id,width:a.width,height:a.height,attribution:a.attribution,license:a.license,sourceUrl:a.sourceUrl,attributionRevealsAnswer:a.attributionRevealsAnswer}))};
}
export function assessmentSummary(rubric,ratings) {
 const valid=new Set(['identified','missed','uncertain','not_assessable']);
 const weights={critical:5,major:3,minor:1}; let earned=0,total=0;
 const items=rubric.map(item=>{
  const rating=item.assessable===false?'not_assessable':ratings[item.id];
  if(!valid.has(rating)) throw new Error(`Choose a self-assessment for ${item.id}`);
  if(rating!=='not_assessable') {total+=weights[item.importance]||1; if(rating==='identified') earned+=weights[item.importance]||1;}
  return {id:item.id,objective:item.objective,importance:item.importance,rating};
 });
 return {method:'learner_self_assessment',score:total?Math.round(100*earned/total):null,criticalMisses:items.filter(i=>i.importance==='critical'&&i.rating!=='identified'&&i.rating!=='not_assessable').map(i=>i.id),items};
}
