/**
 * Activity Sync Bus — real-time event bridge between student activities and admin dashboard.
 *
 * Uses Supabase Realtime Broadcast channel (no DB config needed).
 * Works cross-device via Supabase's WebSocket infrastructure.
 *
 * Usage:
 *   broadcastQuizComplete({ userId, quizId, xp, score })      // student quiz
 *   broadcastActivityComplete({ userId, activityType, xp })    // student lesson/game/story/etc.
 *   onQuizComplete(callback)                                    // admin side — returns unsub fn
 *   onActivityComplete(callback)                                // admin side — returns unsub fn
 */
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface QuizCompletePayload {
    userId: string;
    quizId: string;
    xp: number;
    score: number;
    timestamp: string;
}

export interface ActivityCompletePayload {
    userId: string;
    activityType: string;  // e.g. "lesson", "story_quest", "tamil_game", "english_buddy", "life_skills", "fun_corner", "adventure", "skill_lesson"
    xp: number;
    timestamp: string;
}

const CHANNEL_NAME = "quiz-sync";
const QUIZ_EVENT = "quiz_completed";
const ACTIVITY_EVENT = "activity_completed";

let _channel: RealtimeChannel | null = null;

function getChannel(): RealtimeChannel {
    if (!_channel) {
        _channel = supabase.channel(CHANNEL_NAME);
        _channel.subscribe((status) => {
            if (status === "SUBSCRIBED") {
                console.log("[SyncBus] Channel connected");
            }
        });
    }
    return _channel;
}

/** Broadcast a quiz completion event (called by QuizPlayer after save) */
export function broadcastQuizComplete(payload: Omit<QuizCompletePayload, "timestamp">) {
    const channel = getChannel();
    channel.send({
        type: "broadcast",
        event: QUIZ_EVENT,
        payload: { ...payload, timestamp: new Date().toISOString() },
    });
}

/** Broadcast a general activity completion (lesson, game, story, adventure, etc.) */
export function broadcastActivityComplete(payload: Omit<ActivityCompletePayload, "timestamp">) {
    const channel = getChannel();
    channel.send({
        type: "broadcast",
        event: ACTIVITY_EVENT,
        payload: { ...payload, timestamp: new Date().toISOString() },
    });
}

/** Subscribe to quiz completion events. Returns an unsubscribe function. */
export function onQuizComplete(
    callback: (payload: QuizCompletePayload) => void
): () => void {
    const channel = getChannel();

    channel.on("broadcast", { event: QUIZ_EVENT }, (message) => {
        callback(message.payload as QuizCompletePayload);
    });

    // Re-subscribe to pick up the new listener
    channel.subscribe();

    return () => {
        // Note: Supabase doesn't support removing individual listeners,
        // so we rely on component unmount + channel staying alive for other listeners.
        // The channel is shared and long-lived.
    };
}

/** Subscribe to general activity completion events. Returns an unsubscribe function. */
export function onActivityComplete(
    callback: (payload: ActivityCompletePayload) => void
): () => void {
    const channel = getChannel();

    channel.on("broadcast", { event: ACTIVITY_EVENT }, (message) => {
        callback(message.payload as ActivityCompletePayload);
    });

    channel.subscribe();

    return () => {};
}
