export const WORKBOOKS = {
  A: {
    key: 'A',
    label: 'PTO Register',
    id: '1rQjD8_GJDZzyA1X1wqQym0ultCld0qGeItDQHGv-SB8',
    url: 'https://docs.google.com/spreadsheets/d/1rQjD8_GJDZzyA1X1wqQym0ultCld0qGeItDQHGv-SB8',
  },
  B: {
    key: 'B',
    label: 'DP / Unified Register',
    id: '1vnpC2u6dI82p2ty_F0Lb4izEsbXqpMESogNYxFJfjPs',
    url: 'https://docs.google.com/spreadsheets/d/1vnpC2u6dI82p2ty_F0Lb4izEsbXqpMESogNYxFJfjPs',
  },
  C: {
    key: 'C',
    label: 'Hazardous Waste Register',
    id: '1nJR7PM7qlp4TUYT3jXLogIusjz0_qCa_',
    url: 'https://docs.google.com/spreadsheets/d/1nJR7PM7qlp4TUYT3jXLogIusjz0_qCa_',
  },
  D: {
    key: 'D',
    label: 'ECC / CNC Ultralist (EIA)',
    id: '1ZqjOvAMwFtf3sCEys50yycL2HttfroQk2dlto8mEIvI',
    url: 'https://docs.google.com/spreadsheets/d/1ZqjOvAMwFtf3sCEys50yycL2HttfroQk2dlto8mEIvI',
  },
};

/** Year tabs that feed the dashboard dataset. */
export const PERMIT_TABS = [
  { key: 'DP_2019_2020', workbook: 'B', type: 'DP', gid: '182686779', sheet: '2019-2020', fallbackYear: 2020 },
  { key: 'DP_2021', workbook: 'B', type: 'DP', gid: '1491055037', sheet: '2021', fallbackYear: 2021 },
  { key: 'DP_2022', workbook: 'B', type: 'DP', gid: '394214006', sheet: '2022', fallbackYear: 2022 },
  { key: 'DP_2023', workbook: 'B', type: 'DP', gid: '536657341', sheet: '2023', fallbackYear: 2023 },
  { key: 'DP_2024', workbook: 'B', type: 'DP', gid: '1574966406', sheet: '2024', fallbackYear: 2024 },
  { key: 'DP_2025', workbook: 'B', type: 'DP', gid: '1625823269', sheet: '2025', fallbackYear: 2025 },
  { key: 'DP_2026', workbook: 'B', type: 'DP', gid: '1591882340', sheet: '2026', fallbackYear: 2026 },

  { key: 'PTO_2020', workbook: 'A', type: 'PTO', gid: '2080185783', sheet: 'PO 2020', fallbackYear: 2020 },
  { key: 'PTO_2021', workbook: 'A', type: 'PTO', gid: '691235315', sheet: 'PO 2021', fallbackYear: 2021 },
  { key: 'PTO_2022', workbook: 'A', type: 'PTO', gid: '1171280082', sheet: 'PO 2022', fallbackYear: 2022 },
  { key: 'PTO_2023', workbook: 'A', type: 'PTO', gid: '113408651', sheet: 'PO 2023', fallbackYear: 2023 },
  { key: 'PTO_2024', workbook: 'A', type: 'PTO', gid: '900744893', sheet: 'PO 2024', fallbackYear: 2024 },
  { key: 'PTO_2025', workbook: 'A', type: 'PTO', gid: '1296852512', sheet: 'PO 2025', fallbackYear: 2025 },
  { key: 'PTO_2026', workbook: 'A', type: 'PTO', gid: '529339510', sheet: 'PO 2026', fallbackYear: 2026 },
];

/** Supporting tabs used for the quality / audit view. */
export const SUPPORT_TABS = [
  { key: 'CLEANSE_AUDIT', workbook: 'B', gid: '1262602844', sheet: 'CLEANSE_AUDIT' },
  { key: 'ISSUES_V26', workbook: 'B', gid: '1369797121', sheet: 'UNIFIED_PERMIT_MASTER_ISSUES_V26' },
  { key: 'REVIEW_QUEUE', workbook: 'B', gid: '816142931', sheet: 'REVIEW_QUEUE' },
  { key: 'CROSSMATCH', workbook: 'B', gid: '1141119665', sheet: 'DP_PTO_CROSSMATCH' },
  { key: 'SITE_MASTER', workbook: 'B', gid: '1873126092', sheet: 'DP_PTO_SITE_MASTER_2020_2021' },
  { key: 'UNIFIED_LOCATION', workbook: 'B', gid: '1681635506', sheet: 'UNIFIED_LOCATION_2020_2021' },
  { key: 'PTO_SUMMARY', workbook: 'A', gid: '82943060', sheet: 'SUMMARY' },
];

/**
 * Approved ECC / CNC ultralist tabs (workbook D).
 * The dashboard scope is limited to Cebu and Bohol; the build step drops
 * Negros Oriental and Siquijor rows from these sheets.
 */
export const ECC_TABS = [
  { key: 'ECC_OL', workbook: 'D', sheet: 'ECC OL (2015-Present)', type: 'ECC' },
  { key: 'ECC_MANUAL', workbook: 'D', sheet: 'ECC Manual', type: 'ECC' },
  { key: 'CAT_C', workbook: 'D', sheet: 'CAT C', type: 'CNC' },
  { key: 'CNC_OL', workbook: 'D', sheet: 'CNC OL (2017-Present)', type: 'CNC' },
];

/** Hazardous-waste generator register (workbook C). */
export const HW_TABS = [
  { key: 'HW_ALL_DATA', workbook: 'C', sheet: 'ALL DATA', type: null },
  { key: 'HW_SUMMARY', workbook: 'C', sheet: 'SUMMARY', type: null },
];

export const RAW_DIR = 'data/raw';
export const OUT_DIR = 'public/data';
