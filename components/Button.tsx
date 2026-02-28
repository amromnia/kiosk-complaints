import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'warning' | 'info' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'btn-info',
    success: 'btn-success',
    ghost: 'btn-ghost',
  };

  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const classes = ['btn', variants[variant], sizes[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
