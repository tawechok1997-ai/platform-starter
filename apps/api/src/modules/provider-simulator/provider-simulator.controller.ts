import { Body, Controller, Get, Headers, Param, Post, Req, Res } from '@nestjs/common';
import { ProviderSimulatorGameTransactionDto } from './dto/provider-simulator-game-transaction.dto';
import {
  ProviderSimulatorBalanceRequestDto,
  ProviderSimulatorBetHistoryRequestDto,
  ProviderSimulatorGamesRequestDto,
  ProviderSimulatorHealthRequestDto,
  ProviderSimulatorLaunchRequestDto,
  ProviderSimulatorResetRequestDto,
  ProviderSimulatorTransferRequestDto,
} from './dto/provider-simulator-requests.dto';
import { assertProviderSimulatorAvailable } from './provider-simulator-config';
import { ProviderSimulatorService } from './provider-simulator.service';
import { ProviderSimulatorTransactionService } from './provider-simulator-transaction.service';

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
  constructor(
    private readonly simulator: ProviderSimulatorService,
    private readonly transactions: ProviderSimulatorTransactionService,
  ) {}

  @Post('health')
  health(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorHealthRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.health();
  }

  @Post('launch')
  launch(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorLaunchRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.launch({ ...body });
  }

  @Post('balance')
  balance(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorBalanceRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.getBalance({ ...body });
  }

  @Post('transfer-in')
  transferIn(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorTransferRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.transfer('TRANSFER_IN', { ...body });
  }

  @Post('transfer-out')
  transferOut(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorTransferRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.transfer('TRANSFER_OUT', { ...body });
  }

  @Post('bet')
  bet(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    this.authenticate(headers, body);
    return this.transactions.gameTransaction('BET', { ...body });
  }

  @Post('win')
  win(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    this.authenticate(headers, body);
    return this.transactions.gameTransaction('WIN', { ...body });
  }

  @Post('refund')
  refund(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    this.authenticate(headers, body);
    return this.transactions.gameTransaction('REFUND', { ...body });
  }

  @Post('rollback')
  rollback(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    this.authenticate(headers, body);
    return this.transactions.gameTransaction('ROLLBACK', { ...body });
  }

  @Post('games')
  games(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: ProviderSimulatorGamesRequestDto,
    @Req() request: ProviderSimulatorRequest,
  ) {
    this.authenticate(headers, body);
    const forwardedProto = String(request.headers['x-forwarded-proto'] ?? request.protocol ?? 'http').split(',')[0].trim();
    const forwardedHost = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? 'localhost:4000').split(',')[0].trim();
    const configuredBaseUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
    return this.simulator.games(configuredBaseUrl || `${forwardedProto}://${forwardedHost}`, body);
  }

  @Post('bet-history')
  betHistory(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorBetHistoryRequestDto) {
    this.authenticate(headers, body);
    return this.simulator.betHistory({ ...body });
  }

  @Post('reset')
  reset(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorResetRequestDto) {
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
    assertProviderSimulatorAvailable();
  }
}
