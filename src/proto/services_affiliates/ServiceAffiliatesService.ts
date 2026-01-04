// Original file: /workspaces/D-Affiliates/proto/services_affiliates.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetUserTransfersRequest as _services_affiliates_GetUserTransfersRequest, GetUserTransfersRequest__Output as _services_affiliates_GetUserTransfersRequest__Output } from '../services_affiliates/GetUserTransfersRequest';
import type { GetUserTransfersResponse as _services_affiliates_GetUserTransfersResponse, GetUserTransfersResponse__Output as _services_affiliates_GetUserTransfersResponse__Output } from '../services_affiliates/GetUserTransfersResponse';

export interface ServiceAffiliatesServiceClient extends grpc.Client {
  GetUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  GetUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  GetUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  GetUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  getUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  getUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, metadata: grpc.Metadata, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  getUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, options: grpc.CallOptions, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  getUserTransfers(argument: _services_affiliates_GetUserTransfersRequest, callback: grpc.requestCallback<_services_affiliates_GetUserTransfersResponse__Output>): grpc.ClientUnaryCall;
  
}

export interface ServiceAffiliatesServiceHandlers extends grpc.UntypedServiceImplementation {
  GetUserTransfers: grpc.handleUnaryCall<_services_affiliates_GetUserTransfersRequest__Output, _services_affiliates_GetUserTransfersResponse>;
  
}

export interface ServiceAffiliatesServiceDefinition extends grpc.ServiceDefinition {
  GetUserTransfers: MethodDefinition<_services_affiliates_GetUserTransfersRequest, _services_affiliates_GetUserTransfersResponse, _services_affiliates_GetUserTransfersRequest__Output, _services_affiliates_GetUserTransfersResponse__Output>
}
