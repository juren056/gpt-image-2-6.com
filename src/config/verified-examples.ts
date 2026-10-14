import manifest from '../../public/evidence/2026-10-13/results.json';

export const VERIFIED_OUTPUTS = manifest.cases;

export const VERIFIED_EXAMPLES = manifest.cases.filter((item) =>
  ['NB-05', 'NB-07', 'NB-16', 'NB-17'].includes(item.caseId)
);
export const CHINESE_VERIFIED_EXAMPLES = manifest.cases.filter((item) =>
  ['NB-05', 'NB-06', 'NB-07', 'NB-08'].includes(item.caseId)
);
