import { redirect } from 'next/navigation';

export default function ForgotPasswordPage() {
  redirect('/support?topic=forgot-password');
}
