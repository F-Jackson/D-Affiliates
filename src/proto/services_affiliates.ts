import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { GetUserTransfersRequest as _services_affiliates_GetUserTransfersRequest, GetUserTransfersRequest__Output as _services_affiliates_GetUserTransfersRequest__Output } from './services_affiliates/GetUserTransfersRequest';
import type { GetUserTransfersResponse as _services_affiliates_GetUserTransfersResponse, GetUserTransfersResponse__Output as _services_affiliates_GetUserTransfersResponse__Output } from './services_affiliates/GetUserTransfersResponse';
import type { ServiceAffiliatesServiceClient as _services_affiliates_ServiceAffiliatesServiceClient, ServiceAffiliatesServiceDefinition as _services_affiliates_ServiceAffiliatesServiceDefinition } from './services_affiliates/ServiceAffiliatesService';
import type { Transfer as _services_affiliates_Transfer, Transfer__Output as _services_affiliates_Transfer__Output } from './services_affiliates/Transfer';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  services_affiliates: {
    GetUserTransfersRequest: MessageTypeDefinition<_services_affiliates_GetUserTransfersRequest, _services_affiliates_GetUserTransfersRequest__Output>
    GetUserTransfersResponse: MessageTypeDefinition<_services_affiliates_GetUserTransfersResponse, _services_affiliates_GetUserTransfersResponse__Output>
    ServiceAffiliatesService: SubtypeConstructor<typeof grpc.Client, _services_affiliates_ServiceAffiliatesServiceClient> & { service: _services_affiliates_ServiceAffiliatesServiceDefinition }
    Transfer: MessageTypeDefinition<_services_affiliates_Transfer, _services_affiliates_Transfer__Output>
  }
}

