/**
 * Create Product DTO
 *
 * Data Transfer Object for creating a new product.
 * Uses class-validator for input validation.
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsEnum,
  IsArray,
  IsUrl,
  IsBoolean,
  Min,
  Max,
  ValidateNested,
  IsMongoId,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../schemas/product.schema';

/**
 * Dimensions DTO for product physical measurements
 */
export class DimensionsDto {
  @ApiPropertyOptional({
    description: 'Length in centimeters',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({
    description: 'Width in centimeters',
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({
    description: 'Height in centimeters',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;
}

/**
 * Create Product DTO
 */
export class CreateProductDto {
  @ApiProperty({
    description: 'Stock Keeping Unit - unique identifier',
    example: 'SKU-001-BLK-L',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  @MinLength(1)
  @MaxLength(50)
  sku: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Premium Wireless Headphones',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'premium-wireless-headphones',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Full product description (supports HTML/Markdown)',
    example: 'Experience crystal-clear audio with our premium wireless headphones...',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Short description for listings',
    example: 'Premium wireless headphones with noise cancellation',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string;

  @ApiProperty({
    description: 'Regular product price',
    example: 2990000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Price must be greater than or equal to 0' })
  price: number;

  @ApiPropertyOptional({
    description: 'Sale/discounted price (must be less than regular price)',
    example: 2490000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Sale price must be greater than or equal to 0' })
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'VND',
    default: 'VND',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Available stock quantity',
    example: 100,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status must be DRAFT, ACTIVE, or INACTIVE' })
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Category ObjectId reference',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'Invalid category ID format' })
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Sony',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({
    description: 'Main thumbnail image URL',
    example: 'https://example.com/images/product-thumb.jpg',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of additional product image URLs',
    example: ['https://example.com/images/img1.jpg', 'https://example.com/images/img2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Product weight in grams',
    example: 250,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Product dimensions (length, width, height in cm)',
    type: DimensionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({
    description: 'Product tags for search and categorization',
    example: ['electronics', 'audio', 'wireless'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Average rating (0-5) - usually set by system',
    example: 4.5,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  ratingAverage?: number;

  @ApiPropertyOptional({
    description: 'Total rating count - usually set by system',
    example: 150,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ratingCount?: number;
}
