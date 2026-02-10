/**
 * Update Product DTO
 *
 * Data Transfer Object for updating an existing product.
 * Extends CreateProductDto with PartialType to make all fields optional.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * Update Product DTO
 * All fields are optional - only provided fields will be updated
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
