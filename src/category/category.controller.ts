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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto, CategorySortByField, SortOrder } from './dto/query-category.dto';
import { CategoryStatus } from './schemas/category.schema';

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
    description: 'Creates a new category with the provided data. Slug must be unique.',
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
          description: 'Electronic devices and accessories',
          imageUrl: 'https://example.com/images/electronics.jpg',
          parentId: null,
          status: 'ACTIVE',
          sortOrder: 0,
          level: 0,
          ancestors: [],
          productCount: 0,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryService.create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: category,
    };
  }

  /**
   * Get all categories with filtering, pagination, and sorting
   * GET /categories
   */
  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Retrieves a paginated list of categories with optional filtering and sorting.',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, description' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filter by parent ID (use "root" for root categories)' })
  @ApiQuery({ name: 'status', required: false, enum: CategoryStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'level', required: false, type: Number, description: 'Filter by hierarchy level' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number or "all" for all records' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: CategorySortByField, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: SortOrder, description: 'Sort order (asc/desc)' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      example: {
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            slug: 'electronics',
            status: 'ACTIVE',
            sortOrder: 0,
            level: 0,
            productCount: 150,
            createdAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        pagination: {
          total: 50,
          page: 1,
          limit: 10,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllCategories(@Query() queryDto: QueryCategoryDto) {
    return await this.categoryService.findAll(queryDto);
  }

  /**
   * Get category tree (hierarchical structure)
   * GET /categories/tree
   */
  @Get('tree')
  @ApiOperation({
    summary: 'Get category tree',
    description: 'Retrieves categories in a hierarchical tree structure.',
  })
  @ApiQuery({ name: 'parentId', required: false, description: 'Parent ID to get subtree (omit or "root" for full tree from root)' })
  @ApiResponse({
    status: 200,
    description: 'Category tree retrieved successfully',
    schema: {
      example: {
        message: 'Category tree retrieved successfully',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            name: 'Electronics',
            slug: 'electronics',
            level: 0,
            children: [
              {
                _id: '507f1f77bcf86cd799439012',
                name: 'Phones',
                slug: 'phones',
                level: 1,
                children: [],
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategoryTree(@Query('parentId') parentId?: string) {
    const tree = await this.categoryService.getCategoryTree(parentId);
    return {
      message: 'Category tree retrieved successfully',
      data: tree,
    };
  }

  /**
   * Get a single category by ID
   * GET /categories/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieves a single category by its MongoDB ObjectId.',
  })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId' })
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
          description: 'Electronic devices and accessories',
          imageUrl: 'https://example.com/images/electronics.jpg',
          parentId: null,
          status: 'ACTIVE',
          sortOrder: 0,
          level: 0,
          ancestors: [],
          productCount: 150,
          isDeleted: false,
          createdAt: '2024-01-15T10:30:00.000Z',
          updatedAt: '2024-01-15T10:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryById(@Param('id') id: string) {
    const category = await this.categoryService.findById(id);
    return {
      message: 'Category retrieved successfully',
      data: category,
    };
  }

  /**
   * Update an existing category
   * PUT /categories/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates an existing category. Only provided fields will be modified.',
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
          status: 'ACTIVE',
          updatedAt: '2024-01-16T14:20:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Conflict - slug already exists' })
  async updateCategory(
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
    description: 'Soft deletes a category by setting isDeleted to true. Category can be restored. Cannot delete if has children.',
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
  @ApiResponse({ status: 400, description: 'Invalid category ID format or has children' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return await this.categoryService.delete(id);
  }

  /**
   * Restore a soft-deleted category
   * PATCH /categories/:id/restore
   */
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore a deleted category',
    description: 'Restores a soft-deleted category by setting isDeleted to false.',
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
          isDeleted: false,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid category ID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Deleted category not found' })
  async restoreCategory(@Param('id') id: string) {
    const category = await this.categoryService.restore(id);
    return {
      message: 'Category restored successfully',
      data: category,
    };
  }
}
