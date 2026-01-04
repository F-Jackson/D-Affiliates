// Original file: /workspaces/D-Affiliates/proto/affiliates.proto

import type { Stats as _affiliates_Stats, Stats__Output as _affiliates_Stats__Output } from '../affiliates/Stats';
import type { Transfer as _affiliates_Transfer, Transfer__Output as _affiliates_Transfer__Output } from '../affiliates/Transfer';
import type { Contract as _affiliates_Contract, Contract__Output as _affiliates_Contract__Output } from '../affiliates/Contract';
import type { Long } from '@grpc/proto-loader';

export interface AffiliatedStatsResponse {
  'success'?: (boolean);
  'message'?: (string);
  'affiliate_code'?: (string);
  'status'?: (string);
  'stats'?: (_affiliates_Stats | null);
  'transfers'?: (_affiliates_Transfer)[];
  'next_payment'?: (number | string | Long);
  'contracts'?: (_affiliates_Contract)[];
  'number_of_affiliates'?: (number);
}

export interface AffiliatedStatsResponse__Output {
  'success': (boolean);
  'message': (string);
  'affiliate_code': (string);
  'status': (string);
  'stats': (_affiliates_Stats__Output | null);
  'transfers': (_affiliates_Transfer__Output)[];
  'next_payment': (string);
  'contracts': (_affiliates_Contract__Output)[];
  'number_of_affiliates': (number);
}
