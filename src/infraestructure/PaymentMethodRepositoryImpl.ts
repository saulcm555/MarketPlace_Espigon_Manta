import { PaymentMethod } from "@domain/entities/payment_method";
import { IPaymentMethodRepository } from "@domain/repositories/IPaymentMethodRepository";

export class PaymentMethodRepositoryImpl implements IPaymentMethodRepository {
  private paymentMethods: PaymentMethod[] = [];
  private currentId = 1;

  create(
    paymentMethod: PaymentMethod,
    callback: (error: Error | null, result?: PaymentMethod) => void
  ): void {
    try {
      if (!paymentMethod.method_name) {
        return callback(new Error("Payment method must have a name."));
      }
      const newPaymentMethod: PaymentMethod = {
        ...paymentMethod,
        id_payment_method: this.currentId++,
      };
      this.paymentMethods.push(newPaymentMethod);
      callback(null, newPaymentMethod);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const paymentMethodId = parseInt(id, 10);
    const index = this.paymentMethods.findIndex((p) => p.id_payment_method === paymentMethodId);
    if (index === -1) {
      throw new Error(`Payment method with id ${id} not found`);
    }
    this.paymentMethods[index] = {
      ...this.paymentMethods[index]!,
      ...data,
    };
    return this.paymentMethods[index]!;
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const paymentMethodId = parseInt(id, 10);
    const paymentMethod = this.paymentMethods.find((p) => p.id_payment_method === paymentMethodId);
    return paymentMethod || null;
  }

  async findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethods;
  }

  async delete(id: string): Promise<boolean> {
    const paymentMethodId = parseInt(id, 10);
    const index = this.paymentMethods.findIndex((p) => p.id_payment_method === paymentMethodId);
    if (index === -1) {
      return false;
    }
    this.paymentMethods.splice(index, 1);
    return true;
  }
}
