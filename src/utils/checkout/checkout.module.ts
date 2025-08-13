import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [CheckoutController],
  providers: [CheckoutService, ConfigService]
})
export class CheckoutModule {}
