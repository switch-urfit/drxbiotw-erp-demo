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

// 全訂單時間軸資料（歷史已完成 + 目前進行中 + 未來排程）
import { ScheduledOrder } from './models';

export const ALL_ORDERS: ScheduledOrder[] = [
  // ── 已完成（6 月）──
  { id: 'WO-2606-01', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 180_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-05-28', expectedDate: '2026-06-06', actualDate: '2026-06-06', startDate: '2026-06-02', endDate: '2026-06-06', status: 'shipped' },
  { id: 'WO-2606-02', item: 'HX 平面口罩 藍',  productCode: 'DRX-2D-HX01-B', qty: 120_000, customer: '屈臣氏',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-05-30', expectedDate: '2026-06-10', actualDate: '2026-06-09', startDate: '2026-06-06', endDate: '2026-06-09', status: 'shipped' },
  { id: 'WO-2606-03', item: 'KYD 3D 口罩 L',   productCode: 'DRX-3D-KN01-L', qty: 72_000,  customer: '大樹藥局',  salesChannel: '藥局通路', machineId: 'DRX-P-KNMSK-01', machineType: '3D',   orderDate: '2026-05-29', expectedDate: '2026-06-07', actualDate: '2026-06-07', startDate: '2026-06-02', endDate: '2026-06-07', status: 'shipped' },
  { id: 'WO-2606-04', item: 'HY 4D 口罩 L',    productCode: 'DRX-4D-KF02-L', qty: 90_000,  customer: '佑全藥品',  salesChannel: '藥局通路', machineId: 'DRX-P-KFMSK-02', machineType: '4D',   orderDate: '2026-06-01', expectedDate: '2026-06-10', actualDate: '2026-06-10', startDate: '2026-06-03', endDate: '2026-06-10', status: 'shipped' },
  { id: 'WO-2606-05', item: 'KYD 平面口罩 白',  productCode: 'DRX-2D-KYD3-W', qty: 90_000,  customer: '蝦皮商城',  salesChannel: '電商', machineId: 'DRX-P-2DMSK-03', machineType: '平面', orderDate: '2026-06-02', expectedDate: '2026-06-09', actualDate: '2026-06-09', startDate: '2026-06-04', endDate: '2026-06-09', status: 'shipped' },
  { id: 'WO-2606-06', item: 'HX 平面口罩 綠',  productCode: 'DRX-2D-HX01-G', qty: 150_000, customer: '大創',      salesChannel: '零售通路', machineId: 'DRX-P-2DMSK-02', machineType: '平面', orderDate: '2026-06-03', expectedDate: '2026-06-11', actualDate: '2026-06-13', startDate: '2026-06-05', endDate: '2026-06-13', status: 'shipped', delayReason: '作業員缺勤導致產能不足', delayDays: 2 },
  { id: 'WO-2606-07', item: 'KYD 3D 口罩 M',   productCode: 'DRX-3D-KN02-M', qty: 108_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-KNMSK-02', machineType: '3D',   orderDate: '2026-06-05', expectedDate: '2026-06-16', actualDate: '2026-06-16', startDate: '2026-06-09', endDate: '2026-06-16', status: 'shipped' },
  { id: 'WO-2606-08', item: 'HX 彈力口罩 白',  productCode: 'DRX-3D-HX01-W', qty: 60_000,  customer: '直營門市',  salesChannel: '直營',     machineId: 'DRX-P-3DMSK-01', machineType: '彈力', orderDate: '2026-06-04', expectedDate: '2026-06-11', actualDate: '2026-06-11', startDate: '2026-06-06', endDate: '2026-06-11', status: 'shipped' },
  { id: 'WO-2606-09', item: 'HY 4D 口罩 S',    productCode: 'DRX-4D-KF03-S', qty: 72_000,  customer: '杏一醫療',  salesChannel: '醫療通路', machineId: 'DRX-P-KFMSK-03', machineType: '4D',   orderDate: '2026-06-06', expectedDate: '2026-06-14', actualDate: '2026-06-17', startDate: '2026-06-09', endDate: '2026-06-17', status: 'shipped', delayReason: '機台故障停機 1 天 + 換料延遲', delayDays: 3 },
  { id: 'WO-2606-10', item: 'KYD 3D 口罩 S',   productCode: 'DRX-3D-KN03-S', qty: 54_000,  customer: '蝦皮商城',  salesChannel: '電商',     machineId: 'DRX-P-KNMSK-03', machineType: '3D',   orderDate: '2026-06-08', expectedDate: '2026-06-16', actualDate: '2026-06-16', startDate: '2026-06-10', endDate: '2026-06-16', status: 'shipped' },
  { id: 'WO-2606-11', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 220_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-06-08', expectedDate: '2026-06-18', actualDate: '2026-06-18', startDate: '2026-06-11', endDate: '2026-06-18', status: 'shipped' },
  { id: 'WO-2606-12', item: 'HX 彈力口罩 粉',  productCode: 'DRX-3D-HX01-P', qty: 48_000,  customer: '屈臣氏',    salesChannel: '藥妝通路', machineId: 'DRX-P-3DMSK-02', machineType: '彈力', orderDate: '2026-06-10', expectedDate: '2026-06-18', actualDate: '2026-06-18', startDate: '2026-06-12', endDate: '2026-06-18', status: 'shipped' },
  { id: 'WO-2606-15', item: 'KYD 3D 口罩 M',   productCode: 'DRX-3D-KN02-M', qty: 96_000,  customer: '大樹藥局',  salesChannel: '藥局通路', machineId: 'DRX-P-KNMSK-01', machineType: '3D',   orderDate: '2026-06-10', expectedDate: '2026-06-20', actualDate: '2026-06-22', startDate: '2026-06-12', endDate: '2026-06-22', status: 'completed', delayReason: '原物料到貨延遲', delayDays: 2 },
  { id: 'WO-2606-18', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 220_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-02', machineType: '平面', orderDate: '2026-06-12', expectedDate: '2026-06-23', actualDate: '2026-06-23', startDate: '2026-06-16', endDate: '2026-06-23', status: 'shipped' },

  // ── 已完成（7 月初）──
  { id: 'WO-2607-01', item: 'KYD 3D 口罩 L',   productCode: 'DRX-3D-KN01-L', qty: 108_000, customer: '杏一醫療',  salesChannel: '醫療通路', machineId: 'DRX-P-KNMSK-04', machineType: '3D',   orderDate: '2026-06-20', expectedDate: '2026-07-04', actualDate: '2026-07-04', startDate: '2026-06-25', endDate: '2026-07-04', status: 'shipped' },
  { id: 'WO-2607-02', item: 'HX 平面口罩 藍',  productCode: 'DRX-2D-HX01-B', qty: 160_000, customer: '大創',      salesChannel: '零售通路', machineId: 'DRX-P-2DMSK-04', machineType: '平面', orderDate: '2026-06-22', expectedDate: '2026-07-06', actualDate: '2026-07-08', startDate: '2026-06-27', endDate: '2026-07-08', status: 'shipped', delayReason: '插單排擠延後 2 天', delayDays: 2 },
  { id: 'WO-2607-03', item: 'HY 4D 口罩 L',    productCode: 'DRX-4D-KF02-L', qty: 60_000,  customer: '直營門市',  salesChannel: '直營',     machineId: 'DRX-P-KFMSK-02', machineType: '4D',   orderDate: '2026-06-25', expectedDate: '2026-07-08', actualDate: '2026-07-07', startDate: '2026-07-01', endDate: '2026-07-07', status: 'shipped' },
  { id: 'WO-2607-04', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 200_000, customer: '屈臣氏',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-06-26', expectedDate: '2026-07-10', actualDate: '2026-07-10', startDate: '2026-07-02', endDate: '2026-07-10', status: 'shipped' },
  { id: 'WO-2607-05', item: 'KYD 平面口罩 白',  productCode: 'DRX-2D-KYD3-W', qty: 120_000, customer: '佑全藥品',  salesChannel: '藥局通路', machineId: 'DRX-P-2DMSK-05', machineType: '平面', orderDate: '2026-06-28', expectedDate: '2026-07-10', actualDate: '2026-07-12', startDate: '2026-07-03', endDate: '2026-07-12', status: 'completed', delayReason: '人力不足（暑假請假潮）', delayDays: 2 },
  { id: 'WO-2607-06', item: 'HX 彈力口罩 白',  productCode: 'DRX-3D-HX01-W', qty: 72_000,  customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-3DMSK-01', machineType: '彈力', orderDate: '2026-06-30', expectedDate: '2026-07-11', actualDate: '2026-07-11', startDate: '2026-07-04', endDate: '2026-07-11', status: 'shipped' },
  { id: 'WO-2607-07', item: 'KYD 3D 口罩 L',   productCode: 'DRX-3D-KN01-L', qty: 90_000,  customer: '蝦皮商城',  salesChannel: '電商',     machineId: 'DRX-P-KNMSK-02', machineType: '3D',   orderDate: '2026-07-01', expectedDate: '2026-07-14', actualDate: '2026-07-14', startDate: '2026-07-04', endDate: '2026-07-14', status: 'completed' },

  // ── 目前生產中 ──
  { id: 'WO-2607-08', item: 'HY 4D 口罩 L',    productCode: 'DRX-4D-KF02-L', qty: 120_000, customer: '大樹藥局',  salesChannel: '藥局通路', machineId: 'DRX-P-KFMSK-02', machineType: '4D',   orderDate: '2026-07-03', expectedDate: '2026-07-22', actualDate: undefined, startDate: '2026-07-11', endDate: '2026-07-22', status: 'in_progress' },
  { id: 'WO-2607-09', item: 'HY 4D 口罩 L',    productCode: 'DRX-4D-KF02-L', qty: 90_000,  customer: '屈臣氏',    salesChannel: '藥妝通路', machineId: 'DRX-P-KFMSK-02', machineType: '4D',   orderDate: '2026-07-05', expectedDate: '2026-07-28', actualDate: undefined, startDate: '2026-07-22', endDate: '2026-07-30', status: 'scheduled', delayReason: '前單排擠預計延 2 天', delayDays: 2 },
  { id: 'WO-2607-11', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 150_000, customer: '大創',      salesChannel: '零售通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-07-07', expectedDate: '2026-07-24', actualDate: undefined, startDate: '2026-07-14', endDate: '2026-07-18', status: 'in_progress' },
  { id: 'WO-2607-12', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 220_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-07-08', expectedDate: '2026-07-30', actualDate: undefined, startDate: '2026-07-18', endDate: '2026-07-25', status: 'scheduled' },
  { id: 'WO-2607-13', item: 'HX 平面口罩 藍',  productCode: 'DRX-2D-HX01-B', qty: 110_000, customer: '佑全藥品',  salesChannel: '藥局通路', machineId: 'DRX-P-2DMSK-01', machineType: '平面', orderDate: '2026-07-09', expectedDate: '2026-08-05', actualDate: undefined, startDate: '2026-07-25', endDate: '2026-07-29', status: 'scheduled' },
  { id: 'WO-2607-21', item: 'KYD 3D 口罩 L',   productCode: 'DRX-3D-KN01-L', qty: 72_000,  customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-KNMSK-01', machineType: '3D',   orderDate: '2026-07-08', expectedDate: '2026-07-25', actualDate: undefined, startDate: '2026-07-14', endDate: '2026-07-23', status: 'in_progress' },
  { id: 'WO-2607-22', item: 'KYD 3D 口罩 L',   productCode: 'DRX-3D-KN01-L', qty: 108_000, customer: '杏一醫療',  salesChannel: '醫療通路', machineId: 'DRX-P-KNMSK-01', machineType: '3D',   orderDate: '2026-07-09', expectedDate: '2026-08-08', actualDate: undefined, startDate: '2026-07-23', endDate: '2026-08-06', status: 'scheduled' },
  { id: 'WO-2607-23', item: 'KYD 3D 口罩 M',   productCode: 'DRX-3D-KN02-M', qty: 72_000,  customer: '大樹藥局',  salesChannel: '藥局通路', machineId: 'DRX-P-KNMSK-01', machineType: '3D',   orderDate: '2026-07-10', expectedDate: '2026-08-14', actualDate: undefined, startDate: '2026-08-06', endDate: '2026-08-14', status: 'pending' },
  { id: 'WO-2607-31', item: 'KYD 平面口罩 白',  productCode: 'DRX-2D-KYD3-W', qty: 90_000,  customer: '蝦皮商城',  salesChannel: '電商',     machineId: 'DRX-P-2DMSK-03', machineType: '平面', orderDate: '2026-07-10', expectedDate: '2026-07-28', actualDate: undefined, startDate: '2026-07-21', endDate: '2026-07-28', status: 'scheduled' },

  // ── 未來排程 ──
  { id: 'WO-2607-32', item: 'HX 平面口罩 綠',  productCode: 'DRX-2D-HX01-G', qty: 180_000, customer: '大創',      salesChannel: '零售通路', machineId: 'DRX-P-2DMSK-02', machineType: '平面', orderDate: '2026-07-12', expectedDate: '2026-08-04', actualDate: undefined, startDate: '2026-07-24', endDate: '2026-08-01', status: 'pending' },
  { id: 'WO-2607-33', item: 'HX 彈力口罩 粉',  productCode: 'DRX-3D-HX01-P', qty: 60_000,  customer: '直營門市',  salesChannel: '直營',     machineId: 'DRX-P-3DMSK-02', machineType: '彈力', orderDate: '2026-07-13', expectedDate: '2026-08-01', actualDate: undefined, startDate: '2026-07-24', endDate: '2026-08-01', status: 'pending' },
  { id: 'WO-2607-34', item: 'HY 4D 口罩 S',    productCode: 'DRX-4D-KF03-S', qty: 96_000,  customer: '大樹藥局',  salesChannel: '藥局通路', machineId: 'DRX-P-KFMSK-03', machineType: '4D',   orderDate: '2026-07-14', expectedDate: '2026-08-06', actualDate: undefined, startDate: '2026-07-28', endDate: '2026-08-06', status: 'pending' },
  { id: 'WO-2607-35', item: 'KYD 3D 口罩 S',   productCode: 'DRX-3D-KN03-S', qty: 72_000,  customer: '屈臣氏',    salesChannel: '藥妝通路', machineId: 'DRX-P-KNMSK-03', machineType: '3D',   orderDate: '2026-07-14', expectedDate: '2026-08-08', actualDate: undefined, startDate: '2026-07-28', endDate: '2026-08-08', status: 'pending' },
  { id: 'WO-2607-36', item: 'HX 平面口罩 白',  productCode: 'DRX-2D-HX01-W', qty: 200_000, customer: '康是美',    salesChannel: '藥妝通路', machineId: 'DRX-P-2DMSK-04', machineType: '平面', orderDate: '2026-07-15', expectedDate: '2026-08-08', actualDate: undefined, startDate: '2026-07-28', endDate: '2026-08-06', status: 'pending', rush: true },
];
