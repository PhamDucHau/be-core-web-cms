/**
 * Product Controller
 *
 * RESTful API endpoints for Product CRUD operations.
 * Protected by JWT authentication via AuthGuard.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, SortByField, SortOrder } from './dto/query-product.dto';
import { ProductStatus } from './schemas/product.schema';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product
   * POST /products
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Creates a new product with the provided data. SKU must be unique.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        sku: 'SKU-001-BLK-L',
        name: 'Premium Wireless Headphones',
        slug: 'premium-wireless-headphones',
        description: 'Experience crystal-clear audio...',
        price: 2990000,
        salePrice: 2490000,
        currency: 'VND',
        stockQuantity: 100,
        isInStock: true,
        status: 'ACTIVE',
        categoryId: '507f1f77bcf86cd799439012',
        brand: 'Sony',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        images: ['https://example.com/img1.jpg'],
        tags: ['electronics', 'audio'],
        ratingAverage: 0,
        ratingCount: 0,
        isDeleted: false,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 409, description: 'Conflict - SKU or slug already exists' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    const product = await this.productService.create(createProductDto);
    return {
      message: 'Product created successfully',
      data: product,
    };
  }

  /**
   * Get all products with filtering, pagination, and sorting
   * GET /products
   */
  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Retrieves a paginated list of products with optional filtering and sorting.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, SKU, description' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'brand', required: false, description: 'Filter by brand' })
  @ApiQuery({ name: 'isInStock', required: false, type: Boolean, description: 'Filter by stock availability' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number or "all" for all records' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: SortByField, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder, description: 'Sort order (asc/desc)' })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            sku: 'SKU-001-BLK-L',
            name: 'Premium Wireless Headphones',
            slug: 'premium-wireless-headphones',
            price: 2990000,
            salePrice: 2490000,
            status: 'ACTIVE',
            isInStock: true,
            stockQuantity: 100,
            thumbnailUrl: 'https://example.com/thumb.jpg',
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        pagination: {
          total: 100,
          page: 1,
          limit: 10,
          totalPages: 10,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllProducts(@Query() queryDto: QueryProductDto) {
    return await this.productService.findAll(queryDto);
  }

  /**
   * Get a single product by ID
   * GET /products/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieves a single product by its MongoDB ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    schema: {
      example: {
        message: 'Product retrieved successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          sku: 'SKU-001-BLK-L',
          name: 'Premium Wireless Headphones',
          slug: 'premium-wireless-headphones',
          description: 'Experience crystal-clear audio...',
          shortDescription: 'Premium wireless headphones',
          price: 2990000,
          salePrice: 2490000,
          currency: 'VND',
          stockQuantity: 100,
          isInStock: true,
          status: 'ACTIVE',
          categoryId: '507f1f77bcf86cd799439012',
          brand: 'Sony',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          images: ['https://example.com/img1.jpg'],
          weight: 250,
          dimensions: { length: 20, width: 18, height: 8 },
          tags: ['electronics', 'audio'],
          ratingAverage: 4.5,
          ratingCount: 150,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid product ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    return {
      message: 'Product retrieved successfully',
      data: product,
    };
  }

  /**
   * Update an existing product
   * PUT /products/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a product',
    description: 'Updates an existing product. Only provided fields will be modified.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      example: {
        message: 'Product updated successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          sku: 'SKU-001-BLK-L',
          name: 'Updated Wireless Headphones',
          slug: 'updated-wireless-headphones',
          price: 2790000,
          status: 'ACTIVE',
          updatedAt: '2024-01-16T14:20:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Conflict - SKU or slug already exists' })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productService.update(id, updateProductDto);
    return {
      message: 'Product updated successfully',
      data: product,
    };
  }

  /**
   * Soft delete a product
   * DELETE /products/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a product (soft delete)',
    description: 'Soft deletes a product by setting isDeleted to true. Product can be restored.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        message: 'Product deleted successfully',
        id: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid product ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string) {
    return await this.productService.delete(id);
  }

  /**
   * Restore a soft-deleted product
   * PATCH /products/:id/restore
   */
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a deleted product',
    description: 'Restores a soft-deleted product by setting isDeleted to false.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Product restored successfully',
    schema: {
      example: {
        message: 'Product restored successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Premium Wireless Headphones',
          isDeleted: false,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid product ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Deleted product not found' })
  async restoreProduct(@Param('id') id: string) {
    const product = await this.productService.restore(id);
    return {
      message: 'Product restored successfully',
      data: product,
    };
  }

  /**
   * Update product stock
   * PATCH /products/:id/stock
   */
  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Update product stock',
    description: 'Updates the stock quantity of a product. isInStock is auto-calculated.',
  })
  @ApiParam({ name: 'id', description: 'Product MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    schema: {
      example: {
        message: 'Stock updated successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          stockQuantity: 50,
          isInStock: true,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid product ID or quantity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    const product = await this.productService.updateStock(id, quantity);
    return {
      message: 'Stock updated successfully',
      data: product,
    };
  }

  /**
   * Bulk update product status
   * PATCH /products/bulk/status
   */
  @Patch('bulk/status')
  @ApiOperation({
    summary: 'Bulk update product status',
    description: 'Updates the status of multiple products at once.',
  })
  @ApiResponse({
    status: 200,
    description: 'Products updated successfully',
    schema: {
      example: {
        message: 'Products updated successfully',
        modifiedCount: 5,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: ProductStatus,
  ) {
    const result = await this.productService.bulkUpdateStatus(ids, status);
    return {
      message: 'Products updated successfully',
      ...result,
    };
  }
}
