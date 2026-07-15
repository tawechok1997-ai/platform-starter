/** Public boundary for the auth feature. Keep private implementation files unexported. */
export const AUTH_FEATURE_BOUNDARY = 'auth' as const;
export * from './auth-redirect';
export * from './session-navigation';
export {
  RegisterView,
  type RegisterCopy,
  type RegisterErrorKey,
  type RegisterErrors,
  type RegisterLocale,
  type RegisterStatus,
  type RegisterStep,
  type RegisterViewProps,
} from './register-view';
