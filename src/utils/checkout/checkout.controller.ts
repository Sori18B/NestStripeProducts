import { Controller, Get } from '@nestjs/common';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
    constructor (private readonly checkoutService: CheckoutService) {}

    @Get()
    async createCheckSession() {
        return this.checkoutService.createCheckoutSession();
    }
}
