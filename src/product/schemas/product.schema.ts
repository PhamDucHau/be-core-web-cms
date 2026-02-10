/**
 * Product Schema
 *
 * Defines the MongoDB schema for the Product entity in the e-commerce system.
 * Uses Mongoose decorators for schema definition with timestamps and soft delete support.
 *
 * @collection products
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Product status enum
 * Represents the lifecycle state of a product
 */
export enum ProductStatus {
  DRAFT = 'DRAFT',       // Product is being prepared, not visible to customers
  ACTIVE = 'ACTIVE',     // Product is live and available for purchase
  INACTIVE = 'INACTIVE', // Product is temporarily disabled
}

/**
 * Dimensions sub-document interface
 * Represents the physical dimensions of a product
 */
export class ProductDimensions {
  @Prop({ type: Number })
  length?: number;

  @Prop({ type: Number })
  width?: number;

  @Prop({ type: Number })
  height?: number;
}

/**
 * Product Schema
 * Main product entity for the e-commerce platform
 */
@Schema({
  collection: 'products',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  }
})
export class Product extends Document {
  /**
   * Stock Keeping Unit - unique identifier for inventory management
   */
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true
  })
  sku: string;

  /**
   * Product name - displayed to customers
   */
  @Prop({
    required: true,
    trim: true,
    index: true
  })
  name: string;

  /**
   * URL-friendly slug - auto-generated from name if not provided
   */
  @Prop({
    unique: true,
    trim: true,
    sparse: true,
    index: true
  })
  slug: string;

  /**
   * Full product description - supports HTML/Markdown
   */
  @Prop({ type: String })
  description: string;

  /**
   * Short description for product listings and previews
   */
  @Prop({ type: String })
  shortDescription?: string;

  /**
   * Regular price of the product
   */
  @Prop({
    required: true,
    type: Number,
    min: 0
  })
  price: number;

  /**
   * Discounted sale price - must be less than regular price
   */
  @Prop({
    type: Number,
    min: 0
  })
  salePrice?: number;

  /**
   * Currency code for pricing (ISO 4217)
   */
  @Prop({
    type: String,
    default: 'VND',
    trim: true
  })
  currency: string;

  /**
   * Available quantity in stock
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  stockQuantity: number;

  /**
   * Stock availability flag - auto-calculated from stockQuantity
   */
  @Prop({
    type: Boolean,
    default: false
  })
  isInStock: boolean;

  /**
   * Product lifecycle status
   */
  @Prop({
    type: String,
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
    index: true
  })
  status: ProductStatus;

  /**
   * Reference to product category
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    index: true
  })
  categoryId?: Types.ObjectId;

  /**
   * Brand name
   */
  @Prop({ type: String, trim: true })
  brand?: string;

  /**
   * Main product thumbnail URL
   */
  @Prop({ type: String })
  thumbnailUrl?: string;

  /**
   * Array of additional product image URLs
   */
  @Prop({ type: [String], default: [] })
  images: string[];

  /**
   * Product weight in grams
   */
  @Prop({ type: Number, min: 0 })
  weight?: number;

  /**
   * Physical dimensions of the product
   */
  @Prop({ type: ProductDimensions })
  dimensions?: ProductDimensions;

  /**
   * Tags for search and categorization
   */
  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  /**
   * Average customer rating (0-5)
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
    max: 5
  })
  ratingAverage: number;

  /**
   * Total number of ratings received
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  ratingCount: number;

  /**
   * Soft delete flag - products are never hard deleted
   */
  @Prop({
    type: Boolean,
    default: false,
    index: true
  })
  isDeleted: boolean;

  /**
   * Timestamp fields - auto-managed by Mongoose
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create the Mongoose schema from the class
 */
export const ProductSchema = SchemaFactory.createForClass(Product);

/**
 * Pre-save middleware to auto-calculate isInStock based on stockQuantity
 */
ProductSchema.pre('save', function(next) {
  // Auto-calculate isInStock based on stockQuantity
  this.isInStock = this.stockQuantity > 0;
  next();
});

/**
 * Index for text search on name and description
 */
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

/**
 * Compound index for common queries
 */
ProductSchema.index({ status: 1, isDeleted: 1, categoryId: 1 });
ProductSchema.index({ price: 1, isDeleted: 1 });
ProductSchema.index({ createdAt: -1, isDeleted: 1 });
