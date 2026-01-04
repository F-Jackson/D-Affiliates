// Original file: /workspaces/D-Affiliates/proto/affiliates.proto

import type { Long } from '@grpc/proto-loader';

export interface Transfer {
  'amount'?: (number | string);
  'status'?: (string);
  'failure_reason'?: (string);
  'details'?: (string);
  'completed_date'?: (number | string | Long);
  'internal_payment_proof_url'?: (string);
  'payment_method'?: (string);
  'transfer_id'?: (string);
  'created_at'?: (number | string | Long);
  'payment_str'?: (string);
  '_failure_reason'?: "failure_reason";
  '_details'?: "details";
  '_completed_date'?: "completed_date";
  '_internal_payment_proof_url'?: "internal_payment_proof_url";
  '_payment_method'?: "payment_method";
  '_transfer_id'?: "transfer_id";
  '_created_at'?: "created_at";
  '_payment_str'?: "payment_str";
}

export interface Transfer__Output {
  'amount': (number);
  'status': (string);
  'failure_reason'?: (string);
  'details'?: (string);
  'completed_date'?: (string);
  'internal_payment_proof_url'?: (string);
  'payment_method'?: (string);
  'transfer_id'?: (string);
  'created_at'?: (string);
  'payment_str'?: (string);
}
