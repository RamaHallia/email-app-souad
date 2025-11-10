import React from 'react';
import CustomButton from './CustomButton';

interface CardPackProps {
    title: string;
    subtitle?: string;
    features: string[];
    price: string;
    priceUnit: string;
    buttonText: string;
    buttonGradient?: string;
    topGradient?: string;
    onButtonClick?: () => void;
    buttonHref?: string;
}

export default function CardPack({
    title,
    subtitle,
    features,
    price,
    priceUnit,
    buttonText,
    buttonGradient = `conic-gradient(
    from 195.77deg at 84.44% -1.66%,
    #FE9736 0deg,
    #F4664C 76.15deg,
    #F97E41 197.31deg,
    #E3AB8D 245.77deg,
    #FE9736 360deg
  )`,
    topGradient = `radial-gradient(
    ellipse 90% 90% at 50% 0%,
    #FE9736 0%,
    #F97E41 50%,
    #F4664C 50%,
    transparent 80%
  )`,
    onButtonClick,
    buttonHref,
}: CardPackProps) {
    return (
        <div className="relative w-full lg:w-96 font-roboto flex flex-col justify-between rounded-2xl bg-white overflow-hidden">
            {/* Gradient blur en haut */}
            <div
                className="absolute -top-8 left-0 right-0 z-10 h-[200px] w-full blur-xl rounded-t-2xl pointer-events-none"
                style={{
                    background: topGradient,
                }}
            />

            {/* Section titre et features */}
            <div className="relative z-20 space-y-5 px-10 pt-30 pb-0">
                <h3 className="font-thunder text-black mb-5 text-5xl font-semibold">
                    {title}
                </h3>

                {subtitle && (
                    <p className="text-gray-400">{subtitle}</p>
                )}

                <ul className="space-y-2">
                    {features.map((feature, index) => (
                        <li key={index} className="flex gap-2">
                            <img src="/img/check.png" alt="" className="w-5 h-5" />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Ligne de séparation */}
            <div
                className="relative z-20 my-10"
                style={{
                    height: '1px',
                    backgroundImage:
                        'linear-gradient(to right, #d1d5db 0%, #d1d5db 50%, transparent 50%, transparent 100%)',
                    backgroundSize: '20px 1px',
                    backgroundRepeat: 'repeat-x',
                }}
            />

            {/* Section prix et bouton */}
            <div className="relative z-20 space-y-5 px-10 pb-10">
                <p className="text-4xl font-black font-thunder">
                    {price} <span className="text-lg font-normal">{priceUnit}</span>
                </p>

                <CustomButton
                    style={{
                        background: buttonGradient,
                    }}
                    className="w-full rounded-full!"
                    onClick={onButtonClick}
                    href={buttonHref}
                >
                    {buttonText}
                </CustomButton>
            </div>
        </div>
    );
}