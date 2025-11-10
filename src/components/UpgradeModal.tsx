'use client';

import { useState } from 'react';
import { X, Star, Users, Check, CreditCard, AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UpgradeModalProps {
    onClose: () => void;
    onUpgrade: () => void;
    currentAdditionalAccounts?: number;
}

export function UpgradeModal({ onClose, onUpgrade, currentAdditionalAccounts = 0 }: UpgradeModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const newAdditionalAccounts = currentAdditionalAccounts + 1;
    const newTotal = 29 + (newAdditionalAccounts * 19);
    const prorataAmount = Math.round((19 / 30) * (30 - new Date().getDate()));

    const handleInitialClick = () => {
        setShowConfirmation(true);
    };

    const handleUpgradeClick = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert('Vous devez être connecté');
                return;
            }

            console.log('Session token:', session.access_token.substring(0, 20) + '...');
            console.log('Anon key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-add-account-checkout`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                        'X-Client-Info': 'supabase-js',
                        'Apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    },
                }
            );

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            const data = await response.json();

            if (data.error) {
                alert(`Erreur: ${data.error}`);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Erreur lors de la création du checkout:', error);
            alert('Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in font-inter">
                    <div className="bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <CheckCircle className="w-10 h-10 text-orange-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-center mb-2">Upgrade réussi !</h2>
                            <p className="text-center text-orange-50 text-sm">Votre abonnement a été mis à jour</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                <CreditCard className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-900">Paiement effectué</p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Votre carte a été débitée
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <Mail className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900">Compte additionnel activé</p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        Vous pouvez maintenant ajouter un compte email supplémentaire
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <Star className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900">Compte additionnel activé</p>
                                    <p className="text-xs text-orange-700 mt-1">
                                        Vous pouvez maintenant gérer un compte email supplémentaire
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                onClose();
                            }}
                            className="group relative w-full inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] px-4 py-3 font-medium text-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl"
                        >
                            <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-2">
                                Continuer
                            </span>
                            <svg
                                className="relative z-10 h-5 w-5 -translate-x-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full font-inter">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Confirmer l'upgrade</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-orange-900 mb-2">
                                        Paiement automatique
                                    </p>
                                    <p className="text-xs text-orange-800 leading-relaxed">
                                        En cliquant sur "Confirmer et payer", votre carte bancaire enregistrée sera immédiatement débitée de 19€ HT pour votre compte additionnel.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <CreditCard className="w-5 h-5 text-gray-600" />
                                    <p className="text-sm font-semibold text-gray-900">Détails de facturation</p>
                                </div>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div className="flex justify-between">
                                        <span>Compte additionnel :</span>
                                        <span className="font-semibold">19€ HT/mois</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Renouvellement automatique chaque mois
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    Vous obtiendrez immédiatement :
                                </p>
                                <ul className="text-xs text-green-800 space-y-1 ml-6">
                                    <li>• 1 compte email supplémentaire</li>
                                    <li>• Tri automatique illimité</li>
                                    <li>• Réponses automatiques IA</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                            >
                                Retour
                            </button>
                            <button
                                onClick={handleUpgradeClick}
                                disabled={isLoading}
                                className="group relative flex-1 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] px-4 py-3 font-medium text-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">
                                    {isLoading ? 'Traitement...' : 'Confirmer et payer'}
                                </span>
                                {!isLoading && (
                                    <svg
                                        className="relative z-10 h-5 w-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full font-inter">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Upgrade requis</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">

                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] flex items-center justify-center shadow-md">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Compte additionnel</h3>
                                <p className="text-sm text-gray-600">+19€ HT / mois</p>
                            </div>
                        </div>

                        <p className="text-gray-700 mb-6">
                            Vous avez atteint la limite de votre plan actuel. Pour ajouter un deuxième compte email,
                            vous devez créer un abonnement pour une entreprise.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-orange-600" />
                                Ce qui est inclus :
                            </h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">Un compte email supplémentaire</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">Tri automatique illimité</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-gray-700">Réponses automatiques IA</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Coût du compte additionnel</p>
                                    <p className="text-xs text-gray-600 mt-1">Facturé mensuellement</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-orange-600">19€</p>
                                    <p className="text-xs text-gray-600">HT/mois</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleInitialClick}
                            className="group relative flex-1 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] px-4 py-3 font-medium text-white shadow-lg transition-all duration-300 ease-out hover:shadow-xl"
                        >
                            <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">
                                Continuer
                            </span>
                            <svg
                                className="relative z-10 h-5 w-5 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}