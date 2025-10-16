import { Request, Response } from 'express';
import Grievance from '../models/Grievance';

// @desc    Admin gets all grievances
// @route   GET /api/admin/grievances
export const getAllGrievances = async (req: Request, res: Response) => {
    try {
        const grievances = await Grievance.find({}).sort({ createdAt: -1 });
        res.json(grievances);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Admin responds to a grievance
// @route   PUT /api/admin/grievances/:id
export const respondToGrievance = async (req: Request, res: Response) => {
    const { response } = req.body;
    try {
        const grievance = await Grievance.findById(req.params.id);
        if (grievance) {
            grievance.response = response;
            grievance.status = 'Responded';
            const updatedGrievance = await grievance.save();
            res.json(updatedGrievance);
        } else {
            res.status(404).json({ message: 'Grievance not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
