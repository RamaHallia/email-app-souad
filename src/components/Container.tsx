import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

export default function Container({ className, ...props }: ComponentProps<'section'>) {
    return (
        <section
            className={cn('container mx-auto', className)}
            {...props}
        />
    );
}