import { Request, Response } from 'express';
import { db } from '../db';
import { 
  services, 
  categories, 
  subCategories,
  serviceImages,
  serviceSubCategories,
  users,
  serviceBoosted,
  InsertServiceImage,
  InsertService,
  InsertServiceSubCategory
} from '../../shared/schema';
import { eq, and, like, desc, inArray, sql } from 'drizzle-orm';
import { calculateDistance } from '../utils/helpers';

export async function addService(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { title, description, category_id, charges } = req.body;
    
    if (!title || !description || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category_id are required'
      });
    }
    
    // Create the service
    const [newService] = await db.insert(services).values({
      title,
      description,
      charges: charges ? parseInt(charges, 10) : 0,
      categoryId: parseInt(category_id, 10),
      userId: userId.toString(),
      createdAt: new Date()
    }).returning({ id: services.id });
    
    // Handle service sub-categories if provided
    if (req.body.subCategories && Array.isArray(req.body.subCategories)) {
      const subCatInserts: InsertServiceSubCategory[] = req.body.subCategories.map(
        (subCatId: number) => ({
          serviceId: newService.id,
          subCategoryId: subCatId,
          createdAt: new Date()
        })
      );
      
      if (subCatInserts.length > 0) {
        await db.insert(serviceSubCategories).values(subCatInserts);
      }
    }
    
    // Handle service images if provided
    if (req.files && Array.isArray(req.files)) {
      const imageInserts: InsertServiceImage[] = req.files.map(
        (file: Express.Multer.File) => ({
          serviceId: newService.id,
          imageName: file.filename,
          createdAt: new Date()
        })
      );
      
      if (imageInserts.length > 0) {
        await db.insert(serviceImages).values(imageInserts);
      }
    }
    
    return res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: { id: newService.id }
    });
  } catch (error) {
    console.error('Error adding service:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding service'
    });
  }
}

export async function updateService(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const serviceId = parseInt(req.params.id, 10);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }
    
    // Check if service exists and belongs to the user
    const [existingService] = await db.select()
      .from(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.userId, userId.toString())
        )
      )
      .limit(1);
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission to edit it'
      });
    }
    
    const { title, description, category_id, charges } = req.body;
    const updateData: Partial<InsertService> = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category_id) updateData.categoryId = parseInt(category_id, 10);
    if (charges) updateData.charges = parseInt(charges, 10);
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Update the service
    await db.update(services)
      .set(updateData)
      .where(eq(services.id, serviceId));
    
    // Handle service sub-categories if provided
    if (req.body.subCategories && Array.isArray(req.body.subCategories)) {
      // Delete existing sub-categories
      await db.delete(serviceSubCategories)
        .where(eq(serviceSubCategories.serviceId, serviceId));
      
      // Add new sub-categories
      const subCatInserts: InsertServiceSubCategory[] = req.body.subCategories.map(
        (subCatId: number) => ({
          serviceId,
          subCategoryId: subCatId,
          createdAt: new Date()
        })
      );
      
      if (subCatInserts.length > 0) {
        await db.insert(serviceSubCategories).values(subCatInserts);
      }
    }
    
    // Handle service images if provided
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Add new images
      const imageInserts: InsertServiceImage[] = req.files.map(
        (file: Express.Multer.File) => ({
          serviceId,
          imageName: file.filename,
          createdAt: new Date()
        })
      );
      
      if (imageInserts.length > 0) {
        await db.insert(serviceImages).values(imageInserts);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating service'
    });
  }
}

export async function deleteService(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const serviceId = parseInt(req.params.id, 10);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }
    
    // Check if service exists and belongs to the user
    const [existingService] = await db.select()
      .from(services)
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.userId, userId.toString())
        )
      )
      .limit(1);
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission to delete it'
      });
    }
    
    // Delete service images
    await db.delete(serviceImages)
      .where(eq(serviceImages.serviceId, serviceId));
    
    // Delete service sub-categories
    await db.delete(serviceSubCategories)
      .where(eq(serviceSubCategories.serviceId, serviceId));
    
    // Delete service boostings
    await db.delete(serviceBoosted)
      .where(eq(serviceBoosted.serviceId, serviceId));
    
    // Delete service
    await db.delete(services)
      .where(eq(services.id, serviceId));
    
    return res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting service'
    });
  }
}

export async function getServices(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string, 10) : null;
    const userId = req.query.user_id ? parseInt(req.query.user_id as string, 10) : null;
    
    // Build query conditions
    let whereClause = sql`1 = 1`; // Always true condition
    
    if (categoryId) {
      whereClause = and(whereClause, eq(services.categoryId, categoryId));
    }
    
    if (userId) {
      whereClause = and(whereClause, eq(services.userId, userId.toString()));
    }
    
    // Get services
    const servicesList = await db.select({
      id: services.id,
      title: services.title,
      description: services.description,
      charges: services.charges,
      categoryId: services.categoryId,
      userId: services.userId,
      createdAt: services.createdAt
    })
    .from(services)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(services.createdAt));
    
    // Get total count
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    })
    .from(services)
    .where(whereClause);
    
    // Get service images
    const serviceIds = servicesList.map(service => service.id);
    
    let imagesMap: Record<number, { id: number; serviceId: number; imageName: string }[]> = {};
    
    if (serviceIds.length > 0) {
      const serviceImagesData = await db.select({
        id: serviceImages.id,
        serviceId: serviceImages.serviceId,
        imageName: serviceImages.imageName
      })
      .from(serviceImages)
      .where(inArray(serviceImages.serviceId, serviceIds));
      
      // Group images by service ID
      imagesMap = serviceImagesData.reduce((acc, img) => {
        if (!acc[img.serviceId]) {
          acc[img.serviceId] = [];
        }
        acc[img.serviceId].push(img);
        return acc;
      }, {} as Record<number, { id: number; serviceId: number; imageName: string }[]>);
    }
    
    // Add images to services
    const servicesWithImages = servicesList.map(service => ({
      ...service,
      images: imagesMap[service.id] || []
    }));
    
    return res.status(200).json({
      success: true,
      data: servicesWithImages,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching services'
    });
  }
}

