export interface PaymentRequest {
  recipientName: string;
  recipientUpiId: string;
  amount: number;
  note?: string;
  bankAccount: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  referenceNumber: string;
  timestamp: string;
  errorMessage?: string;
}

export async function processUpiPayment(request: PaymentRequest): Promise<PaymentResult> {
  // Simulate network roundtrip with bank NPCI / UPI switch
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const txnNum = Math.floor(1000000000 + Math.random() * 9000000000);
  const refNum = `UPI/${txnNum}/${request.recipientName.substring(0, 4).toUpperCase()}`;

  return {
    success: true,
    transactionId: `TXN_${Date.now()}`,
    referenceNumber: refNum,
    timestamp: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}
