import React, { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'whatsapp' | 'outline-dark' | 'outline-gold' | 'secondary';
  fullWidth?: boolean;
  href?: string;
  external?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  href,
  external = false,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-sans font-medium text-sm rounded-[4px] px-6 py-3 transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-deep-maroon text-warm-ivory hover:bg-[#4e0c19] border border-transparent',
    whatsapp: 'bg-whatsapp-green text-white hover:bg-[#20ba56] border border-transparent',
    'outline-dark': 'bg-transparent text-warm-ivory border border-warm-ivory hover:bg-warm-ivory/10',
    'outline-gold': 'bg-transparent text-antique-gold border border-antique-gold hover:bg-antique-gold/10',
    secondary: 'bg-[#EDE4D4] text-[#1A110A] hover:bg-[#e2d5bf] border border-transparent',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const classes = `${baseStyles} ${variants[variant]} ${widthStyle} ${className}`;

  if (href) {
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
