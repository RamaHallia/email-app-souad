'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Marquee } from './ui/marquee';

const testimonials = [
  {
    name: 'Julie P.',
    role: 'Banque',
    image: '/assets/img/profil-julie.png',
    text: 'La société HALL-IA a réalisé un CRM sur mesure, avec un déploiement extrêmement rapide. L’outil, connecté à l’intelligence artificielle, est ergonomique, performant et a transformé ma gestion de la relation client. Une équipe professionnelle et réactive que je recommande vivement !',
  },
  {
    name: 'Benjamin G.',
    role: 'Opticien chez Optical center',
    image: '/assets/img/profil-benjamin.png',
    text: 'Je recommande vivement la solution mail développée par HALL-IA. Grâce à cette technologie d’intelligence artificielle, mes mails sont désormais triés et mes réponses automatisées, ce qui a transformé ma gestion quotidienne et m’a fait gagner un temps considérable. Une solution performante et intelligente, soutenue par une équipe professionnelle et réactive.',
  },
  {
    name: 'André S.',
    role: 'Plombier',
    image: '/assets/img/profil-andrée.webp',
    text: 'Le chatbot intelligent déployé sur mon site est connecté à une base de connaissances évolutive et offre des réponses précises et efficaces à mes prospects et clients. Un outil performant qui améliore nettement la relation client !',
  },
  {
    name: 'Alexandre H.',
    role: 'Expert comptable',
    image: '/assets/img/person1.png',
    text: 'J’utilise désormais l’agent Réunion développé par HALL-IA, et c’est bluffant ! Il enregistre automatiquement mes réunions clients, rédige un compte rendu clair, structuré et précis, et génère les tâches à effectuer avec une pertinence incroyable.',
  },
  {
    name: 'Sophie M.',
    role: "Gérante d'agence immobilière",
    image: '/assets/img/person2.webp',
    text: "L'agent développé par HALL-IA analyse automatiquement les demandes entrantes et les qualifie en temps réel. Fini les heures passées à trier les prospects ! La solution s'intègre parfaitement à nos outils existants et nous fait gagner une efficacité remarquable. Une vraie révolution pour notre activité.",
  },
  {
    name: 'Thomas D.',
    role: 'Avocat',
    image: '/assets/img/person3.jpg',
    text: "HALL-IA a développé un assistant IA qui analyse mes documents juridiques et extrait automatiquement les informations clés. Le gain de temps est spectaculaire, et la précision de l'analyse est impressionnante. L'équipe a su comprendre les spécificités de mon métier et adapter la solution en conséquence. Je recommande sans hésitation !",
  },
];



function Testimonial({
  name,
  role,
  image,
  text,
}: Readonly<{
  name: string;
  role: string;
  image: string;
  text: string;
}>) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <article
      className="group flex w-[350px] flex-shrink-0 flex-col items-center text-center transition-all hover:scale-105 lg:w-[470px]"
      aria-labelledby={`testimonial-${name.replaceAll(/\s+/g, '-').toLowerCase()}`}
    >
      <div
        className="relative z-10 mt-2 -mb-8 h-16 w-16 overflow-hidden rounded-full bg-[#DBD8D5]"
        aria-hidden="true"
      >
        <Image
          src={image}
          alt={`Portrait de ${name}`}
          fill
          className="object-centers h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <figure
        className="mb-10 flex flex-col items-center justify-center gap-6 rounded-xl border bg-white p-8 shadow-lg hover:cursor-pointer lg:p-10"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-label={
          isExpanded ? `Réduire le témoignage de ${name}` : `Lire le témoignage complet de ${name}`
        }
      >
        <figcaption className="text-lg">
          <h3
            id={`testimonial-${name.replaceAll(/\s+/g, '-').toLowerCase()}`}
            className="font-semibold text-[#FF9A34]"
          >
            {name}
          </h3>
          <p className="text-[#191918]">{role}</p>
        </figcaption>

        <blockquote className="relative overflow-hidden text-[#858381]">
          <p
            className={`transition-all duration-500 ease-in-out ${
              isExpanded ? 'max-h-[500px]' : 'max-h-24'
            }`}
          >
            {text}
          </p>
          <div
            className={`pointer-events-none absolute right-0 bottom-0 left-0 h-8 bg-gradient-to-t from-white to-transparent transition-opacity duration-500 ${
              isExpanded ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          ></div>
        </blockquote>
      </figure>
    </article>
  );
}

export default function TestimonialCarousel() {
  return (
    <section className="w-full" aria-labelledby="testimonials-heading" role="region">
      <h2 id="testimonials-heading" className="sr-only">
        Nos clients en parlent
      </h2>

      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
        {/* Gradient gauche */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/4 bg-gradient-to-r from-[#F9F7F5] to-transparent" />

        {/* Gradient droite */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/4 bg-gradient-to-l from-[#F9F7F5] to-transparent" />

        {/* Marquee avec les témoignages */}
        <Marquee pauseOnHover className="[--duration:40s] [--gap:2.5rem]">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}