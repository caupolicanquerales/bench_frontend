import { Component, signal } from '@angular/core';
import { AppDashboardLayout } from './app-dashboard-layout/app-dashboard-layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ AppDashboardLayout],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('bench_frontend');
}
