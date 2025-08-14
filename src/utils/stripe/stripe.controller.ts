import { Controller, Post, Body, Get } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ProductDto } from './dto/product.dto';

@Controller()
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('stripe/products')
  /* Function to create a product in Stripe
  {
    "name": "Playera negra",
    "price": 200.00,
    "currency": "mxn",
    "mode": "payment" 
  }
  */
  async createProduct(@Body() productDto: ProductDto) {
    return await this.stripeService.createProduct(productDto);
  }


  @Get('stripe/products')
  /* Function to get all products in Stripe*/
  async getProductsStripe() {
    return await this.stripeService.getProductsStripe();
  }


  @Get('db/products')
  /* Function to get all products in database*/
  async getProductsDB() {
    return await this.stripeService.getProductsDB();
  }
  
}
