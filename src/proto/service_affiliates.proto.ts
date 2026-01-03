export interface GetUserTransfersRequest {
  user_id: string;
}

export interface GetUserTransfersResponse {
  transfers: ExternalTransfer[];
}

export interface ExternalTransfer {
  id: string;
  amount: number;
  created_at: number;
  type: string;
  direction: string;
  product_name?: string;
  commission_rate?: number;
}
