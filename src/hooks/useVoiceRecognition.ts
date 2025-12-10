import { useState, useEffect, useCallback } from 'react';

export interface VoiceState {
    isListening: boolean;
    transcript: string;
    error: string | null;
}

export const useVoiceRecognition = () => {
    const [state, setState] = useState<VoiceState>({
        isListening: false,
        transcript: '',
        error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true; // Allow pauses
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'pt-BR';

            recognitionInstance.onstart = () => {
                setState(prev => ({ ...prev, isListening: true, error: null }));
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionInstance.onresult = (event: any) => {
                let finalTranscript = '';
                let interimTranscript = ''; // Keep track for live feedback

                for (let i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Combine final (from previous chunks) + current interim
                // NOTE: With continuous=true, we might need to be careful with duplication if we store strict state, 
                // but here we just displaying current session.
                // Actually, for simple command, we usually want the latest full sentence. 
                // Let's just join all finals.
                const currentText = (finalTranscript + interimTranscript).trim();

                if (currentText) {
                    setState(prev => ({ ...prev, transcript: currentText }));

                    // Reset silence timer
                    if ((window as any).silenceTimer) clearTimeout((window as any).silenceTimer);
                    (window as any).silenceTimer = setTimeout(() => {
                        recognitionInstance.stop();
                    }, 2000); // 2 seconds silence
                }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognitionInstance.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if ((window as any).silenceTimer) clearTimeout((window as any).silenceTimer);
                setState(prev => ({ ...prev, isListening: false, error: event.error }));
            };

            recognitionInstance.onend = () => {
                if ((window as any).silenceTimer) clearTimeout((window as any).silenceTimer);
                setState(prev => ({ ...prev, isListening: false }));
            };

            setRecognition(recognitionInstance);
        } else {
            setState(prev => ({ ...prev, error: 'Browser not supported' }));
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition && !state.isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Error starting recognition:", e);
            }
        }
    }, [recognition, state.isListening]);

    const stopListening = useCallback(() => {
        if (recognition && state.isListening) {
            recognition.stop();
        }
    }, [recognition, state.isListening]);

    const resetTranscript = useCallback(() => {
        setState(prev => ({ ...prev, transcript: '' }));
    }, []);

    return {
        isListening: state.isListening,
        transcript: state.transcript,
        error: state.error,
        startListening,
        stopListening,
        resetTranscript
    };
};
