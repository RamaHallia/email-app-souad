import Container from "../../Container";
import ItemCarousel, { ListItem } from "../../ItemCaroussel";

const sampleVideoItems: ListItem[] = [
    {
        id: '1',
        title: "Réception Email",
        description:
            'Nouvel email dans votre boite',
        videoUrl: '/assets/img/mails.png',
        alt: "Interface de tri automatique d'emails par IA - Gestion intelligente de boîte mail professionnelle",
        keywords: [
            'tri emails automatique',
            'gestion boîte mail IA',
            'filtrage emails intelligent',
            'automatisation messagerie',
            'productivité email',
        ],
        category: 'Communication et Messagerie',
    },
    {
        id: '2',
        title: 'Chatbot WhatsApp Business',
        description:
            'Chatbot conversationnel intelligent à intégrer sur votre site internet et WhatsApp pour automatiser les réponses clients 24/7.',
        videoUrl: '/assets/img/whatsapp.png',
        alt: 'Chatbot WhatsApp IA - Automatisation des conversations clients sur messagerie instantanée',
        keywords: [
            'chatbot WhatsApp',
            'bot conversationnel',
            'automatisation WhatsApp Business',
            'réponse automatique client',
            'service client IA',
        ],
        category: 'Relation Client',
    },
    {
        id: '3',
        title: 'Transcription et résumé de réunions',
        description:
            'Enregistrement automatique des réunions avec transcription et génération de comptes-rendus intelligents par IA.',
        videoUrl: '/assets/img/reunion.png',
        alt: 'Outil IA de transcription de réunions - Résumé automatique et compte-rendu intelligent',
        keywords: [
            'transcription réunion IA',
            'compte-rendu automatique',
            'résumé meeting',
            'prise de notes automatique',
            'productivité réunion',
        ],
        category: 'Productivité et Collaboration',
    },
    // {
    //   id: '4',
    //   title: 'Prospection LinkedIn automatisée',
    //   description:
    //     'Connecté à votre LinkedIn, cet outil génère et envoie des messages vidéo personnalisés aux prospects en adaptant automatiquement le contenu selon leur profil.',
    //   keywords: [
    //     'prospection LinkedIn IA',
    //     'automatisation prospection',
    //     'messages personnalisés',
    //     'génération leads',
    //     'social selling automatique',
    //   ],
    //   category: 'Commercial et Marketing',
    // },
    {
        id: '5',
        title: 'Gestion automatique des factures',
        description:
            "Automatisez la création de vos factures, les relances clients, l'archivage légal et le suivi comptable complet.",
        videoUrl: '/assets/img/facture.png',
        alt: 'Système automatisé de gestion de factures - Création, relance et suivi comptable par IA',
        keywords: [
            'facturation automatique',
            'relance facture IA',
            'gestion comptable automatisée',
            'suivi paiements',
            'automatisation administrative',
        ],
        category: 'Comptabilité et Finance',
    },
];



export default function HowItWorkSection() {


    return (
        <section className="flex flex-col items-center">

            <h2 className="font-thunder font-black text-7xl mb-16 text-center lg:mt-10">Comment ça marche ?</h2>
            <p className="font-roboto  text-2xl mb-20">4 étapes simple pour une intégration réussie</p>

            <Container>
                <ItemCarousel
                    items={sampleVideoItems}
                    brandColor='#F27732'
                />
            </Container>

        </section>
    )

}