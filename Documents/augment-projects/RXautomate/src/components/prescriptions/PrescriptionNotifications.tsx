import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { PrescriptionNotification } from '@prisma/client';

interface PrescriptionNotificationsProps {
  userId: string;
}

const PrescriptionNotifications: React.FC<PrescriptionNotificationsProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PrescriptionNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/notifications?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        const data = await response.json();
        setNotifications(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    console.log(`Marking notification ${notificationId} as read`);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifications</h4>
            <p className="text-sm text-muted-foreground">
              You have {notifications.filter(n => !n.isRead).length} unread messages.
            </p>
          </div>
          <div className="grid gap-2">
            {isLoading && <p>Loading notifications...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            {!isLoading && !error && notifications.length === 0 && (
              <p className="text-sm text-muted-foreground">No new notifications.</p>
            )}
            {!isLoading && !error && notifications.map((notification) => (
              <div
                key={notification.id}
                className="mb-2 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
              >
                <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title || 'Notification'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                  {!notification.isRead && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)} className="mt-1">
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PrescriptionNotifications;
