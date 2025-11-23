const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Получить все уведомления пользователя
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, unreadOnly } = req.query;

    const query = { userId: parseInt(userId) };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: parseInt(userId), read: false });

    res.json({
      notifications,
      total,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отметить уведомление как прочитанное
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Отметить все уведомления пользователя как прочитанные
router.patch('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Notification.updateMany(
      { userId: parseInt(userId), read: false },
      { read: true }
    );

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать новое уведомление
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, relatedId, relatedType } = req.body;

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить уведомление
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Удалить все прочитанные уведомления пользователя
router.delete('/user/:userId/clear-read', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await Notification.deleteMany({
      userId: parseInt(userId),
      read: true
    });

    res.json({ 
      message: 'Read notifications cleared',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
