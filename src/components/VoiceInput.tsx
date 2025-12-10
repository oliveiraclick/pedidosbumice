import React from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface VoiceInputProps {
    isListening: boolean;
    onClick: () => void;
    className?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ isListening, onClick, className }) => {
    return (
        <button
            onClick={onClick}
            className={twMerge(
                clsx(
                    "relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-500 ease-out group",
                    isListening
                        ? "shadow-[0_0_80px_-10px_rgba(239,68,68,0.6)] scale-110"
                        : "shadow-[0_0_60px_-15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_80px_-10px_rgba(6,182,212,0.7)] hover:scale-105",
                    className
                )
            )}
        >
            {/* Background Layer */}
            <div className={clsx(
                "absolute inset-0 rounded-full transition-all duration-500 opacity-90 backdrop-blur-sm",
                isListening
                    ? "bg-gradient-to-tr from-red-600 via-orange-500 to-red-500"
                    : "bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-500 group-hover:rotate-180"
            )} />

            {/* Inner Ring */}
            <div className="absolute inset-1 bg-slate-900 rounded-full z-10 flex items-center justify-center border border-white/10">
                {/* Icon */}
                {isListening ? (
                    <>
                        <span className="absolute w-full h-full rounded-full border-2 border-red-500 opacity-50 animate-ping"></span>
                        <span className="absolute w-2/3 h-2/3 rounded-full bg-red-500/20 animate-pulse"></span>
                        <Loader2 className="w-12 h-12 text-red-500 animate-spin absolute" />
                        <Mic className="w-12 h-12 text-white relative z-20" />
                    </>
                ) : (
                    <div className="relative z-20 group-hover:scale-110 transition-transform duration-300">
                        <Mic className="w-14 h-14 text-cyan-50 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                    </div>
                )}
            </div>
        </button>
    );
};
