import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  AffiliatedStatsResponse as _affiliates_AffiliatedStatsResponse,
  AffiliatedStatsResponse__Output as _affiliates_AffiliatedStatsResponse__Output,
} from './affiliates/AffiliatedStatsResponse';
import type {
  AffiliatesServiceClient as _affiliates_AffiliatesServiceClient,
  AffiliatesServiceDefinition as _affiliates_AffiliatesServiceDefinition,
} from './affiliates/AffiliatesService';
import type {
  ConfirmContractRequest as _affiliates_ConfirmContractRequest,
  ConfirmContractRequest__Output as _affiliates_ConfirmContractRequest__Output,
} from './affiliates/ConfirmContractRequest';
import type {
  ConfirmContractResponse as _affiliates_ConfirmContractResponse,
  ConfirmContractResponse__Output as _affiliates_ConfirmContractResponse__Output,
} from './affiliates/ConfirmContractResponse';
import type {
  Contract as _affiliates_Contract,
  Contract__Output as _affiliates_Contract__Output,
} from './affiliates/Contract';
import type {
  ContractResponse as _affiliates_ContractResponse,
  ContractResponse__Output as _affiliates_ContractResponse__Output,
} from './affiliates/ContractResponse';
import type {
  GetAffiliatedStatsRequest as _affiliates_GetAffiliatedStatsRequest,
  GetAffiliatedStatsRequest__Output as _affiliates_GetAffiliatedStatsRequest__Output,
} from './affiliates/GetAffiliatedStatsRequest';
import type {
  MakeContractRequest as _affiliates_MakeContractRequest,
  MakeContractRequest__Output as _affiliates_MakeContractRequest__Output,
} from './affiliates/MakeContractRequest';
import type {
  MakeStatsPaymentRequest as _affiliates_MakeStatsPaymentRequest,
  MakeStatsPaymentRequest__Output as _affiliates_MakeStatsPaymentRequest__Output,
} from './affiliates/MakeStatsPaymentRequest';
import type {
  PaymentResponse as _affiliates_PaymentResponse,
  PaymentResponse__Output as _affiliates_PaymentResponse__Output,
} from './affiliates/PaymentResponse';
import type {
  RegisterUserRequest as _affiliates_RegisterUserRequest,
  RegisterUserRequest__Output as _affiliates_RegisterUserRequest__Output,
} from './affiliates/RegisterUserRequest';
import type {
  Stats as _affiliates_Stats,
  Stats__Output as _affiliates_Stats__Output,
} from './affiliates/Stats';
import type {
  SyncAffiliateRequest as _affiliates_SyncAffiliateRequest,
  SyncAffiliateRequest__Output as _affiliates_SyncAffiliateRequest__Output,
} from './affiliates/SyncAffiliateRequest';
import type {
  SyncAffiliateResponse as _affiliates_SyncAffiliateResponse,
  SyncAffiliateResponse__Output as _affiliates_SyncAffiliateResponse__Output,
} from './affiliates/SyncAffiliateResponse';
import type {
  SyncTransfersRequest as _affiliates_SyncTransfersRequest,
  SyncTransfersRequest__Output as _affiliates_SyncTransfersRequest__Output,
} from './affiliates/SyncTransfersRequest';
import type {
  SyncTransfersResponse as _affiliates_SyncTransfersResponse,
  SyncTransfersResponse__Output as _affiliates_SyncTransfersResponse__Output,
} from './affiliates/SyncTransfersResponse';
import type {
  Transfer as _affiliates_Transfer,
  Transfer__Output as _affiliates_Transfer__Output,
} from './affiliates/Transfer';
import type {
  UserRegistrationResponse as _affiliates_UserRegistrationResponse,
  UserRegistrationResponse__Output as _affiliates_UserRegistrationResponse__Output,
} from './affiliates/UserRegistrationResponse';
import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from './google/protobuf/Timestamp';

type SubtypeConstructor<
  Constructor extends new (...args: any) => any,
  Subtype,
> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  affiliates: {
    AffiliatedStatsResponse: MessageTypeDefinition<
      _affiliates_AffiliatedStatsResponse,
      _affiliates_AffiliatedStatsResponse__Output
    >;
    AffiliatesService: SubtypeConstructor<
      typeof grpc.Client,
      _affiliates_AffiliatesServiceClient
    > & { service: _affiliates_AffiliatesServiceDefinition };
    ConfirmContractRequest: MessageTypeDefinition<
      _affiliates_ConfirmContractRequest,
      _affiliates_ConfirmContractRequest__Output
    >;
    ConfirmContractResponse: MessageTypeDefinition<
      _affiliates_ConfirmContractResponse,
      _affiliates_ConfirmContractResponse__Output
    >;
    Contract: MessageTypeDefinition<
      _affiliates_Contract,
      _affiliates_Contract__Output
    >;
    ContractResponse: MessageTypeDefinition<
      _affiliates_ContractResponse,
      _affiliates_ContractResponse__Output
    >;
    GetAffiliatedStatsRequest: MessageTypeDefinition<
      _affiliates_GetAffiliatedStatsRequest,
      _affiliates_GetAffiliatedStatsRequest__Output
    >;
    MakeContractRequest: MessageTypeDefinition<
      _affiliates_MakeContractRequest,
      _affiliates_MakeContractRequest__Output
    >;
    MakeStatsPaymentRequest: MessageTypeDefinition<
      _affiliates_MakeStatsPaymentRequest,
      _affiliates_MakeStatsPaymentRequest__Output
    >;
    PaymentResponse: MessageTypeDefinition<
      _affiliates_PaymentResponse,
      _affiliates_PaymentResponse__Output
    >;
    RegisterUserRequest: MessageTypeDefinition<
      _affiliates_RegisterUserRequest,
      _affiliates_RegisterUserRequest__Output
    >;
    Stats: MessageTypeDefinition<_affiliates_Stats, _affiliates_Stats__Output>;
    SyncAffiliateRequest: MessageTypeDefinition<
      _affiliates_SyncAffiliateRequest,
      _affiliates_SyncAffiliateRequest__Output
    >;
    SyncAffiliateResponse: MessageTypeDefinition<
      _affiliates_SyncAffiliateResponse,
      _affiliates_SyncAffiliateResponse__Output
    >;
    SyncTransfersRequest: MessageTypeDefinition<
      _affiliates_SyncTransfersRequest,
      _affiliates_SyncTransfersRequest__Output
    >;
    SyncTransfersResponse: MessageTypeDefinition<
      _affiliates_SyncTransfersResponse,
      _affiliates_SyncTransfersResponse__Output
    >;
    Transfer: MessageTypeDefinition<
      _affiliates_Transfer,
      _affiliates_Transfer__Output
    >;
    UserRegistrationResponse: MessageTypeDefinition<
      _affiliates_UserRegistrationResponse,
      _affiliates_UserRegistrationResponse__Output
    >;
  };
  google: {
    protobuf: {
      Timestamp: MessageTypeDefinition<
        _google_protobuf_Timestamp,
        _google_protobuf_Timestamp__Output
      >;
    };
  };
}
