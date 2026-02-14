/**
 * Create Category DTO
 *
 * Data Transfer Object for creating a new category.
 * Uses class-validator for input validation.
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsMongoId,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Category DTO
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name - must be unique',
    example: 'Electronics',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(1, { message: 'Category name must be at least 1 character' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'electronics',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120, { message: 'Slug must not exceed 120 characters' })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'All electronic devices and accessories',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ObjectId reference for hierarchical structure',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid parent category ID format' })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active and visible',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}
