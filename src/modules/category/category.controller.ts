/**
 * Category Controller
 *
 * RESTful API endpoints for Category CRUD operations.
 * Protected by JWT authentication via AuthGuard.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
import { AuthGuard } from '../../guards/auth.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Create a new category
   * POST /categories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'Creates a new product category. Name must be unique. Slug is auto-generated if not provided.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    schema: {
      example: {
        message: 'Category created successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          slug: 'electronics',
          description: 'All electronic devices and accessories',
          parentId: null,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          id: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name or slug already exists',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * Get all categories
   * GET /categories
   */
  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description:
      'Retrieves all active categories. Optionally populate parent category info.',
  })
  @ApiQuery({
    name: 'populate',
    required: false,
    type: Boolean,
    description: 'Populate parent category info',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        message: 'Categories retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            slug: 'electronics',
            description: 'All electronic devices and accessories',
            parentId: null,
            isActive: true,
            isDeleted: false,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
            id: '507f1f77bcf86cd799439011',
          },
          {
            _id: '507f1f77bcf86cd799439012',
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Mobile phones and tablets',
            parentId: {
              _id: '507f1f77bcf86cd799439011',
              name: 'Electronics',
              slug: 'electronics',
            },
            isActive: true,
            isDeleted: false,
            createdAt: '2024-01-16T10:30:00.000Z',
            updatedAt: '2024-01-16T10:30:00.000Z',
            id: '507f1f77bcf86cd799439012',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('populate') populate?: string) {
    const populateParent = populate === 'true';
    const categories = await this.categoryService.findAll(populateParent);
    return {
      message: 'Categories retrieved successfully',
      data: categories,
    };
  }

  /**
   * Get a single category by ID
   * GET /categories/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description:
      'Retrieves a single category by its MongoDB ObjectId. Optionally populate parent.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
  @ApiQuery({
    name: 'populate',
    required: false,
    type: Boolean,
    description: 'Populate parent category info',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    schema: {
      example: {
        message: 'Category retrieved successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          slug: 'electronics',
          description: 'All electronic devices and accessories',
          parentId: null,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
          id: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id') id: string,
    @Query('populate') populate?: string,
  ) {
    const populateParent = populate === 'true';
    const category = await this.categoryService.findOne(id, populateParent);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  /**
   * Update an existing category
   * PATCH /categories/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category',
    description:
      'Updates an existing category. Only provided fields will be modified.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    schema: {
      example: {
        message: 'Category updated successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Updated Electronics',
          slug: 'updated-electronics',
          description: 'Updated description',
          parentId: null,
          isActive: true,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-16T14:20:00.000Z',
          id: '507f1f77bcf86cd799439011',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - name or slug already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoryService.update(id, updateCategoryDto);
    return {
      message: 'Category updated successfully',
      data: category,
    };
  }

  /**
   * Soft delete a category
   * DELETE /categories/:id
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a category (soft delete)',
    description:
      'Soft deletes a category by setting isDeleted to true. Category can be restored.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
    schema: {
      example: {
        message: 'Category deleted successfully',
        id: '507f1f77bcf86cd799439011',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async softDelete(@Param('id') id: string) {
    return await this.categoryService.softDelete(id);
  }

  /**
   * Get products in a category
   * GET /categories/:id/products
   */
  @Get(':id/products')
  @ApiOperation({
    summary: 'Get products in category',
    description:
      'Retrieves all products belonging to a specific category. Optionally populate category info on products.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
  @ApiQuery({
    name: 'populate',
    required: false,
    type: Boolean,
    description: 'Populate category info on products',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        message: 'Products retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439021',
            sku: 'SKU-001-BLK-L',
            name: 'Premium Wireless Headphones',
            slug: 'premium-wireless-headphones',
            price: 2990000,
            salePrice: 2490000,
            status: 'ACTIVE',
            categoryId: {
              _id: '507f1f77bcf86cd799439011',
              name: 'Electronics',
              slug: 'electronics',
            },
            isInStock: true,
            stockQuantity: 100,
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findProducts(
    @Param('id') id: string,
    @Query('populate') populate?: string,
  ) {
    const populateCategory = populate === 'true';
    const products = await this.categoryService.findProducts(
      id,
      populateCategory,
    );
    return {
      message: 'Products retrieved successfully',
      data: products,
    };
  }

  /**
   * Restore a soft-deleted category
   * PATCH /categories/:id/restore
   */
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a deleted category',
    description:
      'Restores a soft-deleted category by setting isDeleted to false.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Category restored successfully',
    schema: {
      example: {
        message: 'Category restored successfully',
        data: {
          _id: '507f1f77bcf86cd799439011',
          name: 'Electronics',
          slug: 'electronics',
          isDeleted: false,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Deleted category not found' })
  async restore(@Param('id') id: string) {
    const category = await this.categoryService.restore(id);
    return {
      message: 'Category restored successfully',
      data: category,
    };
  }

  /**
   * Get child categories of a parent
   * GET /categories/:id/children
   */
  @Get(':id/children')
  @ApiOperation({
    summary: 'Get child categories',
    description: 'Retrieves all child categories of a specific parent category.',
  })
  @ApiParam({ name: 'id', description: 'Parent category MongoDB ObjectId' })
  @ApiResponse({
    status: 200,
    description: 'Child categories retrieved successfully',
    schema: {
      example: {
        message: 'Child categories retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439012',
            name: 'Smartphones',
            slug: 'smartphones',
            parentId: '507f1f77bcf86cd799439011',
            isActive: true,
            isDeleted: false,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findChildren(@Param('id') id: string) {
    const children = await this.categoryService.findChildren(id);
    return {
      message: 'Child categories retrieved successfully',
      data: children,
    };
  }

  /**
   * Get root categories (no parent)
   * GET /categories/root
   */
  @Get('root/list')
  @ApiOperation({
    summary: 'Get root categories',
    description:
      'Retrieves all root categories (categories without a parent).',
  })
  @ApiResponse({
    status: 200,
    description: 'Root categories retrieved successfully',
    schema: {
      example: {
        message: 'Root categories retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            slug: 'electronics',
            isActive: true,
            isDeleted: false,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findRootCategories() {
    const categories = await this.categoryService.findRootCategories();
    return {
      message: 'Root categories retrieved successfully',
      data: categories,
    };
  }
}
