/**
 * Category Schema
 *
 * Defines the MongoDB schema for the Category entity in the e-commerce system.
 * Uses Mongoose decorators for schema definition with timestamps and soft delete support.
 * Supports hierarchical categories via parentId self-reference.
 *
 * @collection categories
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Category Schema
 * Represents product categories with hierarchical support
 */
@Schema({
  collection: 'categories',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
  },
})
export class Category extends Document {
  /**
   * Category name - unique identifier for display
   */
  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  name: string;

  /**
   * URL-friendly slug - auto-generated from name if not provided
   */
  @Prop({
    unique: true,
    trim: true,
    index: true,
  })
  slug: string;

  /**
   * Category description - optional detailed description
   */
  @Prop({
    type: String,
    trim: true,
  })
  description?: string;

  /**
   * Parent category reference - for hierarchical categories
   */
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    index: true,
  })
  parentId?: Types.ObjectId;

  /**
   * Active status flag - determines if category is visible
   */
  @Prop({
    type: Boolean,
    default: true,
    index: true,
  })
  isActive: boolean;

  /**
   * Soft delete flag - categories are never hard deleted
   */
  @Prop({
    type: Boolean,
    default: false,
    index: true,
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
 * Compound indexes for common queries
 */
CategorySchema.index({ name: 1, isDeleted: 1 });
CategorySchema.index({ slug: 1, isDeleted: 1 });
CategorySchema.index({ parentId: 1, isDeleted: 1 });
CategorySchema.index({ isActive: 1, isDeleted: 1 });
CategorySchema.index({ createdAt: -1, isDeleted: 1 });

/**
 * Text index for search on name and description
 */
CategorySchema.index({ name: 'text', description: 'text' });
