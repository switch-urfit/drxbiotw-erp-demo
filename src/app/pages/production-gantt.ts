// ══════════════════════════════════════════════════════════
// 生產甘特圖：依機台 / 依品項兩種視角
// 機台視角：每列一台機台，顯示歷史 + 未來排程
// 品項視角：每列一個產品，顯示跨機台的產能配置
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

  viewMode = signal<'machine' | 'product'>('machine');
  hoveredBlock = signal<string | null>(null);

  readonly lanes = computed<GanttLane[]>(() => {
    return this.viewMode() === 'machine'
      ? this.s.ganttByMachine()
      : this.s.ganttByProduct();
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

  setView(mode: 'machine' | 'product'): void {
    this.viewMode.set(mode);
  }
}
