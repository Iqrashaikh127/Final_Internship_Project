const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');

// Create Group
router.post('/create', auth, async (req, res) => {
  const { name, members, createdBy } = req.body;
  try {
    const existing = await Group.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Group already exists' });

    const group = await Group.create({ name, members, createdBy });
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update group members
router.put('/update/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.members = req.body.members;
    await group.save();

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all groups current user is in
router.get('/my', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.username });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send group message
router.post('/message', auth, async (req, res) => {
  const { group, message } = req.body;
  try {
    const msg = await GroupMessage.create({ group, sender: req.user.username, message });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a group
router.get('/messages/:group', auth, async (req, res) => {
  try {
    const msgs = await GroupMessage.find({ group: req.params.group }).sort({ timestamp: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Optional: Only creator can delete
    if (group.createdBy !== req.user.username) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    await group.deleteOne(); // delete group
    await GroupMessage.deleteMany({ group: group.name }); // delete messages tied to the group (optional)

    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

