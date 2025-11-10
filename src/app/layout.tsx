import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Roboto, Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from './providers';

export const thunder = localFont({
    src: [
        {
            path: './(fonts)/thunder-lc.ttf',
            weight: '500',
            style: 'normal',
        },
        {
            path: './(fonts)/thunder-mediumlc.ttf',
            weight: '600',
            style: 'normal',
        },
    ],
    variable: '--font-thunder',
    display: 'swap',
});

export const roboto = Roboto({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600'],
    variable: '--font-roboto',
});

export const inter = Inter({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-inter',
});
export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title: {
        default: 'Automatic Email - Gestion Intelligente de vos Emails',
        template: '%s | Automatic Email'
    },
   
    description: 'Solution de tri automatique et intelligent de vos emails. Gagnez du temps avec notre système de classification automatique des emails professionnels.',
    keywords: ['tri email', 'gestion email', 'email automatique', 'organisation email', 'productivité'],
    authors: [{ name: 'Hallia' }],
    creator: 'Hallia',
    publisher: 'Hallia',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'fr_FR',
        url: 'https://votre-domaine.com',
        siteName: 'Automatic Email',
        title: 'Automatic Email - Gestion Intelligente de vos Emails',
        description: 'Solution de tri automatique et intelligent de vos emails.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Automatic Email',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Automatic Email',
        description: 'Solution de tri automatique et intelligent de vos emails.',
        images: ['/twitter-image.jpg'],
        creator: '@votre_compte',
    },
    verification: {
        google: 'votre-code-verification-google',
    },
    alternates: {
        canonical: 'https://votre-domaine.com',
    },
    icons: {
        icon: '/icon.svg',
        // shortcut: '/favicon-16x16.png', // Fichier manquant - décommenter quand disponible
        // apple: '/apple-touch-icon.png', // Fichier manquant - décommenter quand disponible
    },
    manifest: '/site.webmanifest',
    // JSON-LD via metadata
    other: {
        'script:ld+json': JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Automatic Email',
            description: 'Solution de tri automatique et intelligent de vos emails',
            url: 'https://votre-domaine.com',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
        }),
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body className={`${thunder.variable} ${roboto.variable} ${inter.variable} antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}