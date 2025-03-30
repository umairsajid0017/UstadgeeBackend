import { Request, Response } from 'express';
import prisma from '../db';

// Add a new task
export async function addTask(req: Request, res: Response) {
  try {
    const {
      worker_id,
      service_id,
      description,
      est_time,
      total_amount,
      offer_expiration_date,
      audio_name,
      cnic,
      arrival_time
    } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Create new task
    const newTask = await prisma.task_assigns.create({
      data: {
        worker_id,
        user_id: req.user.phoneNumber,
        service_id: Number(service_id),
        description,
        est_time: Number(est_time),
        total_amount: Number(total_amount),
        offer_expiration_date: new Date(offer_expiration_date),
        status_id: 1, // Assuming 1 is "Pending" status
        audio_name: audio_name || '',
        cnic: cnic || '',
        arrival_time: new Date(arrival_time)
      }
    });
    
    // Get service details
    const service = await prisma.services.findUnique({
      where: { id: Number(service_id) }
    });
    
    // Create notification for service provider
    await prisma.notification.create({
      data: {
        title: 'New Task Request',
        type: 1,
        username: worker_id,
        username_notifier: req.user.phoneNumber,
        post_id: newTask.id,
        is_read: 0
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: newTask
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get tasks for a service provider
export async function getUstadRequests(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Get tasks assigned to this provider
    const tasks = await prisma.task_assigns.findMany({
      where: {
        worker_id: req.user.phoneNumber
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Format tasks with additional info
    const formattedTasks = await Promise.all(tasks.map(async (task) => {
      // Get service
      const service = await prisma.services.findUnique({
        where: { id: task.service_id }
      });
      
      // Get customer
      const customer = await prisma.users.findFirst({
        where: { phone_number: task.user_id }
      });
      
      // Get status
      const status = await prisma.status.findUnique({
        where: { id: task.status_id }
      });
      
      return {
        ...task,
        service: service ? {
          id: service.id,
          title: service.title,
          description: service.description,
          charges: service.charges
        } : null,
        customer: customer ? {
          id: customer.id,
          fullName: customer.full_name,
          phoneNumber: customer.phone_number,
          profileImage: customer.profile_image
        } : null,
        status: status?.name || 'Unknown'
      };
    }));
    
    res.json({
      success: true,
      data: formattedTasks
    });
  } catch (error) {
    console.error('Get Ustad requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get tasks requested by a user
export async function getUserRequests(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Get tasks requested by this user
    const tasks = await prisma.task_assigns.findMany({
      where: {
        user_id: req.user.phoneNumber
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Format tasks with additional info
    const formattedTasks = await Promise.all(tasks.map(async (task) => {
      // Get service
      const service = await prisma.services.findUnique({
        where: { id: task.service_id }
      });
      
      // Get service provider
      const provider = await prisma.users.findFirst({
        where: { phone_number: task.worker_id }
      });
      
      // Get status
      const status = await prisma.status.findUnique({
        where: { id: task.status_id }
      });
      
      return {
        ...task,
        service: service ? {
          id: service.id,
          title: service.title,
          description: service.description,
          charges: service.charges
        } : null,
        provider: provider ? {
          id: provider.id,
          fullName: provider.full_name,
          phoneNumber: provider.phone_number,
          profileImage: provider.profile_image
        } : null,
        status: status?.name || 'Unknown'
      };
    }));
    
    res.json({
      success: true,
      data: formattedTasks
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get completed tasks for a user
export async function getUserRequestsCompleted(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Get completed tasks (assuming status_id 3 is "Completed")
    const tasks = await prisma.task_assigns.findMany({
      where: {
        user_id: req.user.phoneNumber,
        status_id: 3
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Format tasks with additional info
    const formattedTasks = await Promise.all(tasks.map(async (task) => {
      // Get service
      const service = await prisma.services.findUnique({
        where: { id: task.service_id }
      });
      
      // Get service provider
      const provider = await prisma.users.findFirst({
        where: { phone_number: task.worker_id }
      });
      
      return {
        ...task,
        service: service ? {
          id: service.id,
          title: service.title,
          description: service.description,
          charges: service.charges
        } : null,
        provider: provider ? {
          id: provider.id,
          fullName: provider.full_name,
          phoneNumber: provider.phone_number,
          profileImage: provider.profile_image
        } : null,
        status: 'Completed'
      };
    }));
    
    res.json({
      success: true,
      data: formattedTasks
    });
  } catch (error) {
    console.error('Get completed requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Update task status
export async function updateRequestStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status_id } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Get the task
    const task = await prisma.task_assigns.findUnique({
      where: { id: Number(id) }
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check if user is allowed to update this task
    if (task.worker_id !== req.user.phoneNumber && task.user_id !== req.user.phoneNumber) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }
    
    // Update the task status
    const updatedTask = await prisma.task_assigns.update({
      where: { id: Number(id) },
      data: { status_id: Number(status_id) }
    });
    
    // Get status name
    const status = await prisma.status.findUnique({
      where: { id: Number(status_id) }
    });
    
    // Create notification for the other party
    const notifyUser = task.worker_id === req.user.phoneNumber ? task.user_id : task.worker_id;
    
    await prisma.notification.create({
      data: {
        title: `Task status updated to ${status ? status.name : 'new status'}`,
        type: 2,
        username: notifyUser,
        username_notifier: req.user.phoneNumber,
        post_id: task.id,
        is_read: 0
      }
    });
    
    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: {
        ...updatedTask,
        status: status?.name
      }
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}