import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class CheckoutService {
  private stripe: Stripe;
  private pismaService: PrismaService

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_API_KEY');

    if (!stripeKey) {
      throw new Error('No se encontró la apikey en .env');
    }
    this.stripe = new Stripe(stripeKey);
  }

  async createCheckoutSession(): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      success_url:
        'http://localhost:3000' +
        '/pay/success/checkout/session?session_id{CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000' + '/pay/failed/checkout/session',
      mode: 'payment',
      payment_intent_data: {
        setup_future_usage: 'on_session',
      },
      line_items: [
        {
          price: 'price_1RvdRZBdlgqm5kAhMmRnm7H7',
          quantity: 2,
        },
      ],
      customer: 'cus_SrMNWHujsYG8Cf',
    });

    return session;
  }
}
