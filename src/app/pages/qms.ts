// ══════════════════════════════════════════════════════════
// QMS 文件一鍵產生：流程圖 step 11「QMS 文件 + ERP 收尾」
// 文件引擎沿用已驗證的報表產生器（mocr-to-qms 專案）
// ══════════════════════════════════════════════════════════
import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { SchedulerService } from '../core/scheduler.service';
import { FINISHED_ORDERS } from '../core/data';

@Component({
  selector: 'app-qms',
  imports: [DecimalPipe],
  templateUrl: './qms.html',
})
export class QmsPage {
  readonly s = inject(SchedulerService);
  readonly orders = FINISHED_ORDERS;

  generating = signal(false);
  generatedFor = signal<string | null>(null);

  generate(orderId: string): void {
    if (this.generating() || this.generatedFor() === orderId) return;
    this.generating.set(true);
    setTimeout(() => {
      this.generating.set(false);
      this.generatedFor.set(orderId);
      this.s.generateQms(orderId);
    }, 700);
  }
}
