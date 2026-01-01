import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, Image as ImageIcon, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useUser, useAuth } from '@clerk/clerk-react';

interface Message {
    role: 'user' | 'model';
    content: string;
}

export const ChatBot: React.FC = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Media State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingMedia, setIsProcessingMedia] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const handleToggle = (e: any) => {
            setIsOpen(prev => (e.detail !== undefined ? e.detail : !prev));
        };
        window.addEventListener('toggleNutriChat', handleToggle);
        return () => window.removeEventListener('toggleNutriChat', handleToggle);
    }, []);

    // --- Voice Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = handleVoiceUpload;
            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please allow permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks to release mic
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleVoiceUpload = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome records webm/opus
        // Create a File object
        const audioFile = new File([audioBlob], 'voice_recording.webm', { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('audio', audioFile);

        setIsProcessingMedia(true);
        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/intelligence/analyze-voice`, {
                method: 'POST',
                // Content-Type header is set automatically by fetch for FormData
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            if (data.success && data.data?.text) {
                setInput(prev => (prev + ' ' + data.data.text).trim());
            } else {
                console.error('Voice analysis failed:', data);
                // Optionally show error toast
            }
        } catch (error) {
            console.error('Error uploading voice:', error);
        } finally {
            setIsProcessingMedia(false);
        }
    };

    // --- Image Logic ---
    const triggerImageUpload = () => {
        fileInputRef.current?.click();
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('image', file);

            setIsProcessingMedia(true);
            try {
                const token = await getToken();
                const response = await fetch(`${API_URL}/intelligence/analyze-image`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                });

                const data = await response.json();
                if (data.success && data.data?.items) {
                    // Format items into a friendly string
                    const items = data.data.items;
                    if (items.length > 0) {
                        const itemsString = items.map((i: any) => `${i.quantity} ${i.unit} ${i.name}`).join(', ');
                        const text = `I have: ${itemsString}`;
                        setInput(prev => (prev + ' ' + text).trim());
                    } else {
                        // Fallback if no items extracted but maybe text?
                        // For now just say no items found or use raw text if available
                        setInput(prev => (prev + ' [No clear items found in image]').trim());
                    }
                } else {
                    console.error('Image analysis failed:', data);
                }
            } catch (error) {
                console.error('Error uploading image:', error);
            } finally {
                setIsProcessingMedia(false);
                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const token = await getToken();
            const response = await fetch(`${API_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages,
                    userId: user?.id,
                }),
            });

            const data = await response.json();

            if (data.error) {
                console.error('Server Error Details:', data);
                throw new Error(data.details || data.error);
            }

            setMessages((prev) => [...prev, { role: 'model', content: data.response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'model', content: 'Sorry, I encountered an error. Please try again.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <div
                className="fixed bottom-8 right-8 w-auto min-w-[260px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-primary/10 overflow-hidden z-50 flex justify-between items-center p-3 cursor-pointer hover:shadow-[0_20px_50px_rgba(172,156,6,0.15)] transition-all transform hover:-translate-y-1 group"
                onClick={() => setIsOpen(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src="/chatbot.png" alt="Bot" className="w-10 h-10 rounded-xl bg-primary/5 p-1.5 object-contain" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-white"></div>
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm tracking-tight">NutriAI Assistant</h4>
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest opacity-70">Online</p>
                    </div>
                </div>
                <div className="ml-6 mr-1 bg-primary/10 p-2 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Send className="w-4 h-4 rotate-45" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-[400px] h-[600px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50 flex flex-col font-sans animate-slide-in">
            {/* Header */}
            <div className="bg-white p-5 border-b border-gray-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src="/chatbot.png" alt="Bot" className="w-10 h-10 rounded-xl bg-primary/5 p-1.5 object-contain" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-base tracking-tight leading-tight">NutriAI Assistant</h3>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Active session</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-red-50 p-2 rounded-xl transition-all text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="text-center mt-24 px-10">
                        <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <img src="/chatbot.png" alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h4 className="text-slate-900 font-black text-lg mb-2 tracking-tight">How can I help you?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            I can help with inventory, meal planning, and nutrition insights.
                        </p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Bubble */}
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-primary text-white ml-auto'
                                : 'bg-slate-50 text-slate-800'
                                }`}
                        >
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {(isLoading || isProcessingMedia) && (
                    <div className="flex gap-1.5 items-center bg-slate-50 w-fit px-4 py-3 rounded-2xl">
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-50 shrink-0">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <button
                        type="button"
                        onClick={triggerImageUpload}
                        disabled={isLoading || isProcessingMedia || isRecording}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

                    <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading || isProcessingMedia}
                        className={`p-2 rounded-lg transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-primary'}`}
                    >
                        {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 text-sm py-1"
                        disabled={isLoading || isProcessingMedia || isRecording}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isProcessingMedia || isRecording}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-30 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
};
