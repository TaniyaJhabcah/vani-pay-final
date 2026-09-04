export type NavTab = 'home' | 'wallet' | 'insights' | 'settings';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  handle: string;
  avatar: string;
  upiId: string;
  phone: string;
  primaryBank: string;
  balance: number;
}

export interface Contact {
  id: string;
  name: string;
  upiId: string;
  phone: string;
  avatar: string;
  recentAmount?: number;
  note?: string;
  verified: boolean;
}

export type TransactionType = 'send' | 'receive' | 'bill' | 'investment';
export type TransactionStatus = 'completed' | 'pending' | 'failed';

export interface Transaction {
  id: string;
  title: string;
  recipientOrSender: string;
  upiId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  time: string;
  category: string;
  iconName: string;
  method: string;
  referenceId: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'Savings' | 'Current' | 'UPI Lite';
  balance: number;
  isPrimary: boolean;
  colorScheme: string;
  logoInitial: string;
}

export type VoiceState =
  | 'idle'
  | 'speaking'
  | 'listening'
  | 'processing'
  | 'verifying'
  | 'confirming'
  | 'authorizing'
  | 'success'
  | 'error';

export type VoiceDebugEvent =
  | 'TTS_STARTED'
  | 'TTS_ENDED'
  | 'MIC_REQUESTED'
  | 'MIC_STARTED'
  | 'MIC_RESULT'
  | 'MIC_ERROR'
  | 'MIC_ENDED';

export interface VoiceDebugLog {
  id: string;
  timestamp: string;
  event: VoiceDebugEvent;
  details?: string;
  isError?: boolean;
}

export interface ParsedVoiceCommand {
  intent:
    | 'send_money'
    | 'check_balance'
    | 'show_transactions'
    | 'pay_bill'
    | 'confirm_payment'
    | 'cancel'
    | 'navigate'
    | 'unknown';
  amount?: number;
  recipientName?: string;
  billType?: string;
  targetView?: NavTab;
  confidence: number;
  rawText: string;
}

export interface VoicePaymentDraft {
  recipient: Contact;
  amount: number;
  note: string;
  debitAccount: BankAccount;
  step: 'confirm' | 'authorize' | 'success';
}
