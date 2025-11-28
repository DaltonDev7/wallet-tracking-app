import { Component, ElementRef, HostListener, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from 'firebase/auth';
import { routesEnum } from '../../core/enums/router.enum';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

   user = signal<User | null>(null);

  // Menú usuario (dropdown)
  isUserMenuOpen = signal(false);

  // Menú mobile
  readonly isMenuOpen = signal(false);

  // (si lo usas en otro lado)
  readonly isNewMovementOpen = signal(false);

  @ViewChild('userMenu') userMenuRef!: ElementRef;

  constructor(
    private authServices: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authServices.user$.subscribe((u) => {
      this.user.set(u);
    });
  }

  // ====== MENÚ MOBILE ======

  toggleMenu() {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  // ====== MENÚ USUARIO (DESKTOP) ======

  toggleUserMenu() {
    this.isUserMenuOpen.update((v) => !v);
  }

  async onLogout() {
    await this.authServices.logout();
    this.router.navigate([routesEnum.signIn]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (!this.userMenuRef) return;

    const clickedInside = this.userMenuRef.nativeElement.contains(target);

    if (!clickedInside) {
      this.isUserMenuOpen.set(false);
    }
  }


}
