# Promotional Notification System Demo

## How the System Works

### 1. **Once-Per-Day Logic**
- The system checks for notifications only once per day per user
- Uses localStorage to track:
  - `last_notification_check`: Date of last check (YYYY-MM-DD format)
  - `seen_notifications`: Object mapping notification IDs to the date they were seen

### 2. **Flow on App Startup**
1. User opens the app (Home page loads)
2. `NotificationService.checkAndShowNotifications()` is called
3. Service checks if notifications were already checked today
4. If not, fetches active notifications from backend
5. Filters out notifications already seen today
6. Shows the first unseen notification in a modal
7. Marks the notification as seen (both in backend and localStorage)
8. Updates last checked date

### 3. **Testing the System**

#### Clear Local Storage (for testing)
```javascript
// In browser console
localStorage.removeItem('seen_notifications');
localStorage.removeItem('last_notification_check');
```

#### Simulate Different Days
```javascript
// To test "once per day" behavior, manually set dates
localStorage.setItem('last_notification_check', '2024-01-15');
```

#### Force Notification Check
```javascript
// In browser console after app loads
await window.angularComponentRef.zone.run(() => {
  window.angularComponentRef.component.notificationService.checkAndShowNotifications();
});
```

### 4. **Expected Backend Response**

The backend should return an array of active notifications in this format:
```json
[
  {
    "id": 1,
    "title": "Special Offer",
    "message": "Get 20% off your first order!",
    "image_url": "https://example.com/offer.jpg",
    "is_active": true,
    "start_date": "2024-01-01T00:00:00.000000Z",
    "end_date": "2024-12-31T23:59:59.000000Z",
    "created_at": "2024-01-01T10:00:00.000000Z",
    "updated_at": "2024-01-01T10:00:00.000000Z"
  }
]
```

### 5. **Error Handling**
- If backend API calls fail, the system gracefully handles errors
- Notifications are still marked as seen locally to prevent spamming users
- Console errors are logged for debugging

### 6. **Customization Options**

#### Modal Styling
The modal appearance can be customized in `notification-modal.component.scss`:
- Change colors, fonts, and spacing
- Adjust modal size and positioning
- Add animations or transitions

#### Notification Types
The system supports:
- Text-only notifications
- Notifications with images
- Time-limited notifications (using start/end dates)

### 7. **Admin Features (Future Enhancement)**
The backend includes admin endpoints for:
- Creating new promotional notifications
- Updating existing notifications  
- Deleting notifications
- Managing notification scheduling

### 8. **Testing Without Backend**
For development/testing without a backend, you can mock the API responses:

```typescript
// In notification.service.ts - temporary mock for testing
private mockNotifications: Notification[] = [
  {
    id: 1,
    title: 'Test Notification',
    message: 'This is a test promotional message',
    image_url: null,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Temporarily replace the API call
getPromotionalNotifications(): Observable<Notification[]> {
  return of(this.mockNotifications); // Use mock data instead of HTTP call
}
```

## Implementation Complete!

The promotional notification system is now fully implemented with:
✅ Frontend Angular components and services
✅ Backend Laravel API endpoints documentation
✅ Once-per-day display logic
✅ Support for text and image notifications
✅ Proper error handling
✅ Local storage persistence

The system will automatically show promotional notifications to users once per day when they open the app, helping to drive engagement without being intrusive.
