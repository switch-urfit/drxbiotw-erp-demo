// ══════════════════════════════════════════════════════════
// 交期追蹤：所有訂單交期狀態，搜尋/篩選，延遲原因一覽
// ══════════════════════════════════════════════════════════
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService } from '../core/scheduler.service';
import { ScheduledOrder } from '../core/models';

@Component({
  selector: 'app-delivery',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './delivery.html',
})
export class DeliveryPage {
  readonly s = inject(SchedulerService);

  query = signal('');
  statusFilter = signal('all');
  sortCol = signal<keyof ScheduledOrder | ''>('expectedDate');
  sortAsc = signal(true);

  readonly filtered = computed(() => {
    let list = this.s.filterOrders(this.query(), this.statusFilter());
    const col = this.sortCol();
    if (col) {
      const asc = this.sortAsc() ? 1 : -1;
      list = [...list].sort((a, b) => {
        const av = (a as any)[col] ?? '';
        const bv = (b as any)[col] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * asc;
        return String(av).localeCompare(String(bv)) * asc;
      });
    }
    return list;
  });

  readonly stats = computed(() => {
    const all = this.s.allOrders();
    const total = all.length;
    const done = all.filter(o => o.status === 'shipped' || o.status === 'completed').length;
    const active = all.filter(o => o.status === 'in_progress' || o.status === 'scheduled').length;
    const delayed = all.filter(o => (o.delayDays ?? 0) > 0).length;
    const onTime = all.filter(o => o.actualDate && !o.delayDays).length;
    return { total, done, active, delayed, onTime };
  });

  toggleSort(col: keyof ScheduledOrder): void {
    if (this.sortCol() === col) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortCol.set(col);
      this.sortAsc.set(true);
    }
  }

  sortIcon(col: keyof ScheduledOrder): string {
    if (this.sortCol() !== col) return '↕';
    return this.sortAsc() ? '↑' : '↓';
  }

  daysUntil(dateStr: string): number {
    const d = this.s.parseDate(dateStr);
    return Math.round((d.getTime() - this.s.today.getTime()) / 86_400_000);
  }
}
