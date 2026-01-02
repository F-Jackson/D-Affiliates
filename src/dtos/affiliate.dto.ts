import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  IsDate,
} from 'class-validator';

// ========== PUBLIC ENDPOINTS DTOS ==========

export class RegisterUserDto {
  @IsString()
  userId: string;

  @IsString()
  country: string;
}

export class SyncAffiliateDto {
  @IsString()
  userId: string;

  @IsString()
  affiliateCode: string;
}

export class ConfirmContractDto {
  @IsString()
  userId: string;

  @IsString()
  contractId: string;

  @IsString()
  code: string;

  @IsEnum(['bank_transfer', 'paypal', 'crypto'])
  paymentMethod: 'bank_transfer' | 'paypal' | 'crypto';
}

export class MakeStatsPaymentDto {
  @IsString()
  userId: string;
}

export class SendContractPendingDto {
  @IsString()
  userId: string;
}

export class MakeContractDto {
  @IsString()
  userId: string;
}

export class SyncTransfersDto {
  @IsString()
  userId: string;
}

export class GetAffiliatedStatsDto {
  @IsString()
  userId: string;
}

// ========== ADMIN ENDPOINTS DTOS ==========

export class AdminChangeTransferStatusSuccessDto {
  @IsString()
  paymentProofUrl: string;

  @IsOptional()
  @IsString()
  internalPaymentProofUrl?: string;

  @IsDate()
  completedDate: Date;
}

export class AdminChangeTransferStatusDto {
  @IsString()
  userId: string;

  @IsString()
  transferId: string;

  @IsOptional()
  @IsString()
  failedReason?: string;

  @IsOptional()
  success?: AdminChangeTransferStatusSuccessDto;

  @IsOptional()
  @IsString()
  detail?: string;
}

export class AdminGetAffiliatedStatsDto {
  @IsString()
  userId: string;
}

export class AdminGetAffiliatesListDto {
  @IsNumber()
  page: number = 1;
}

// ========== RESPONSE DTOS ==========

export class AffiliateSummaryDto {
  @IsString()
  _id: string;

  @IsString()
  affiliateCode: string;

  @IsDate()
  createdAt: Date;
}

export class PaginatedAffiliatesResponseDto {
  affiliates: AffiliateSummaryDto[];
  currentPage: number;
  totalPages: number;
  totalAffiliates: number;
}

export class TransferStatusResponseDto {
  message: string;
  transferId: string;
  status: 'completed' | 'failed';
}

export class UserRegistrationResponseDto {
  _id: string;
  userId: string;
  affiliateCode: string;
  status: string;
  createdAt: Date;
}
