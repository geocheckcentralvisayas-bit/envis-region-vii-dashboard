export type PermitType = 'DP' | 'PTO';
export type Lifecycle = 'Active' | 'Expiring' | 'Expired' | 'Unknown';
export type Scope = 'in' | 'out' | 'unknown';
export type ClearanceType = 'ECC' | 'CNC' | 'ECC/CNC';
export type RegisterId = 'DP' | 'PTO' | 'HW' | 'ECC' | 'CNC';

export interface SpatialFlags {
  flood?: string;
  slide?: string;
  pa?: string;
  ws?: string;
  lc?: string;
  land?: string;
}

export interface Permit {
  id: string;
  type: PermitType;
  permitNo: string;
  appNo: string;
  year: number;
  company: string;
  barangay: string;
  address: string;
  municipality: string;
  province: string;
  lguCode: string | null;
  scope: Scope;
  lat: number | null;
  lon: number | null;
  coordStatus: string;
  sourceStatus: string;
  lifecycle: Lifecycle;
  issued: string | null;
  expiry: string | null;
  paid: string | null;
  industry: string;
  psic: string;
  eccNo: string;
  waterbody: string;
  wastewater: string;
  volume: string;
  fee: string;
  pco: string;
  remarks: string;
  link: string;
  qa: string[];
  sourceSheet: string;
  sourceRow: number;
  workbook: string;
  siteId?: string;
  spatial?: SpatialFlags | null;
  risk?: number;
}

export type SiteGap =
  | 'both-active'
  | 'dp-active'
  | 'pto-active'
  | 'both-inactive'
  | 'dp-only'
  | 'pto-only'
  | 'hw-only';

export type MatchMethod = 'exact' | 'alias' | 'fuzzy' | 'core' | 'none';

export interface HwWasteCode {
  code: string;
  description: string;
  nature: string;
  catalogue: string;
  practice: string;
}

export interface HwRegistration {
  id: string;
  appNo: string;
  hwGrNo: string;
  company: string;
  municipality: string;
  province: string;
  barangay: string;
  address: string;
  lat: number | null;
  lon: number | null;
  coordStatus: string;
  scope: Scope;
  subtype: string;
  issued: string | null;
  expiry: string | null;
  lifecycle: Lifecycle;
  pco: string;
  caseHandler: string;
  pcoAccreditation: string;
  pcoAccreditationDate: string | null;
  email: string;
  phone: string;
  employees: string;
  industry: string;
  psic: string;
  permitTypes: string[];
  eccNos: string[];
  cncNos: string[];
  ptoNos: string[];
  dpNos: string[];
  hwNumber: string;
  wasteCodes: HwWasteCode[];
  wasteCount: number;
  wasteRecordCounts: Record<string, number>;
  recordCount: number;
  siteId: string | null;
  matched: boolean;
  sourceRow: number;
  qa: string[];
}

export interface Clearance {
  id: string;
  number: string;
  type: ClearanceType;
  company: string;
  municipality: string;
  province: string;
  barangay: string;
  address: string;
  lat: number | null;
  lon: number | null;
  scope: Scope;
  issued: string | null;
  expiry: string | null;
  lifecycle: Lifecycle;
  year: number | null;
  appNo: string;
  hwGrNo: string;
  siteId: string | null;
  sources: string[];
  permitRefs: string[];
  hwCodes: string[];
}

export interface Site {
  id: string;
  company: string;
  key: string;
  municipality: string;
  province: string;
  barangay: string;
  address: string;
  lat: number | null;
  lon: number | null;
  coordStatus: string;
  dpCount: number;
  ptoCount: number;
  permitCount: number;
  years: number[];
  latestIssued: string | null;
  dpExpiry: string | null;
  ptoExpiry: string | null;
  activeDP: boolean;
  activePTO: boolean;
  gap: SiteGap;
  matchMethod: MatchMethod;
  matchType: 'both' | 'dp' | 'pto' | 'hw';
  industry: string;
  scope: Scope;
  spatial: SpatialFlags | null;
  risk: number;
  hwCount: number;
  hwGrNos: string[];
  hwExpiry: string | null;
  activeHW: boolean;
  hwCodeCount: number;
  eccNos: string[];
  cncNos: string[];
  ambiguousNos: string[];
  eccCount: number;
  cncCount: number;
  ambiguousCount: number;
  clearanceCount: number;
}

