import { useLanguageStore } from "@/store/useLanguageStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
    const { language, setLanguage } = useLanguageStore();
    const { t } = useTranslation();

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "ta" : "en");
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 sm:gap-2 h-8 sm:h-10 px-2.5 sm:px-4 rounded-full border-border bg-card hover:bg-accent text-foreground font-semibold shadow-sm transition-all"
            onClick={toggleLanguage}
        >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-sm leading-none">{language === "en" ? "தமிழ்" : "English"}</span>
        </Button>
    );
};
