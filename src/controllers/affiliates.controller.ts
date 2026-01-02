import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AffiliatedService } from '../services/affiliated.service';
import {
  RegisterUserDto,
  SyncAffiliateDto,
  SyncTransfersDto,
  ConfirmContractDto,
  MakeStatsPaymentDto,
  SendContractPendingDto,
  MakeContractDto,
  GetAffiliatedStatsDto,
} from '../dtos/affiliate.dto';

@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatedService: AffiliatedService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.affiliatedService.registerUser(
      registerUserDto.userId,
      registerUserDto.country,
    );
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncAffiliate(@Body() syncAffiliateDto: SyncAffiliateDto) {
    return this.affiliatedService.syncAffiliate(
      syncAffiliateDto.userId,
      syncAffiliateDto.affiliateCode,
    );
  }

  @Post('sync-transfers')
  @HttpCode(HttpStatus.OK)
  async syncTransfers(@Body() syncTransfersDto: SyncTransfersDto) {
    return this.affiliatedService.syncTransfers(syncTransfersDto.userId);
  }

  @Get('stats/:userId')
  async getAffiliatedStats(@Param('userId') userId: string) {
    return this.affiliatedService.getAffiliatedStats(userId);
  }

  @Post('payment/stats')
  @HttpCode(HttpStatus.OK)
  async makeStatsPayment(@Body() makeStatsPaymentDto: MakeStatsPaymentDto) {
    return this.affiliatedService.makeStatsPayment(makeStatsPaymentDto.userId);
  }

  @Post('contract/send')
  @HttpCode(HttpStatus.OK)
  async sendContractPending(
    @Body() sendContractPendingDto: SendContractPendingDto,
  ) {
    return this.affiliatedService.sendContractPendingToAffiliate(
      sendContractPendingDto.userId,
    );
  }

  @Post('contract/create')
  @HttpCode(HttpStatus.CREATED)
  async makeContract(@Body() makeContractDto: MakeContractDto) {
    return this.affiliatedService.adminMakeContract(makeContractDto.userId);
  }

  @Post('contract/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmContract(@Body() confirmContractDto: ConfirmContractDto) {
    return this.affiliatedService.confirmContract(
      confirmContractDto.userId,
      confirmContractDto.contractId,
      confirmContractDto.code,
      confirmContractDto.paymentMethod,
    );
  }
}
