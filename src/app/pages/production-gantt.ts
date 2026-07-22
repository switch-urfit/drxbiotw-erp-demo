// ══════════════════════════════════════════════════════════
// 生產甘特圖：依機台 / 依品項 / 依訂單三種視角
// 機台視角：每列一台機台，顯示歷史 + 未來排程
// 品項視角：每列一個產品，顯示跨機台的產能配置
// 訂單視角：每列一位客戶，顯示訂單進度與延遲狀況
// ══════════════════════════════════════════════════════════
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SchedulerService } from '../core/scheduler.service';
import { GanttLane } from '../core/models';

@Component({
  selector: 'app-production-gantt',
  imports: [DecimalPipe],
  templateUrl: './production-gantt.html',
})
export class ProductionGanttPage {
  readonly s = inject(SchedulerService);

  viewMode = signal<'machine' | 'product' | 'order'>('machine');
  hoveredBlock = signal<string | null>(null);

  readonly lanes = computed<GanttLane[]>(() => {
    switch (this.viewMode()) {
      case 'machine': return this.s.ganttByMachine();
      case 'product': return this.s.ganttByProduct();
      case 'order':   return this.s.ganttByOrder();
      default:        return this.s.ganttByMachine();
    }
  });

  readonly ticks = computed(() => this.s.ganttTicks(7));
  readonly totalDays = computed(() => this.s.ganttTotalDays);
  readonly todayPct = computed(() => (this.s.todayOffset / this.s.ganttTotalDays) * 100);

  pct(day: number): number {
    return (day / this.s.ganttTotalDays) * 100;
  }

  readonly machineSummary = computed(() => {
    const lanes = this.s.ganttByMachine();
    return lanes.map(l => {
      const m = this.s.machines.find(ma => ma.id === l.key)!;
      const cap = m.ratePerPerson * m.stdOps * this.s.MIN_PER_DAY;
      return { id: m.id, spec: m.spec, type: m.type, dailyCap: cap, orders: l.blocks.length };
    });
  });

  readonly productSummary = computed(() => {
    const lanes = this.s.ganttByProduct();
    return lanes.map(l => {
      const orders = this.s.allOrders().filter(o => o.item === l.key);
      const totalQty = orders.reduce((s, o) => s + o.qty, 0);
      const type = orders[0]?.machineType ?? '';
      const dailyCap = this.s.productDailyCapacity(type);
      return { item: l.key, type, totalQty, dailyCap, batches: l.blocks.length };
    });
  });

  readonly orderSummary = computed(() => {
    const allOrders = this.s.allOrders();
    const grouped = new Map<string, typeof allOrders>();
    for (const o of allOrders) {
      const list = grouped.get(o.customer) ?? [];
      list.push(o);
      grouped.set(o.customer, list);
    }
    return [...grouped.entries()].map(([customer, orders]) => {
      const totalQty = orders.reduce((s, o) => s + o.qty, 0);
      const done = orders.filter(o => o.status === 'shipped' || o.status === 'completed').length;
      const delayed = orders.filter(o => (o.delayDays ?? 0) > 0).length;
      const channels = [...new Set(orders.map(o => o.salesChannel))].join('、');
      return { customer, channels, totalOrders: orders.length, totalQty, done, delayed };
    });
  });

  setView(mode: 'machine' | 'product' | 'order'): void {
    this.viewMode.set(mode);
  }
}
