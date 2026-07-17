// ══════════════════════════════════════════════════════════
// 稽核紀錄：ISO 13485 要求 — 誰、改什麼、何時、為什麼
// 本頁彙整 Demo 全站操作產生的紀錄（正式系統寫入 schedule_changes 表）
// ══════════════════════════════════════════════════════════
import { Component, inject } from '@angular/core';
import { SchedulerService } from '../core/scheduler.service';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.html',
})
export class AuditPage {
  readonly s = inject(SchedulerService);
}
