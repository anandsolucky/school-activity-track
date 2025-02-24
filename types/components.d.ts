declare module '@/components/auth/LoginForm' {
  const LoginForm: React.FC;
  export default LoginForm;
}

declare module '@/components/auth/RegisterForm' {
  const RegisterForm: React.FC;
  export default RegisterForm;
}

declare module '@/components/auth/ForgotPasswordForm' {
  const ForgotPasswordForm: React.FC;
  export default ForgotPasswordForm;
}

declare module '@/components/ui/Spinner' {
  interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  const Spinner: React.FC<SpinnerProps>;
  export { Spinner, SpinnerProps };
}