export interface CountItem {
  name: string;
  count: number;
}

/**
 * One map marker: every register held by an establishment at one location.
 * Grouped at build time from sites plus orphan clearances.
 */
export interface Facility {
  id: string;
  company: string;
  aliases: string[];
  key: string;
  lat: number;
  lon: number;
  coordStatus: string;
  municipality: string;
  province: string;
  barangay: string;
  address: string;
  scope: Scope;
  risk: number;
  siteId: string | null;
  siteIds: string[];
  gap: SiteGap | null;
  matchType: 'both' | 'dp' | 'pto' | 'hw' | null;
  registers: RegisterId[];
  counts: Record<RegisterId, number>;
  totalRecords: number;
  years: number[];
  latestIssued: string | null;
  activeDP: boolean;
  activePTO: boolean;
  activeHW: boolean;
  clearanceNumbers: string[];
}

export interface SourceTab {
  key: string;
  workbook: string;
  sheet: string;
  gid?: string;
  type: PermitType | null;
  rows: number;
  columns?: number;
  file?: string;
  error?: string;
}

export interface Meta {
  generatedAt: string;
  referenceDate: string;
  sources: {
    fetchedAt: string;
    workbooks: Record<string, { id: string; label: string; url: string }>;
    tabs: SourceTab[];
  };
  totals: {
    permits: number;
    dp: number;
    pto: number;
    sites: number;
    bothSites: number;
    dpOnlySites: number;
    ptoOnlySites: number;
    inScope: number;
    outOfScope: number;
    unknownScope: number;
    plotted: number;
    screened: number;
    active: number;
    expiring: number;
    expired: number;
    unknownExpiry: number;
    crossMatchedSites: number;
    riskSites: number;
    sourceRows: number;
    duplicates: number;
    skippedRows: number;
    hwOnlySites: number;
    hwSites: number;
    hwRegistrations: number;
    hwWasteRows: number;
    hwGenerators: number;
    hwActive: number;
    hwExpiring: number;
    hwExpired: number;
    hwUnknown: number;
    matchedHw: number;
    clearanceSites: number;
    clearances: number;
    eccClearances: number;
    cncClearances: number;
    ambiguousClearances: number;
    facilities: number;
    multiRegisterFacilities: number;
    coordinatesKept: number;
    coordinatesCorrected: number;
    coordinatesApproximate: number;
    coordinatesUnresolved: number;
  };
  years: number[];
  provinces: CountItem[];
  lgus: { municipality: string; province: string; count: number }[];
  industries: CountItem[];
  statuses: CountItem[];
  lifecycles: CountItem[];
  qa: CountItem[];
  audit: { rows: number; byAction: CountItem[]; byField: CountItem[] };
  issues: { total: number; byType: CountItem[]; byAction: CountItem[] };
  reviewQueue: {
    type: string;
    year: string;
    permitNo: string;
    company: string;
    municipality: string;
    province: string;
    issue: string;
    action: string;
  }[];
  notes: string[];
  hwWasteCodes?: CountItem[];
  hwIndustries?: CountItem[];
  clearanceSources?: CountItem[];
}

export interface QualityData {
  audit: {
    at: string;
    type: string;
    year: string;
    permitNo: string;
    company: string;
    field: string;
    original: string;
    clean: string;
    action: string;
    reason: string;
  }[];
  reviewQueue: Meta['reviewQueue'];
  duplicates: {
    permitNo: string;
    type: string;
    keptFrom: string;
    droppedFrom: string;
    company: string;
  }[];
  skipped: {
    tab: string;
    row: number;
    permitNo: string;
    company: string;
    reason: string;
  }[];
}

export interface LayerClass {
  label: string;
  color: string;
  rank?: number;
}

export interface SpatialLayer {
  id: string;
  name: string;
  group: string;
  file: string;
  geometry: string;
  count: number;
  sizeBytes: number;
  bbox: number[];
  classes: string[];
  classMeta: Record<string, LayerClass> | null;
  style: {
    kind: 'outline' | 'classified';
    color?: string;
    weight?: number;
    fillOpacity?: number;
    field?: string;
  };
  description: string;
}

export interface LayerManifest {
  generatedAt: string;
  totalBytes: number;
  layers: SpatialLayer[];
}

