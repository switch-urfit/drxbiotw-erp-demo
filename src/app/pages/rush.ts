// ══════════════════════════════════════════════════════════
// 插單衝擊預覽：先試算（不動真資料），生管確認後才寫入
// 升級重點：按「該機台產能 × 當天上線人力」精準估算，
// 取代現行的全廠單一概估值
// ══════════════════════════════════════════════════════════
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SchedulerService } from '../core/scheduler.service';
import { Gantt } from '../shared/gantt';
import { GanttRow, RushPreviewResult } from '../core/models';

@Component({
  selector: 'app-rush',
  imports: [DecimalPipe, FormsModule, Gantt],
  templateUrl: './rush.html',
})
export class RushPage {
  readonly s = inject(SchedulerService);

  machineId = signal('DRX-P-2DMSK-01');
  qty = signal(160_000);
  pos = signal(0);
  reason = signal('');
  error = signal('');
  preview = signal<RushPreviewResult | null>(null);
  confirmed = signal(false);

  /** 可插單的機台：今天有排班且有佇列 */
  readonly candidates = computed(() =>
    this.s.staffedMachines().filter(m => this.s.queueOf(m.id).length > 0));

  readonly positions = computed(() => {
    const q = this.s.queueOf(this.machineId());
    return [
      { value: 0, label: '最前面（第 1 順位）' },
      ...q.map((o, i) => ({ value: i + 1, label: `${o.id} 之後` })),
    ];
  });

  readonly ganttBefore = computed<GanttRow[]>(() => {
    const p = this.preview();
    if (!p) return [];
    return p.before.map(o => ({ label: o.id, start: o.start, len: o.len, text: `${o.len} 天` }));
  });

  readonly ganttAfter = computed<GanttRow[]>(() => {
    const p = this.preview();
    if (!p) return [];
    return p.after.map(o => {
      const d = p.delays.find(x => x.id === o.id);
      return {
        label: o.id, start: o.start, len: o.len,
        cls: o.rush ? 'rush' as const : (d ? 'delay' as const : '' as const),
        text: o.rush ? `急單 ${o.len} 天` : d ? `延 ${d.days} 天` : `${o.len} 天`,
      };
    });
  });

  onMachineChange(): void {
    this.pos.set(0);
    this.preview.set(null);
    this.confirmed.set(false);
    this.error.set('');
  }

  runPreview(): void {
    this.confirmed.set(false);
    if (!this.reason().trim()) {
      this.error.set('插單原因為必填（ISO 13485 稽核要求），請先填寫。');
      this.preview.set(null);
      return;
    }
    if (this.qty() <= 0) {
      this.error.set('請輸入有效的急單數量。');
      this.preview.set(null);
      return;
    }
    if (this.s.presentCount(this.machineId()) === 0) {
      this.error.set('此機台今日 0 人上線（全員缺勤或未排班），無法估算 — 請先到「每日排班」調整人力。');
      this.preview.set(null);
      return;
    }
    this.error.set('');
    this.preview.set(this.s.rushPreview(this.machineId(), this.qty(), this.pos()));
  }

  confirm(): void {
    const p = this.preview();
    if (!p || this.confirmed()) return;
    this.s.confirmRush(this.machineId(), this.qty(), this.pos(), this.reason().trim(), p.delays);
    this.confirmed.set(true);
  }

  delaySummary(): string {
    const p = this.preview();
    if (!p) return '';
    return p.delays.length
      ? p.delays.map(d => `${d.id} 延 ${d.days} 天`).join('、')
      : '不影響其他單';
  }
}
