import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { LoginModelDto, RegisterModelDto } from '../model/authModel';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent {
  isLoginMode = true;
  authError: string | null = null;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.isLoginMode ? Validators.nullValidator : Validators.minLength(6)]],
      username: [''],
      confirmPassword: ['']
    });

    this.toggleFormValidators();
  }

  get showAdditionalFields() {
    return !this.isLoginMode;
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.authError = null;
    this.toggleFormValidators();
    this.form.reset();
  }

  private toggleFormValidators() {
    const passwordControl = this.form.get('password');
    const usernameControl = this.form.get('username');
    const confirmPasswordControl = this.form.get('confirmPassword');

    if (this.isLoginMode) {
      usernameControl?.clearValidators();
      confirmPasswordControl?.clearValidators();
      passwordControl?.setValidators([Validators.required]);
    } else {
      usernameControl?.setValidators([Validators.required]);
      passwordControl?.setValidators([
        Validators.required,
        Validators.minLength(6),
        this.strongPasswordValidator
      ]);
      confirmPasswordControl?.setValidators([Validators.required]);
      this.form.setValidators(this.passwordMatchValidator);
    }

    usernameControl?.updateValueAndValidity();
    passwordControl?.updateValueAndValidity();
    confirmPasswordControl?.updateValueAndValidity();
  }

  strongPasswordValidator: ValidatorFn = (control: AbstractControl) => {
    const password = control.value;
    if (!password) return null;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar ? null : { weakPassword: true };
  };

  passwordMatchValidator = (control: AbstractControl) => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password && confirmPassword && password.value !== confirmPassword.value 
      ? { passwordMismatch: true } : null;
  };

  onSubmit() {
    if (this.form.invalid) return;

    const authObservable = this.isLoginMode 
      ? this.authService.login(this.form.value as LoginModelDto)
      : this.authService.register(this.form.value as RegisterModelDto);

    authObservable.subscribe({
      next: (response) => {
        if (this.isLoginMode) {
          const role = this.authService.getUserRole();
          this.router.navigate([role === 'Admin' ? '/admin/calendar' : '/calendar']);
          this.toastr.success('Login successful!', 'Welcome!');
        } else {
          this.router.navigate(['/auth']);
          this.toastr.success('Registration successful!', 'Welcome!');
        }
      },
      error: (err) => {
        this.authError = this.isLoginMode 
          ? 'Invalid credentials. Please try again.' 
          : 'Registration failed. Please try again.';
        this.toastr.error(this.authError, this.isLoginMode ? 'Login Failed' : 'Registration Failed');
      }
    });
  }
}