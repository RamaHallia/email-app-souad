'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import AppNavbar from '@/components/layout/AppNavbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            console.log('❌ Non connecté, redirection vers /login');
            router.push('/auth/login');
        } else if (user) {
            console.log('✅ Utilisateur connecté:', user.email);
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <AppNavbar />
            <main className="container mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}