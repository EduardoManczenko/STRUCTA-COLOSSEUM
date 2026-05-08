import { Body, Controller, Get, Post } from '@nestjs/common';
import { FaucetService } from './faucet.service';
import { FaucetMintUsdcDto } from './dto/faucet.dto';

/**
 * Devnet-only faucet endpoints. No auth: this is purely a convenience for
 * testers preparing their wallet to interact with the protocol.
 */
@Controller('faucet')
export class FaucetController {
  constructor(private readonly service: FaucetService) {}

  @Get('info')
  info() {
    return this.service.info();
  }

  @Post('usdc')
  mintUsdc(@Body() dto: FaucetMintUsdcDto) {
    return this.service.buildMintUsdcTx({
      walletAddress: dto.walletAddress,
      amountHuman: dto.amountHuman,
    });
  }
}
