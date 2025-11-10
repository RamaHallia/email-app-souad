import React from "react";

import { MacbookScroll } from "@/components/ui/macbook-scroll";

export function MacbookScrollSection() {
    return (
        <div className="relative w-full overflow-hidden dark:bg-[#0B0B0F]">
            {/* ✅ Conteneur relatif pour positionner les cartes */}
            <div className="relative w-full">
                <MacbookScroll
                    badge={
                        <a href="https://peerlist.io/manuarora">
                            <Badge className="h-10 w-10 -rotate-12 transform" />
                        </a>
                    }
                    src={`assets/videos/hallia-hero-video.webm`}
                    isVideo={true}
                    showGradient={false}
                />

                {/* ✅ Carte en haut à droite de l'écran du MacBook */}
                <div className="absolute max-xl:right-[0%] xl:top-[10%] xl:right-[15%] md:top-[20%] z-20 border rounded-2xl flex w-90 py-3 px-6 items-center gap-3 backdrop-blur-md shadow-lg animate-fade-in">
                    <span className="font-roboto text-3xl font-semibold">
                        95%
                    </span>
                    <span className="font-roboto">
                        <p className="font-semibold">De précision</p>
                        <p className="text-sm text-gray-600">
                        Au lieu d'écrire des emails manuellement, notre IA suggère des réponses appropriées. Bénéficiez d'un gain de temps moyen de 95%.
                        </p>
                    </span>
                </div>

                {/* ✅ Carte en bas à gauche de l'écran du MacBook */}
                <div className="absolute lg:left-[0%] top-[20%] xl:left-[15%] md:top-[30%] z-20 border rounded-2xl flex w-90 py-3 px-6 items-center gap-3 shadow-lg backdrop-blur-md  animate-fade-in">
                <span className="font-roboto text-3xl font-semibold">
                        98%
                    </span>
                    <span className="font-roboto">
                        <p className="font-semibold">De précision</p>
                        <p className="text-sm text-gray-600">
                            Nos modèles d'IA uniques atteignent jusqu'à 98% de précision dans la classification des emails entrants.
                        </p>
                    </span>
                </div>
            </div>
        </div>
    );
}

// Peerlist logo
const Badge = ({ className }: { className?: string }) => {
    return (
        <img src="/assets/logos/logo-hallia.png" alt="Hallia Logo" className="w-5 h-5" />
    );
};