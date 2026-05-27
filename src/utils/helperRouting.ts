const helperRouteLabels: Record<string, string> = {
  fleischner: 'Fleischner helper',
  lungrads: 'Lung-RADS helper',
  'adrenal-washout': 'Adrenal washout helper',
  bosniak: 'Bosniak helper',
  tirads: 'TI-RADS helper',
  lirads: 'LI-RADS helper',
  orads: 'O-RADS helper',
  bonerads: 'Bone-RADS helper',
  cadrads: 'CAD-RADS helper',
  recist: 'RECIST helper',
  pirads: 'PI-RADS helper',
  birads: 'BI-RADS helper',
  'rv-lv-ratio': 'RV/LV helper',
  aspects: 'ASPECTS helper',
};

export function getHelperRouteLabel(helperId: string): string {
  return helperRouteLabels[helperId] ?? 'Associated helper';
}
