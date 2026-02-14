/**
 * Category Module
 *
 * NestJS module for Category feature.
 * Registers the Category and Product schemas, service, and controller.
 * Exports CategoryService for use in other modules.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { Product, ProductSchema } from '../../product/schemas/product.schema';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { AuthGuard } from '../../guards/auth.guard';

@Module({
  imports: [
    // Register Category and Product schemas with Mongoose
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, AuthGuard],
  exports: [CategoryService], // Export for use in other modules
})
export class CategoryModule {}
