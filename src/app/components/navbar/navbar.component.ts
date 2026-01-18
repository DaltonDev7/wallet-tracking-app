import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '@angular/fire/auth';
import { routesEnum } from '../../core/enums/router.enum';

// PrimeNG standalone imports
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { DrawerModule } from 'primeng/drawer';
import { TieredMenuModule } from 'primeng/tieredmenu';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MenubarModule,
    ButtonModule,
    AvatarModule,
    DrawerModule,
    TieredMenuModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  user = signal<User | null>(null);


  mobileOpen = false;

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  // User dropdown
  @ViewChild('userMenu') userMenu!: any;

  menuItems = signal<any[]>([]);
  userItems = signal<any[]>([]);

  constructor(
    private authServices: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.menuItems.set([
      { label: 'Inicio', routerLink: '/' },
      { label: 'Ingresos', routerLink: '/income' },
      { label: 'Gastos', routerLink: '/expenses' },
      { label: 'Categorías', routerLink: '/categories' }
    ]);

    this.userItems.set([
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: async () => {
          await this.onLogout();
        }
      }
    ]);

    this.authServices.user$.subscribe(u => this.user.set(u));
  }


  openUserMenu(event: Event) {
    this.userMenu.toggle(event);
  }

  async onLogout() {
    await this.authServices.logout();
    this.router.navigate([routesEnum.signIn]);
  }

  displayInitial(): string {
    const name = this.user()?.displayName?.trim();
    return name ? name[0].toUpperCase() : 'U';
  }

}
