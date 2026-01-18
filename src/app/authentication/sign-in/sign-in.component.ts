import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  form: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder, private authenticationServices: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true],
    });
  }

  handleSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const { email, password, rememberMe } = this.form.value;
    console.log('Sign in ->', { email, password, rememberMe });

    // Aquí va tu lógica real de login (Firebase/AuthService/etc.)
    // this.authService.signIn(email, password, rememberMe).subscribe(...)

    setTimeout(() => {
      this.isSubmitting = false;
    }, 800);
  }



  async signInWithGoogle() {
    try {
      this.isSubmitting = true;
      const cred = await this.authenticationServices.signInWithGoogle();
      // Aquí rediriges al dashboard, home, etc.
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('Error al iniciar sesión con Google', error);
      // Aquí luego puedes mostrar un mensaje de error en la UI
    } finally {
      this.isSubmitting = false;
    }
  }

}
