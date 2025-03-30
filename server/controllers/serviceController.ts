import { Request, Response } from 'express';
import prisma from '../db';
import { calculateDistance } from '../utils/helpers';

// Add a new service
export async function addService(req: Request, res: Response) {
  try {
    const { title, description, charges, category_id, sub_category_ids, image_names } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Create service
    const service = await prisma.services.create({
      data: {
        title,
        description,
        charges: Number(charges),
        category_id: Number(category_id),
        user_id: req.user.phoneNumber
      }
    });
    
    // Add service images
    if (image_names && Array.isArray(image_names)) {
      for (const image_name of image_names) {
        await prisma.service_images.create({
          data: {
            service_id: service.id,
            image_name
          }
        });
      }
    }
    
    // Add subcategories
    if (sub_category_ids && Array.isArray(sub_category_ids)) {
      for (const sub_category_id of sub_category_ids) {
        await prisma.service_subCategories.create({
          data: {
            service_id: service.id,
            sub_category_id: Number(sub_category_id)
          }
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Service added successfully',
      data: service
    });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Update a service
export async function updateService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, description, charges, category_id } = req.body;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Check if service exists and belongs to user
    const existingService = await prisma.services.findFirst({
      where: {
        id: Number(id),
        user_id: req.user.phoneNumber
      }
    });
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission'
      });
    }
    
    // Update service
    const updatedService = await prisma.services.update({
      where: { id: Number(id) },
      data: {
        title,
        description,
        charges: Number(charges),
        category_id: Number(category_id)
      }
    });
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Delete a service
export async function deleteService(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    
    // Check if service exists and belongs to user
    const existingService = await prisma.services.findFirst({
      where: {
        id: Number(id),
        user_id: req.user.phoneNumber
      }
    });
    
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you do not have permission'
      });
    }
    
    // Delete service
    await prisma.services.delete({
      where: { id: Number(id) }
    });
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get all services
export async function getServices(req: Request, res: Response) {
  try {
    // Get all services
    const services = await prisma.services.findMany();
    
    // Format services with images, subcategories, and other data
    const formattedServices = await Promise.all(services.map(async (service) => {
      // Get service images
      const images = await prisma.service_images.findMany({
        where: { service_id: service.id }
      });
      
      // Get service provider
      const provider = await prisma.users.findFirst({
        where: { phone_number: service.user_id }
      });
      
      // Get category
      const category = await prisma.category.findUnique({
        where: { id: service.category_id }
      });
      
      // Get subcategories
      const subCategoryRelations = await prisma.service_subCategories.findMany({
        where: { service_id: service.id }
      });
      
      const subCategoryIds = subCategoryRelations.map(rel => rel.sub_category_id);
      
      const subCategories = await prisma.sub_category.findMany({
        where: { id: { in: subCategoryIds } }
      });
      
      // Return formatted service
      return {
        ...service,
        images: images.map(img => img.image_name),
        provider: provider ? {
          id: provider.id,
          fullName: provider.full_name,
          phoneNumber: provider.phone_number,
          profileImage: provider.profile_image
        } : null,
        category: category?.name || '',
        subCategories: subCategories.map(sc => sc.name)
      };
    }));
    
    res.json({
      success: true,
      data: formattedServices
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get a service by ID
export async function getServiceById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Get service
    const service = await prisma.services.findUnique({
      where: { id: Number(id) }
    });
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    // Get service images
    const images = await prisma.service_images.findMany({
      where: { service_id: service.id }
    });
    
    // Get service provider
    const provider = await prisma.users.findFirst({
      where: { phone_number: service.user_id }
    });
    
    // Get category
    const category = await prisma.category.findUnique({
      where: { id: service.category_id }
    });
    
    // Get subcategories
    const subCategoryRelations = await prisma.service_subCategories.findMany({
      where: { service_id: service.id }
    });
    
    const subCategoryIds = subCategoryRelations.map(rel => rel.sub_category_id);
    
    const subCategories = await prisma.sub_category.findMany({
      where: { id: { in: subCategoryIds } }
    });
    
    // Return formatted service
    const formattedService = {
      ...service,
      images: images.map(img => img.image_name),
      provider: provider ? {
        id: provider.id,
        fullName: provider.full_name,
        phoneNumber: provider.phone_number,
        profileImage: provider.profile_image
      } : null,
      category: category?.name || '',
      subCategories: subCategories.map(sc => sc.name)
    };
    
    res.json({
      success: true,
      data: formattedService
    });
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Search for services
export async function searchUstadgee(req: Request, res: Response) {
  try {
    const { query, latitude, longitude, category_id, distance, price_min, price_max } = req.body;
    
    // Base query
    let whereClause: any = {};
    
    // Search by title or description
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Filter by category
    if (category_id) {
      whereClause.category_id = Number(category_id);
    }
    
    // Filter by price range
    if (price_min !== undefined) {
      whereClause.charges = { ...whereClause.charges, gte: Number(price_min) };
    }
    
    if (price_max !== undefined) {
      whereClause.charges = { ...whereClause.charges, lte: Number(price_max) };
    }
    
    // Get services
    const services = await prisma.services.findMany({
      where: whereClause
    });
    
    // Format and filter by distance if needed
    let formattedServices = await Promise.all(services.map(async (service) => {
      // Get service images
      const images = await prisma.service_images.findMany({
        where: { service_id: service.id }
      });
      
      // Get service provider
      const provider = await prisma.users.findFirst({
        where: { phone_number: service.user_id }
      });
      
      // Get category
      const category = await prisma.category.findUnique({
        where: { id: service.category_id }
      });
      
      // Calculate distance if coordinates are provided
      let serviceDistance = null;
      if (latitude && longitude && provider) {
        const providerLat = parseFloat(provider.latitude);
        const providerLon = parseFloat(provider.longitude);
        
        if (!isNaN(providerLat) && !isNaN(providerLon)) {
          serviceDistance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            providerLat,
            providerLon
          );
        }
      }
      
      // Return formatted service with distance
      return {
        ...service,
        images: images.map(img => img.image_name),
        provider: provider ? {
          id: provider.id,
          fullName: provider.full_name,
          phoneNumber: provider.phone_number,
          profileImage: provider.profile_image
        } : null,
        category: category?.name || '',
        distance: serviceDistance
      };
    }));
    
    // Filter by distance if specified
    if (distance && latitude && longitude) {
      formattedServices = formattedServices.filter(
        service => service.distance !== null && service.distance <= parseFloat(distance)
      );
    }
    
    // Sort by distance if available
    if (latitude && longitude) {
      formattedServices.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    
    res.json({
      success: true,
      data: formattedServices
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Boost a service
export async function boostService(req: Request, res: Response) {
  try {
    const { service_id, day_selected, payment_method, amount } = req.body;
    
    // Create service boost record
    const boostedService = await prisma.service_boosted.create({
      data: {
        service_id: Number(service_id),
        day_selected: Number(day_selected),
        payment_method,
        amount: Number(amount)
      }
    });
    
    // Create payment method record
    await prisma.payment_methods.create({
      data: {
        service_boosted_id: boostedService.id,
        payment_method,
        amount: amount.toString()
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Service boosted successfully',
      data: boostedService
    });
  } catch (error) {
    console.error('Boost service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get categories
export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.category.findMany();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Get subcategories
export async function getSubCategories(req: Request, res: Response) {
  try {
    const { category_id } = req.params;
    
    const subCategories = await prisma.sub_category.findMany({
      where: { category_id: Number(category_id) }
    });
    
    res.json({
      success: true,
      data: subCategories
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}