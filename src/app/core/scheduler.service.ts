// ══════════════════════════════════════════════════════════
// 排程引擎（Demo）— 動態產能、插單衝擊試算、停機順延、稽核
// 核心公式：當天該機產能（片/分）＝ 每人每分鐘產能 × 當天實際上線人數
// ══════════════════════════════════════════════════════════
import { Injectable, computed, signal } from '@angular/core';
import {
  AuditEntry, Downtime, Machine, Operator, QueuedOrder, RushPreviewResult, WorkOrder,
} from './models';
import { DEFAULT_ASSIGNMENTS, DEFAULT_QUEUES, MACHINES, OPERATORS } from './data';

@Injectable({ providedIn: 'root' })
export class SchedulerService {
  /** 一天工作分鐘數：09:00–18:00 扣午休 60 分 */
  readonly MIN_PER_DAY = 480;
  /** 停機時數換算順延天數的除數（工作小時/日） */
  readonly HOURS_PER_DAY = 8;
  /** Demo 基準日（今天） */
  readonly today = new Date(2026, 6, 17);
  /** 排程起算日（下週一） */
  readonly scheduleStart = new Date(2026, 6, 20);

  readonly machines: Machine[] = MACHINES;

  readonly operators = signal<Operator[]>(OPERATORS.map(o => ({ ...o, absent: false })));
  readonly assignments = signal<Record<string, string[]>>(structuredClone(DEFAULT_ASSIGNMENTS));
  readonly queues = signal<Record<string, WorkOrder[]>>(structuredClone(DEFAULT_QUEUES));
  readonly downtimes = signal<Record<string, Downtime>>({});
  readonly audit = signal<AuditEntry[]>([
    { time: '08:15', who: '倉庫 MARY', action: 'WO-2607-11 備料完成 → material_ready', reason: '—' },
    { time: '08:02', who: '廠長 KEN', action: '建立今日班表（複製昨日後微調）', reason: '每日機台運作計畫' },
  ]);

  // ── 全廠彙總 ──
  readonly presentTotal = computed(() =>
    Object.values(this.assignments()).flat()
      .filter(name => !this.operatorByName(name)?.absent).length);
  readonly assignedTotal = computed(() => Object.values(this.assignments()).flat().length);
  readonly plantCapacity = computed(() =>
    this.machines.reduce((sum, m) => sum + this.capacity(m.id), 0));
  readonly runningCount = computed(() =>
    this.machines.filter(m => (this.assignments()[m.id]?.length ?? 0) > 0).length);
  readonly staffedMachines = computed(() =>
    this.machines.filter(m => (this.assignments()[m.id]?.length ?? 0) > 0));

  // ── 查詢 ──
  machine(id: string): Machine {
    return this.machines.find(m => m.id === id)!;
  }
  operatorByName(name: string): Operator | undefined {
    return this.operators().find(o => o.name === name);
  }
  assignedOps(machineId: string): Operator[] {
    return (this.assignments()[machineId] ?? [])
      .map(n => this.operatorByName(n)!)
      .filter(Boolean);
  }
  presentCount(machineId: string): number {
    return this.assignedOps(machineId).filter(o => !o.absent).length;
  }
  /** 當天該機產能（片/分）＝ 每人產能 × 實際上線人數 */
  capacity(machineId: string): number {
    return this.machine(machineId).ratePerPerson * this.presentCount(machineId);
  }
  /** 滿編產能（標準人數全到） */
  fullCapacity(machineId: string): number {
    const m = this.machine(machineId);
    return m.ratePerPerson * m.stdOps;
  }
  isDown(machineId: string): boolean {
    return !!this.downtimes()[machineId];
  }
  queueOf(machineId: string): WorkOrder[] {
    return this.queues()[machineId] ?? [];
  }

  /** 工單需時（天）；0 人上線回傳 Infinity */
  durationDays(machineId: string, qty: number, people?: number): number {
    const p = people ?? this.presentCount(machineId);
    if (p <= 0) return Infinity;
    return Math.ceil(qty / (this.machine(machineId).ratePerPerson * p * this.MIN_PER_DAY));
  }

  /** 依目前人力把佇列排出起訖天 */
  scheduleQueue(machineId: string, people?: number, orders?: WorkOrder[]): QueuedOrder[] {
    const list = orders ?? this.queueOf(machineId);
    let cur = 0;
    return list.map(o => {
      const len = this.durationDays(machineId, o.qty, people);
      const row: QueuedOrder = { ...o, start: cur, len: isFinite(len) ? len : 0 };
      cur += isFinite(len) ? len : 0;
      return row;
    });
  }

