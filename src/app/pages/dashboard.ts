// ══════════════════════════════════════════════════════════
// 儀表板：全廠今日產能總覽、注意事項、13 台機台狀態
// ══════════════════════════════════════════════════════════
import { Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SchedulerService } from '../core/scheduler.service';

@Component({
  selector: 'app-dashboard',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly s = inject(SchedulerService);

  readonly alerts = computed(() => {
    const out: { level: 'warn' | 'bad'; text: string }[] = [];
    for (const m of this.s.machines) {
      const assigned = this.s.assignedOps(m.id);
      const absent = assigned.filter(o => o.absent);
      if (this.s.downtimes()[m.id]) {
        const dt = this.s.downtimes()[m.id];
        out.push({ level: 'bad', text: `${m.id} 停機中（${dt.reason} ${dt.hours}h）— ${dt.affected} 張工單已自動順延 ${dt.delayDays} 天` });
      }
      if (assigned.length && absent.length === assigned.length) {
        out.push({ level: 'bad', text: `${m.id} 全員缺勤 — 今日 0 產出，佇列工單需整批順延` });
      } else if (absent.length) {
        out.push({ level: 'warn', text: `${m.id} 缺 ${absent.length} 人（${absent.map(o => o.name).join('、')}）— 產能 ${this.s.fullCapacity(m.id).toFixed(2)} → ${this.s.capacity(m.id).toFixed(2)} 片/分` });
      }
      if (!assigned.length && this.s.queueOf(m.id).length) {
        out.push({ level: 'warn', text: `${m.id} 有 ${this.s.queueOf(m.id).length} 張單待產但今日未排班 — 沒有排班＝不開工` });
      }
    }
    return out;
  });

  status(mid: string): { cls: string; text: string } {
    if (this.s.downtimes()[mid]) return { cls: 'bad', text: '停機中' };
    const n = this.s.assignedOps(mid).length;
    if (!n) return { cls: 'idle', text: '未排班' };
    const present = this.s.presentCount(mid);
    if (present === 0) return { cls: 'bad', text: '全員缺勤' };
    if (present < this.s.machine(mid).stdOps) return { cls: 'warn', text: `缺員運轉 ${present}/${this.s.machine(mid).stdOps}` };
    return { cls: 'ok', text: `運轉中 ${present}/${this.s.machine(mid).stdOps} 人` };
  }
}
