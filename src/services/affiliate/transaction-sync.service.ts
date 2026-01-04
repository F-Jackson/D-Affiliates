import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import type {
  GetUserTransfersRequest,
  GetUserTransfersResponse,
  ExternalTransfer,
} from 'src/proto';

export interface AffiliatesGrpcClient {
  GetUserTransfers(
    data: GetUserTransfersRequest,
    metadata?: Metadata,
  ): Promise<GetUserTransfersResponse>;
}

@Injectable()
export class TransactionSyncService implements OnModuleInit {
  private affiliatesGrpcClient: AffiliatesGrpcClient;

  constructor(
    @Inject('SERVICES_AFFILIATES_PACKAGE') private readonly client: ClientGrpc,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.affiliatesGrpcClient = this.client.getService<AffiliatesGrpcClient>(
      'ServiceAffiliatesService',
    );
  }

  private createMetadata(): Metadata {
    const apiKey =
      this.configService.get<string>('SERVICES_AFFILIATES_API_KEY') || 'X';

    const metadata = new Metadata();
    metadata.set('idempotency-key', uuidv4());
    metadata.set('x-api-key', apiKey);

    return metadata;
  }

  async fetchExternalTransactions(
    affiliateIds: string[],
  ): Promise<ExternalTransfer[]> {
    const allTransfers: ExternalTransfer[] = [];

    for (const affiliateId of affiliateIds) {
      const response = await this.affiliatesGrpcClient.GetUserTransfers(
        {
          user_id: affiliateId,
        },
        this.createMetadata(),
      );

      if (response.transfers) {
        allTransfers.push(
          ...response.transfers.map((tx) => ({
            id: tx.id || '',
            userId: affiliateId,
            amount: typeof tx.amount === 'number' ? tx.amount : 0,
            created_at: typeof tx.created_at === 'number' ? tx.created_at : 0,
            type: tx.type || '',
            direction: tx.direction || '',
            product_name: tx.product_name,
            commission_rate: typeof tx.commission_rate === 'number' ? tx.commission_rate : undefined,
          })),
        );
      }
    }

    return allTransfers;
  }
}
