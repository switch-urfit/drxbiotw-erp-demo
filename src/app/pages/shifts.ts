// ══════════════════════════════════════════════════════════
// 每日排班 × 產能：加派/調離作業員、登記缺勤，產能與交期即時重算
// 規則：沒排班＝不開工；同一人不能同時排兩台；只能排會操作該機型的人
// ══════════════════════════════════════════════════════════
import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SchedulerService } from '../core/scheduler.service';

@Component({
  selector: 'app-shifts',
  imports: [DecimalPipe],
  templateUrl: './shifts.html',
})
export class ShiftsPage {
  readonly s = inject(SchedulerService);

  firstOrderEta(mid: string): { days: number; eta: string } | null {
    const q = this.s.queueOf(mid);
    if (!q.length) return null;
    const days = this.s.durationDays(mid, q[0].qty);
    return isFinite(days) ? { days, eta: this.s.dateOf(days - 1) } : null;
  }

  understaffMsg(mid: string): string | null {
    const m = this.s.machine(mid);
    const assigned = this.s.assignedOps(mid);
    if (!assigned.length) return null;
    const present = this.s.presentCount(mid);
    if (present === 0) return '全員缺勤 — 此機今日 0 產出，佇列上所有工單需整批順延，系統已通知生管 HANK。';
    if (present < assigned.length) {
      const factor = (assigned.length / present).toFixed(2);
      return `缺 ${assigned.length - present} 人：產能 ${(m.ratePerPerson * assigned.length).toFixed(2)} → ${this.s.capacity(mid).toFixed(2)} 片/分，工時約 ×${factor}，受影響工單完成日已自動重算。已推播生管 HANK、廠長 KEN。`;
    }
    return null;
  }

  onAdd(mid: string, select: HTMLSelectElement): void {
    this.s.addOperator(mid, select.value);
    select.value = '';
  }
}
