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
import { ProviderSimulatorSecurityService } from './provider-simulator-security.service';
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
    private readonly security: ProviderSimulatorSecurityService,
  ) {}

  @Post('health')
  async health(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorHealthRequestDto) {
    await this.authenticate(headers, body, 'health');
    return this.simulator.health();
  }

  @Post('launch')
  async launch(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorLaunchRequestDto) {
    await this.authenticate(headers, body, 'launch');
    return this.simulator.launch({ ...body });
  }

  @Post('balance')
  async balance(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorBalanceRequestDto) {
    await this.authenticate(headers, body, 'balance');
    return this.simulator.getBalance({ ...body });
  }

  @Post('transfer-in')
  async transferIn(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorTransferRequestDto) {
    await this.authenticate(headers, body, 'transfer-in');
    return this.simulator.transfer('TRANSFER_IN', { ...body });
  }

  @Post('transfer-out')
  async transferOut(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorTransferRequestDto) {
    await this.authenticate(headers, body, 'transfer-out');
    return this.simulator.transfer('TRANSFER_OUT', { ...body });
  }

  @Post('bet')
  async bet(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    await this.authenticate(headers, body, 'bet');
    return this.transactions.gameTransaction('BET', { ...body });
  }

  @Post('win')
  async win(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    await this.authenticate(headers, body, 'win');
    return this.transactions.gameTransaction('WIN', { ...body });
  }

  @Post('refund')
  async refund(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    await this.authenticate(headers, body, 'refund');
    return this.transactions.gameTransaction('REFUND', { ...body });
  }

  @Post('rollback')
  async rollback(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorGameTransactionDto) {
    await this.authenticate(headers, body, 'rollback');
    return this.transactions.gameTransaction('ROLLBACK', { ...body });
  }

  @Post('games')
  async games(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: ProviderSimulatorGamesRequestDto,
    @Req() request: ProviderSimulatorRequest,
  ) {
    await this.authenticate(headers, body, 'games');
    const forwardedProto = String(request.headers['x-forwarded-proto'] ?? request.protocol ?? 'http').split(',')[0].trim();
    const forwardedHost = String(request.headers['x-forwarded-host'] ?? request.headers.host ?? 'localhost:4000').split(',')[0].trim();
    const configuredBaseUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, '');
    return this.simulator.games(configuredBaseUrl || `${forwardedProto}://${forwardedHost}`, body);
  }

  @Post('bet-history')
  async betHistory(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorBetHistoryRequestDto) {
    await this.authenticate(headers, body, 'bet-history');
    return this.simulator.betHistory({ ...body });
  }

  @Post('reset')
  async reset(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: ProviderSimulatorResetRequestDto) {
    await this.authenticate(headers, body, 'reset');
    return this.simulator.reset();
  }

  @Get('icons/:gameCode')
  icon(@Param('gameCode') gameCode: string, @Res() response: SvgResponse) {
    assertProviderSimulatorAvailable();
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    response.send(this.simulator.icon(gameCode));
  }

  private async authenticate(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    endpoint: string,
  ) {
    assertProviderSimulatorAvailable();
    await this.security.authenticate(headers, body, endpoint);
  }
}
