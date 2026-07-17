// ══════════════════════════════════════════════════════════
// 甘特圖元件（共用）— 以天為單位的水平條圖
// 顏色僅輔助，狀態一律有文字標示（一般/急單/被順延/停機）
// ══════════════════════════════════════════════════════════
import { Component, computed, input } from '@angular/core';
import { GanttRow } from '../core/models';

@Component({
  selector: 'app-gantt',
  template: `
    <div class="gantt">
      <div class="g-title">{{ title() }}</div>
      @for (r of rows(); track $index) {
        <div class="g-row">
          <div class="g-label">{{ r.label }}</div>
          <div class="g-track">
            <div class="g-bar {{ r.cls || '' }}"
                 [style.left.%]="r.start / total() * 100"
                 [style.width.%]="r.len / total() * 100">{{ r.text }}</div>
          </div>
        </div>
      }
      <div class="g-axis">
        <div></div>
        <div class="ticks">
          @for (t of ticks(); track $index) { <span>{{ t }}</span> }
        </div>
      </div>
    </div>
  `,
})
export class Gantt {
  title = input('');
  rows = input<GanttRow[]>([]);
  total = input(10);
  start = input<Date>(new Date(2026, 6, 20));

  ticks = computed(() => {
    const total = Math.max(1, Math.ceil(this.total()));
    const step = Math.max(1, Math.ceil(total / 6));
    const out: string[] = [];
    for (let i = 0; i <= total; i += step) {
      const d = new Date(this.start());
      d.setDate(d.getDate() + i);
      out.push(`${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`);
    }
    return out;
  });
}
