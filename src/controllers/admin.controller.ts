import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AffiliatedService } from '../services/affiliated.service';
import {
  AdminChangeTransferStatusDto,
  AdminConfirmContractDto,
  PaginatedAffiliatesResponseDto,
  SendContractPendingDto,
  TransferStatusResponseDto,
} from '../dtos/affiliate.dto';

@Controller('admin/affiliates')
export class AdminController {
  constructor(private readonly affiliatedService: AffiliatedService) {}

  @Get('list')
  async getAffiliatesList(
    @Query('page') page: number = 1,
  ): Promise<PaginatedAffiliatesResponseDto> {
    const result = await this.affiliatedService.adminGetAffiliatesList(page);
    return {
      affiliates: result.affiliates.map((user: any) => ({
        _id: user._id.toString(),
        affiliateCode: user.affiliateCode,
        createdAt: user.createdAt,
      })),
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalAffiliates: result.totalAffiliates,
    };
  }

  @Get('stats/:userId')
  async getAffiliatedStats(@Param('userId') userId: string) {
    return this.affiliatedService.adminGetAffiliatedStats(userId);
  }

  @Post('transfers/status')
  @HttpCode(HttpStatus.OK)
  async changeTransferStatus(
    @Body() adminChangeTransferStatusDto: AdminChangeTransferStatusDto,
  ): Promise<TransferStatusResponseDto> {
    await this.affiliatedService.adminChangeTransfer(
      adminChangeTransferStatusDto.userId,
      adminChangeTransferStatusDto.transferId,
      {
        failedReason: adminChangeTransferStatusDto.failedReason || '',
        success: adminChangeTransferStatusDto.success,
        detail: adminChangeTransferStatusDto.detail,
      },
    );

    return {
      message: 'Transferência atualizada com sucesso',
      transferId: adminChangeTransferStatusDto.transferId,
      status: adminChangeTransferStatusDto.success ? 'completed' : 'failed',
    };
  }

  @Post('contract/make')
  @HttpCode(HttpStatus.OK)
  async makeContract(@Body('userId') userId: string) {
    return this.affiliatedService.adminMakeContract(userId);
  }

  @Post('contract/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmContract(
    @Body() adminConfirmContractDto: AdminConfirmContractDto,
  ) {
    return this.affiliatedService.adminConfirmContract(
      adminConfirmContractDto.userId,
      adminConfirmContractDto.contractId,
      adminConfirmContractDto.plataform,
      adminConfirmContractDto.taxAmount,
    );
  }

  @Post('contract/send')
  @HttpCode(HttpStatus.OK)
  async sendContractPending(
    @Body() sendContractPendingDto: SendContractPendingDto,
  ) {
    return this.affiliatedService.adminSendContractPendingToAffiliate(
      sendContractPendingDto.userId,
    );
  }
}
