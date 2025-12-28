import { Request, Response } from 'express';
import { resourcesService } from './resources-service';
import prisma from '../../config/database';
import { newsAPIService } from '../../services/news-api-service';
import { youtubeAPIService } from '../../services/youtube-api-service';
import { webScraperService } from '../../services/web-scraper-service';
import { foodistaService } from '../../services/foodista-service';

export const getAllResources = async (req: Request, res: Response) => {
  try {
    const resources = await resourcesService.getAllResources();
    res.json({ message: "Retrieved resources successfully", data: resources });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      message: 'Error fetching resources',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getAllResourceTags = async (req: Request, res: Response) => {
  try {
    const tags = await resourcesService.getAllResourceTags();
    res.json({ message: "Retrieved resource tags successfully", data: tags });
  } catch (error) {
    console.error('Error fetching resource tags:', error);
    res.status(500).json({
      message: 'Error fetching resource tags',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getResourceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const resource = await resourcesService.getResourceById(id);
    if (!resource) {
      return res.status(404).json({ message: `Resource with id ${id} not found` });
    }
    res.json({ message: `Retrieved resource ${id} successfully`, data: resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      message: 'Error fetching resource',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getPersonalizedRecommendations = async (req: Request, res: Response) => {
  try {
    // Get Clerk userId from authenticated request
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({
        message: 'Unauthorized: User ID not found',
      });
    }

    // Convert Clerk ID to database ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found in database',
      });
    }

    const recommendations = await resourcesService.getPersonalizedRecommendations(user.id);

    res.json({
      message: 'Retrieved personalized recommendations successfully',
      data: recommendations,
    });
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    res.status(500).json({
      message: 'Error fetching personalized recommendations',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Search external articles
export const searchExternalArticles = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        message: 'Search query is required',
      });
    }

    const articles = await newsAPIService.searchArticles([query], 20);

    res.json({
      message: 'Search completed successfully',
      data: articles,
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({
      message: 'Error searching articles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Search external videos
export const searchExternalVideos = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        message: 'Search query is required',
      });
    }

    const videos = await youtubeAPIService.searchVideos([query], 20);

    res.json({
      message: 'Search completed successfully',
      data: videos,
    });
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({
      message: 'Error searching videos',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Create custom resource
export const createResource = async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get database user ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resource = await resourcesService.createResource(user.id, req.body);

    res.status(201).json({
      message: 'Resource created successfully',
      data: resource,
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      message: 'Error creating resource',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update resource
export const updateResource = async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.auth?.userId;
    const { id } = req.params;

    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resource = await resourcesService.updateResource(user.id, id, req.body);

    res.json({
      message: 'Resource updated successfully',
      data: resource,
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
      error instanceof Error && error.message.includes('not authorized') ? 403 : 500;
    res.status(statusCode).json({
      message: 'Error updating resource',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete resource
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.auth?.userId;
    const { id } = req.params;

    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await resourcesService.deleteResource(user.id, id);

    res.json({
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 :
      error instanceof Error && error.message.includes('not authorized') ? 403 : 500;
    res.status(statusCode).json({
      message: 'Error deleting resource',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get Foodista RSS Feed
 */
export const getFoodistaFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await foodistaService.getLatestPosts();
    // Wrap in data object to be consistent with other endpoints and frontend expectations
    res.status(200).json({ data: posts });
  } catch (error) {
    console.error('Error getting Foodista feed:', error);
    res.status(500).json({ error: 'Failed to fetch Foodista feed' });
  }
};

/**
 * Import a resource from a URL (Scrape)
 */
export const importResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      res.status(401).json({ error: 'Unauthorized: User ID not found' });
      return;
    }

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found in database' });
      return;
    }

    const scrapedData = await webScraperService.scrapeRecipe(url);

    if (!scrapedData) {
      res.status(422).json({ error: 'Could not extract recipe data from this URL' });
      return;
    }

    // Create resource from scraped data using the service
    const resource = await resourcesService.createResource(user.id, {
      title: scrapedData.title,
      description: scrapedData.description || 'Imported recipe',
      url: scrapedData.url,
      type: 'Article', // Treat blogs as articles
      isPublic: false, // Private by default
      tags: ['Imported', 'Recipe', ...(scrapedData.ingredients ? scrapedData.ingredients.slice(0, 3) : [])]
    });

    res.status(201).json({
      message: 'Resource imported successfully',
      data: {
        resource,
        scrapedData // Return detailed data if needed
      }
    });

  } catch (error) {
    console.error('Error importing resource:', error);
    res.status(500).json({ error: 'Failed to import resource' });
  }
};

export const resourcesController = {
  getAllResources,
  getAllResourceTags,
  getResourceById,
  getPersonalizedRecommendations,
  searchArticles: searchExternalArticles, // Aliased to match router (searchArticles)
  searchVideos: searchExternalVideos,     // Aliased to match router (searchVideos)
  createResource,
  updateResource,
  deleteResource,
  getFoodistaFeed,
  importResource
};