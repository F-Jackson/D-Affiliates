import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AffiliatedService } from '../services/affiliated.service';
import {
  AdminChangeTransferStatusDto,
  AdminConfirmContractDto,
  PaginatedAffiliatesResponseDto,
  SendContractPendingDto,
  TransferStatusResponseDto,
} from '../dtos/affiliate.dto';
import { ConfigService } from '@nestjs/config';

@Controller('admin/affiliates')
export class AdminController {
  constructor(
    private readonly affiliatedService: AffiliatedService,
    private readonly configService: ConfigService,
  ) {}

  validateApiKey(apiKey: string): void {
    const expectedApiKey = this.configService.get<string>(
      'ADMIN_AFFILIATES_API_KEY',
    );

    if (!apiKey) {
      throw new Error('API-Key is required');
    }

    if (apiKey !== expectedApiKey) {
      throw new Error('Invalid API-Key');
    }
  }

  @Get('list')
  async getAffiliatesList(
    @Query('page') page: number = 1,
    @Headers('x-api-key') apiKey: string,
  ): Promise<PaginatedAffiliatesResponseDto> {
    this.validateApiKey(apiKey);

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
  async getAffiliatedStats(
    @Param('userId') userId: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey);

    return this.affiliatedService.adminGetAffiliatedStats(userId);
  }

  @Post('transfers/status')
  @HttpCode(HttpStatus.OK)
  async changeTransferStatus(
    @Body() adminChangeTransferStatusDto: AdminChangeTransferStatusDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<TransferStatusResponseDto> {
    this.validateApiKey(apiKey);

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
  async makeContract(
    @Body('userId') userId: string,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey);

    return this.affiliatedService.adminMakeContract(userId);
  }

  @Post('contract/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmContract(
    @Body() adminConfirmContractDto: AdminConfirmContractDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey);

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
    @Headers('x-api-key') apiKey: string,
  ) {
    this.validateApiKey(apiKey);

    return this.affiliatedService.adminSendContractPendingToAffiliate(
      sendContractPendingDto.userId,
    );
  }
}
