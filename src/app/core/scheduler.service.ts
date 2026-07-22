// ══════════════════════════════════════════════════════════
// 排程引擎（Demo）— 動態產能、插單衝擊試算、停機順延、稽核
// 核心公式：當天該機產能（片/分）＝ 每人每分鐘產能 × 當天實際上線人數
// ══════════════════════════════════════════════════════════
import { Injectable, computed, signal } from '@angular/core';
import {
  AuditEntry, Downtime, GanttBlock, GanttLane, Machine, Operator,
  OrderStatus, QueuedOrder, RushPreviewResult, ScheduledOrder, WorkOrder,
} from './models';
import { ALL_ORDERS, DEFAULT_ASSIGNMENTS, DEFAULT_QUEUES, MACHINES, OPERATORS } from './data';

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

  // ══════════════════════════════════════════════════════════
  // 交期追蹤
  // ══════════════════════════════════════════════════════════
  readonly allOrders = signal<ScheduledOrder[]>(ALL_ORDERS);

  /** 甘特圖時間軸基準日（往前 50 天 ≈ 6 月初） */
  readonly ganttOrigin = new Date(2026, 5, 1);
  /** 甘特圖結束日 */
  readonly ganttEnd = new Date(2026, 7, 15);

  private daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 86_400_000);
  }

  parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  dayOffset(dateStr: string): number {
    return this.daysBetween(this.ganttOrigin, this.parseDate(dateStr));
  }

  get ganttTotalDays(): number {
    return this.daysBetween(this.ganttOrigin, this.ganttEnd);
  }

  get todayOffset(): number {
    return this.daysBetween(this.ganttOrigin, this.today);
  }

  formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  deliveryStatus(o: ScheduledOrder): { cls: string; text: string } {
    if (o.status === 'shipped') return { cls: 'ok', text: '已出貨' };
    if (o.status === 'completed') return { cls: 'ok', text: '已完成' };
    if (o.delayDays && o.delayDays > 0) {
      if (o.actualDate) return { cls: 'bad', text: `延遲 ${o.delayDays} 天` };
      return { cls: 'warn', text: `預計延遲 ${o.delayDays} 天` };
    }
    if (o.status === 'in_progress') return { cls: 'accent', text: '生產中' };
    if (o.status === 'scheduled') return { cls: 'accent', text: '已排程' };
    return { cls: 'idle', text: '待排程' };
  }

  filterOrders(query: string, statusFilter: string): ScheduledOrder[] {
    let list = this.allOrders();
    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'delayed') {
        list = list.filter(o => (o.delayDays ?? 0) > 0);
      } else if (statusFilter === 'done') {
        list = list.filter(o => o.status === 'shipped' || o.status === 'completed');
      } else if (statusFilter === 'active') {
        list = list.filter(o => o.status === 'in_progress' || o.status === 'scheduled');
      } else {
        list = list.filter(o => o.status === statusFilter);
      }
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.item.toLowerCase().includes(q) ||
        o.productCode.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.salesChannel.toLowerCase().includes(q) ||
        o.machineId.toLowerCase().includes(q)
      );
    }
    return list;
  }

  // ══════════════════════════════════════════════════════════
  // 甘特圖資料產生
  // ══════════════════════════════════════════════════════════
  private blockCls(o: ScheduledOrder): GanttBlock['cls'] {
    if (o.rush) return 'rush';
    if ((o.delayDays ?? 0) > 0) return 'delayed';
    const s = o.status;
    if (s === 'shipped' || s === 'completed') return 'completed';
    if (s === 'in_progress') return 'in_progress';
    if (s === 'scheduled') return 'scheduled';
    return 'pending';
  }

  ganttByMachine(): GanttLane[] {
    const orders = this.allOrders();
    const grouped = new Map<string, ScheduledOrder[]>();
    for (const o of orders) {
      const list = grouped.get(o.machineId) ?? [];
      list.push(o);
      grouped.set(o.machineId, list);
    }
    return this.machines
      .filter(m => grouped.has(m.id))
      .map(m => {
        const mOrders = grouped.get(m.id)!.sort((a, b) =>
          this.dayOffset(a.startDate) - this.dayOffset(b.startDate));
        return {
          key: m.id,
          label: m.id.replace('DRX-P-', ''),
          sublabel: `${m.spec} · ${m.type}`,
          blocks: mOrders.map(o => ({
            id: o.id,
            label: `${o.id} ${o.item}`,
            startDay: Math.max(0, this.dayOffset(o.startDate)),
            lengthDays: Math.max(1, this.dayOffset(o.endDate) - this.dayOffset(o.startDate)),
            cls: this.blockCls(o),
            tooltip: `${o.id}\n${o.item} × ${o.qty.toLocaleString()}\n${o.customer}\n${o.startDate} → ${o.endDate}`,
          })),
        };
      });
  }

  ganttByProduct(): GanttLane[] {
    const orders = this.allOrders();
    const grouped = new Map<string, ScheduledOrder[]>();
    for (const o of orders) {
      const list = grouped.get(o.item) ?? [];
      list.push(o);
      grouped.set(o.item, list);
    }
    const lanes: GanttLane[] = [];
    for (const [item, itemOrders] of grouped) {
      const sorted = itemOrders.sort((a, b) =>
        this.dayOffset(a.startDate) - this.dayOffset(b.startDate));
      const type = sorted[0].machineType;
      const machineIds = [...new Set(sorted.map(o => o.machineId))];
      lanes.push({
        key: item,
        label: item,
        sublabel: `${type} · ${machineIds.length} 台`,
        blocks: sorted.map(o => ({
          id: o.id,
          label: `${o.id} (${o.machineId.replace('DRX-P-', '')})`,
          startDay: Math.max(0, this.dayOffset(o.startDate)),
          lengthDays: Math.max(1, this.dayOffset(o.endDate) - this.dayOffset(o.startDate)),
          cls: this.blockCls(o),
          tooltip: `${o.id}\n${o.customer}\n機台 ${o.machineId}\n${o.qty.toLocaleString()} 片\n${o.startDate} → ${o.endDate}`,
        })),
      });
    }
    return lanes;
  }

  /** 甘特圖時間軸刻度 */
  ganttTicks(step: number = 7): { offset: number; label: string }[] {
    const total = this.ganttTotalDays;
    const ticks: { offset: number; label: string }[] = [];
    for (let i = 0; i <= total; i += step) {
      const d = new Date(this.ganttOrigin);
      d.setDate(d.getDate() + i);
      ticks.push({
        offset: i,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
      });
    }
    return ticks;
  }

  /** 產品的日產能（片/天） */
  productDailyCapacity(machineType: string): number {
    const typeMachines = this.machines.filter(m => m.type === machineType);
    if (!typeMachines.length) return 0;
    const m = typeMachines[0];
    return m.ratePerPerson * m.stdOps * this.MIN_PER_DAY;
  }
}
