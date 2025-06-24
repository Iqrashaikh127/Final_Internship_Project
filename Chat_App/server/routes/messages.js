const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// Multer setup
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Send Text Message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiver, group, message, type = 'text', isGroup = false } = req.body;
    const sender = req.user.username;

    const msg = await Message.create({
      sender,
      receiver: isGroup ? group : receiver,
      message,
      type,
      isGroup
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send Image Message
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const sender = req.user.username;
    const isGroup = req.body.group !== undefined;
    const receiver = isGroup ? req.body.group : req.body.receiver;

    const imageUrl = `/uploads/${req.file.filename}`;
    const msg = await Message.create({
      sender,
      receiver,
      imageUrl,
      type: 'image',
      isGroup
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Other GET/DELETE routes (unchanged, use your existing ones)
router.get('/private/:receiver', authMiddleware, async (req, res) => {
  const currentUser = req.user.username;
  const { receiver } = req.params;

  try {
    const messages = await Message.find({
      isGroup: false,
      $or: [
        { sender: currentUser, receiver },
        { sender: receiver, receiver: currentUser },
      ],
    }).sort({ timestamp: 1 });

    await Message.updateMany(
      { receiver: currentUser, sender: receiver, isRead: false, isGroup: false },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/group/:groupId', authMiddleware, async (req, res) => {
  const { groupId } = req.params;
  const currentUser = req.user.username;

  try {
    const messages = await Message.find({
      receiver: groupId,
      isGroup: true,
    }).sort({ timestamp: 1 });

    await Message.updateMany(
      {
        receiver: groupId,
        isGroup: true,
        isRead: false,
        sender: { $ne: currentUser },
      },
      { $set: { isRead: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender !== req.user.username) return res.status(403).json({ error: 'Unauthorized' });

    await message.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
