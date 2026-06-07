import BrandLogo from '@/components/layout/BrandLogo';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthBrandHeaderProps {
    title?: string;
    description?: string;
}

export default function AuthBrandHeader({ title, description }: AuthBrandHeaderProps) {
    return (
        <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
                <BrandLogo variant="auth" />
            </div>
            {title ? <CardTitle className="text-2xl">{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
    );
}

export { AuthBrandHeader };
