// server/src/services/payosService.ts
import { ENV } from '../config/env';

// Dynamically or safely load @payos/node
let PayOSClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const payosModule = require('@payos/node');
  PayOSClass = payosModule.PayOS || payosModule.default || payosModule;
} catch (err) {
  console.warn('⚠️ @payos/node module not loaded:', err);
}

export interface CreatePaymentLinkParams {
  orderCode: number;
  amount: number;
  description: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLinkResult {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';
  checkoutUrl: string;
  qrCode: string;
}

class PayOSService {
  private client: any = null;

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    if (PayOSClass && ENV.PAYOS_CLIENT_ID && ENV.PAYOS_API_KEY && ENV.PAYOS_CHECKSUM_KEY) {
      try {
        this.client = new PayOSClass({
          clientId: ENV.PAYOS_CLIENT_ID,
          apiKey: ENV.PAYOS_API_KEY,
          checksumKey: ENV.PAYOS_CHECKSUM_KEY,
        });
        console.log('✅ PayOS Client initialized successfully.');
      } catch (err) {
        console.error('❌ Failed to initialize PayOS Client:', err);
        this.client = null;
      }
    } else {
      console.log('ℹ️ PayOS Client running in sandbox/simulation mode (Missing PayOS credentials).');
    }
  }

  public isConfigured(): boolean {
    return !!(this.client && ENV.PAYOS_CLIENT_ID && ENV.PAYOS_API_KEY && ENV.PAYOS_CHECKSUM_KEY);
  }

  /**
   * Tạo Payment Link qua PayOS
   */
  public async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResult> {
    const returnUrl = params.returnUrl || ENV.PAYOS_RETURN_URL || 'http://localhost:8081';
    const cancelUrl = params.cancelUrl || ENV.PAYOS_CANCEL_URL || 'http://localhost:8081';

    // Description must be <= 25 characters according to banking regulations
    const cleanDesc = params.description.length > 25 
      ? params.description.substring(0, 25) 
      : params.description;

    if (this.isConfigured()) {
      try {
        const payload: any = {
          orderCode: params.orderCode,
          amount: params.amount,
          description: cleanDesc,
          returnUrl,
          cancelUrl,
          items: [
            {
              name: `Nap Xu Kindr (${Math.round(params.amount / 1000)} Xu)`,
              quantity: 1,
              price: params.amount,
            },
          ],
        };

        if (params.buyerName) payload.buyerName = params.buyerName;
        if (params.buyerPhone) payload.buyerPhone = params.buyerPhone;
        if (params.buyerEmail) payload.buyerEmail = params.buyerEmail;

        const res = await this.client.paymentRequests.create(payload);

        return {
          bin: res.bin || '970422', // Military Bank (MB) BIN default
          accountNumber: res.accountNumber || ENV.BANK_ACCOUNT_NUMBER || '',
          accountName: res.accountName || ENV.BANK_ACCOUNT_HOLDER || 'CONG DONG KINDR',
          amount: res.amount || params.amount,
          description: res.description || cleanDesc,
          orderCode: res.orderCode || params.orderCode,
          currency: res.currency || 'VND',
          paymentLinkId: res.paymentLinkId || `PL_${params.orderCode}`,
          status: (res.status as any) || 'PENDING',
          checkoutUrl: res.checkoutUrl || `https://pay.payos.vn/web/${params.orderCode}`,
          qrCode: res.qrCode || `00020101021238540010A000000727012400069704220112${res.accountNumber || ENV.BANK_ACCOUNT_NUMBER || ''}5303704540${params.amount}5802VN62${cleanDesc.length}${cleanDesc}6304`,
        };
      } catch (err: any) {
        console.error('PayOS createPaymentLink error:', err);
        throw err;
      }
    }

    // Fallback for demo / development when PayOS keys are not yet configured in .env
    const fallbackBankCode = ENV.BANK_CODE || 'MB';
    const fallbackAccount = ENV.BANK_ACCOUNT_NUMBER || '0901234567';
    const fallbackHolder = ENV.BANK_ACCOUNT_HOLDER || 'CONG DONG KINDR';
    const vietqrUrl = `https://img.vietqr.io/image/${fallbackBankCode}-${fallbackAccount}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(cleanDesc)}&accountName=${encodeURIComponent(fallbackHolder)}`;

    return {
      bin: '970422',
      accountNumber: fallbackAccount,
      accountName: fallbackHolder,
      amount: params.amount,
      description: cleanDesc,
      orderCode: params.orderCode,
      currency: 'VND',
      paymentLinkId: `PL_DEMO_${params.orderCode}`,
      status: 'PENDING',
      checkoutUrl: vietqrUrl,
      qrCode: vietqrUrl,
    };
  }

  /**
   * Xác thực Webhook data từ PayOS
   */
  public async verifyPaymentWebhookData(body: any): Promise<any> {
    if (this.isConfigured()) {
      return await this.client.webhooks.verify(body);
    }
    // Sandbox / local mode fallback verification:
    // If webhook data contains orderCode and amount, accept in development
    if (ENV.NODE_ENV === 'development' && body?.data) {
      return body.data;
    }
    throw new Error('PayOS credentials not configured for webhook verification');
  }

  /**
   * Lấy thông tin thanh toán đơn hàng từ PayOS
   */
  public async getPaymentLinkInformation(orderCode: number): Promise<any> {
    if (this.isConfigured()) {
      return await this.client.paymentRequests.get(orderCode);
    }
    return null;
  }

  /**
   * Hủy Payment Link trên PayOS
   */
  public async cancelPaymentLink(orderCode: number, reason?: string): Promise<any> {
    if (this.isConfigured()) {
      return await this.client.paymentRequests.cancel(orderCode, reason || 'Người dùng hủy đơn');
    }
    return { orderCode, status: 'CANCELLED' };
  }
}

export const payosService = new PayOSService();

