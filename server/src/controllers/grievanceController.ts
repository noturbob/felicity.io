import { Request, Response } from 'express';
import Grievance from '../models/Grievance';

export const getGrievances = async (req: Request, res: Response) => {
  try {
    const grievances = await Grievance.find({}).sort({ createdAt: -1 });
    res.json(grievances);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createGrievance = async (req: Request, res: Response) => {
  const { subject, message, mood } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ message: 'Subject and message are required' });
  }

  try {
    const grievance = new Grievance({
      subject,
      message,
      mood,
    });
    const createdGrievance = await grievance.save();
    res.status(201).json(createdGrievance);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};