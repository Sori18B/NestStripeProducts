import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/config/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [WebhookController],
  providers: [WebhookService]
})
export class WebhookModule {}
