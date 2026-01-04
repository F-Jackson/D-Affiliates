// Original file: /workspaces/D-Affiliates/proto/affiliates.proto

import type { Long } from '@grpc/proto-loader';

export interface Contract {
  contract_id?: string;
  status?: string;
  amount?: number | string;
  confirmed_at?: number | string | Long;
  platform?: string;
  tax_amount?: number | string;
  transaction_ids?: string[];
}

export interface Contract__Output {
  contract_id: string;
  status: string;
  amount: number;
  confirmed_at: string;
  platform: string;
  tax_amount: number;
  transaction_ids: string[];
}
