/**
 * EDUCORE-OMEGA WhatsApp Group Notice Service
 * 
 * Sends school notices to a WhatsApp Group via deep link.
 * NO API tokens required — completely FREE!
 * 
 * How it works:
 * 1. Admin composes a notice in the dashboard
 * 2. Clicks "Send to WhatsApp Group"
 * 3. WhatsApp opens with the formatted notice text pre-filled
 * 4. Admin taps send in WhatsApp → notice reaches the entire group
 */

// ==================== CONFIG ====================

const WHATSAPP_GROUP_LINK = import.meta.env.VITE_WHATSAPP_GROUP_LINK || '';

// ==================== TYPES ====================

export interface WhatsAppSendResult {
    success: boolean;
    method: 'group_share';
    error?: string;
}

// ==================== MAIN SERVICE ====================

export const whatsappService = {

    /**
     * Check if WhatsApp group link is configured
     */
    isAvailable(): boolean {
        return !!WHATSAPP_GROUP_LINK;
    },

    /**
     * Get the configured WhatsApp group link
     */
    getGroupLink(): string {
        return WHATSAPP_GROUP_LINK;
    },

    /**
     * Format notice text for WhatsApp (with emoji + formatting)
     */
    formatNotice(title: string, message: string, category?: string, priority?: string): string {
        // Priority emoji
        const priorityEmoji = priority === 'urgent' ? '🚨' :
            priority === 'high' ? '⚠️' :
                '📢';

        // Category label
        const categoryLabel = category === 'academic' ? '📚 Academic' :
            category === 'financial' ? '💰 Financial' :
                category === 'urgent' ? '🚨 Urgent' :
                    category === 'system' ? '⚙️ System' :
                        '📋 Announcement';

        // Build WhatsApp-formatted message
        const formattedText = [
            `${priorityEmoji} *SCHOOL NOTICE* ${priorityEmoji}`,
            ``,
            `📌 *${title}*`,
            ``,
            message,
            ``,
            `📂 _${categoryLabel}_`,
            `🏫 _EduCore-Omega School Management_`,
            `📅 _${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}_`,
        ].join('\n');

        return formattedText;
    },

    /**
     * Open WhatsApp with pre-filled notice message
     * Uses the wa.me deep link to pre-fill text
     * Admin just needs to select the group and tap send
     */
    sendToGroup(title: string, message: string, category?: string, priority?: string): WhatsAppSendResult {
        if (!WHATSAPP_GROUP_LINK) {
            return { success: false, method: 'group_share', error: 'WhatsApp group link not configured in .env' };
        }

        try {
            const formattedText = this.formatNotice(title, message, category, priority);
            const encodedText = encodeURIComponent(formattedText);

            // Use WhatsApp's universal share link
            // This opens WhatsApp with the message pre-filled
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;

            // Open in a new tab — user selects the group and sends
            window.open(whatsappUrl, '_blank');

            return { success: true, method: 'group_share' };
        } catch (error) {
            return {
                success: false,
                method: 'group_share',
                error: error instanceof Error ? error.message : 'Failed to open WhatsApp'
            };
        }
    },

    /**
     * Copy formatted notice to clipboard (backup method)
     */
    async copyNoticeToClipboard(title: string, message: string, category?: string, priority?: string): Promise<boolean> {
        try {
            const formattedText = this.formatNotice(title, message, category, priority);
            await navigator.clipboard.writeText(formattedText);
            return true;
        } catch {
            return false;
        }
    },
};

export default whatsappService;
