import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard';
import { ShiftsPage } from './pages/shifts';
import { RushPage } from './pages/rush';
import { DowntimePage } from './pages/downtime';
import { QmsPage } from './pages/qms';
import { AuditPage } from './pages/audit';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardPage, title: '儀表板 — DRX 排程升級展示' },
  { path: 'shifts',    component: ShiftsPage,    title: '每日排班 × 產能 — DRX 排程升級展示' },
  { path: 'rush',      component: RushPage,      title: '插單衝擊預覽 — DRX 排程升級展示' },
  { path: 'downtime',  component: DowntimePage,  title: '停機自動順延 — DRX 排程升級展示' },
  { path: 'qms',       component: QmsPage,       title: 'QMS 文件產生 — DRX 排程升級展示' },
  { path: 'audit',     component: AuditPage,     title: '稽核紀錄 — DRX 排程升級展示' },
  { path: '**', redirectTo: 'dashboard' },
];
