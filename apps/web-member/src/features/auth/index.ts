/** Public boundary for the auth feature. Keep private implementation files unexported. */
export const AUTH_FEATURE_BOUNDARY = 'auth' as const;
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
