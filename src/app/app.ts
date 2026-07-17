// ══════════════════════════════════════════════════════════
// 應用程式外框：側欄導航 + 路由出口（紫色主題，與正式系統一致）
// ══════════════════════════════════════════════════════════
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly nav = [
    { path: '/dashboard', icon: '📊', label: '儀表板' },
    { path: '/shifts',    icon: '👥', label: '每日排班 × 產能' },
    { path: '/rush',      icon: '⚡', label: '插單衝擊預覽' },
    { path: '/downtime',  icon: '🔧', label: '停機自動順延' },
    { path: '/qms',       icon: '📄', label: 'QMS 文件產生' },
    { path: '/audit',     icon: '🗒', label: '稽核紀錄' },
  ];
}
