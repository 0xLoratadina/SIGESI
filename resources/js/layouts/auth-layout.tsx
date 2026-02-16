import AuthSplitLayout from '@/layouts/auth/auth-split-layout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <AuthSplitLayout>{children}</AuthSplitLayout>;
}
