// ══════════════════════════════════════════════════════════
// 停機自動順延：領班記錄停機 → 系統自動算延時、連動順延整條佇列
// 現行系統只做「記錄＋甘特圖顯示」，順延靠生管手動 — 本頁展示升級後行為
// ══════════════════════════════════════════════════════════
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchedulerService } from '../core/scheduler.service';
import { Gantt } from '../shared/gantt';
import { Downtime, GanttRow, QueuedOrder } from '../core/models';

@Component({
  selector: 'app-downtime',
  imports: [FormsModule, Gantt],
  templateUrl: './downtime.html',
})
export class DowntimePage {
  readonly s = inject(SchedulerService);

  machineId = signal('DRX-P-KNMSK-01');
  reason = signal('故障');
  hours = signal(16);
  note = signal('');
  error = signal('');
  result = signal<{ dt: Downtime; before: QueuedOrder[]; totalDays: number } | null>(null);

  readonly reasons = ['換料', '故障', '保養', '其他'];

  readonly candidates = computed(() =>
    this.s.staffedMachines().filter(m => this.s.queueOf(m.id).length > 0));

  readonly activeDt = computed(() => this.s.downtimes()[this.machineId()] ?? null);

  readonly ganttBefore = computed<GanttRow[]>(() => {
    const r = this.result();
    if (!r) return [];
    return r.before.map(o => ({ label: o.id, start: o.start, len: o.len, text: `${o.len} 天` }));
  });

  readonly ganttAfter = computed<GanttRow[]>(() => {
    const r = this.result();
    if (!r) return [];
    const { dt, before } = r;
    const first = before[0];
    const dtStart = Math.min(1, first.len); // 停機發生在首單進行中的第 1 天結束時
    const rows: GanttRow[] = [
      { label: first.id, start: 0, len: dtStart, text: '' },
      { label: '🔧 停機', start: dtStart, len: dt.delayDays, cls: 'downtime', text: `${dt.reason} ${dt.hours}h` },
    ];
    if (first.len - dtStart > 0) {
      rows.push({
        label: `${first.id}（續）`, start: dtStart + dt.delayDays,
        len: first.len - dtStart, cls: 'delay', text: `延 ${dt.delayDays} 天`,
      });
    }
    for (const o of before.slice(1)) {
      rows.push({ label: o.id, start: o.start + dt.delayDays, len: o.len, cls: 'delay', text: `延 ${dt.delayDays} 天` });
    }
    return rows;
  });

  record(): void {
    if (this.hours() <= 0) { this.error.set('請輸入停機時長。'); return; }
    if (this.activeDt()) { this.error.set('此機台已有進行中的停機，請先結束。'); return; }
    const before = this.s.scheduleQueue(this.machineId());
    if (!before.length || this.s.presentCount(this.machineId()) === 0) {
      this.error.set('此機台今日沒有可估算的佇列（未排班或無工單）。');
      return;
    }
    this.error.set('');
    const dt = this.s.recordDowntime(this.machineId(), this.reason(), this.hours(), this.note().trim());
    const totalDays = before[before.length - 1].start + before[before.length - 1].len + dt.delayDays + 0.5;
    this.result.set({ dt, before, totalDays });
  }

  end(): void {
    this.s.endDowntime(this.machineId());
  }

  onMachineChange(): void {
    this.result.set(null);
    this.error.set('');
  }
}
