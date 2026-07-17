// ══════════════════════════════════════════════════════════
// 種子資料 — 2026-06-17 正式系統（production.drxbio.com）快照
// 機台 13 台（全部啟用）、現場作業員 8 位（全部在職）
// 正式數字以系統「機台管理」「作業員主檔」為準
// ══════════════════════════════════════════════════════════
import { Machine, Operator, WorkOrder } from './models';

export const MACHINES: Machine[] = [
  { id: 'DRX-P-2DMSK-01', spec: 'HX 平面',  type: '平面', minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 38.33 },
  { id: 'DRX-P-2DMSK-02', spec: 'HX 平面',  type: '平面', minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 38.33 },
  { id: 'DRX-P-2DMSK-03', spec: 'KYD 平面', type: '平面', minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-2DMSK-04', spec: 'KYD 平面', type: '平面', minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-2DMSK-05', spec: 'HY 平面',  type: '平面', minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-3DMSK-01', spec: 'HX 彈力',  type: '彈力', minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-3DMSK-02', spec: 'HX 彈力',  type: '彈力', minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-KFMSK-02', spec: 'HY 4D L',  type: '4D',  minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-KFMSK-03', spec: 'HY 4D S',  type: '4D',  minOps: 1, stdOps: 2, maxOps: 2, ratePerPerson: 37.5 },
  { id: 'DRX-P-KNMSK-01', spec: 'KYD 3D L', type: '3D',  minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 25 },
  { id: 'DRX-P-KNMSK-02', spec: 'KYD 3D M', type: '3D',  minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 25 },
  { id: 'DRX-P-KNMSK-03', spec: 'KYD 3D S', type: '3D',  minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 25 },
  { id: 'DRX-P-KNMSK-04', spec: 'KYD 3D L', type: '3D',  minOps: 1, stdOps: 3, maxOps: 3, ratePerPerson: 25 },
];

// 註：玉映與金英的員工編號在正式系統中同為 023（重複），
// 已列入里程碑 M1 前置作業修正；Demo 依快照原樣呈現。
export const OPERATORS: Omit<Operator, 'absent'>[] = [
  { name: '欣欣', empNo: '005', skills: ['4D', '平面', '彈力'] },
  { name: '玉映', empNo: '023', skills: ['平面', '彈力', '3D'] },
  { name: '金英', empNo: '023', skills: ['平面', '彈力', '4D'] },
  { name: '阿創', empNo: '015', skills: ['平面'] },
  { name: '阿容', empNo: '019', skills: ['3D', '平面', '彈力'] },
  { name: '阿張', empNo: '020', skills: ['平面', '彈力', '3D'] },
  { name: '阿英', empNo: '018', skills: ['3D', '4D', '平面', '彈力'] },
  { name: '阿莊', empNo: '021', skills: ['平面', '彈力', '3D'] },
];

// 今日班表（廠長前一天排好）：開 3 台、上線 8 人
export const DEFAULT_ASSIGNMENTS: Record<string, string[]> = {
  'DRX-P-2DMSK-01': ['阿創', '阿張', '阿莊'],
  'DRX-P-KNMSK-01': ['玉映', '阿容', '阿英'],
  'DRX-P-KFMSK-02': ['欣欣', '金英'],
};

// 各機台佇列（依優先序）
export const DEFAULT_QUEUES: Record<string, WorkOrder[]> = {
  'DRX-P-2DMSK-01': [
    { id: 'WO-2607-11', item: 'HX 平面口罩 白', qty: 150_000 },
    { id: 'WO-2607-12', item: 'HX 平面口罩 白', qty: 220_000 },
    { id: 'WO-2607-13', item: 'HX 平面口罩 藍', qty: 110_000 },
  ],
  'DRX-P-KNMSK-01': [
    { id: 'WO-2607-21', item: 'KYD 3D 口罩 L', qty: 72_000 },
    { id: 'WO-2607-22', item: 'KYD 3D 口罩 L', qty: 108_000 },
    { id: 'WO-2607-23', item: 'KYD 3D 口罩 M', qty: 72_000 },
  ],
  'DRX-P-KFMSK-02': [
    { id: 'WO-2607-08', item: 'HY 4D 口罩 L', qty: 120_000 },
    { id: 'WO-2607-09', item: 'HY 4D 口罩 L', qty: 90_000 },
  ],
  // 有單待產但今日未排班 → 儀表板會提示
  'DRX-P-2DMSK-03': [
    { id: 'WO-2607-31', item: 'KYD 平面口罩 白', qty: 90_000 },
  ],
};

// QMS 示範用的已完工訂單
export const FINISHED_ORDERS = [
  { id: 'WO-2606-18', customer: '康是美',   item: 'HX 平面口罩 白', qty: 220_000, batch: 'B20260612-01', status: '已出貨' },
  { id: 'WO-2606-15', customer: '大樹藥局', item: 'KYD 3D 口罩 M',  qty: 96_000,  batch: 'B20260605-02', status: '已入庫' },
];