export interface Dataset {
  permits: Permit[];
  sites: Site[];
  meta: Meta;
  quality: QualityData;
  layers: LayerManifest;
  hw: HwRegistration[];
  clearances: Clearance[];
  facilities: Facility[];
}

export type LegalPayment = 'PAID' | 'PENDING' | 'MIXED' | 'NONE';
export type LegalStatus = 'CLOSED' | 'OPEN' | 'PARTIAL' | 'UNKNOWN';
export type LegalMatchMethod = 'exact' | 'alias' | 'manual' | 'unmatched';
export type LegalCoverage = 'full' | 'partial' | 'none';

export interface LegalEntity {
  id: string;
  name: string;
  legalNames: string[];
  facilityId: string | null;
  siteId: string | null;
  municipality: string;
  province: string;
  barangay: string;
  registers: RegisterId[];
  matchMethod: LegalMatchMethod;
  lat: number | null;
  lon: number | null;
  coordStatus: string | null;
  cases: number;
  novCount: number;
  pabNovCount: number;
  orderCount: number;
  pabOrderCount: number;
  erfCount: number;
  pabPenaltyCount: number;
  complaintCount: number;
  ra6969Count: number;
  recordCount: number;
  paidCases: number;
  pendingCases: number;
  openCases: number;
  closedCases: number;
  unknownCases: number;
  years: string[];
  caseNos: string[];
  latestYear: string | null;
  status: LegalStatus;
  payment: LegalPayment;
}

export interface LegalCase {
  id: string;
  kind: string;
  type: string;
  sourceYear: string;
  year: string;
  caseNo: string;
  displayCaseNo: string;
  rawCaseNo: string;
  pabCaseNos: string[];
  iisRef: string;
  dateDocketed: string;
  establishment: string;
  entityId: string;
  entityName: string | null;
  municipality: string;
  province: string;
  address: string;
  documentType: string;
  stage: string;
  stageLabel: string;
  violations: string[];
  status: LegalStatus;
  payment: LegalPayment;
  closedSignals: string[];
  openSignals: string[];
  matchMethod: LegalMatchMethod;
  types: {
    nov: number;
    pabNov: number;
    order: number;
    pabOrder: number;
    erf: number;
    pabPenalty: number;
    complaint: number;
    ra6969: number;
  };
}

export interface LegalPabYear {
  year: string;
  coverage: LegalCoverage;
  note: string;
  pabNovIssued: number;
  pabOrders: number;
  pabOrdersWithPenalty: number;
  ordersAssessed: number;
  penaltyRecords: number;
  paid: number;
  pending: number;
  assessed: number;
  collected: number;
  erfRecords: number;
  erfPaid: number;
  erfPending: number;
  erfCollected: number;
  ra6969Records: number;
  ra6969Collected: number;
}

export interface LegalFacilitySummary {
  entityId: string;
  cases: number;
  records: number;
  open: number;
  closed: number;
  pab: number;
  erf: number;
  complaints: number;
  status: LegalStatus;
  payment: LegalPayment;
}

export interface LegalData {
  generatedAt: string;
  dataDate: string;
  fetchedAt: string;
  sourceUrl: string;
  scopeLabel: string;
  timelineStart: string;
  docketYears: string[];
  matchQuality: { exact: number; alias: number; manual: number; unmatched: number };
  totals: {
    entities: number;
    matchedEntities: number;
    unmatchedEntities: number;
    facilitiesWithLegal: number;
    cases: number;
    pabNov: number;
    pabNovPlaceholders: number;
    orders: number;
    pabOrders: number;
    erf: number;
    pabPenalties: number;
    ra6969: number;
    complaints: number;
    openEntities: number;
    closedEntities: number;
    pabCollected: number;
  };
  pabByYear: LegalPabYear[];
  entities: LegalEntity[];
  orphans: LegalEntity[];
  cases: LegalCase[];
  byFacility: Record<string, LegalFacilitySummary>;
  candidateCount: number;
}

export type PageId =
  | 'overview'
  | 'sites'
  | 'dp'
  | 'pto'
  | 'renewal'
  | 'map'
  | 'spatial'
  | 'screening'
  | 'quality'
  | 'tables'
  | 'reports'
  | 'about'
  | 'hw'
  | 'clearances'
  | 'legal';
