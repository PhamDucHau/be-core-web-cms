/**
 * Product Module
 *
 * NestJS module for Product feature.
 * Registers the Product schema, service, and controller.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { AuthGuard } from '../guards/auth.guard';

@Module({
  imports: [
    // Register Product schema with Mongoose
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService, AuthGuard],
  exports: [ProductService], // Export for use in other modules
})
export class ProductModule {}
