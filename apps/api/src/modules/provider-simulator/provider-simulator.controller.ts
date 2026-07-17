import { Body, Controller, Get, Headers, NotFoundException, Param, Post, Req, Res } from '@nestjs/common';
import { ProviderSimulatorService } from './provider-simulator.service';

type ProviderSimulatorRequest = {
  headers: Record<string, string | string[] | undefined>;
  protocol?: string | undefined;
};

type SvgResponse = {
  setHeader(name: string, value: string): void;
  send(body: string): unknown;
};

@Controller('provider-simulator')
export class ProviderSimulatorController {
  constructor(private readonly simulator: ProviderSimulatorService) {}

  @Post('health')
  health(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.health();
  }

  @Post('launch')
  launch(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.launch(body);
  }

  @Post('balance')
  balance(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.getBalance(body);
  }

  @Post('transfer-in')
  transferIn(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.transfer('TRANSFER_IN', body);
  }

  @Post('transfer-out')
  transferOut(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.transfer('TRANSFER_OUT', body);
  }

  @Post('games')
  games(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
    @Req() request: ProviderSimulatorRequest,
  ) {
    this.authenticate(headers, body);
    const forwardedProto = String(request.headers['x-forwarded-proto'] ?? request.protocol ?? 'http').split(',')[0].trim();
    const forwardedHost = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? 'localhost:4000').split(',')[0].trim();
    const configuredBaseUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
    return this.simulator.games(configuredBaseUrl || `${forwardedProto}://${forwardedHost}`);
  }

  @Post('bet-history')
  betHistory(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.betHistory(body);
  }

  @Post('reset')
  reset(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: Record<string, unknown>) {
    this.authenticate(headers, body);
    return this.simulator.reset();
  }

  @Get('icons/:gameCode')
  icon(@Param('gameCode') gameCode: string, @Res() response: SvgResponse) {
    this.ensureEnabled();
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    response.send(this.simulator.icon(gameCode));
  }

  private authenticate(headers: Record<string, string | string[] | undefined>, body: unknown) {
    this.ensureEnabled();
    this.simulator.verifyRequest(headers, body);
  }

  private ensureEnabled() {
    if (process.env.ENABLE_PROVIDER_SIMULATOR !== 'true') {
      throw new NotFoundException('Provider simulator is disabled');
    }
  }
}
