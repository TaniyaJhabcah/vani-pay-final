import React from 'react';
import { FaceAuthentication } from './FaceAuthentication';

interface FaceAuthorizationViewProps {
  onSuccess: () => void;
  onCancel: () => void;
  recipientName?: string;
  amount?: number;
}

export const FaceAuthorizationView: React.FC<FaceAuthorizationViewProps> = ({
  onSuccess,
  onCancel,
  recipientName,
  amount,
}) => {
  return (
    <FaceAuthentication
      onSuccess={onSuccess}
      onCancel={onCancel}
      recipientName={recipientName}
      amount={amount}
    />
  );
};

