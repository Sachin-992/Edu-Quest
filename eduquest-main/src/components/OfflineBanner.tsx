import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";

/**
 * A subtle top-banner that appears when the user goes offline.
 * Dismisses automatically when connectivity returns.
 */
const OfflineBanner = () => {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 inset-x-0 z-[9999] bg-destructive text-destructive-foreground text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-300">
            <WifiOff className="w-4 h-4 shrink-0" />
            You're offline — some features may not work until you reconnect.
        </div>
    );
};

export default OfflineBanner;
