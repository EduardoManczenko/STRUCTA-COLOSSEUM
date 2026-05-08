import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { MultisigService } from './multisig.service';
import { CreateProposalDto, IncorporatorReviewDto, SignProposalDto } from './dto/admin.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  AuthUser,
} from '../../common/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly multisig: MultisigService,
  ) {}

  // ===== Incorporators =====

  @Get('incorporators')
  listIncorps(@Query('status') status?: string) {
    return this.admin.listIncorporators(status);
  }

  @Get('incorporators/:id')
  getIncorp(@Param('id') id: string) {
    return this.admin.getIncorporator(id);
  }

  @Post('incorporators/:id/review')
  reviewIncorp(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: IncorporatorReviewDto,
  ) {
    return this.admin.reviewIncorporator(
      id,
      user.id,
      dto.approved,
      dto.reason,
    );
  }

  // ===== Developments =====

  @Get('developments')
  listDevs(@Query('status') status?: string) {
    return this.admin.listDevelopments(status);
  }

  @Get('developments/:id')
  getDev(@Param('id') id: string) {
    return this.admin.getDevelopment(id);
  }

  @Get('developments/:id/on-chain')
  getDevOnChain(@Param('id') id: string) {
    return this.admin.getOnChainSnapshot(id);
  }

  // ===== Multisig =====

  @Get('proposals')
  listProposals(
    @Query('status') status?: string,
    @Query('developmentId') developmentId?: string,
  ) {
    return this.multisig.list({ status, developmentId });
  }

  @Get('proposals/:id')
  oneProposal(@Param('id') id: string) {
    return this.multisig.getById(id);
  }

  @Get('proposals/:id/signing-message')
  signingMessage(@Param('id') id: string) {
    return this.multisig.getSigningMessage(id);
  }

  @Post('proposals')
  createProposal(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProposalDto,
  ) {
    return this.multisig.create({
      developmentId: dto.developmentId,
      action: dto.action,
      description: dto.description,
      payload: dto.payload,
      proposedBy: user.id,
    });
  }

  @Post('proposals/:id/sign')
  sign(@Param('id') id: string, @Body() dto: SignProposalDto) {
    return this.multisig.sign(id, {
      walletAddress: dto.walletAddress,
      signature: dto.signature,
      message: dto.message,
    });
  }

  // ===== Owner Wallets =====

  @Get('owner-wallets')
  listOwnerWallets() {
    return this.multisig.listOwnerWallets();
  }

  @Post('owner-wallets')
  addOwnerWallet(@Body() body: { walletAddress: string; label?: string }) {
    return this.multisig.addOwnerWallet(body.walletAddress, body.label);
  }

  @Post('owner-wallets/remove')
  removeOwnerWallet(@Body() body: { walletAddress: string }) {
    return this.multisig.removeOwnerWallet(body.walletAddress);
  }
}
