'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, TrendingUp, Filter, Clock, RefreshCw, Check, MailIcon } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { OnboardingModal } from '@/components/OnBoardingModal';

type TimePeriod = 'today' | 'week' | 'month';

interface EmailStats {
    emailsRepondus: number;
    emailsTries: number;
    publicitiesFiltrees: number;
    emailsRepondusHier: number;
    emailsTriesHier: number;
    publicitiesHier: number;
    emailsInfo: number;
    emailsInfoHier: number;
}

interface EmailAccount {
    id: string;
    email: string;
    provider: 'gmail' | 'outlook' | 'smtp_imap';
    is_classement: boolean;
    company_name?: string | null;
    is_active?: boolean;
    cancel_at_period_end?: boolean;
    subscription_status?: string;
}

export default function Dashboard() {
    const { user } = useAuth();
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
    const [stats, setStats] = useState<EmailStats>({
        emailsRepondus: 0,
        emailsTries: 0,
        publicitiesFiltrees: 0,
        emailsRepondusHier: 0,
        emailsTriesHier: 0,
        publicitiesHier: 0,
        emailsInfo: 0,
        emailsInfoHier: 0,
    });
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [isClassementActive, setIsClassementActive] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    const [autoSort, setAutoSort] = useState(false);
    const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
    const [hasEverHadSubscription, setHasEverHadSubscription] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');

    useEffect(() => {
        if (user?.id) {
            loadAccounts();
            checkOnboardingStatus();
            checkSubscription();
        }
    }, [user?.id]);

    useEffect(() => {
        if (user?.id && selectedEmail) {
            loadStats();
        }
    }, [user?.id, timePeriod, selectedEmail]);

    const checkSubscription = async () => {
        if (!user) return;

        try {
            const { data: allSubs } = await supabase
                .from('stripe_user_subscriptions')
                .select('subscription_type, status, cancel_at_period_end, current_period_end')
                .eq('user_id', user.id)
                .is('deleted_at', null);

            const hasAnySubscription = (allSubs?.length || 0) > 0;
            setHasEverHadSubscription(hasAnySubscription);

            const premierSub = allSubs?.find(s =>
                s.subscription_type === 'premier' &&
                ['active', 'trialing'].includes(s.status)
            );

            const isActive = !!premierSub;
            setHasActiveSubscription(isActive);
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    };

    const loadAccounts = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('email_configurations')
                .select('id, email, provider, is_classement, company_name, is_active, is_connected')
                .eq('user_id', user.id)
                .eq('is_connected', true)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading accounts:', error);
                return;
            }

            // Charger les informations d'abonnement
            const { data: allSubs } = await supabase
                .from('stripe_user_subscriptions')
                .select('subscription_id, status, cancel_at_period_end, subscription_type, email_configuration_id')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            const allAccounts: EmailAccount[] = (data || []).map((acc: any) => {
                let subscriptionInfo = {};

                const configSubs = allSubs?.filter(s => s.email_configuration_id === acc.id) || [];

                const activeSub = configSubs.find(s =>
                    ['active', 'trialing'].includes(s.status)
                );

                if (activeSub) {
                    subscriptionInfo = {
                        cancel_at_period_end: activeSub.cancel_at_period_end,
                        subscription_status: activeSub.status
                    };
                }

                return {
                    id: acc.id,
                    email: acc.email,
                    provider: acc.provider as 'gmail' | 'outlook' | 'smtp_imap',
                    is_classement: acc.is_classement ?? true,
                    company_name: acc.company_name || null,
                    is_active: acc.is_active !== false,
                    ...subscriptionInfo
                };
            });

            setAccounts(allAccounts);

            // Seulement initialiser la sélection si aucun compte n'est actuellement sélectionné
            if (allAccounts.length > 0 && !selectedAccountId) {
                // Sélectionner le premier compte ACTIF (non désactivé et non en résiliation)
                const firstActiveAccount = allAccounts.find(acc => 
                    acc.is_active !== false && acc.cancel_at_period_end !== true
                );
                if (firstActiveAccount) {
                    setSelectedAccountId(firstActiveAccount.id);
                    setSelectedEmail(firstActiveAccount.email);
                    setIsClassementActive(firstActiveAccount.is_classement);
                    setAutoSort(firstActiveAccount.is_classement);
                }
            } else if (selectedAccountId) {
                // Mettre à jour l'état du compte actuellement sélectionné
                const currentAccount = allAccounts.find(acc => acc.id === selectedAccountId);
                if (currentAccount) {
                    setIsClassementActive(currentAccount.is_classement);
                    setAutoSort(currentAccount.is_classement);
                }
            }
        } catch (err) {
            console.error('Load accounts error:', err);
        }
    };

    const checkOnboardingStatus = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('is_configured, company_name, street_address, contact_email')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error checking onboarding:', error);
            return;
        }

        if (data) {
            const needsConfig = !data.is_configured ||
                !data.company_name ||
                !data.street_address ||
                !data.contact_email;

            setNeedsOnboarding(needsConfig);
            setShowOnboarding(needsConfig);
        }
    };

    const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        switch (timePeriod) {
            case 'today':
                return {
                    start: today.toISOString(),
                    end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    previousStart: yesterday.toISOString(),
                    previousEnd: today.toISOString(),
                };
            case 'week':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const previousWeekStart = new Date(weekStart);
                previousWeekStart.setDate(weekStart.getDate() - 7);
                return {
                    start: weekStart.toISOString(),
                    end: now.toISOString(),
                    previousStart: previousWeekStart.toISOString(),
                    previousEnd: weekStart.toISOString(),
                };
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return {
                    start: monthStart.toISOString(),
                    end: now.toISOString(),
                    previousStart: previousMonthStart.toISOString(),
                    previousEnd: monthStart.toISOString(),
                };
        }
    };

    const loadStats = async () => {
        if (!user?.id || !selectedEmail) return;

        setLoading(true);
        try {
            const { start, end, previousStart, previousEnd } = getDateRange();

            const { count: emailsRepondus } = await supabase
                .from('email_traite')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', start)
                .lt('created_at', end);

            const { count: emailsRepondusHier } = await supabase
                .from('email_traite')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', previousStart)
                .lt('created_at', previousEnd);

            const { count: emailsTries } = await supabase
                .from('email_info')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', start)
                .lt('created_at', end);

            const { count: emailsTriesHier } = await supabase
                .from('email_info')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', previousStart)
                .lt('created_at', previousEnd);

            const { count: publicitiesFiltrees } = await supabase
                .from('email_pub')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', start)
                .lt('created_at', end);

            const { count: publicitiesHier } = await supabase
                .from('email_pub')
                .select('*', { count: 'exact', head: true })
                .eq('email', selectedEmail)
                .gte('created_at', previousStart)
                .lt('created_at', previousEnd);

            const totalEmailsTries = (emailsRepondus || 0) + (emailsTries || 0) + (publicitiesFiltrees || 0);
            const totalEmailsTriesHier = (emailsRepondusHier || 0) + (emailsTriesHier || 0) + (publicitiesHier || 0);

            setStats({
                emailsRepondus: emailsRepondus || 0,
                emailsTries: totalEmailsTries,
                publicitiesFiltrees: publicitiesFiltrees || 0,
                emailsRepondusHier: emailsRepondusHier || 0,
                emailsTriesHier: totalEmailsTriesHier,
                publicitiesHier: publicitiesHier || 0,
                emailsInfo: emailsTries || 0,
                emailsInfoHier: emailsTriesHier || 0,
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeSaved = () => {
        const totalMinutes =
            stats.emailsRepondus * 2 +
            stats.emailsInfo * 0.5 +
            stats.publicitiesFiltrees * 0.17;

        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.round(totalMinutes % 60);

        if (hours === 0 && mins === 0) return '0m';
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    };

    const getDiffText = (current: number, previous: number) => {
        const diff = current - previous;
        if (diff === 0) return 'Aucun changement';
        const sign = diff > 0 ? '+' : '';
        const period = timePeriod === 'today' ? 'depuis hier' : 'vs période précédente';
        return `${sign}${diff} ${period}`;
    };

    const handleToggleAutoSort = async () => {
        if (!user || !selectedEmail || !selectedAccountId) return;
        if (hasEverHadSubscription && !hasActiveSubscription) return;

        const newValue = !autoSort;
        setAutoSort(newValue);

        try {
            const { error } = await supabase
                .from('email_configurations')
                .update({ is_classement: newValue })
                .eq('user_id', user.id)
                .eq('email', selectedEmail);

            if (error) {
                console.error('Error updating classement:', error);
                setAutoSort(!newValue);
                return;
            }

            const { data: configData } = await supabase
                .from('email_configurations')
                .select('gmail_token_id, outlook_token_id')
                .eq('user_id', user.id)
                .eq('email', selectedEmail)
                .maybeSingle();

            if (configData?.gmail_token_id) {
                await supabase
                    .from('gmail_tokens')
                    .update({ is_classement: newValue })
                    .eq('id', configData.gmail_token_id);
            }

            setNotificationMessage(newValue ? 'Tri automatique activé' : 'Tri automatique désactivé');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);

            // Mettre à jour localement l'état du compte au lieu de tout recharger
            setAccounts(prevAccounts => 
                prevAccounts.map(acc => 
                    acc.id === selectedAccountId 
                        ? { ...acc, is_classement: newValue }
                        : acc
                )
            );
            setIsClassementActive(newValue);
        } catch (error) {
            console.error('Error toggling auto sort:', error);
            setAutoSort(!newValue);
        }
    };

    return (
        <div className="font-inter space-y-4 md:space-y-8 px-4 md:px-0 max-md:w-full">
            {/* Ajout du style pour les animations */}
            <style jsx>{`
    @keyframes spin-slow {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse-line {
        0%, 100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }

    @keyframes pulse-opacity {
        0%, 100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }

    @keyframes bounce-alert {
        0%, 100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-5px);
        }
    }

    @keyframes flow-orange {
        0% {
            background-position: 200% 0%;
        }
        100% {
            background-position: 0% 0%;
        }
    }

    .animate-spin-slow {
        animation: spin-slow 3s linear infinite;
    }

    .animate-pulse-line {
        animation: pulse-line 2s ease-in-out infinite;
    }

    .animate-pulse-opacity {
        animation: pulse-opacity 2.5s ease-in-out infinite;
    }

    .animate-bounce-alert {
        animation: bounce-alert 1s ease-in-out infinite;
    }

    .animate-flow-orange-1 {
        background: linear-gradient(90deg, 
            #FE9736 0%, 
            #FE9736 30%,
            rgba(255, 255, 255, 0.8) 40%,
            rgba(255, 255, 255, 0.9) 50%,
            rgba(255, 255, 255, 0.8) 60%,
            #FE9736 70%,
            #FE9736 100%
        );
        background-size: 200% 100%;
        animation: flow-orange 2s linear infinite;
    }

    .animate-flow-orange-2 {
        background: linear-gradient(90deg, 
            #FE9736 0%, 
            #FE9736 30%,
            rgba(255, 255, 255, 0.8) 40%,
            rgba(255, 255, 255, 0.9) 50%,
            rgba(255, 255, 255, 0.8) 60%,
            #FE9736 70%,
            #FE9736 100%
        );
        background-size: 200% 100%;
        animation: flow-orange 2s linear infinite;
        animation-delay: 1s;
    }
`}</style>

            {/* Flux de traitement */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6 ">
                    {/* Section Toggle et Informations */}
                    <div className="flex flex-col gap-6 py-6 md:py-8 px-4 md:px-6 border-gray-200 w-full lg:w-[30%] border-b lg:border-b-0 lg:border-r">
                        <div className='flex flex-col sm:flex-row justify-between gap-3'>
                            <button
                                disabled={hasEverHadSubscription && !hasActiveSubscription}
                                onClick={handleToggleAutoSort}
                                className={`relative w-14 h-8 rounded-full transition-colors ${hasEverHadSubscription && !hasActiveSubscription
                                    ? 'bg-gray-200 cursor-not-allowed'
                                    : autoSort
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${autoSort ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </button>

                            <div className="flex items-center gap-2 border rounded-md p-1">
                                <div className="relative flex items-center gap-2">
                                    {autoSort && (
                                        <>
                                            <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </>
                                    )}
                                    {!autoSort && (
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                                    )}
                                    <span className="text-sm font-medium text-gray-600">État</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${autoSort
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {autoSort ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900">Flux de traitement automatique</h3>
                            <p className="text-sm text-gray-600">Désactivable à tout moment</p>
                        </div>
                    </div>

                    {/* Section des icônes de flux */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full lg:w-[70%] py-4 md:py-6 px-4 md:px-0">
                        {/* Email Icon */}
                        <div className={`flex flex-col items-center p-3 md:p-5 bg-blue-200/50 rounded-md gap-2`}>
                            <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-transparent relative">
                                <img 
                                    src="/assets/icon/icon-email.png" 
                                    alt="Email"
                                    className={autoSort ? 'animate-pulse-opacity' : ''}
                                />
                                {autoSort && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-bounce-alert shadow-md">
                                        !
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs md:text-sm font-medium text-blue-500">Email</p>
                        </div>

                        {/* Ligne animée 1 */}
                        <div className="flex-1 py-2 md:px-2 md:py-0 max-w-[80px] md:max-w-[80px] w-full md:w-auto h-full md:h-auto min-h-[40px] md:min-h-0">
                            <div className={`w-0.5 md:w-full md:h-0.5 h-full rounded-full ${!autoSort
                                ? 'bg-gray-200'
                                : 'animate-flow-orange-1'
                                }`} />
                        </div>

                        {/* Logo IA avec rotation */}
                        <div
                            className={`flex flex-col items-center p-3 md:p-5 rounded-md gap-2 transition-opacity`}
                            style={{
                                background: !autoSort ? '#000000' : `conic-gradient(
                                    from 195.77deg at 84.44% -1.66%,
                                    #FE9736 0deg,
                                    #F4664C 76.15deg,
                                    #F97E41 197.31deg,
                                    #E3AB8D 245.77deg,
                                    #FE9736 360deg
                                )`,
                            }}
                        >
                            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-transparent`}>
                                <span className='border p-1.5 md:p-2 rounded-md'>
                                    <img 
                                        src={autoSort ? '/assets/icon/icon-actualise.png' : '/assets/icon/icon-stop.png'} 
                                        className={autoSort ? 'animate-spin-slow' : ''} 
                                        alt="IA" 
                                    />
                                </span>
                            </div>
                            <img
                                src="/assets/icon/icon-logo.png"
                                alt="Logo"
                                className={!autoSort ? 'grayscale' : ''}
                            />
                        </div>

                        {/* Ligne animée 2 */}
                        <div className="flex-1 py-2 md:px-2 md:py-0 max-w-[80px] md:max-w-[80px] w-full md:w-auto h-full md:h-auto min-h-[40px] md:min-h-0">
                            <div className={`w-0.5 md:w-full md:h-0.5 h-full rounded-full ${!autoSort
                                ? 'bg-gray-200'
                                : 'animate-flow-orange-2'
                                }`} />
                        </div>

                        {/* Traité, Pub, Info - grisés si inactif */}
                        <div className={`flex flex-col sm:flex-row gap-1.5 font-roboto transition-opacity ${!autoSort ? 'opacity-40 grayscale' : ''
                            }`}>
                            <div className="flex flex-col items-center bg-green-200/50 p-3 md:p-5 rounded-t-md sm:rounded-t-none sm:rounded-tl-md sm:rounded-bl-md gap-2">
                                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shadow-md ${!autoSort
                                    ? 'bg-gray-300'
                                    : 'bg-white'
                                    }`}>
                                    <img src="assets/icon/icon-check.png" alt="Check" />
                                </div>
                                <p className="mt-1 text-xs md:text-sm font-medium text-green-500">Traîté</p>
                            </div>
                            <div className="flex flex-col items-center bg-red-200/50 p-3 md:p-5 gap-2">
                                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shadow-md ${!autoSort
                                    ? 'bg-gray-300'
                                    : 'bg-white'
                                    }`}>
                                    <img src="/assets/icon/icon-close.png" alt="Croix" />
                                </div>
                                <p className="mt-1 text-xs md:text-sm font-medium text-red-500">Pub</p>
                            </div>
                            <div className="flex flex-col items-center bg-blue-200/50 p-3 md:p-5 rounded-b-md sm:rounded-b-none sm:rounded-tr-md sm:rounded-br-md gap-2">
                                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center shadow-md ${!autoSort
                                    ? 'bg-gray-300'
                                    : 'bg-white'
                                    }`}>
                                    <img src="/assets/icon/icon-info.png" alt="Info" />
                                </div>
                                <p className="mt-1 text-xs md:text-sm font-medium text-blue-500">Info</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {accounts.length === 0 ? (
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm text-center w-full ">
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                        Aucun compte email configuré
                    </h2>
                    <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
                        Ajoutez votre premier compte email pour commencer
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm w-full ">
                    <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-6">
                        <div>
                            <label className="text-sm md:text-md font-roboto font-semibold text-gray-600 mb-2 md:mb-3 block">
                                Compte Email
                            </label>
                            <div className="flex gap-2 md:gap-3 overflow-x-auto">
                                {accounts.map(account => {
                                    const isDisabled = account.is_active === false || account.cancel_at_period_end === true;
                                    return (
                                    <button
                                        key={account.id}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            setSelectedAccountId(account.id);
                                            setSelectedEmail(account.email);
                                            setIsClassementActive(account.is_classement);
                                            setAutoSort(account.is_classement);
                                        }}
                                        disabled={isDisabled}
                                        className={` flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl font-medium transition-all flex-shrink-0 text-sm md:text-base ${
                                            isDisabled
                                                ? 'bg-gray-100 border-2 border-gray-200 opacity-50 cursor-not-allowed'
                                                : selectedAccountId === account.id
                                                ? 'bg-blue-50 border-2 border-blue-200 shadow-md'
                                                : 'bg-gray-50 border-1 border-transparent hover:border-gray-300'
                                            }`}
                                    >


                                        {/* Logo selon le type de compte */}
                                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0">
                                            {account.provider === 'gmail' ? (
                                                <img
                                                    src="/logo/logo-gmail.png"
                                                    alt="Gmail"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <MailIcon className='w-6 h-6 text-blue-600' />
                                            )}
                                        </div>

                                        <div className='flex flex-col gap-1 items-start flex-1'>
                                            <div className="flex items-center gap-2">
                                                <span>{account.company_name?.trim() || 'Nom non défini'}</span>
                                                {isDisabled && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                                        {account.cancel_at_period_end ? 'En résiliation' : 'Inactif'}
                                                    </span>
                                                )}
                                            </div>
                                            <span>{account.email}</span>

                                        </div>

                                        <div className="flex items-center">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedAccountId === account.id
                                                    ? 'border-blue-500'
                                                    : 'border-gray-300'
                                                }`}>
                                                {selectedAccountId === account.id && (
                                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                )}
                                            </div>
                                        </div>



                                    </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                            <h3 className="text-base md:text-lg font-roboto font-semibold text-black">Statistiques</h3>
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2 bg-gray-50 p-1 rounded-lg w-full md:w-auto">
                                <button
                                    onClick={() => setTimePeriod('today')}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium text-xs md:text-sm transition-all flex-1 md:flex-none ${timePeriod === 'today'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Aujourd'hui
                                </button>
                                <button
                                    onClick={() => setTimePeriod('week')}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium text-xs md:text-sm transition-all flex-1 md:flex-none ${timePeriod === 'week'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Cette semaine
                                </button>
                                <button
                                    onClick={() => setTimePeriod('month')}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md font-medium text-xs md:text-sm transition-all flex-1 md:flex-none ${timePeriod === 'month'
                                        ? 'bg-white text-black shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    Ce mois
                                </button>
                            </div>
                            <button
                                onClick={() => loadStats()}
                                disabled={loading}
                                className="group px-3 md:px-4 py-1.5 md:py-2 rounded-full font-medium text-xs md:text-sm text-white disabled:opacity-50 flex items-center gap-2 w-full md:w-auto justify-center shadow-md hover:shadow-lg transition-all duration-300"
                            style={{background:`conic-gradient(
                                    from 195.77deg at 84.44% -1.66%,
                                    #FE9736 0deg,
                                    #F4664C 76.15deg,
                                    #F97E41 197.31deg,
                                    #E3AB8D 245.77deg,
                                    #FE9736 360deg
                                )`}} >
                                <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                                Actualiser
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white border-2  rounded-xl p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm md:text-md font-inter text-black ">Temps économisé</span>
                                <img src="/assets/icon/icon-envelope.png" alt="envelope" className=" bg-gray-100/50 rounded-md p-2     " />                            </div>
                            {loading ? (
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">...</div>
                            ) : (
                                <>
                                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                        {calculateTimeSaved()}
                                    </div>
                                    <div className="text-sm md:text-md font-inter text-[#4A5565]">
                                        2 min/réponse + 30s/tri + 10s/pub
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="bg-white border-2  rounded-xl p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm md:text-md font-inter text-black">Emails répondus</span>
                                <img src="/assets/icon/icon-check.png" alt="check" className=" bg-green-200/50 rounded-md p-2 rounded-2xl" />
                            </div>
                            {loading ? (
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">...</div>
                            ) : (
                                <>
                                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                        {stats.emailsRepondus}
                                    </div>
                                    <div className={'text-sm md:text-md font-inter text-[#4A5565]'}>
                                        {getDiffText(stats.emailsRepondus, stats.emailsRepondusHier)}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white border-2 rounded-xl p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm md:text-md font-inter text-black">Emails triés</span>
                                <img src="/assets/icon/icon-close.png" alt="close" className=" bg-red-200/50 rounded-md p-2 rounded-2xl" />
                            </div>
                            {loading ? (
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">...</div>
                            ) : (
                                <>
                                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                        {stats.emailsTries}
                                    </div>
                                    <div className="text-sm md:text-md font-inter text-[#4A5565]">
                                        {getDiffText(stats.emailsTries, stats.emailsTriesHier)}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white border-2 rounded-xl p-4 md:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm md:text-md font-inter text-black">Publicités filtrées</span>
                                <img src="/assets/icon/icon-info.png" alt="info" className=" bg-blue-200/50 rounded-md p-2 rounded-2xl" />
                            </div>
                            {loading ? (
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">...</div>
                            ) : (
                                <>
                                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                        {stats.publicitiesFiltrees}
                                    </div>
                                    <div className="text-sm md:text-md font-inter text-[#4A5565]">
                                        {getDiffText(stats.publicitiesFiltrees, stats.publicitiesHier)}
                                    </div>
                                </>
                            )}
                        </div>

                        
                    </div>
                </div>
            )}

            {/* Notification toast */}
            {showNotification && (
                <div className="fixed top-4 right-2 md:right-4 left-2 md:left-auto z-50 animate-fade-in-right font-inter">
                    <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-orange-200">
                        {/* Barre latérale colorée */}
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#F35F4F] to-[#FFAD5A]" />
                        
                        {/* Contenu */}
                        <div className="pl-6 pr-6 py-4 flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                                <Check className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[3]" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm md:text-base">{notificationMessage}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Modification enregistrée</p>
                            </div>
                        </div>
                        
                        {/* Effet de brillance */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                    </div>
                </div>
            )}

            {showOnboarding && user && (
                <OnboardingModal
                    userId={user.id}
                    onComplete={() => {
                        setShowOnboarding(false);
                        setNeedsOnboarding(false);
                        checkOnboardingStatus();
                    }}
                />
            )}
        </div>
    );
}