/**
 * Query Product DTO
 *
 * Data Transfer Object for querying/filtering products.
 * Supports pagination, sorting, filtering, and search functionality.
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../schemas/product.schema';

/**
 * Sort field options
 */
export enum SortByField {
  PRICE = 'price',
  CREATED_AT = 'createdAt',
  NAME = 'name',
  RATING = 'ratingAverage',
  STOCK = 'stockQuantity',
}

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Query Product DTO
 * Supports comprehensive filtering and pagination options
 */
export class QueryProductDto {
  @ApiPropertyOptional({
    description: 'Search term for name, description, SKU, or tags',
    example: 'wireless headphones',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum price filter',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price filter',
    example: 5000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid category ID format' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product status',
    enum: ProductStatus,
    example: ProductStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status must be DRAFT, ACTIVE, or INACTIVE' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Filter by brand name',
    example: 'Sony',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by stock availability',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  isInStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'electronics,wireless',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Page number (use "all" to get all records)',
    example: '1',
    default: '1',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: SortByField,
    default: SortByField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortByField, { message: 'sortBy must be price, createdAt, name, ratingAverage, or stockQuantity' })
  sortBy?: SortByField;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'sortOrder must be asc or desc' })
  sortOrder?: SortOrder;
}
