import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { User } from 'firebase/auth';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';

import { AuthService } from '../../core/services/auth.service';
import { routesEnum } from '../../core/enums/router.enum';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, AvatarModule, ButtonModule, MenuModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = signal<User | null>(null);
  readonly isMenuOpen = signal(false);

  readonly navItems = [
    { label: 'Inicio', route: '/' },
    { label: 'Analitica', route: `/${routesEnum.analytics}` },
    { label: 'Ingresos', route: `/${routesEnum.income}` },
    { label: 'Gastos', route: `/${routesEnum.expenses}` },
    { label: 'Categorías', route: `/${routesEnum.category}` }
  ];

  readonly userMenuItems: MenuItem[] = [
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => void this.onLogout()
    }
  ];

  ngOnInit(): void {
    this.authService.user$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.user.set(user);
      });
  }

  get userInitial(): string {
    const displayName = this.user()?.displayName?.trim();
    const email = this.user()?.email?.trim();

    return (displayName?.[0] ?? email?.[0] ?? 'U').toUpperCase();
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    await this.router.navigate([routesEnum.signIn]);
  }
}