  /** 第 n 天（0 起算）對應日期 MM/DD */
  dateOf(day: number): string {
    const d = new Date(this.scheduleStart);
    d.setDate(d.getDate() + day);
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  // ── 班表操作（廠長） ──
  toggleAbsent(machineId: string, name: string): void {
    const op = this.operatorByName(name);
    if (!op) return;
    const absent = !op.absent;
    this.operators.update(list => list.map(o => o.name === name ? { ...o, absent } : o));
    const m = this.machine(machineId);
    this.log('廠長 KEN',
      `${machineId} 到班更新：${name} ${absent ? `缺勤，產能自動扣 ${m.ratePerPerson} 片/分` : '銷假回線'}`,
      absent ? '當天實際產能＝(排定−缺勤)×每人產能' : '—');
  }
  addOperator(machineId: string, name: string): void {
    if (!name) return;
    this.assignments.update(a => ({ ...a, [machineId]: [...(a[machineId] ?? []), name] }));
    this.log('廠長 KEN', `${machineId} 加派 ${name} 上線`, '每日機台運作計畫調整');
  }
  removeOperator(machineId: string, name: string): void {
    this.assignments.update(a => ({
      ...a, [machineId]: (a[machineId] ?? []).filter(n => n !== name),
    }));
    this.log('廠長 KEN', `${machineId} 調離 ${name}`, '每日機台運作計畫調整');
  }
  /** 可加派名單：會操作該機型、且今天尚未被排到任何機台（同時段不得排兩台） */
  availableFor(machineId: string): Operator[] {
    const type = this.machine(machineId).type;
    const assignedAll = new Set(Object.values(this.assignments()).flat());
    return this.operators().filter(o => o.skills.includes(type) && !assignedAll.has(o.name));
  }

  // ── 插單（生管） ──
  rushPreview(machineId: string, qty: number, pos: number): RushPreviewResult {
    const people = this.presentCount(machineId);
    const before = this.scheduleQueue(machineId, people);
    const rush: WorkOrder = { id: 'RUSH-2607-XX', item: '急件', qty, rush: true };
    const list = [...this.queueOf(machineId)];
    list.splice(pos, 0, rush);
    const after = this.scheduleQueue(machineId, people, list);
    const delays = after
      .filter(o => !o.rush)
      .map(o => ({ id: o.id, days: o.start - before.find(b => b.id === o.id)!.start }))
      .filter(d => d.days > 0);
    const rushDays = this.durationDays(machineId, qty, people);
    const totalDays = Math.max(...after.map(o => o.start + o.len), 1);
    return {
      before, after, delays,
      rushDays: isFinite(rushDays) ? rushDays : 0,
      people,
      capacity: this.capacity(machineId),
      totalDays,
    };
  }
  confirmRush(machineId: string, qty: number, pos: number, reason: string,
              delays: { id: string; days: number }[]): void {
    const rush: WorkOrder = { id: 'RUSH-2607-XX', item: '急件插單', qty, rush: true };
    this.queues.update(q => {
      const list = [...(q[machineId] ?? [])];
      list.splice(pos, 0, rush);
      return { ...q, [machineId]: list };
    });
    this.log('生管 HANK',
      `插單 ${rush.id}（${qty.toLocaleString()} 片）至 ${machineId} 第 ${pos + 1} 順位` +
      (delays.length ? `，連動影響 ${delays.length} 張` : '，無影響'),
      reason);
  }

  // ── 停機（領班） ──
  recordDowntime(machineId: string, reason: string, hours: number, note: string): Downtime {
    const delayDays = Math.ceil(hours / this.HOURS_PER_DAY);
    const affected = this.queueOf(machineId).length;
    const dt: Downtime = { machineId, reason, hours, note, delayDays, affected };
    this.downtimes.update(d => ({ ...d, [machineId]: dt }));
    this.log('領班 ALICE',
      `${machineId} 停機紀錄（${reason} ${hours}h）→ 系統自動順延 ${affected} 張工單各 ${delayDays} 天`,
      note || reason);
    return dt;
  }
  endDowntime(machineId: string): void {
    this.downtimes.update(d => {
      const { [machineId]: _, ...rest } = d;
      return rest;
    });
    this.log('領班 ALICE', `${machineId} 結束停機，回報實際復機時間`, '—');
  }

  // ── QMS（業助/PMC/QC） ──
  generateQms(orderId: string): void {
    this.log('業助 JUDY', `${orderId} 產生 QMS 收尾文件 ×3 + ERP CSV`,
      'ISO 13485 訂單收尾（流程圖 step 11）');
  }

  // ── 稽核 ──
  log(who: string, action: string, reason: string): void {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.audit.update(list => [{ time, who, action, reason: reason || '—' }, ...list]);
  }
}
