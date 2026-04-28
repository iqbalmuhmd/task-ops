const express = require('express');
const router  = express.Router();
const Task    = require('./Task');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// GET /api/tasks — carry-forward then return all tasks
router.get('/', async (req, res) => {
  try {
    const t = today();
    // carry incomplete past tasks → today
    const stale = await Task.find({ completed: false, dueDate: { $lt: t } });
    for (const task of stale) {
      task.originalDate = task.originalDate || task.dueDate;
      task.dueDate      = t;
      task.forwarded    = true;
      await task.save();
    }
    const tasks = await Task.find().sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.completed === true)  update.completedAt = new Date();
    if (update.completed === false) update.completedAt = null;

    // defer to tomorrow
    if (update.dueDate === tomorrow()) {
      update.forwarded    = true;
      update.originalDate = update.originalDate || undefined; // set by caller
    }

    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
