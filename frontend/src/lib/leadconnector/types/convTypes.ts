// Common GHL API request types
export const ghlRequestTypes = {
    lastMessageType: [
      'TYPE_CALL', 'TYPE_SMS', 'TYPE_EMAIL', 'TYPE_SMS_REVIEW_REQUEST',
      'TYPE_WEBCHAT', 'TYPE_SMS_NO_SHOW_REQUEST', 'TYPE_CAMPAIGN_SMS',
      'TYPE_CAMPAIGN_CALL', 'TYPE_CAMPAIGN_EMAIL', 'TYPE_CAMPAIGN_VOICEMAIL',
      'TYPE_FACEBOOK', 'TYPE_CAMPAIGN_FACEBOOK', 'TYPE_CAMPAIGN_MANUAL_CALL',
      'TYPE_CAMPAIGN_MANUAL_SMS', 'TYPE_GMB', 'TYPE_CAMPAIGN_GMB', 'TYPE_REVIEW',
      'TYPE_INSTAGRAM', 'TYPE_WHATSAPP', 'TYPE_CUSTOM_SMS', 'TYPE_CUSTOM_EMAIL',
      'TYPE_CUSTOM_PROVIDER_SMS', 'TYPE_CUSTOM_PROVIDER_EMAIL', 'TYPE_IVR_CALL',
      'TYPE_ACTIVITY_CONTACT', 'TYPE_ACTIVITY_INVOICE', 'TYPE_ACTIVITY_PAYMENT',
      'TYPE_ACTIVITY_OPPORTUNITY', 'TYPE_LIVE_CHAT', 'TYPE_LIVE_CHAT_INFO_MESSAGE',
      'TYPE_ACTIVITY_APPOINTMENT', 'TYPE_FACEBOOK_COMMENT', 'TYPE_INSTAGRAM_COMMENT',
      'TYPE_CUSTOM_CALL', 'TYPE_INTERNAL_COMMENT'
    ] as const,
    conversationStatus: ['all', 'read', 'unread', 'starred', 'recents'] as const,
    sortDirection: ['asc', 'desc'] as const,
    sortBy: ['last_manual_message_date', 'last_message_date', 'score_profile'] as const
  };
  
  export type LastMessageType = typeof ghlRequestTypes.lastMessageType[number];
  export type ConversationStatus = typeof ghlRequestTypes.conversationStatus[number];
  export type SortDirection = typeof ghlRequestTypes.sortDirection[number];
  export type SortBy = typeof ghlRequestTypes.sortBy[number];
  