/**
 * Category Schema
 *
 * Defines the MongoDB schema for the Category entity in the e-commerce system.
 * Uses Mongoose decorators for schema definition with timestamps and soft delete support.
 * Supports hierarchical categories with parent-child relationships.
 *
 * @collection categories
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Category status enum
 * Represents the lifecycle state of a category
 */
export enum CategoryStatus {
  DRAFT = 'DRAFT',       // Category is being prepared, not visible to customers
  ACTIVE = 'ACTIVE',     // Category is live and visible
  INACTIVE = 'INACTIVE', // Category is temporarily disabled
}

/**
 * Category Schema
 * Main category entity for the e-commerce platform
 */
@Schema({
  collection: 'categories',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      return ret;
    }
  }
})
export class Category extends Document {
  /**
   * Category name - displayed to customers
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
   * Category description
   */
  @Prop({ type: String })
  description?: string;

  /**
   * Category thumbnail/icon URL
   */
  @Prop({ type: String })
  imageUrl?: string;

  /**
   * Parent category ID for hierarchical structure
   * null means this is a root category
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    index: true,
    default: null
  })
  parentId?: Types.ObjectId;

  /**
   * Category lifecycle status
   */
  @Prop({
    type: String,
    enum: CategoryStatus,
    default: CategoryStatus.DRAFT,
    index: true
  })
  status: CategoryStatus;

  /**
   * Display order for sorting categories
   */
  @Prop({
    type: Number,
    default: 0
  })
  sortOrder: number;

  /**
   * Category level in hierarchy (0 = root, 1 = child, etc.)
   */
  @Prop({
    type: Number,
    default: 0
  })
  level: number;

  /**
   * Path of ancestor category IDs for efficient hierarchical queries
   * Example: ["rootId", "parentId", "currentId"]
   */
  @Prop({
    type: [Types.ObjectId],
    default: []
  })
  ancestors: Types.ObjectId[];

  /**
   * Number of products in this category
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0
  })
  productCount: number;

  /**
   * Soft delete flag - categories are never hard deleted
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
export const CategorySchema = SchemaFactory.createForClass(Category);

/**
 * Index for text search on name and description
 */
CategorySchema.index({ name: 'text', description: 'text' });

/**
 * Compound index for common queries
 */
CategorySchema.index({ status: 1, isDeleted: 1, parentId: 1 });
CategorySchema.index({ sortOrder: 1, isDeleted: 1 });
CategorySchema.index({ level: 1, isDeleted: 1 });
