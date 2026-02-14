/**
 * Category Module
 *
 * NestJS module for Category feature.
 * Registers the Category schema, service, and controller.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { AuthGuard } from '../guards/auth.guard';

@Module({
  imports: [
    // Register Category schema with Mongoose
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, AuthGuard],
  exports: [CategoryService], // Export for use in other modules
})
export class CategoryModule {}
