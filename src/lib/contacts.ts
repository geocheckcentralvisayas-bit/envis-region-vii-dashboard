export interface ContactRow {
  section: string;
  email: string;
  local?: string;
  mobile?: string;
  concerns?: string;
}

export interface ContactGroup {
  division: string;
  short: string;
  rows: ContactRow[];
}

/** Main office details for DENR-EMB Region VII. */
export const EMB_R7_OFFICE = {
  name: 'DENR-EMB Region VII',
  address: 'DENR Compound, Greenplains Subdivision, Banilad, Mandaue City',
  trunkline: '(032) 260 9777',
  email: 'r7records@emb.gov.ph',
  website: 'https://r7.emb.gov.ph/',
};

/**
 * DENR-EMB Region VII directory, grouped by division.
 * Source: regional office contact sheet (2026).
 */
export const EMB_R7_CONTACTS: ContactGroup[] = [
  {
    division: 'Clearance and Permitting Division',
    short: 'CPD',
    rows: [
      {
        section: 'Environmental Impact Assessment',
        email: 'r7eiapermitting@emb.gov.ph',
        local: '119',
        mobile: '0992 885 8858',
        concerns: 'ECC / CNC',
      },
      {
        section: 'Air and Water',
        email: 'r7airwaterpermitting@emb.gov.ph',
        local: '118',
        mobile: '0966 270 5718 · 0969 112 5004',
        concerns: 'Discharge Permit · Permit to Operate · OPMS (Online System)',
      },
      {
        section: 'Toxic Chemicals and Hazardous Waste',
        email: 'r7chemhazpermitting@emb.gov.ph',
        local: '117',
        mobile: '0949 914 9218',
        concerns: 'Permit to Transport · Chemical Importation Clearance · Hazardous Waste',
      },
      {
        section: 'Pollution Control Officer',
        email: 'r7pco@emb.gov.ph',
        local: '118',
        mobile: '0966 270 5718 · 0969 112 5004',
        concerns: 'PCO applicants',
      },
    ],
  },
  {
    division: 'Environmental Monitoring and Enforcement Division',
    short: 'EMED',
    rows: [
      {
        section: 'Air and Water',
        email: 'r7airwatermonitoring@emb.gov.ph',
        local: '124',
        mobile: '0915 606 8572',
        concerns: 'SMR submission / evaluation · CMR submission / evaluation',
      },
      {
        section: 'Toxic Chemicals and Hazardous Waste',
        email: 'r7chemhazmonitoring@emb.gov.ph',
        local: '123',
        mobile: '0917 115 6107 · 0933 643 8280',
        concerns: 'Hazardous waste management concerns',
      },
      {
        section: 'Solid Waste Management',
        email: 'r7swm@emb.gov.ph',
        local: '126',
        mobile: '0915 606 8857',
        concerns: 'Solid waste management concerns (LGU)',
      },
    ],
  },
  {
    division: 'Finance and Administrative Division',
    short: 'FAD',
    rows: [
      {
        section: 'Human Resource Unit',
        email: 'r7humanresource@emb.gov.ph',
        concerns: 'HR-related concerns',
      },
      {
        section: 'Procurement Unit',
        email: 'r7procurement@emb.gov.ph',
        local: '128',
        concerns: 'Procurement-related concerns',
      },
      {
        section: 'Finance and Accounting Unit',
        email: 'r7accountant@emb.gov.ph',
        local: '104',
        concerns: 'Accounting-related concerns',
      },
      {
        section: 'Records Unit',
        email: 'r7records@emb.gov.ph',
        local: '109',
        mobile: '0915 606 6584',
        concerns: 'Receiving / releasing of documents',
      },
    ],
  },
  {
    division: 'Office of the Regional Director',
    short: 'ORD',
    rows: [
      {
        section: 'Legal Unit',
        email: 'r7legal@emb.gov.ph',
        local: '103',
        mobile: '0915 728 7132 · 0915 606 8564',
        concerns: 'Legal concerns · complaints',
      },
      {
        section: 'Information and Education Unit',
        email: 'r7eeiu@emb.gov.ph',
        local: '127',
        mobile: '0995 951 6101',
        concerns: 'Environmental events',
      },
      {
        section: 'Management of Information System Unit',
        email: 'r7support@emb.gov.ph',
        local: '108',
        concerns: 'Online system error related concerns',
      },
    ],
  },
  {
    division: 'Provincial Environmental Management Office',
    short: 'PEMO',
    rows: [
      {
        section: 'PEMO Bohol',
        email: 'pemubohol@emb.gov.ph',
        local: 'Landline (038) 411 6355',
        mobile: '0917 566 5003',
      },
    ],
  },
];
