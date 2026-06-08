import Link from 'next/link';
import { cn } from '@/lib/utils';
import EffixyLogoHorizontal from '@/components/layout/EffixyLogoHorizontal';

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
    inverted?: boolean;
}

export default function BrandLogo({ variant = 'sidebar', href, className, inverted }: BrandLogoProps) {
    const logo = (
        <EffixyLogoHorizontal
            inverted={inverted}
            className={cn(variantClass[variant], className)}
        />
    );

    if (href) {
        return (
            <Link href={href} className="inline-flex items-center shrink-0">
                {logo}
            </Link>
        );
    }

    return <div className="inline-flex items-center shrink-0">{logo}</div>;
}

export { BrandLogo };
