import connectDB from '../../../lib/db';
import Product from '../../../models/Product';
import Composer from '../../../models/Composer';
import { protect, authorize } from '../../../middleware/auth';
import { corsMiddleware } from '../../../middleware/cors';
import { productCache } from '../../../lib/cache';
import { errorHandler, NotFoundError, ValidationError, successResponse, paginationResponse } from '../../../lib/errorHandler';
import { validate } from '../../../middleware/validation';
import { logger, performanceLogger } from '../../../middleware/logger';

const handler = async (req, res) => {
  const startTime = Date.now();
  await connectDB();

  switch (req.method) {
    case 'GET':
      const { category, composer, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;
      
      // Validate query parameters
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1) {
        throw new ValidationError('Page must be greater than 0');
      }
      
      if (limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Limit must be between 1 and 100');
      }
      
      // Build filter object
      const filters = {};
      if (category) filters.category = category;
      if (composer) filters.composer = composer;
      if (search) {
        filters.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      logger.info('Fetching products', { filters, page: pageNum, limit: limitNum });

      // Check cache first
      const cachedResult = await productCache.getProducts(filters);
      if (cachedResult) {
        res.setHeader('X-Cache', 'HIT');
        logger.info('Products served from cache');
        return res.status(200).json(cachedResult);
      }

      // Calculate pagination
      const skip = (pageNum - 1) * limitNum;
      const total = await Product.countDocuments(filters);
      
      // Get products with populated composer data
      const queryStart = Date.now();
      const products = await Product.find(filters)
        .populate({
          path: 'composer',
          select: 'nama biografi spesialisasi'
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum);
      
      const queryDuration = Date.now() - queryStart;
      performanceLogger.slowQuery(filters, queryDuration);

      const result = paginationResponse(products, pageNum, limitNum, total);
      
      // Cache the result for future requests
      await productCache.setProducts(filters, result, 300); // Cache for 5 minutes
      
      res.setHeader('X-Cache', 'MISS');
      logger.info('Products fetched successfully', { 
        count: products.length, 
        total, 
        duration: Date.now() - startTime 
      });
      
      res.status(200).json(result);
      break;

    case 'POST':
      // Validasi token dan role
      await protect(req, res, async () => {
        await authorize('admin', 'composer')(req, res, async () => {
          const { title, description, price, category, score, preview } = req.body;

          // Validasi input menggunakan validation middleware
          if (!title || !description || !price || !category || !score || !preview) {
            throw new ValidationError('All required fields must be provided', {
              title: !title ? 'Title is required' : undefined,
              description: !description ? 'Description is required' : undefined,
              price: !price ? 'Price is required' : undefined,
              category: !category ? 'Category is required' : undefined,
              score: !score ? 'Score is required' : undefined,
              preview: !preview ? 'Preview is required' : undefined
            });
          }

          // Additional validation
          if (price <= 0) {
            throw new ValidationError('Price must be greater than 0');
          }

          if (score < 0 || score > 5) {
            throw new ValidationError('Score must be between 0 and 5');
          }

          logger.info('Creating new product', { title, category, composer: req.user.id });

          // Buat produk baru
          const product = await Product.create({
            ...req.body,
            composer: req.user.id
          });

          // Clear product cache
          await productCache.clearProducts();

          logger.info('Product created successfully', { productId: product._id, title });

          const response = successResponse(product, 'Product created successfully', 201);
          res.status(201).json(response);
        });
      });
      break;

    default:
      res.status(405).json({
        success: false,
        message: 'Method not allowed'
      });
  }
};

// Apply CORS and error handling middleware
const corsHandler = async (req, res) => {
  return new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(errorHandler(handler)(req, res));
    });
  });
};

export default corsHandler;