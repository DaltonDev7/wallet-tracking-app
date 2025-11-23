import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  readonly isMenuOpen = signal(false);
  readonly isNewMovementOpen = signal(false);


  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }


  onLogout() {
    // Aquí luego llamas a tu servicio de auth
    // this.authService.logout();
    console.log('Cerrar sesión');
  }

}
