// Original file: /workspaces/D-Affiliates/proto/affiliates.proto

import type { Long } from '@grpc/proto-loader';

export interface Stats {
  total_earnings?: number | string;
  total_withdrawn?: number | string;
  pending_withdrawals?: number | string;
  number_of_affiliates?: number;
  total_earnings_last_month?: number | string;
  updated_at?: number | string | Long;
}

export interface Stats__Output {
  total_earnings: number;
  total_withdrawn: number;
  pending_withdrawals: number;
  number_of_affiliates: number;
  total_earnings_last_month: number;
  updated_at: string;
}
