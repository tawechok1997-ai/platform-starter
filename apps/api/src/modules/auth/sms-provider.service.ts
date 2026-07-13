import { BadGatewayException, Injectable, Logger } from '@nestjs/common';

export type SmsDeliveryResult = {
  provider: string;
  messageId?: string;
};

@Injectable()
export class SmsProviderService {
  private readonly logger = new Logger(SmsProviderService.name);

  async sendOtp(phone: string, code: string, expiresInMinutes: number): Promise<SmsDeliveryResult> {
    const provider = String(process.env.SMS_PROVIDER ?? 'console').toLowerCase();
    if (provider === 'console') {
      if (process.env.NODE_ENV === 'production' && process.env.ALLOW_CONSOLE_SMS !== 'true') {
        throw new BadGatewayException('SMS provider is not configured');
      }
      this.logger.log(`OTP delivery queued for ${this.mask(phone)} (${expiresInMinutes}m)`);
      return { provider: 'console', messageId: `console-${Date.now()}` };
    }

    if (provider === 'http') {
      const endpoint = process.env.SMS_HTTP_ENDPOINT;
      const token = process.env.SMS_HTTP_TOKEN;
      if (!endpoint || !token) throw new BadGatewayException('SMS HTTP provider is not configured');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone, message: `รหัสยืนยันของคุณคือ ${code} ใช้ได้ภายใน ${expiresInMinutes} นาที` }),
      });
      if (!response.ok) throw new BadGatewayException('SMS provider rejected the request');
      const body = await response.json().catch(() => ({} as any));
      return { provider: 'http', messageId: String((body as any)?.messageId ?? (body as any)?.id ?? '') || undefined };
    }

    throw new BadGatewayException(`Unsupported SMS provider: ${provider}`);
  }

  private mask(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return `${'*'.repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
  }
}
