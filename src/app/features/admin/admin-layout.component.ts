import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AdminSessionHeaderComponent } from "./admin-session-header.component";

@Component({
  selector: 'app-admin-layout',
  imports: [AdminSessionHeaderComponent, RouterOutlet],
  template: `
    <app-admin-session-header />

    <div class="min-h-screen bg-slate-50 lg:ml-64">
      <main>
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent {}