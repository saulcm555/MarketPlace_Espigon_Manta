import { PaymentMethod } from "@domain/entities/payment_method";
import { IPaymentMethodRepository } from "@domain/repositories/IPaymentMethodRepository";

export class PaymentMethodService {
  constructor(private paymentMethodRepository: IPaymentMethodRepository) {}

  createPaymentMethod(paymentMethod: PaymentMethod, callback: (err: Error | null, result?: PaymentMethod) => void): void {
    this.paymentMethodRepository.create(paymentMethod, callback);
  }

  updatePaymentMethod(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.paymentMethodRepository.update(id, data);
  }

  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    return await this.paymentMethodRepository.findById(id);
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.findAll();
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    return await this.paymentMethodRepository.delete(id);
  }
}
