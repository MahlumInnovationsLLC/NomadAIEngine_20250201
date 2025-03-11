import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  heading: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  description,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', className)} {...props}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
        {description && (
          <p className="text-muted-foreground max-w-[750px]">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}