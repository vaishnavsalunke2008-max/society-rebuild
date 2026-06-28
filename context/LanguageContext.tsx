"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { Lang } from "@/lib/translations";
import { t as translate } from "@/lib/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sh_lang") as Lang | null;
    if (saved && ["en", "hi", "mr", "te", "ta"].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  function setLang(newLang: Lang) {
    setLangState(newLang);
    localStorage.setItem("sh_lang", newLang);
  }

  const t = (key: string) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
