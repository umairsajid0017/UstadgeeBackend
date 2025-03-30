import { Request, Response } from 'express';
import { db } from '../db';
import {
  taskAssigns,
  services,
  users,
  statuses,
  InsertTaskAssign
} from '../../shared/schema';
import { eq, and, desc, asc, or, inArray } from 'drizzle-orm';
import { saveAudioFile } from '../utils/helpers';

export async function addTask(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const {
      service_id,
      user_id,
      worker_id,
      description,
      est_time,
      amount,
      offer_expiration_date,
      cnic,
      arrival_time,
      audio_data,
      audio_name
    } = req.body;
    
    if (!service_id || !worker_id || !description || !est_time || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      });
    }
    
    // Check if service exists
    const [existingService] = await db.select()
      .from(services)
      .where(eq(services.id, parseInt(service_id, 10)))
      .limit(1);
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Process audio if provided
    let audioFileName = '';
    if (audio_data && audio_name) {
      audioFileName = await saveAudioFile(audio_data, audio_name);
    }
    
    // Create new task
    const newTask: InsertTaskAssign = {
      workerId: worker_id,
      userId: user_id || userId.toString(),
      serviceId: parseInt(service_id, 10),
      description,
      estTime: parseInt(est_time, 10),
      totalAmount: parseInt(amount, 10),
      offerExpirationDate: new Date(offer_expiration_date),
      statusId: 1, // Default status: Pending
      audioName: audioFileName || audio_name || '',
      cnic: cnic || '',
      arrivalTime: new Date(arrival_time),
      createdAt: new Date()
    };
    
    const [insertedTask] = await db.insert(taskAssigns)
      .values(newTask)
      .returning({ id: taskAssigns.id });
    
    return res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: { id: insertedTask.id }
    });
  } catch (error) {
    console.error('Error adding task:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding task'
    });
  }
}

export async function getUstadRequests(req: Request, res: Response) {
  try {
    const workerId = req.body.worker_id || req.user?.id?.toString();
    
    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required'
      });
    }
    
    // Get tasks for worker
    const tasks = await db.select({
      id: taskAssigns.id,
      workerId: taskAssigns.workerId,
      userId: taskAssigns.userId,
      serviceId: taskAssigns.serviceId,
      description: taskAssigns.description,
      estTime: taskAssigns.estTime,
      totalAmount: taskAssigns.totalAmount,
      offerExpirationDate: taskAssigns.offerExpirationDate,
      statusId: taskAssigns.statusId,
      createdAt: taskAssigns.createdAt,
      audioName: taskAssigns.audioName,
      arrivalTime: taskAssigns.arrivalTime
    })
    .from(taskAssigns)
    .where(
      and(
        eq(taskAssigns.workerId, workerId),
        inArray(
          taskAssigns.statusId,
          [1, 2, 3] // Pending, Accepted, In Progress
        )
      )
    )
    .orderBy(desc(taskAssigns.createdAt));
    
    // Get user and service details for each task
    const taskIds = tasks.map(task => task.id);
    
    if (taskIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get status names
    const statusMap = await db.select()
      .from(statuses);
    
    const statusById = statusMap.reduce((acc, status) => {
      acc[status.id] = status.name;
      return acc;
    }, {} as Record<number, string>);
    
    // Get user details
    const userIds = [...new Set(tasks.map(task => task.userId))];
    const usersMap = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage,
      phoneNumber: users.phoneNumber
    })
    .from(users)
    .where(inArray(users.id, userIds.map(id => parseInt(id, 10))));
    
    const usersById = usersMap.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, typeof usersMap[number]>);
    
    // Get service details
    const serviceIds = [...new Set(tasks.map(task => task.serviceId))];
    const servicesMap = await db.select({
      id: services.id,
      title: services.title,
      description: services.description
    })
    .from(services)
    .where(inArray(services.id, serviceIds));
    
    const servicesById = servicesMap.reduce((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {} as Record<number, typeof servicesMap[number]>);
    
    // Combine all data
    const tasksWithDetails = tasks.map(task => ({
      ...task,
      user: usersById[parseInt(task.userId, 10)] || null,
      service: servicesById[task.serviceId] || null,
      status: statusById[task.statusId] || 'Unknown'
    }));
    
    return res.status(200).json({
      success: true,
      data: tasksWithDetails
    });
  } catch (error) {
    console.error('Error fetching worker requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching requests'
    });
  }
}

