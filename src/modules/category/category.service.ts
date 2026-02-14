/**
 * Category Service
 *
 * Business logic layer for Category CRUD operations.
 * Handles data validation, transformation, and database operations.
 * Also provides methods to query products by category.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Category } from './schemas/category.schema';
import { Product } from '../../product/schemas/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

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
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /**
   * Create a new category
   * @param createCategoryDto - Category data
   * @returns Created category
   * @throws ConflictException if name or slug already exists
   * @throws BadRequestException if validation fails
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      // Check if category name already exists
      const existingName = await this.categoryModel.findOne({
        name: createCategoryDto.name,
        isDeleted: false,
      });

      if (existingName) {
        throw new ConflictException(
          `Category name "${createCategoryDto.name}" already exists`,
        );
      }

      // Generate slug if not provided
      let slug = createCategoryDto.slug;
      if (!slug) {
        slug = generateSlug(createCategoryDto.name);
      }

      // Check if slug already exists and make it unique
      let slugExists = await this.categoryModel.findOne({
        slug,
        isDeleted: false,
      });
      let slugCounter = 1;
      const originalSlug = slug;
      while (slugExists) {
        slug = `${originalSlug}-${slugCounter}`;
        slugExists = await this.categoryModel.findOne({
          slug,
          isDeleted: false,
        });
        slugCounter++;
      }

      // Validate parentId if provided
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
      }

      // Prepare category data
      const categoryData = {
        ...createCategoryDto,
        slug,
        parentId: createCategoryDto.parentId
          ? new Types.ObjectId(createCategoryDto.parentId)
          : undefined,
        isActive: createCategoryDto.isActive ?? true,
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
   * Find all categories with optional parent population
   * @param populateParent - Whether to populate parent category
   * @returns Array of categories
   */
  async findAll(populateParent: boolean = false): Promise<Category[]> {
    const query = this.categoryModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 });

    if (populateParent) {
      query.populate('parentId', 'name slug');
    }

    return await query.exec();
  }

  /**
   * Find a single category by ID
   * @param id - Category ID
   * @param populateParent - Whether to populate parent category
   * @returns Category document
   * @throws NotFoundException if category not found
   * @throws BadRequestException if ID format is invalid
   */
  async findOne(id: string, populateParent: boolean = false): Promise<Category> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const query = this.categoryModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (populateParent) {
      query.populate('parentId', 'name slug');
    }

    const category = await query.exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Update an existing category
   * @param id - Category ID
   * @param updateCategoryDto - Fields to update
   * @returns Updated category
   * @throws NotFoundException if category not found
   * @throws BadRequestException if validation fails
   * @throws ConflictException if name or slug already exists
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
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

      // Check for name uniqueness if being updated
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingName = await this.categoryModel.findOne({
          name: updateCategoryDto.name,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingName) {
          throw new ConflictException(
            `Category name "${updateCategoryDto.name}" already exists`,
          );
        }
      }

      // Handle slug update
      if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
        const existingSlug = await this.categoryModel.findOne({
          slug: updateCategoryDto.slug,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingSlug) {
          throw new ConflictException(
            `Slug "${updateCategoryDto.slug}" already exists`,
          );
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

      // Validate parentId if provided
      if (updateCategoryDto.parentId) {
        if (!Types.ObjectId.isValid(updateCategoryDto.parentId)) {
          throw new BadRequestException('Invalid parent category ID format');
        }

        // Prevent setting self as parent
        if (updateCategoryDto.parentId === id) {
          throw new BadRequestException('Category cannot be its own parent');
        }

        const parentCategory = await this.categoryModel.findOne({
          _id: updateCategoryDto.parentId,
          isDeleted: false,
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }
      }

      // Prepare update data
      const updateData: Partial<Category> = { ...updateCategoryDto } as any;

      // Convert parentId if provided
      if (updateCategoryDto.parentId) {
        updateData.parentId = new Types.ObjectId(updateCategoryDto.parentId);
      } else if (updateCategoryDto.parentId === null) {
        // Allow removing parent
        updateData.parentId = undefined;
      }

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
  async softDelete(id: string): Promise<{ message: string; id: string }> {
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

    // Soft delete - set isDeleted flag
    category.isDeleted = true;
    await category.save();

    return {
      message: 'Category deleted successfully',
      id,
    };
  }

  /**
   * Find all products belonging to a category
   * @param categoryId - Category ID
   * @param populateCategory - Whether to populate category info on products
   * @returns Array of products in the category
   * @throws NotFoundException if category not found
   * @throws BadRequestException if ID format is invalid
   */
  async findProducts(
    categoryId: string,
    populateCategory: boolean = false,
  ): Promise<Product[]> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('Invalid category ID format');
    }

    // Verify category exists
    const category = await this.categoryModel.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Query products in this category
    const query = this.productModel
      .find({
        categoryId: new Types.ObjectId(categoryId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 });

    if (populateCategory) {
      query.populate('categoryId', 'name slug');
    }

    return await query.exec();
  }

  /**
   * Find category by slug
   * @param slug - Category slug
   * @param populateParent - Whether to populate parent category
   * @returns Category document
   * @throws NotFoundException if category not found
   */
  async findBySlug(
    slug: string,
    populateParent: boolean = false,
  ): Promise<Category> {
    const query = this.categoryModel.findOne({
      slug,
      isDeleted: false,
    });

    if (populateParent) {
      query.populate('parentId', 'name slug');
    }

    const category = await query.exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Find child categories of a parent
   * @param parentId - Parent category ID
   * @returns Array of child categories
   * @throws BadRequestException if ID format is invalid
   */
  async findChildren(parentId: string): Promise<Category[]> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('Invalid parent category ID format');
    }

    return await this.categoryModel
      .find({
        parentId: new Types.ObjectId(parentId),
        isDeleted: false,
      })
      .sort({ name: 1 })
      .exec();
  }

  /**
   * Find all root categories (categories without parent)
   * @returns Array of root categories
   */
  async findRootCategories(): Promise<Category[]> {
    return await this.categoryModel
      .find({
        parentId: { $exists: false },
        isDeleted: false,
      })
      .sort({ name: 1 })
      .exec();
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
}
