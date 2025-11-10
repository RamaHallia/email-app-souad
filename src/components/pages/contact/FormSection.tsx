

'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { ComponentProps, useState, FormEvent } from 'react';
import * as motion from 'motion/react-client';
import { submitContactForm, ContactFormData } from './action';
import emailjs from '@emailjs/browser';

export default function FormSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    subjects: [],
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev: ContactFormData) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s: string) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const sendEmail = async (data: ContactFormData) => {
    try {
      emailjs.init({
        publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
        limitRate: {
          throttle: 10000,
        },
      });

      const response = await emailjs.send('service_49forb8', 'template_6uisj68', data);
      console.log('Email envoyé ✅', response);
    } catch (error) {
      console.error('Erreur EmailJS ❌', error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      // Validation basique
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setSubmitStatus({
          type: 'error',
          message: 'Veuillez remplir tous les champs obligatoires',
        });
        setIsSubmitting(false);
        return;
      }

      if (formData.subjects.length === 0) {
        setSubmitStatus({
          type: 'error',
          message: 'Veuillez sélectionner au moins un sujet',
        });
        setIsSubmitting(false);
        return;
      }

      // Soumettre le formulaire
      const result = await submitContactForm(formData);

      if (result.success) {
        // Envoyer l'email après l'insertion en DB
        await sendEmail(formData);

        setSubmitStatus({
          type: 'success',
          message: 'Votre demande a été envoyée avec succès ! Nous vous recontacterons bientôt.',
        });
        
        // Réinitialiser le formulaire
        setFormData({
          firstName: '',
          lastName: '',
          company: '',
          email: '',
          phone: '',
          subjects: [],
          message: '',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Une erreur est survenue',
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Une erreur inattendue est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="font-roboto flex min-h-screen w-full flex-col items-center justify-center gap-6 px-12 pt-32 pb-16 max-md:min-h-[1300px] xl:flex-row xl:justify-between xl:px-28"
      aria-labelledby="contact-heading"
    >
      <motion.div
        className="w-full space-y-8 xl:w-1/2"
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 10, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="flex max-w-[700px] flex-col gap-6 text-sm">
          <div
            className="flex w-fit items-center gap-2 rounded-full bg-[#FEFDFD] px-3 py-1 shadow-sm"
            role="status"
            aria-label="Statut de disponibilité"
          >
            <span className="relative flex size-3" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-lime-500" />
            </span>
            <span>Spécialisé en PME</span>
          </div>

          <h1 className="font-thunder text-7xl font-semibold" id="contact-heading">
            Commençons à travailler ensemble
          </h1>

          <p className="text-base">
            Chez HALL-IA, nous développons des solutions intelligentes pour automatiser chaque
            domaine de votre entreprise
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <fieldset className="space-y-2">
            <legend className="sr-only">Informations personnelles et professionnelles</legend>

            <div className="max-md:space-y-2 md:flex md:gap-2">
              <div className="flex w-full items-center gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <label htmlFor="lastName" className="sr-only">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  className="w-full bg-white focus:ring-0 focus:outline-none"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  aria-required="true"
                  autoComplete="family-name"
                />
              </div>

              <div className="flex w-full items-center gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <label htmlFor="firstName" className="sr-only">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Prénom"
                  className="w-full bg-white focus:ring-0 focus:outline-none"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  aria-required="true"
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className="flex w-full items-center gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="gray"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M10 12h4" />
                <path d="M10 8h4" />
                <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
                <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
              </svg>
              <label htmlFor="company" className="sr-only">
                Société
              </label>
              <input
                id="company"
                name="company"
                type="text"
                placeholder="Société"
                className="w-full bg-white focus:ring-0 focus:outline-none"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                autoComplete="organization"
              />
            </div>

            <div className="max-md:space-y-2 md:flex md:gap-2">
              <div className="flex w-full items-center gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                </svg>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="w-full bg-white focus:ring-0 focus:outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  aria-required="true"
                  autoComplete="email"
                  aria-describedby="email-format"
                />
              </div>
              <span id="email-format" className="sr-only">
                Format attendu : exemple@domaine.fr
              </span>

              <div className="flex w-full items-center gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="gray"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
                </svg>
                <label htmlFor="phone" className="sr-only">
                  Téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Téléphone"
                  className="w-full bg-white focus:ring-0 focus:outline-none"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  autoComplete="tel"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="after:ml-1 after:text-red-500 after:content-['*']">
              Quels sujets vous intéressent ?
            </legend>
            <div
              className="flex flex-col gap-2"
              role="group"
              aria-label="Sélection des sujets d'intérêt"
            >
              <Subject
                title="Je souhaite avoir des informations générales"
                isSelected={formData.subjects.includes('Informations générales')}
                onToggle={() => handleSubjectToggle('Informations générales')}
              />
              <div className="flex flex-col gap-2 md:flex-row">
                <div className="w-full space-y-2">
                  <Subject
                    title="Automatisation"
                    src={'/assets/svg/hallia-purple-logo.svg'}
                    isSelected={formData.subjects.includes('Automatisation')}
                    onToggle={() => handleSubjectToggle('Automatisation')}
                  />
                  <Subject
                    title="Agent IA"
                    src={'/assets/svg/hallia-red-logo.svg'}
                    isSelected={formData.subjects.includes('Agent IA')}
                    onToggle={() => handleSubjectToggle('Agent IA')}
                  />
                </div>
                <div className="w-full space-y-2">
                  <Subject
                    title="Audit"
                    src={'/assets/svg/hallia-blue-logo.svg'}
                    isSelected={formData.subjects.includes('Audit')}
                    onToggle={() => handleSubjectToggle('Audit')}
                  />
                  <Subject
                    title="Formations"
                    src={'/assets/svg/hallia-green-logo.svg'}
                    isSelected={formData.subjects.includes('Formations')}
                    onToggle={() => handleSubjectToggle('Formations')}
                  />
                </div>
              </div>
            </div>
            {formData.subjects.length === 0 && (
              <p id="subjects-error" className="sr-only" role="alert">
                Veuillez sélectionner au moins un sujet
              </p>
            )}
          </fieldset>

          <div className="flex w-full gap-2 border border-[#F4F1EE] bg-white px-3 py-2.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="gray"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
              <path d="M12 11h.01" />
              <path d="M16 11h.01" />
              <path d="M8 11h.01" />
            </svg>
            <label htmlFor="message" className="sr-only">
              Informations complémentaires
            </label>
            <textarea
              id="message"
              name="message"
              placeholder="Informations complémentaires"
              className="h-20 w-full resize-y bg-white focus:ring-0 focus:outline-none"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              aria-required="true"
            />
          </div>

          {submitStatus.type && (
            <div
              role="alert"
              aria-live="polite"
              className={`rounded-md p-4 text-sm ${
                submitStatus.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {submitStatus.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || formData.subjects.length === 0}
            className={`w-full rounded-full bg-gradient-to-br from-[#F35F4F] to-[#FFAD5A] py-2.5 text-white transition-all hover:scale-95 ${
              isSubmitting || formData.subjects.length === 0
                ? 'cursor-not-allowed opacity-50 hover:scale-100'
                : ''
            }`}
            aria-disabled={isSubmitting || formData.subjects.length === 0}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
          </button>
        </form>
      </motion.div>

      <motion.aside
        className="relative hidden w-1/2 justify-center overflow-hidden rounded-lg bg-[#DBD8D5] text-white xl:flex"
        initial={{ x: 10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -10, opacity: 0 }}
        transition={{ duration: 0.5 }}
        aria-label="Témoignage du fondateur"
      >
        <img
          src="/assets/img/stand-person.png"
          alt="Personne debout représentant l'équipe HALL-IA"
          width={530}
          height={800}
          loading="lazy"
        />

        <div className="absolute top-0 left-0 flex items-center gap-2 p-7">
          <img
            src="/assets/svg/hallia-black-logo.svg"
            alt="Logo HALL-IA"
            width={42}
            height={42}
            loading="lazy"
          />
          <img
            src="/assets/svg/hallia-letter-picture-logo.svg"
            alt="HALL-IA"
            width={70}
            height={30}
            loading="lazy"
          />
        </div>

        <div
          className="absolute inset-x-0 bottom-0 z-[5] h-1/2 bg-gradient-to-t from-black/60 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30%]"
          style={{
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          aria-hidden="true"
        />

        <blockquote className="absolute bottom-0 z-10 space-y-6 p-7 font-semibold">
          <p className="w-[95%] text-2xl">
            L'IA n'est pas une solution unique. C'est un ensemble d'outils complémentaires, chacun
            résolvant un enjeu précis. L'audit vous guide. L'automatisation vous libère. L'agent
            vous donne l'expertise. Le sur-mesure crée votre avantage. Ensemble, ils transforment
            votre entreprise.
          </p>
          <footer>
            <cite className="not-italic">
              <p>Ilan</p>
              <p className="font-medium">Fondateur et CEO</p>
            </cite>
          </footer>
        </blockquote>
      </motion.aside>
    </section>
  );
}

function Subject({
  src,
  title,
  isSelected,
  onToggle,
  ...props
}: Readonly<{
  src?: string;
  title: string;
  isSelected: boolean;
  onToggle: () => void;
  props?: ComponentProps<'button'>;
}>) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-md bg-[#FEFDFD] px-4 py-2 transition-all',
        'hover:cursor-pointer hover:shadow-sm',
        'focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none',
        isSelected && 'bg-transparent ring-2 ring-black',
      )}
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Désélectionner' : 'Sélectionner'} ${title}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {src && <Image src={src} width={36} height={36} alt="" aria-hidden="true" loading="lazy" />}
        <span className="text-left">{title}</span>
      </span>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(
          'flex-shrink-0 transition-colors',
          isSelected ? 'text-black' : 'text-gray-400',
        )}
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="10" />
        {isSelected ? (
          <path d="m9 12 2 2 4-4" />
        ) : (
          <>
            <path d="M8 12h8" />
            <path d="M12 8v8" />
          </>
        )}
      </svg>
    </button>
  );
}