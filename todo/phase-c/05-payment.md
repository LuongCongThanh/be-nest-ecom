# Task C-05 — VNPay Payment Integration

**Phase**: C — Core MVP  
**Ước lượng**: 5 giờ  
**Phụ thuộc**: Task C-04  
**Spec gốc**: [planning/business/05-payment/01-payment.md](../../planning/business/05-payment/01-payment.md)

---

## Nhiệm vụ

Integrate VNPay: tạo payment URL, xử lý webhook (verify HMAC, idempotent), chuyển order PENDING → PAID atomic.

---

## Các bước thực hiện

### 1. Thêm Payment model vào schema.prisma

```prisma
enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  REFUNDED
}

model Payment {
  id             String        @id @default(uuid())
  orderId        String        @unique
  provider       String        @default("VNPAY")
  amount         Decimal       @db.Decimal(12, 2)
  status         PaymentStatus @default(PENDING)
  providerTxId   String?       @unique
  providerData   Json?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  order          Order         @relation(fields: [orderId], references: [id])

  @@index([providerTxId])
  @@map("payments")
}
```

```bash
npx prisma migrate dev --name add-payments
```

### 2. Cài packages VNPay

```bash
npm install crypto-js qs
npm install --save-dev @types/qs
```

### 3. Tạo VNPayService

Tạo `src/modules/payment/services/vnpay.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { OrderService } from '../../order/services/order.service';

@Injectable()
export class VNPayService {
  private readonly tmnCode: string;
  private readonly secretKey: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly orderService: OrderService,
  ) {
    this.tmnCode = config.get('VNPAY_TMN_CODE') ?? 'DEMO';
    this.secretKey = config.get('VNPAY_SECRET_KEY') ?? 'DEMOSECRET';
    this.vnpUrl = config.get('VNPAY_URL') ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = config.get('VNPAY_RETURN_URL') ?? 'http://localhost:3000/api/v1/payments/vnpay/return';
  }

  async createPaymentUrl(orderId: string, userId: string): Promise<string> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) throw new BadRequestException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    if (order.status !== 'PENDING') {
      throw new BadRequestException({ code: 'ORDER_NOT_PENDING', message: 'Order is not pending' });
    }

    // Tạo Payment record
    await this.prisma.payment.upsert({
      where: { orderId },
      create: { orderId, amount: order.total, status: 'PENDING' },
      update: {},
    });

    const date = new Date();
    const createDate = this.formatDate(date);
    const txnRef = `${order.orderNumber}-${Date.now()}`;

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
      vnp_OrderType: 'other',
      vnp_Amount: String(Number(order.total) * 100),
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
    };

    const sortedParams = Object.fromEntries(Object.entries(params).sort());
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    return `${this.vnpUrl}?${qs.stringify(sortedParams, { encode: false })}`;
  }

  async handleWebhook(query: Record<string, string>): Promise<{ code: string; message: string }> {
    const { vnp_SecureHash, vnp_TransactionNo, vnp_TxnRef, vnp_ResponseCode, ...rest } = query;

    // Verify HMAC
    const signData = qs.stringify(
      Object.fromEntries(Object.entries(rest).sort()),
      { encode: false },
    );
    const hmac = crypto.createHmac('sha512', this.secretKey);
    const expectedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (expectedHash !== vnp_SecureHash) {
      return { code: '97', message: 'Invalid signature' };
    }

    // Idempotent — check providerTxId đã xử lý chưa
    const existingPayment = await this.prisma.payment.findFirst({
      where: { providerTxId: vnp_TransactionNo },
    });
    if (existingPayment) {
      return { code: '00', message: 'Already processed' };
    }

    // Lấy order từ txnRef
    const orderNumber = vnp_TxnRef.split('-')[0];
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
      include: { payment: true },
    });

    if (!order) return { code: '01', message: 'Order not found' };

    if (vnp_ResponseCode === '00') {
      // Payment SUCCESS → PENDING → PAID atomic
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { orderId: order.id },
          data: { status: 'SUCCESS', providerTxId: vnp_TransactionNo, providerData: query as any },
        }),
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID' },
        }),
        this.prisma.orderStatusLog.create({
          data: { orderId: order.id, fromStatus: 'PENDING', toStatus: 'PAID', reason: 'VNPay payment success' },
        }),
      ]);
    } else {
      await this.prisma.payment.update({
        where: { orderId: order.id },
        data: { status: 'FAILED', providerTxId: vnp_TransactionNo, providerData: query as any },
      });
    }

    return { code: '00', message: 'Success' };
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  }
}
```

### 4. Thêm vào .env

```
VNPAY_TMN_CODE=DEMO_TMN_CODE
VNPAY_SECRET_KEY=DEMO_SECRET_KEY
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/v1/payments/vnpay/return
```

### 5. PaymentController

```typescript
@Controller('payments')
export class PaymentController {
  @Post('vnpay/create')
  createPaymentUrl(
    @Body() body: { orderId: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.vnpayService.createPaymentUrl(body.orderId, userId).then(url => ({ url }));
  }

  @Public()
  @Get('vnpay/return')
  handleReturn(@Query() query: Record<string, string>) {
    return this.vnpayService.handleWebhook(query);
  }

  @Public()
  @Post('vnpay/webhook')
  handleWebhook(@Query() query: Record<string, string>) {
    return this.vnpayService.handleWebhook(query);
  }
}
```

---

## Verify hoàn thành

Dùng VNPay sandbox để test:
1. Tạo order → lấy `orderId`
2. Gọi `POST /payments/vnpay/create` → nhận payment URL
3. Mở payment URL trong browser → dùng thẻ test sandbox
4. VNPay redirect về return URL → order chuyển sang `PAID`

**Thẻ test VNPay sandbox:**
- Số thẻ: 9704198526191432198
- Tên: NGUYEN VAN A
- Ngày phát hành: 07/15
- OTP: 123456

---

## Xong thì làm gì?

→ [06-phase-c-exit-gate.md](./06-phase-c-exit-gate.md)