export async function getUserRequests(req: Request, res: Response) {
  try {
    const userId = req.body.user_id || req.user?.id?.toString();
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get active tasks for user
    const tasks = await db.select({
      id: taskAssigns.id,
      workerId: taskAssigns.workerId,
      userId: taskAssigns.userId,
      serviceId: taskAssigns.serviceId,
      description: taskAssigns.description,
      estTime: taskAssigns.estTime,
      totalAmount: taskAssigns.totalAmount,
      offerExpirationDate: taskAssigns.offerExpirationDate,
      statusId: taskAssigns.statusId,
      createdAt: taskAssigns.createdAt,
      audioName: taskAssigns.audioName,
      arrivalTime: taskAssigns.arrivalTime
    })
    .from(taskAssigns)
    .where(
      and(
        eq(taskAssigns.userId, userId),
        inArray(
          taskAssigns.statusId,
          [1, 2, 3] // Pending, Accepted, In Progress
        )
      )
    )
    .orderBy(desc(taskAssigns.createdAt));
    
    // Get worker and service details for each task
    const taskIds = tasks.map(task => task.id);
    
    if (taskIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get status names
    const statusMap = await db.select()
      .from(statuses);
    
    const statusById = statusMap.reduce((acc, status) => {
      acc[status.id] = status.name;
      return acc;
    }, {} as Record<number, string>);
    
    // Get worker details
    const workerIds = [...new Set(tasks.map(task => task.workerId))];
    const workersMap = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage,
      phoneNumber: users.phoneNumber
    })
    .from(users)
    .where(inArray(users.id, workerIds.map(id => parseInt(id, 10))));
    
    const workersById = workersMap.reduce((acc, worker) => {
      acc[worker.id] = worker;
      return acc;
    }, {} as Record<number, typeof workersMap[number]>);
    
    // Get service details
    const serviceIds = [...new Set(tasks.map(task => task.serviceId))];
    const servicesMap = await db.select({
      id: services.id,
      title: services.title,
      description: services.description
    })
    .from(services)
    .where(inArray(services.id, serviceIds));
    
    const servicesById = servicesMap.reduce((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {} as Record<number, typeof servicesMap[number]>);
    
    // Combine all data
    const tasksWithDetails = tasks.map(task => ({
      ...task,
      worker: workersById[parseInt(task.workerId, 10)] || null,
      service: servicesById[task.serviceId] || null,
      status: statusById[task.statusId] || 'Unknown'
    }));
    
    return res.status(200).json({
      success: true,
      data: tasksWithDetails
    });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching requests'
    });
  }
}

export async function getUserRequestsCompleted(req: Request, res: Response) {
  try {
    const userId = req.body.user_id || req.user?.id?.toString();
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Get completed tasks for user
    const tasks = await db.select({
      id: taskAssigns.id,
      workerId: taskAssigns.workerId,
      userId: taskAssigns.userId,
      serviceId: taskAssigns.serviceId,
      description: taskAssigns.description,
      estTime: taskAssigns.estTime,
      totalAmount: taskAssigns.totalAmount,
      statusId: taskAssigns.statusId,
      createdAt: taskAssigns.createdAt
    })
    .from(taskAssigns)
    .where(
      and(
        eq(taskAssigns.userId, userId),
        inArray(
          taskAssigns.statusId,
          [4, 5] // Completed, Cancelled
        )
      )
    )
    .orderBy(desc(taskAssigns.createdAt));
    
    // Get worker and service details for each task
    const taskIds = tasks.map(task => task.id);
    
    if (taskIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get status names
    const statusMap = await db.select()
      .from(statuses);
    
    const statusById = statusMap.reduce((acc, status) => {
      acc[status.id] = status.name;
      return acc;
    }, {} as Record<number, string>);
    
    // Get worker details
    const workerIds = [...new Set(tasks.map(task => task.workerId))];
    const workersMap = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(inArray(users.id, workerIds.map(id => parseInt(id, 10))));
    
    const workersById = workersMap.reduce((acc, worker) => {
      acc[worker.id] = worker;
      return acc;
    }, {} as Record<number, typeof workersMap[number]>);
    
    // Get service details
    const serviceIds = [...new Set(tasks.map(task => task.serviceId))];
    const servicesMap = await db.select({
      id: services.id,
      title: services.title,
      description: services.description
    })
    .from(services)
    .where(inArray(services.id, serviceIds));
    
    const servicesById = servicesMap.reduce((acc, service) => {
      acc[service.id] = service;
      return acc;
    }, {} as Record<number, typeof servicesMap[number]>);
    
    // Combine all data
    const tasksWithDetails = tasks.map(task => ({
      ...task,
      worker: workersById[parseInt(task.workerId, 10)] || null,
      service: servicesById[task.serviceId] || null,
      status: statusById[task.statusId] || 'Unknown'
    }));
    
    return res.status(200).json({
      success: true,
      data: tasksWithDetails
    });
  } catch (error) {
    console.error('Error fetching completed requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching completed requests'
    });
  }
}

export async function updateRequestStatus(req: Request, res: Response) {
  try {
    const { request_id, status_id } = req.body;
    
    if (!request_id || !status_id) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and status ID are required'
      });
    }
    
    // Validate status ID
    const validStatuses = [1, 2, 3, 4, 5]; // Pending, Accepted, In Progress, Completed, Cancelled
    if (!validStatuses.includes(parseInt(status_id, 10))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status ID'
      });
    }
    
    // Check if task exists
    const [existingTask] = await db.select()
      .from(taskAssigns)
      .where(eq(taskAssigns.id, parseInt(request_id, 10)))
      .limit(1);
    
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Update task status
    await db.update(taskAssigns)
      .set({ statusId: parseInt(status_id, 10) })
      .where(eq(taskAssigns.id, parseInt(request_id, 10)));
    
    return res.status(200).json({
      success: true,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating task status'
    });
  }
}
