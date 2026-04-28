const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  category:    { type: String, enum: ['Study','Project','Health','Work','Life'], default: 'Work' },
  dueDate:     { type: String, required: true }, // YYYY-MM-DD
  note:        { type: String, default: '' },
  completed:   { type: Boolean, default: false },
  forwarded:   { type: Boolean, default: false },
  originalDate:{ type: String, default: null },
  completedAt: { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
