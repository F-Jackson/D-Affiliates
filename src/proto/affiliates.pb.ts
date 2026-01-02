/* eslint-disable */
import { GrpcMethod } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export const protobufPackage = 'affiliates';

export interface RegisterUserRequest {
  userId: string;
  country: string;
}

export interface SyncAffiliateRequest {
  userId: string;
  affiliateCode: string;
}

export interface SyncTransfersRequest {
  userId: string;
}

export interface GetAffiliatedStatsRequest {
  userId: string;
}

export interface MakeStatsPaymentRequest {
  userId: string;
}

export interface MakeContractRequest {
  userId: string;
}

export interface ConfirmContractRequest {
  userId: string;
  contractId: string;
  code: string;
  paymentMethod: string;
}

export interface UserRegistrationResponse {
  affiliateCode: string;
}

export interface SyncAffiliateResponse {
  success: boolean;
  message: string;
}

export interface SyncTransfersResponse {
  success: boolean;
  message: string;
}

export interface AffiliatedStatsResponse {
  userId: string;
  totalEarnings: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  numberOfAffiliates: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  transactionId: string;
}

export interface ContractResponse {
  contractId: string;
  status: string;
  message: string;
}

export interface ConfirmContractResponse {
  success: boolean;
  message: string;
  contractId: string;
}

export const AFFILIATES_SERVICE_NAME = 'AffiliatesService';

export const AffiliatesServiceClient = Symbol('AffiliatesService');

export interface AffiliatesServiceClient {
  registerUser(
    request: RegisterUserRequest,
  ): Observable<UserRegistrationResponse>;
  syncAffiliate(
    request: SyncAffiliateRequest,
  ): Observable<SyncAffiliateResponse>;
  syncTransfers(
    request: SyncTransfersRequest,
  ): Observable<SyncTransfersResponse>;
  getAffiliatedStats(
    request: GetAffiliatedStatsRequest,
  ): Observable<AffiliatedStatsResponse>;
  makeStatsPayment(
    request: MakeStatsPaymentRequest,
  ): Observable<PaymentResponse>;
  makeContract(request: MakeContractRequest): Observable<ContractResponse>;
  confirmContract(
    request: ConfirmContractRequest,
  ): Observable<ConfirmContractResponse>;
}

export interface AffiliatesServiceServer {
  registerUser(
    request: RegisterUserRequest,
  ): Promise<UserRegistrationResponse> | UserRegistrationResponse;
  syncAffiliate(
    request: SyncAffiliateRequest,
  ): Promise<SyncAffiliateResponse> | SyncAffiliateResponse;
  syncTransfers(
    request: SyncTransfersRequest,
  ): Promise<SyncTransfersResponse> | SyncTransfersResponse;
  getAffiliatedStats(
    request: GetAffiliatedStatsRequest,
  ): Promise<AffiliatedStatsResponse> | AffiliatedStatsResponse;
  makeStatsPayment(
    request: MakeStatsPaymentRequest,
  ): Promise<PaymentResponse> | PaymentResponse;
  makeContract(
    request: MakeContractRequest,
  ): Promise<ContractResponse> | ContractResponse;
  confirmContract(
    request: ConfirmContractRequest,
  ): Promise<ConfirmContractResponse> | ConfirmContractResponse;
}

export function registerAffiliatesService(
  target: any,
  methodName: string,
  descriptor: PropertyDescriptor,
) {
  GrpcMethod('AffiliatesService', methodName)(target, methodName, descriptor);
}
