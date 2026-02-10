/**
 * Product Service
 *
 * Business logic layer for Product CRUD operations.
 * Handles data validation, transformation, and database operations.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Product, ProductStatus } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto, SortByField, SortOrder } from './dto/query-product.dto';

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
 * Generate URL-friendly slug from product name
 * @param name - Product name to convert
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
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /**
   * Create a new product
   * @param createProductDto - Product data
   * @returns Created product
   * @throws BadRequestException if SKU already exists or validation fails
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // Check if SKU already exists
      const existingSku = await this.productModel.findOne({
        sku: createProductDto.sku,
        isDeleted: false,
      });

      if (existingSku) {
        throw new ConflictException(`SKU "${createProductDto.sku}" already exists`);
      }

      // Generate slug if not provided
      let slug = createProductDto.slug;
      if (!slug) {
        slug = generateSlug(createProductDto.name);
      }

      // Check if slug already exists and make it unique
      let slugExists = await this.productModel.findOne({ slug, isDeleted: false });
      let slugCounter = 1;
      const originalSlug = slug;
      while (slugExists) {
        slug = `${originalSlug}-${slugCounter}`;
        slugExists = await this.productModel.findOne({ slug, isDeleted: false });
        slugCounter++;
      }

      // Validate salePrice < price
      if (
        createProductDto.salePrice !== undefined &&
        createProductDto.salePrice >= createProductDto.price
      ) {
        throw new BadRequestException('Sale price must be less than regular price');
      }

      // Prepare product data
      const productData = {
        ...createProductDto,
        slug,
        // Convert categoryId to ObjectId if provided
        categoryId: createProductDto.categoryId
          ? new Types.ObjectId(createProductDto.categoryId)
          : undefined,
        // Auto-calculate isInStock
        isInStock: (createProductDto.stockQuantity || 0) > 0,
      };

      // Create and save the product
      const newProduct = new this.productModel(productData);
      const savedProduct = await newProduct.save();

      return savedProduct;
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

      throw new BadRequestException('Failed to create product');
    }
  }

  /**
   * Find all products with filtering, pagination, and sorting
   * @param queryDto - Query parameters
   * @returns Paginated product list with metadata
   */
  async findAll(queryDto: QueryProductDto): Promise<{
    data: Product[];
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
    const filter: FilterQuery<Product> = {
      isDeleted: false, // Always exclude soft-deleted products
    };

    // Filter by status
    if (queryDto.status) {
      filter.status = queryDto.status;
    }

    // Filter by categoryId
    if (queryDto.categoryId && Types.ObjectId.isValid(queryDto.categoryId)) {
      filter.categoryId = new Types.ObjectId(queryDto.categoryId);
    }

    // Filter by brand
    if (queryDto.brand) {
      filter.brand = { $regex: queryDto.brand, $options: 'i' };
    }

    // Filter by price range
    if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
      filter.price = {};
      if (queryDto.minPrice !== undefined) {
        filter.price.$gte = queryDto.minPrice;
      }
      if (queryDto.maxPrice !== undefined) {
        filter.price.$lte = queryDto.maxPrice;
      }
    }

    // Filter by stock availability
    if (queryDto.isInStock !== undefined) {
      filter.isInStock = queryDto.isInStock;
    }

    // Filter by tags
    if (queryDto.tags) {
      const tagsArray = queryDto.tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagsArray };
    }

    // Build sort options
    const sortBy = queryDto.sortBy || SortByField.CREATED_AT;
    const sortOrder = queryDto.sortOrder === SortOrder.ASC ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    // Handle search with Vietnamese tone removal
    if (queryDto.search && queryDto.search.trim()) {
      const searchTerm = queryDto.search.trim().toLowerCase();
      const normalizedSearch = removeVietnameseTones(searchTerm);

      // Get all matching documents for search
      const allProducts = await this.productModel
        .find(filter)
        .sort(sortOptions)
        .exec();

      // Filter in application layer for better Vietnamese search support
      const filteredProducts = allProducts.filter((product) => {
        const nameLower = product.name.toLowerCase();
        const nameNormalized = removeVietnameseTones(nameLower);
        const skuLower = product.sku.toLowerCase();
        const descLower = (product.description || '').toLowerCase();
        const descNormalized = removeVietnameseTones(descLower);

        // Check if search term matches name, SKU, or description
        return (
          nameLower.includes(searchTerm) ||
          nameNormalized.includes(normalizedSearch) ||
          skuLower.includes(searchTerm) ||
          descLower.includes(searchTerm) ||
          descNormalized.includes(normalizedSearch) ||
          product.tags?.some(tag =>
            tag.toLowerCase().includes(searchTerm) ||
            removeVietnameseTones(tag.toLowerCase()).includes(normalizedSearch)
          )
        );
      });

      const total = filteredProducts.length;

      // Apply pagination
      if (isGetAll) {
        return {
          data: filteredProducts,
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
      const data = filteredProducts.slice(skip, skip + limit);

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
    const total = await this.productModel.countDocuments(filter);

    if (isGetAll) {
      const data = await this.productModel.find(filter).sort(sortOptions).exec();

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

    const data = await this.productModel
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
   * Find a single product by ID
   * @param id - Product ID
   * @returns Product document
   * @throws NotFoundException if product not found
   * @throws BadRequestException if ID format is invalid
   */
  async findById(id: string): Promise<Product> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Find a single product by slug
   * @param slug - Product slug
   * @returns Product document
   * @throws NotFoundException if product not found
   */
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productModel.findOne({
      slug,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Update an existing product
   * @param id - Product ID
   * @param updateProductDto - Fields to update
   * @returns Updated product
   * @throws NotFoundException if product not found
   * @throws BadRequestException if validation fails
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    try {
      const product = await this.productModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check for SKU uniqueness if being updated
      if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
        const existingSku = await this.productModel.findOne({
          sku: updateProductDto.sku,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingSku) {
          throw new ConflictException(`SKU "${updateProductDto.sku}" already exists`);
        }
      }

      // Handle slug update
      if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
        const existingSlug = await this.productModel.findOne({
          slug: updateProductDto.slug,
          _id: { $ne: id },
          isDeleted: false,
        });

        if (existingSlug) {
          throw new ConflictException(`Slug "${updateProductDto.slug}" already exists`);
        }
      }

      // Auto-generate slug if name is updated and slug is not provided
      if (updateProductDto.name && !updateProductDto.slug) {
        let newSlug = generateSlug(updateProductDto.name);
        let slugExists = await this.productModel.findOne({
          slug: newSlug,
          _id: { $ne: id },
          isDeleted: false,
        });

        let slugCounter = 1;
        const originalSlug = newSlug;
        while (slugExists) {
          newSlug = `${originalSlug}-${slugCounter}`;
          slugExists = await this.productModel.findOne({
            slug: newSlug,
            _id: { $ne: id },
            isDeleted: false,
          });
          slugCounter++;
        }
        updateProductDto.slug = newSlug;
      }

      // Validate salePrice < price
      const newPrice = updateProductDto.price ?? product.price;
      const newSalePrice = updateProductDto.salePrice ?? product.salePrice;

      if (newSalePrice !== undefined && newSalePrice >= newPrice) {
        throw new BadRequestException('Sale price must be less than regular price');
      }

      // Prepare update data
      const updateData: Partial<Product> = { ...updateProductDto } as any;

      // Convert categoryId if provided
      if (updateProductDto.categoryId) {
        if (!Types.ObjectId.isValid(updateProductDto.categoryId)) {
          throw new BadRequestException('Invalid category ID format');
        }
        updateData.categoryId = new Types.ObjectId(updateProductDto.categoryId);
      }

      // Auto-calculate isInStock if stockQuantity is updated
      if (updateProductDto.stockQuantity !== undefined) {
        updateData.isInStock = updateProductDto.stockQuantity > 0;
      }

      // Update fields
      Object.assign(product, updateData);
      const updatedProduct = await product.save();

      return updatedProduct;
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

      throw new BadRequestException('Failed to update product');
    }
  }

  /**
   * Soft delete a product
   * @param id - Product ID
   * @returns Success message and deleted product ID
   * @throws NotFoundException if product not found
   * @throws BadRequestException if ID format is invalid
   */
  async delete(id: string): Promise<{ message: string; id: string }> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete - set isDeleted flag
    product.isDeleted = true;
    await product.save();

    return {
      message: 'Product deleted successfully',
      id,
    };
  }

  /**
   * Restore a soft-deleted product
   * @param id - Product ID
   * @returns Restored product
   * @throws NotFoundException if product not found
   */
  async restore(id: string): Promise<Product> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: true,
    });

    if (!product) {
      throw new NotFoundException('Deleted product not found');
    }

    product.isDeleted = false;
    return await product.save();
  }

  /**
   * Permanently delete a product (admin only)
   * @param id - Product ID
   * @returns Success message
   * @throws NotFoundException if product not found
   */
  async hardDelete(id: string): Promise<{ message: string; id: string }> {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const result = await this.productModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException('Product not found');
    }

    return {
      message: 'Product permanently deleted',
      id,
    };
  }

  /**
   * Update product stock quantity
   * @param id - Product ID
   * @param quantity - New stock quantity
   * @returns Updated product
   */
  async updateStock(id: string, quantity: number): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    if (quantity < 0) {
      throw new BadRequestException('Stock quantity cannot be negative');
    }

    const product = await this.productModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.stockQuantity = quantity;
    product.isInStock = quantity > 0;

    return await product.save();
  }

  /**
   * Bulk update product status
   * @param ids - Array of product IDs
   * @param status - New status
   * @returns Update result
   */
  async bulkUpdateStatus(
    ids: string[],
    status: ProductStatus,
  ): Promise<{ modifiedCount: number }> {
    // Validate all IDs
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length !== ids.length) {
      throw new BadRequestException('One or more invalid product IDs');
    }

    const result = await this.productModel.updateMany(
      {
        _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
        isDeleted: false,
      },
      { $set: { status } },
    );

    return { modifiedCount: result.modifiedCount };
  }
}
