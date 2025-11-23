import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
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

  signInWithGoogle() {
    console.log('Google signup/login...');
    // Si usas Firebase:
    /*
    this.authService.googleSignIn().then(() => {
        this.router.navigate(['/dashboard']);
    });
    */
  }

}
