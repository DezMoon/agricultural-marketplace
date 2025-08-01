export interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    listing_id?: number;
    message_text: string;
    timestamp: Date;
    read_status: boolean;
}
export interface SendMessageData {
    receiver_id: number;
    listing_id?: number;
    message_text: string;
}
export interface MessageWithUsers extends Message {
    sender_username: string;
    recipient_username: string;
    listing_title?: string;
}
export interface Conversation {
    other_user_id: number;
    other_user_username: string;
    latest_message: string;
    latest_message_date: Date;
    unread_count: number;
}
//# sourceMappingURL=messages.d.ts.map