'use client';

import React from 'react';
import Button from './Button';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function PrimaryButton(props: PrimaryButtonProps) {
  return <Button variant="primary" {...props} />;
}
