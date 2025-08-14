import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService, private prisma: PrismaService) {
    const stripeKey = this.configService.get<string>('STRIPE_API_KEY');
    if (!stripeKey) {
      throw new Error('No se encontró la apikey');
    }
    this.stripe = new Stripe(stripeKey, { apiVersion: '2025-07-30.basil' });
  }

  getStripe(): Stripe {
    return this.stripe;
  }

  async handleEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.warn(`Evento no manejado: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    this.logger.log(`Sesión completada: ${session.id}`);
    
    // Actualizar orden en la base de datos
    await this.prisma.order.update({
      where: { stripeSessionId: session.id },
      data: {
        status: session.payment_status === 'paid' ? 'completed' : 'pending',
        customerEmail: session.customer_email,
        stripeCustomerId: session.customer as string,
        paymentDate: session.payment_status === 'paid' ? new Date() : null,
      }
    });

    // Registrar en el historial de pagos
    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: session.id }
    });

    if (order) {
      await this.prisma.paymentHistory.create({
        data: {
          orderId: order.id,
          eventType: 'checkout.session.completed',
          eventData: session as any
        }
      });
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Pago exitoso: ${paymentIntent.id}`);
    
    // Actualizar orden como completada
    await this.prisma.order.update({
      where: { stripeSessionId: paymentIntent.metadata.session_id },
      data: {
        status: 'completed',
        paymentDate: new Date(),
      }
    });

    // Registrar en el historial de pagos
    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: paymentIntent.metadata.session_id }
    });

    if (order) {
      await this.prisma.paymentHistory.create({
        data: {
          orderId: order.id,
          eventType: 'payment_intent.succeeded',
          eventData: paymentIntent as any
        }
      });
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Pago fallido: ${paymentIntent.id}`);
    
    // Actualizar orden como fallida
    await this.prisma.order.update({
      where: { stripeSessionId: paymentIntent.metadata.session_id },
      data: { status: 'failed' }
    });

    // Registrar en el historial de pagos
    const order = await this.prisma.order.findUnique({
      where: { stripeSessionId: paymentIntent.metadata.session_id }
    });

    if (order) {
      await this.prisma.paymentHistory.create({
        data: {
          orderId: order.id,
          eventType: 'payment_intent.payment_failed',
          eventData: paymentIntent as any
        }
      });
    }
  }
}