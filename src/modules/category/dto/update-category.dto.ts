/**
 * Update Category DTO
 *
 * Data Transfer Object for updating an existing category.
 * Extends CreateCategoryDto with PartialType to make all fields optional.
 */

import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * Update Category DTO
 * All fields are optional - only provided fields will be updated
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
