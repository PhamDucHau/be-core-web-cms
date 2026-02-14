/**
 * Create Category DTO
 *
 * Data Transfer Object for creating a new category.
 * Uses class-validator for input validation.
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  IsMongoId,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../schemas/category.schema';

/**
 * Create Category DTO
 */
export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Electronic devices and accessories',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category image URL',
    example: 'https://example.com/images/category-electronics.jpg',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure (null for root categories)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid parent category ID format' })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Category status',
    enum: CategoryStatus,
    default: CategoryStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Status must be DRAFT, ACTIVE, or INACTIVE' })
  status?: CategoryStatus;

  @ApiPropertyOptional({
    description: 'Display order for sorting',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
