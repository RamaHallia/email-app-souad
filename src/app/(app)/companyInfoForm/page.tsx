'use client';

import { useState, useEffect } from 'react';
import { Building2, FileText, Briefcase, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../../../../context/AuthContext';

interface CompanyInfo {
    company_name: string;
    activity_description: string;
    services_offered: string;
}

export default function CompanyInfoPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState<CompanyInfo>({
        company_name: '',
        activity_description: '',
        services_offered: '',
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        loadCompanyInfo();
    }, [user?.id]);

    const loadCompanyInfo = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('email_configurations')
                .select('company_name, activity_description, services_offered')
                .eq('user_id', user.id)
                .eq('provider', 'gmail')
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setFormData({
                    company_name: data.company_name || '',
                    activity_description: data.activity_description || '',
                    services_offered: data.services_offered || '',
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setInitialLoad(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.company_name.trim() || !formData.activity_description.trim() || !formData.services_offered.trim()) {
            alert('Tous les champs sont obligatoires');
            return;
        }

        setLoading(true);
        setSaved(false);

        try {
            const { error } = await supabase
                .from('email_configurations')
                .update({
                    company_name: formData.company_name,
                    activity_description: formData.activity_description,
                    services_offered: formData.services_offered,
                    is_classement: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user?.id)
                .eq('provider', 'gmail');

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            alert('Erreur lors de la sauvegarde des informations');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoad) {
        return (
            <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        <div className="h-12 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Informations de votre entreprise
                </h2>
                <p className="text-gray-600">
                    Ces informations aideront notre IA à mieux comprendre votre activité et à générer des réponses pertinentes.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Nom de l'entreprise
                    </label>
                    <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Ex: Hall IA"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Description de l'activité et vos offres ou services
                    </label>
                    <textarea
                        value={formData.activity_description}
                        onChange={(e) => setFormData({ ...formData, activity_description: e.target.value })}
                        placeholder="Décrivez brièvement votre activité, votre secteur d'activité, votre mission..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        Signature
                    </label>
                    <textarea
                        value={formData.services_offered}
                        onChange={(e) => setFormData({ ...formData, services_offered: e.target.value })}
                        placeholder="Jean DUPONT&#10;06 12 34 56 78&#10;15 rue de la Paix, 75001 Paris&#10;www.monentreprise.fr"
                        rows={4}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Enregistrer
                            </>
                        )}
                    </button>

                    {saved && (
                        <div className="flex items-center gap-2 text-green-600 animate-fade-in">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Informations enregistrées</span>
                        </div>
                    )}
                </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                    <span className="font-semibold text-gray-900">💡 Astuce :</span> Plus vos informations sont détaillées, plus l'IA pourra générer des réponses personnalisées et pertinentes pour vos clients.
                </p>
            </div>
        </div>
    );
}