export async function getServiceById(req: Request, res: Response) {
  try {
    const serviceId = parseInt(req.params.id, 10);
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }
    
    // Get service details
    const [service] = await db.select({
      id: services.id,
      title: services.title,
      description: services.description,
      charges: services.charges,
      categoryId: services.categoryId,
      userId: services.userId,
      createdAt: services.createdAt
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get service images
    const serviceImagesData = await db.select({
      id: serviceImages.id,
      serviceId: serviceImages.serviceId,
      imageName: serviceImages.imageName
    })
    .from(serviceImages)
    .where(eq(serviceImages.serviceId, serviceId));
    
    // Get service provider info
    const [provider] = await db.select({
      id: users.id,
      fullName: users.fullName,
      profileImage: users.profileImage,
      userTypeId: users.userTypeId
    })
    .from(users)
    .where(eq(users.id, parseInt(service.userId, 10)))
    .limit(1);
    
    // Get category info
    const [category] = await db.select({
      id: categories.id,
      name: categories.name
    })
    .from(categories)
    .where(eq(categories.id, service.categoryId))
    .limit(1);
    
    // Get subcategories
    const subCategoriesData = await db.select({
      id: subCategories.id,
      name: subCategories.name
    })
    .from(subCategories)
    .innerJoin(
      serviceSubCategories,
      eq(serviceSubCategories.subCategoryId, subCategories.id)
    )
    .where(eq(serviceSubCategories.serviceId, serviceId));
    
    // Combine all data
    const serviceWithDetails = {
      ...service,
      images: serviceImagesData,
      provider,
      category,
      subCategories: subCategoriesData
    };
    
    return res.status(200).json({
      success: true,
      data: serviceWithDetails
    });
  } catch (error) {
    console.error('Error fetching service details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching service details'
    });
  }
}

export async function searchUstadgee(req: Request, res: Response) {
  try {
    const { search_string, user_id, lat, long, service_id } = req.body;
    
    let whereClause = sql`u.user_type = 2 OR u.user_type = 3`; // Ustadgee or Karigar
    
    if (search_string) {
      whereClause = and(
        whereClause,
        like(users.fullName, `%${search_string}%`)
      );
    }
    
    if (service_id) {
      whereClause = and(
        whereClause,
        eq(services.id, parseInt(service_id, 10))
      );
    }
    
    // Get service providers
    const providers = await db.select({
      id: users.id,
      fullName: users.fullName,
      phoneNumber: users.phoneNumber,
      profileImage: users.profileImage,
      userTypeId: users.userTypeId,
      latitude: users.latitude,
      longitude: users.longitude,
      servicesCount: sql<number>`(SELECT COUNT(*) FROM services s WHERE s.user_id = ${users.id.toString()})`
    })
    .from(users)
    .where(whereClause)
    .limit(50);
    
    // Calculate distance if coordinates provided
    if (lat && long) {
      const userLat = parseFloat(lat);
      const userLong = parseFloat(long);
      
      const providersWithDistance = providers.map(provider => {
        const providerLat = parseFloat(provider.latitude);
        const providerLong = parseFloat(provider.longitude);
        
        let distance = null;
        if (!isNaN(providerLat) && !isNaN(providerLong)) {
          distance = calculateDistance(userLat, userLong, providerLat, providerLong);
        }
        
        return {
          ...provider,
          distance
        };
      });
      
      // Sort by distance
      providersWithDistance.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
      
      return res.status(200).json({
        success: true,
        data: providersWithDistance
      });
    }
    
    return res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error searching Ustadgee:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while searching Ustadgee'
    });
  }
}

export async function boostService(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const { service_id, day_selected, payment_method, amount } = req.body;
    
    if (!service_id || !day_selected || !payment_method || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Service ID, days, payment method, and amount are required'
      });
    }
    
    // Check if service exists and belongs to the user
    const [existingService] = await db.select()
      .from(services)
      .where(
        and(
          eq(services.id, parseInt(service_id, 10)),
          eq(services.userId, userId.toString())
        )
      )
      .limit(1);
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission to boost it'
      });
    }
    
    // Create service boost
    const [newBoost] = await db.insert(serviceBoosted).values({
      serviceId: parseInt(service_id, 10),
      daySelected: parseInt(day_selected, 10),
      paymentMethod: payment_method,
      amount: parseInt(amount, 10),
      status: 1,
      createdAt: new Date()
    }).returning({ id: serviceBoosted.id });
    
    return res.status(201).json({
      success: true,
      message: 'Service boosted successfully',
      data: { id: newBoost.id }
    });
  } catch (error) {
    console.error('Error boosting service:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while boosting service'
    });
  }
}

export async function getCategories(req: Request, res: Response) {
  try {
    const categoriesList = await db.select().from(categories);
    
    return res.status(200).json({
      success: true,
      data: categoriesList
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
}

export async function getSubCategories(req: Request, res: Response) {
  try {
    const categoryId = req.query.category_id ? 
      parseInt(req.query.category_id as string, 10) : null;
    
    let query = db.select().from(subCategories);
    
    if (categoryId) {
      query = query.where(eq(subCategories.categoryId, categoryId));
    }
    
    const subCategoriesList = await query;
    
    return res.status(200).json({
      success: true,
      data: subCategoriesList
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching subcategories'
    });
  }
}
