import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class CheckoutService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_API_KEY');

    if (!stripeKey) {
      throw new Error('No se encontró la apikey en .env');
    }
    this.stripe = new Stripe(stripeKey);
  }

  async createCheckoutSession(): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      payment_method_types: ['card'],
      mode: 'payment', //o suscription para los planess
      line_items: [
        {
          price: 'price_1MotwRLkdIwHu7ixYcPLm5uZ',
          quantity: 2,
        },
      ],
    });

    return session;
  }
}
