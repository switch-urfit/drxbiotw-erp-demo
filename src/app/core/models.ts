// ══════════════════════════════════════════════════════════
// 資料模型定義
// 機台/作業員數字為 2026-06-17 正式系統快照（見 core/data.ts）
// ══════════════════════════════════════════════════════════
export type MachineType = '平面' | '彈力' | '4D' | '3D';

export interface Machine {
  id: string;            // 設備編號，例 DRX-P-2DMSK-01
  spec: string;          // 規格，例 HX 平面
  type: MachineType;
  minOps: number;        // 最少人數
  stdOps: number;        // 標準人數
  maxOps: number;        // 最多人數
  ratePerPerson: number; // 每人每分鐘產能（片/分）
}

export interface Operator {
  name: string;
  empNo: string;
  skills: MachineType[]; // 會操作的機台類型
  absent: boolean;       // 今日缺勤
}

export interface WorkOrder {
  id: string;
  item: string;
  qty: number;
  rush?: boolean;        // 急件
}

// 佇列排程後的工單（附起訖天）
export interface QueuedOrder extends WorkOrder {
  start: number;         // 第幾天開始（0 起算）
  len: number;           // 需時天數
}

export interface Downtime {
  machineId: string;
  reason: string;        // 換料 / 故障 / 保養 / 其他
  hours: number;
  note: string;
  delayDays: number;
  affected: number;      // 受影響工單數
}

export interface AuditEntry {
  time: string;
  who: string;
  action: string;
  reason: string;
}

export interface GanttRow {
  label: string;
  start: number;
  len: number;
  cls?: '' | 'rush' | 'delay' | 'downtime';
  text?: string;
}

export interface RushPreviewResult {
  before: QueuedOrder[];
  after: QueuedOrder[];
  delays: { id: string; days: number }[];
  rushDays: number;
  people: number;
  capacity: number;      // 片/分
  totalDays: number;
}

export type OrderStatus = 'shipped' | 'completed' | 'in_progress' | 'scheduled' | 'pending' | 'delayed';

export interface ScheduledOrder {
  id: string;
  item: string;
  productCode: string;
  qty: number;
  customer: string;
  salesChannel: string;
  machineId: string;
  machineType: MachineType;
  orderDate: string;
  expectedDate: string;
  actualDate?: string;
  startDate: string;
  endDate: string;
  status: OrderStatus;
  delayReason?: string;
  delayDays?: number;
  rush?: boolean;
}

export interface GanttBlock {
  id: string;
  label: string;
  startDay: number;
  lengthDays: number;
  cls: 'completed' | 'in_progress' | 'scheduled' | 'pending' | 'delayed' | 'rush';
  tooltip: string;
}

export interface GanttLane {
  key: string;
  label: string;
  sublabel?: string;
  blocks: GanttBlock[];
}
