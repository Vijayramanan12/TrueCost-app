import React, { createContext, useContext, useState, useEffect } from "react";
import { type Language, translations, type TranslationKeys } from "./translations";

export type { Language, TranslationKeys };

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage = "English" }: { children: React.ReactNode, initialLanguage?: string }) {
    const [language, setLanguageState] = useState<Language>(initialLanguage as Language);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_language", lang);
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem("app_language");
        if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
            setLanguageState(savedLanguage as Language);
        } else if (initialLanguage && Object.keys(translations).includes(initialLanguage)) {
            setLanguageState(initialLanguage as Language);
        }
    }, [initialLanguage]);

    const t = (key: TranslationKeys): string => {
        return translations[language][key] || translations.English[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useTranslation must be used within a LanguageProvider");
    }
    return context;
}
