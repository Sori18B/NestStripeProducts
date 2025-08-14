import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller()
export class CheckoutController {
  constructor(private checkoutService: CheckoutService) {}

  @Get('checkout/products')
  /* Function to get all available products for purchase */
  async getAvailableProducts() {
    return await this.checkoutService.getAvailableProducts();
  }

  @Post('checkout/create-session')
  /* Function to create a checkout session
  {
    "productId": 6,
    "quantity": 1,
    "customerEmail": "cliente@ejemplo.com"
  }
  */
  async createCheckoutSession(@Body() checkoutDto: CheckoutDto) {
    return await this.checkoutService.createCheckoutSession(checkoutDto);
  }

  @Get('checkout/verify-payment/:sessionId')
  /* Function to verify payment status */
  async verifyPayment(@Param('sessionId') sessionId: string) {
    return await this.checkoutService.verifyPayment(sessionId);
  }
}