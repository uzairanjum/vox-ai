import { getCurrentUser } from './user';
// Removed automatic default agent creation

/**
 * Initialize user data including default AI agents
 * Should be called on login or when accessing AI features
 */
export async function initializeUserData(userId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    let targetUserId = userId;
    
    if (!targetUserId) {
      const user = await getCurrentUser();
      if (!user?.id) {
        return { success: false, error: 'User not authenticated' };
      }
      targetUserId = user.id;
    }
    
    console.log('Initializing user data for:', targetUserId);
    
    // User initialization complete - no automatic agent creation needed
    console.log('User data initialization completed for:', targetUserId);
    return { success: true };
    
  } catch (error) {
    console.error('Error in user data initialization:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown initialization error' 
    };
  }
}

/**
 * Initialize user data silently (doesn't throw or return errors)
 * Useful for background initialization
 */
export async function initializeUserDataSilently(userId?: string): Promise<void> {
  try {
    await initializeUserData(userId);
  } catch (error) {
    console.warn('Silent user data initialization failed:', error);
  }
} 