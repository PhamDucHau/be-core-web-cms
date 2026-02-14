/**
 * Query Category DTO
 *
 * Data Transfer Object for querying/filtering categories.
 * Supports pagination, sorting, filtering, and search functionality.
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryStatus } from '../schemas/category.schema';

/**
 * Sort field options
 */
export enum CategorySortByField {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  SORT_ORDER = 'sortOrder',
  PRODUCT_COUNT = 'productCount',
}

/**
 * Sort order options
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * Query Category DTO
 * Supports comprehensive filtering and pagination options
 */
export class QueryCategoryDto {
  @ApiPropertyOptional({
    description: 'Search term for name and description',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by parent category ID (use "root" for root categories)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category status',
    enum: CategoryStatus,
    example: CategoryStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Status must be DRAFT, ACTIVE, or INACTIVE' })
  status?: CategoryStatus;

  @ApiPropertyOptional({
    description: 'Filter by category level (0 = root)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({
    description: 'Include children categories in response',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeChildren?: boolean;

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
    enum: CategorySortByField,
    default: CategorySortByField.SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(CategorySortByField, { message: 'sortBy must be name, createdAt, sortOrder, or productCount' })
  sortBy?: CategorySortByField;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder, { message: 'sortOrder must be asc or desc' })
  sortOrder?: SortOrder;
}
