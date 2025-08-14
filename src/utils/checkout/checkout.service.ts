import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CheckoutService {
  private stripe: Stripe;
  private readonly frontendSuccessUrl: string;
  private readonly frontendCancelUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_API_KEY');
    const frontendSuccessUrl = this.configService.get<string>('FRONTEND_SUCCESS_URL');
    const frontendCancelUrl = this.configService.get<string>('FRONTEND_CANCEL_URL');

    if (!stripeKey) {
      throw new Error('STRIPE_API_KEY no encontrada');
    }
    if (!frontendSuccessUrl) {
      throw new Error('FRONTEND_SUCCESS_URL no encontrada');
    }
    if (!frontendCancelUrl) {
      throw new Error('FRONTEND_CANCEL_URL no encontrada');
    }
    
    this.frontendSuccessUrl = frontendSuccessUrl;
    this.frontendCancelUrl = frontendCancelUrl;
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createCheckoutSession(checkoutDto: CheckoutDto) {
    const { productId, quantity, customerEmail } = checkoutDto;

    // Buscar el producto en nuestra base de datos
    const product = await this.prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${productId} no encontrado`);
    }

    if (!product.stripePriceId) {
      throw new NotFoundException(`El producto ${product.name} no tiene precio configurado`);
    }

    // Crear sesión en Stripe
    const session = await this.stripe.checkout.sessions.create({
      customer_email: customerEmail,
      payment_method_types: ['card'],
      line_items: [{
        price: product.stripePriceId,
        quantity: quantity,
      }],
      mode: product.mode as 'payment' | 'subscription' | 'setup',
      success_url: `${this.frontendSuccessUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.frontendCancelUrl,
    });

    // Calcular monto total
    const amount = product.price * quantity;

    // Guardar la orden en nuestra base de datos
    const order = await this.prisma.order.create({
      data: {
        stripeSessionId: session.id,
        status: 'pending',
        amount: amount,
        currency: product.currency,
        customerEmail: customerEmail,
        productId: product.id
      }
    });

    return {
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
      productName: product.name,
      total: amount
    };
  }

  async verifyPayment(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: sessionId },
      include: { product: true }
    });

    if (!order) {
      throw new NotFoundException(`Orden no encontrada`);
    }

    return {
      sessionId: session.id,
      status: session.payment_status,
      customerEmail: session.customer_email,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      productName: order.product.name
    };
  }

  async getAvailableProducts() {
    const products = await this.prisma.products.findMany({
      where: {
        stripePriceId: {
          not: null
        }
      }
    });

    return products;
  }
}