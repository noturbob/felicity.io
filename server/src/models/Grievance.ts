import mongoose from 'mongoose';

const grievanceSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  mood: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    required: true,
    default: 'Pending',
  },
  response: {
    type: String,
    required: false,
    default: null,
  },
}, { timestamps: true });

const Grievance = mongoose.model('Grievance', grievanceSchema);

export default Grievance;