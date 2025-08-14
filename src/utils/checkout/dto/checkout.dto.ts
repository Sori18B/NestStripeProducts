import { IsNotEmpty, IsNumber, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 6 })
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({ example: 1 })
  quantity: number;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'cliente@ejemplo.com' })
  customerEmail: string;
}
