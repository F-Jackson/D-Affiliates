// Original file: /workspaces/D-Affiliates/proto/affiliates.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  AffiliatedStatsResponse as _affiliates_AffiliatedStatsResponse,
  AffiliatedStatsResponse__Output as _affiliates_AffiliatedStatsResponse__Output,
} from '../affiliates/AffiliatedStatsResponse';
import type {
  ConfirmContractRequest as _affiliates_ConfirmContractRequest,
  ConfirmContractRequest__Output as _affiliates_ConfirmContractRequest__Output,
} from '../affiliates/ConfirmContractRequest';
import type {
  ConfirmContractResponse as _affiliates_ConfirmContractResponse,
  ConfirmContractResponse__Output as _affiliates_ConfirmContractResponse__Output,
} from '../affiliates/ConfirmContractResponse';
import type {
  ContractResponse as _affiliates_ContractResponse,
  ContractResponse__Output as _affiliates_ContractResponse__Output,
} from '../affiliates/ContractResponse';
import type {
  GetAffiliatedStatsRequest as _affiliates_GetAffiliatedStatsRequest,
  GetAffiliatedStatsRequest__Output as _affiliates_GetAffiliatedStatsRequest__Output,
} from '../affiliates/GetAffiliatedStatsRequest';
import type {
  MakeContractRequest as _affiliates_MakeContractRequest,
  MakeContractRequest__Output as _affiliates_MakeContractRequest__Output,
} from '../affiliates/MakeContractRequest';
import type {
  MakeStatsPaymentRequest as _affiliates_MakeStatsPaymentRequest,
  MakeStatsPaymentRequest__Output as _affiliates_MakeStatsPaymentRequest__Output,
} from '../affiliates/MakeStatsPaymentRequest';
import type {
  PaymentResponse as _affiliates_PaymentResponse,
  PaymentResponse__Output as _affiliates_PaymentResponse__Output,
} from '../affiliates/PaymentResponse';
import type {
  RegisterUserRequest as _affiliates_RegisterUserRequest,
  RegisterUserRequest__Output as _affiliates_RegisterUserRequest__Output,
} from '../affiliates/RegisterUserRequest';
import type {
  SyncAffiliateRequest as _affiliates_SyncAffiliateRequest,
  SyncAffiliateRequest__Output as _affiliates_SyncAffiliateRequest__Output,
} from '../affiliates/SyncAffiliateRequest';
import type {
  SyncAffiliateResponse as _affiliates_SyncAffiliateResponse,
  SyncAffiliateResponse__Output as _affiliates_SyncAffiliateResponse__Output,
} from '../affiliates/SyncAffiliateResponse';
import type {
  SyncTransfersRequest as _affiliates_SyncTransfersRequest,
  SyncTransfersRequest__Output as _affiliates_SyncTransfersRequest__Output,
} from '../affiliates/SyncTransfersRequest';
import type {
  SyncTransfersResponse as _affiliates_SyncTransfersResponse,
  SyncTransfersResponse__Output as _affiliates_SyncTransfersResponse__Output,
} from '../affiliates/SyncTransfersResponse';
import type {
  UserRegistrationResponse as _affiliates_UserRegistrationResponse,
  UserRegistrationResponse__Output as _affiliates_UserRegistrationResponse__Output,
} from '../affiliates/UserRegistrationResponse';

