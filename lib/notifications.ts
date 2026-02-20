// Notification service for milestones and push notifications
import { dbClient, ensureInitialized } from './db_turso';
import webpush from 'web-push';

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface Milestone {
  id?: number;
  pot_id: number;
  milestone_type: '25%' | '50%' | '75%' | '100%' | 'GOAL_REACHED';
  milestone_value: number;
  achieved_at?: string;
}

export interface Notification {
  id?: number;
  user_id: number;
  type: 'milestone' | 'system' | 'alert';
  title: string;
  message: string;
  pot_id?: number;
  milestone_type?: string;
  is_read?: boolean;
  created_at?: string;
}

// Milestone percentages to track
const MILESTONE_PERCENTAGES = [25, 50, 75, 100];

/**
 * Check if any milestones have been reached for a pot after a balance change
 * This should be called after a transaction is added or balance is updated
 */
export async function checkAndCreateMilestones(
  potId: number,
  currentBalance: number,
  goalAmount: number | null,
  userId: number
): Promise<Notification[]> {
  await ensureInitialized();

  const notifications: Notification[] = [];

  if (!goalAmount || goalAmount <= 0) {
    return notifications;
  }

  const percentage = (currentBalance / goalAmount) * 100;

  // Check each milestone percentage
  for (const milestonePct of MILESTONE_PERCENTAGES) {
    if (percentage >= milestonePct) {
      const milestoneType = milestonePct === 100 ? 'GOAL_REACHED' : `${milestonePct}%`;
      const milestoneValue = (goalAmount * milestonePct) / 100;

      // Check if this milestone was already achieved
      const existingResult = await dbClient.execute({
        sql: `SELECT id FROM milestones WHERE pot_id = ? AND milestone_type = ?`,
        args: [potId, milestoneType]
      });

      if (existingResult.rows.length === 0) {
        // Create the milestone record
        await dbClient.execute({
          sql: `INSERT INTO milestones (pot_id, milestone_type, milestone_value)
                VALUES (?, ?, ?)`,
          args: [potId, milestoneType, milestoneValue]
        });

        // Get pot details for notification
        const potResult = await dbClient.execute({
          sql: `SELECT name FROM savings_pots WHERE id = ?`,
          args: [potId]
        });
        const potName = potResult.rows[0]?.name || 'Savings Pot';

        // Create notification
        let title: string;
        let message: string;

        if (milestonePct === 100) {
          title = '🎉 Goal Reached!';
          message = `Congratulations! You've reached your savings goal of £${goalAmount.toLocaleString('en-GB')} for "${potName}"`;
        } else {
          title = `📈 ${milestonePct}% Milestone!`;
          message = `You've saved ${milestonePct}% of your goal for "${potName}" (£${milestoneValue.toLocaleString('en-GB')})`;
        }

        const notification: Notification = {
          user_id: userId,
          type: 'milestone',
          title,
          message,
          pot_id: potId,
          milestone_type: milestoneType
        };

        const notifResult = await createNotification(notification);
        if (notifResult) {
          notifications.push(notifResult);
        }

        // Send push notification if user has subscriptions
        await sendPushNotification(userId, title, message, { potId, milestoneType });
      }
    }
  }

  return notifications;
}

/**
 * Create a notification in the database
 */
export async function createNotification(notification: Notification): Promise<Notification | null> {
  await ensureInitialized();

  try {
    const result = await dbClient.execute({
      sql: `INSERT INTO notifications (user_id, type, title, message, pot_id, milestone_type)
            VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        notification.user_id,
        notification.type,
        notification.title,
        notification.message,
        notification.pot_id || null,
        notification.milestone_type || null
      ]
    });

    if (result.rows.length > 0) {
      return result.rows[0] as unknown as Notification;
    }
    return null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: number, unreadOnly: boolean = false): Promise<Notification[]> {
  await ensureInitialized();

  let query = `SELECT * FROM notifications WHERE user_id = ?`;
  const args: any[] = [userId];

  if (unreadOnly) {
    query += ` AND is_read = 0`;
  }

  query += ` ORDER BY created_at DESC`;

  const result = await dbClient.execute({ sql: query, args });
  return result.rows as unknown as Notification[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number): Promise<boolean> {
  await ensureInitialized();

  try {
    await dbClient.execute({
      sql: `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      args: [notificationId, userId]
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  await ensureInitialized();

  try {
    await dbClient.execute({
      sql: `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
      args: [userId]
    });
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: number): Promise<number> {
  await ensureInitialized();

  const result = await dbClient.execute({
    sql: `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
    args: [userId]
  });

  return Number(result.rows[0]?.count || 0);
}

/**
 * Get milestones for a pot
 */
export async function getPotMilestones(potId: number): Promise<Milestone[]> {
  await ensureInitialized();

  const result = await dbClient.execute({
    sql: `SELECT * FROM milestones WHERE pot_id = ? ORDER BY milestone_value ASC`,
    args: [potId]
  });

  return result.rows as unknown as Milestone[];
}

// ============================================================
// Web Push API Functions
// ============================================================

export interface PushSubscription {
  id?: number;
  user_id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at?: string;
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
  userId: number,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<boolean> {
  await ensureInitialized();

  try {
    await dbClient.execute({
      sql: `INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?)`,
      args: [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
    });
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
}

/**
 * Delete a push subscription
 */
export async function deletePushSubscription(endpoint: string): Promise<boolean> {
  await ensureInitialized();

  try {
    await dbClient.execute({
      sql: `DELETE FROM push_subscriptions WHERE endpoint = ?`,
      args: [endpoint]
    });
    return true;
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return false;
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getPushSubscriptions(userId: number): Promise<PushSubscription[]> {
  await ensureInitialized();

  const result = await dbClient.execute({
    sql: `SELECT * FROM push_subscriptions WHERE user_id = ?`,
    args: [userId]
  });

  return result.rows as unknown as PushSubscription[];
}

/**
 * Send a push notification to all user's devices
 */
async function sendPushNotification(
  userId: number,
  title: string,
  body: string,
  data?: { potId?: number; milestoneType?: string }
): Promise<void> {
  // Get user's push subscriptions
  const subscriptions = await getPushSubscriptions(userId);

  if (subscriptions.length === 0) {
    return;
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push Notification] VAPID keys not configured. Skipping push.');
    return;
  }

  const payload = JSON.stringify({
    title,
    body,
    data: {
      ...data,
      url: '/' // Default to root, can be expanded later
    }
  });

  // Send push to each subscription
  const pushPromises = subscriptions.map(async (sub) => {
    try {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      await webpush.sendNotification(pushSub, payload);
    } catch (error: any) {
      // If subscription has expired or is invalid, remove it from the database
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log(`[Push Notification] Removing expired subscription for user ${userId}: ${sub.endpoint}`);
        await deletePushSubscription(sub.endpoint);
      } else {
        console.error(`[Push Notification] Error sending to ${sub.endpoint}:`, error);
      }
    }
  });

  await Promise.all(pushPromises);
  console.log(`[Push Notification] Attempted sending to ${subscriptions.length} devices (User: ${userId})`);
}
