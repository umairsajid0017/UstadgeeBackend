import { Request, Response } from 'express';
import { db } from '../db';
import { reviews, users, InsertReview } from '../../shared/schema';
import { eq, and, desc, avg, sql } from 'drizzle-orm';

export async function addReview(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { worker_id, rating, description } = req.body;
    
    if (!worker_id || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID and rating are required'
      });
    }
    
    // Check if worker exists
    const [worker] = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(worker_id, 10)))
      .limit(1);
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Check if user has already reviewed this worker
    const existingReview = await db.select()
      .from(reviews)
      .where(
        and(
          eq(reviews.workerId, parseInt(worker_id, 10)),
          eq(reviews.userId, userId)
        )
      )
      .limit(1);
    
    if (existingReview.length > 0) {
      // Update existing review
      await db.update(reviews)
        .set({
          rating: parseInt(rating, 10),
          description: description || ''
        })
        .where(
          and(
            eq(reviews.workerId, parseInt(worker_id, 10)),
            eq(reviews.userId, userId)
          )
        );
      
      return res.status(200).json({
        success: true,
        message: 'Review updated successfully'
      });
    }
    
    // Add new review
    const newReview: InsertReview = {
      workerId: parseInt(worker_id, 10),
      userId: userId,
      rating: parseInt(rating, 10),
      description: description || ''
    };
    
    const [insertedReview] = await db.insert(reviews)
      .values(newReview)
      .returning({ id: reviews.id });
    
    return res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: { id: insertedReview.id }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('worker_user_idx')) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this worker'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error while adding review'
    });
  }
}

export async function showReviews(req: Request, res: Response) {
  try {
    const workerId = req.body.worker_id || req.params.worker_id;
    
    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID is required'
      });
    }
    
    // Get worker reviews
    const workerReviews = await db.select({
      id: reviews.id,
      rating: reviews.rating,
      description: reviews.description,
      userId: reviews.userId,
      createdAt: reviews.createdAt
    })
    .from(reviews)
    .where(eq(reviews.workerId, parseInt(workerId, 10)))
    .orderBy(desc(reviews.createdAt));
    
    // Get average rating
    const [averageRating] = await db.select({
      average: avg(reviews.rating).as('average')
    })
    .from(reviews)
    .where(eq(reviews.workerId, parseInt(workerId, 10)));
    
    // Get user details for each review
    const userIds = workerReviews.map(review => review.userId);
    
    const usersMap = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage
    })
    .from(users)
    .where(sql`${users.id} IN (${userIds})`);
    
    const usersById = usersMap.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, typeof usersMap[number]>);
    
    // Combine reviews with user data
    const reviewsWithUserData = workerReviews.map(review => ({
      ...review,
      user: usersById[review.userId] || null
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        reviews: reviewsWithUserData,
        average_rating: averageRating.average || 0,
        total_reviews: workerReviews.length
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching reviews'
    });
  }
}