export interface AffiliatesServiceClient extends grpc.Client {
  ConfirmContract(
    argument: _affiliates_ConfirmContractRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  ConfirmContract(
    argument: _affiliates_ConfirmContractRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  ConfirmContract(
    argument: _affiliates_ConfirmContractRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  ConfirmContract(
    argument: _affiliates_ConfirmContractRequest,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  confirmContract(
    argument: _affiliates_ConfirmContractRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  confirmContract(
    argument: _affiliates_ConfirmContractRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  confirmContract(
    argument: _affiliates_ConfirmContractRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  confirmContract(
    argument: _affiliates_ConfirmContractRequest,
    callback: grpc.requestCallback<_affiliates_ConfirmContractResponse__Output>,
  ): grpc.ClientUnaryCall;

  GetAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  GetAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;
  getAffiliatedStats(
    argument: _affiliates_GetAffiliatedStatsRequest,
    callback: grpc.requestCallback<_affiliates_AffiliatedStatsResponse__Output>,
  ): grpc.ClientUnaryCall;

  MakeContract(
    argument: _affiliates_MakeContractRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeContract(
    argument: _affiliates_MakeContractRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeContract(
    argument: _affiliates_MakeContractRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeContract(
    argument: _affiliates_MakeContractRequest,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeContract(
    argument: _affiliates_MakeContractRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeContract(
    argument: _affiliates_MakeContractRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeContract(
    argument: _affiliates_MakeContractRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeContract(
    argument: _affiliates_MakeContractRequest,
    callback: grpc.requestCallback<_affiliates_ContractResponse__Output>,
  ): grpc.ClientUnaryCall;

  MakeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  MakeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;
  makeStatsPayment(
    argument: _affiliates_MakeStatsPaymentRequest,
    callback: grpc.requestCallback<_affiliates_PaymentResponse__Output>,
  ): grpc.ClientUnaryCall;

  RegisterUser(
    argument: _affiliates_RegisterUserRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  RegisterUser(
    argument: _affiliates_RegisterUserRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  RegisterUser(
    argument: _affiliates_RegisterUserRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  RegisterUser(
    argument: _affiliates_RegisterUserRequest,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  registerUser(
    argument: _affiliates_RegisterUserRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  registerUser(
    argument: _affiliates_RegisterUserRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  registerUser(
    argument: _affiliates_RegisterUserRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;
  registerUser(
    argument: _affiliates_RegisterUserRequest,
    callback: grpc.requestCallback<_affiliates_UserRegistrationResponse__Output>,
  ): grpc.ClientUnaryCall;

  SyncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncAffiliate(
    argument: _affiliates_SyncAffiliateRequest,
    callback: grpc.requestCallback<_affiliates_SyncAffiliateResponse__Output>,
  ): grpc.ClientUnaryCall;

  SyncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  SyncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    metadata: grpc.Metadata,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    options: grpc.CallOptions,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
  syncTransfers(
    argument: _affiliates_SyncTransfersRequest,
    callback: grpc.requestCallback<_affiliates_SyncTransfersResponse__Output>,
  ): grpc.ClientUnaryCall;
}

export interface AffiliatesServiceHandlers
  extends grpc.UntypedServiceImplementation {
  ConfirmContract: grpc.handleUnaryCall<
    _affiliates_ConfirmContractRequest__Output,
    _affiliates_ConfirmContractResponse
  >;

  GetAffiliatedStats: grpc.handleUnaryCall<
    _affiliates_GetAffiliatedStatsRequest__Output,
    _affiliates_AffiliatedStatsResponse
  >;

  MakeContract: grpc.handleUnaryCall<
    _affiliates_MakeContractRequest__Output,
    _affiliates_ContractResponse
  >;

  MakeStatsPayment: grpc.handleUnaryCall<
    _affiliates_MakeStatsPaymentRequest__Output,
    _affiliates_PaymentResponse
  >;

  RegisterUser: grpc.handleUnaryCall<
    _affiliates_RegisterUserRequest__Output,
    _affiliates_UserRegistrationResponse
  >;

  SyncAffiliate: grpc.handleUnaryCall<
    _affiliates_SyncAffiliateRequest__Output,
    _affiliates_SyncAffiliateResponse
  >;

  SyncTransfers: grpc.handleUnaryCall<
    _affiliates_SyncTransfersRequest__Output,
    _affiliates_SyncTransfersResponse
  >;
}

export interface AffiliatesServiceDefinition extends grpc.ServiceDefinition {
  ConfirmContract: MethodDefinition<
    _affiliates_ConfirmContractRequest,
    _affiliates_ConfirmContractResponse,
    _affiliates_ConfirmContractRequest__Output,
    _affiliates_ConfirmContractResponse__Output
  >;
  GetAffiliatedStats: MethodDefinition<
    _affiliates_GetAffiliatedStatsRequest,
    _affiliates_AffiliatedStatsResponse,
    _affiliates_GetAffiliatedStatsRequest__Output,
    _affiliates_AffiliatedStatsResponse__Output
  >;
  MakeContract: MethodDefinition<
    _affiliates_MakeContractRequest,
    _affiliates_ContractResponse,
    _affiliates_MakeContractRequest__Output,
    _affiliates_ContractResponse__Output
  >;
  MakeStatsPayment: MethodDefinition<
    _affiliates_MakeStatsPaymentRequest,
    _affiliates_PaymentResponse,
    _affiliates_MakeStatsPaymentRequest__Output,
    _affiliates_PaymentResponse__Output
  >;
  RegisterUser: MethodDefinition<
    _affiliates_RegisterUserRequest,
    _affiliates_UserRegistrationResponse,
    _affiliates_RegisterUserRequest__Output,
    _affiliates_UserRegistrationResponse__Output
  >;
  SyncAffiliate: MethodDefinition<
    _affiliates_SyncAffiliateRequest,
    _affiliates_SyncAffiliateResponse,
    _affiliates_SyncAffiliateRequest__Output,
    _affiliates_SyncAffiliateResponse__Output
  >;
  SyncTransfers: MethodDefinition<
    _affiliates_SyncTransfersRequest,
    _affiliates_SyncTransfersResponse,
    _affiliates_SyncTransfersRequest__Output,
    _affiliates_SyncTransfersResponse__Output
  >;
}
