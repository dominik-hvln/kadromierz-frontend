import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type BrandLogoVariant = 'auth' | 'sidebar' | 'header';

const variantClass: Record<BrandLogoVariant, string> = {
    auth: 'h-10 w-auto',
    sidebar: 'h-8 w-auto',
    header: 'h-7 w-auto',
};

interface BrandLogoProps {
    variant?: BrandLogoVariant;
    href?: string;
    className?: string;
}

export default function BrandLogo({ variant = 'sidebar', href, className }: BrandLogoProps) {
    const img = (
        <Image
            src="/logo-horizontal.png"
            alt="Effixy"
            width={320}
            height={80}
            priority={variant === 'auth'}
            className={cn(variantClass[variant], className)}
        />
    );

    if (href) {
        return (
            <Link href={href} className="inline-flex items-center shrink-0">
                {img}
            </Link>
        );
    }

    return <div className="inline-flex items-center shrink-0">{img}</div>;
}

export { BrandLogo };
