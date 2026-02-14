/**
 * Category Service
 *
 * Business logic layer for Category CRUD operations.
 * Handles data validation, transformation, and database operations.
 * Supports hierarchical category structure with parent-child relationships.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Category, CategoryStatus } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { QueryCategoryDto, CategorySortByField, SortOrder } from './dto/query-category.dto';

/**
 * Helper function to remove Vietnamese tones for search
 * Enables searching without accent marks
 */
function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

/**
 * Generate URL-friendly slug from category name
 * @param name - Category name to convert
 * @returns URL-safe slug string
 */
function generateSlug(name: string): string {
  return removeVietnameseTones(name)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  /**
   * Create a new category
   * @param createCategoryDto - Category data
   * @returns Created category
   * @throws BadRequestException if validation fails
   * @throws ConflictException if slug already exists
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Generate slug if not provided
      let slug = createCategoryDto.slug;
      if (!slug) {
        slug = generateSlug(createCategoryDto.name);
      }

      // Check if slug already exists and make it unique
      let slugExists = await this.categoryModel.findOne({ slug, isDeleted: false });
      let slugCounter = 1;
      const originalSlug = slug;
      while (slugExists) {
        slug = `${originalSlug}-${slugCounter}`;
        slugExists = await this.categoryModel.findOne({ slug, isDeleted: false });
        slugCounter++;
      }

      // Initialize level and ancestors
      let level = 0;
      let ancestors: Types.ObjectId[] = [];

      // If parentId is provided, validate and get parent info
      if (createCategoryDto.parentId) {
        if (!Types.ObjectId.isValid(createCategoryDto.parentId)) {
          throw new BadRequestException('Invalid parent category ID format');
        }

        const parentCategory = await this.categoryModel.findOne({
          _id: createCategoryDto.parentId,
          isDeleted: false,
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        // Set level and ancestors based on parent
        level = parentCategory.level + 1;
        ancestors = [...parentCategory.ancestors, parentCategory._id as Types.ObjectId];
      }

      // Prepare category data
      const categoryData = {
        ...createCategoryDto,
        slug,
        level,
        ancestors,
        parentId: createCategoryDto.parentId
          ? new Types.ObjectId(createCategoryDto.parentId)
          : null,
      };

      // Create and save the category
      const newCategory = new this.categoryModel(categoryData);
      const savedCategory = await newCategory.save();

      return savedCategory;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }

      throw new BadRequestException('Failed to create category');
    }
  }

  /**
   * Find all categories with filtering, pagination, and sorting
   * @param queryDto - Query parameters
   * @returns Paginated category list with metadata
   */
  async findAll(queryDto: QueryCategoryDto): Promise<{
    data: Category[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    // Parse pagination
    const isGetAll = queryDto.page === 'all';
    const page = isGetAll ? 1 : parseInt(queryDto.page || '1', 10) || 1;
    const limit = isGetAll ? Number.MAX_SAFE_INTEGER : queryDto.limit || 10;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: FilterQuery<Category> = {
      isDeleted: false, // Always exclude soft-deleted categories
    };

    // Filter by status
    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    // Filter by parentId
    if (queryDto.parentId) {
      if (queryDto.parentId === 'root') {
        // Get only root categories (no parent)
        filter.parentId = null;
      } else if (Types.ObjectId.isValid(queryDto.parentId)) {
        filter.parentId = new Types.ObjectId(queryDto.parentId);
      }
    }

    // Filter by level
    if (queryDto.level !== undefined) {
      filter.level = queryDto.level;
    }

    // Build sort options
    const sortBy = queryDto.sortBy || CategorySortByField.SORT_ORDER;
    const sortOrder = queryDto.sortOrder === SortOrder.DESC ? -1 : 1;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    // Handle search with Vietnamese tone removal
    if (queryDto.search && queryDto.search.trim()) {
      const searchTerm = queryDto.search.trim().toLowerCase();
      const normalizedSearch = removeVietnameseTones(searchTerm);

      // Get all matching documents for search
      const allCategories = await this.categoryModel
        .find(filter)
        .sort(sortOptions)
        .exec();

      // Filter in application layer for better Vietnamese search support
      const filteredCategories = allCategories.filter((category) => {
        const nameLower = category.name.toLowerCase();
        const nameNormalized = removeVietnameseTones(nameLower);
        const descLower = (category.description || '').toLowerCase();
        const descNormalized = removeVietnameseTones(descLower);

        // Check if search term matches name or description
        return (
          nameLower.includes(searchTerm) ||
          nameNormalized.includes(normalizedSearch) ||
          descLower.includes(searchTerm) ||
          descNormalized.includes(normalizedSearch)
        );
      });

      const total = filteredCategories.length;

      // Apply pagination
      if (isGetAll) {
        return {
          data: filteredCategories,
          pagination: {
            total,
            page: 1,
            limit: total,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      const totalPages = Math.ceil(total / limit);
      const data = filteredCategories.slice(skip, skip + limit);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    }

    // No search - use standard MongoDB query with pagination
    const total = await this.categoryModel.countDocuments(filter);

    if (isGetAll) {
      const data = await this.categoryModel.find(filter).sort(sortOptions).exec();

      return {
        data,
        pagination: {
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const data = await this.categoryModel
      .find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find a single category by ID
   * @param id - Category ID
   * @returns Category document
   * @throws NotFoundException if category not found
   * @throws BadRequestException if ID format is invalid
   */
  async findById(id: string): Promise<Category> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Find a single category by slug
   * @param slug - Category slug
   * @returns Category document
   * @throws NotFoundException if category not found
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({
      slug,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Get category tree (hierarchical structure)
   * @param parentId - Optional parent ID to get subtree
   * @returns Hierarchical category structure
   */
  async getCategoryTree(parentId?: string): Promise<any[]> {
    const filter: FilterQuery<Category> = { isDeleted: false };

    if (parentId && parentId !== 'root') {
      if (!Types.ObjectId.isValid(parentId)) {
        throw new BadRequestException('Invalid parent category ID format');
      }
      filter.parentId = new Types.ObjectId(parentId);
    } else {
      filter.parentId = null;
    }

    const categories = await this.categoryModel
      .find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .exec();

    // Recursively build tree
    const buildTree = async (cats: Category[]): Promise<any[]> => {
      const result = [];
      for (const cat of cats) {
        const children = await this.categoryModel
          .find({ parentId: cat._id, isDeleted: false })
          .sort({ sortOrder: 1, name: 1 })
          .exec();

        result.push({
          ...cat.toJSON(),
          children: children.length > 0 ? await buildTree(children) : [],
        });
      }
      return result;
    };

    return buildTree(categories);
  }

  /**
   * Update an existing category
   * @param id - Category ID
   * @param updateCategoryDto - Fields to update
   * @returns Updated category
   * @throws NotFoundException if category not found
   * @throws BadRequestException if validation fails
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    try {
      const category = await this.categoryModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }

      // Handle slug update
      if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
        const existingSlug = await this.categoryModel.findOne({
          slug: updateCategoryDto.slug,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingSlug) {
          throw new ConflictException(`Slug "${updateCategoryDto.slug}" already exists`);
        }
      }

      // Auto-generate slug if name is updated and slug is not provided
      if (updateCategoryDto.name && !updateCategoryDto.slug) {
        let newSlug = generateSlug(updateCategoryDto.name);
        let slugExists = await this.categoryModel.findOne({
          slug: newSlug,
          _id: { $ne: id },
          isDeleted: false,
        });

        let slugCounter = 1;
        const originalSlug = newSlug;
        while (slugExists) {
          newSlug = `${originalSlug}-${slugCounter}`;
          slugExists = await this.categoryModel.findOne({
            slug: newSlug,
            _id: { $ne: id },
            isDeleted: false,
          });
          slugCounter++;
        }
        updateCategoryDto.slug = newSlug;
      }

      // Handle parent change
      if (updateCategoryDto.parentId !== undefined) {
        if (updateCategoryDto.parentId === null) {
          // Moving to root level
          category.parentId = null;
          category.level = 0;
          category.ancestors = [];
        } else if (updateCategoryDto.parentId) {
          // Prevent setting self as parent
          if (updateCategoryDto.parentId === id) {
            throw new BadRequestException('Category cannot be its own parent');
          }

          if (!Types.ObjectId.isValid(updateCategoryDto.parentId)) {
            throw new BadRequestException('Invalid parent category ID format');
          }

          const parentCategory = await this.categoryModel.findOne({
            _id: updateCategoryDto.parentId,
            isDeleted: false,
          });

          if (!parentCategory) {
            throw new NotFoundException('Parent category not found');
          }

          // Prevent circular reference
          if (parentCategory.ancestors.some(a => a.toString() === id)) {
            throw new BadRequestException('Cannot set a descendant as parent (circular reference)');
          }

          category.parentId = new Types.ObjectId(updateCategoryDto.parentId);
          category.level = parentCategory.level + 1;
          category.ancestors = [...parentCategory.ancestors, parentCategory._id as Types.ObjectId];
        }
      }

      // Update other fields
      const updateData: Partial<Category> = { ...updateCategoryDto } as any;
      delete updateData['parentId']; // Already handled above

      // Update fields
      Object.assign(category, updateData);
      const updatedCategory = await category.save();

      return updatedCategory;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }

      throw new BadRequestException('Failed to update category');
    }
  }

  /**
   * Soft delete a category
   * @param id - Category ID
   * @returns Success message and deleted category ID
   * @throws NotFoundException if category not found
   * @throws BadRequestException if ID format is invalid
   */
  async delete(id: string): Promise<{ message: string; id: string }> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check if category has children
    const childrenCount = await this.categoryModel.countDocuments({
      parentId: id,
      isDeleted: false,
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${childrenCount} child categories. Delete or move children first.`
      );
    }

    // Soft delete - set isDeleted flag
    category.isDeleted = true;
    await category.save();

    return {
      message: 'Category deleted successfully',
      id,
    };
  }

  /**
   * Restore a soft-deleted category
   * @param id - Category ID
   * @returns Restored category
   * @throws NotFoundException if category not found
   */
  async restore(id: string): Promise<Category> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Deleted category not found');
    }

    category.isDeleted = false;
    return await category.save();
  }

  /**
   * Permanently delete a category (admin only)
   * @param id - Category ID
   * @returns Success message
   * @throws NotFoundException if category not found
   */
  async hardDelete(id: string): Promise<{ message: string; id: string }> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const result = await this.categoryModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Category not found');
    }

    return {
      message: 'Category permanently deleted',
      id,
    };
  }

  /**
   * Update product count for a category
   * @param id - Category ID
   * @param count - New product count
   * @returns Updated category
   */
  async updateProductCount(id: string, count: number): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.productCount = Math.max(0, count);
    return await category.save();
  }

  /**
   * Increment/decrement product count
   * @param id - Category ID
   * @param increment - Amount to increment (negative to decrement)
   * @returns Updated category
   */
  async incrementProductCount(id: string, increment: number): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $inc: { productCount: increment } },
      { new: true }
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Ensure productCount doesn't go negative
    if (category.productCount < 0) {
      category.productCount = 0;
      await category.save();
    }

    return category;
  }
}
