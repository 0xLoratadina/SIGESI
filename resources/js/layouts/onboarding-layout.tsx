import AppLogoIcon from '@/components/app-logo-icon';

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8 md:px-8 md:py-12">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <AppLogoIcon className="size-7 fill-current" />
                </div>
                <h1 className="text-xl font-semibold">SIGESI</h1>
            </div>
            <div className="w-full max-w-lg">{children}</div>
        </div>
    );
}
