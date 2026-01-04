// Original file: /workspaces/D-Affiliates/proto/services_affiliates.proto

import type { Long } from '@grpc/proto-loader';

export interface Transfer {
  'id'?: (string);
  'amount'?: (number | string);
  'created_at'?: (number | string | Long);
  'type'?: (string);
  'direction'?: (string);
  'product_name'?: (string);
  'commission_rate'?: (number | string);
  '_product_name'?: "product_name";
  '_commission_rate'?: "commission_rate";
}

export interface Transfer__Output {
  'id': (string);
  'amount': (number);
  'created_at': (string);
  'type': (string);
  'direction': (string);
  'product_name'?: (string);
  'commission_rate'?: (number);
}
