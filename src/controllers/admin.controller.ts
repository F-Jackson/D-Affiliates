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
  AdminGetAffiliatedStatsDto,
  AdminGetAffiliatesListDto,
  PaginatedAffiliatesResponseDto,
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
}
