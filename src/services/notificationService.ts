
import { supabase } from "@/integrations/supabase/client";

export const getNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return { data: [], error: error.message || 'Failed to fetch notifications' };
  }
};

export const markNotificationAsRead = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return { data: null, error: error.message || 'Failed to mark notification as read' };
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
      .select();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return { data: null, error: error.message || 'Failed to mark all notifications as read' };
  }
};

export const deleteNotification = async (id: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return { error: null };
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return { error: error.message || 'Failed to delete notification' };
  }
};
