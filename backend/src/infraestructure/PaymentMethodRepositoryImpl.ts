import { IPaymentMethodRepository } from "../domain/repositories/IPaymentMethodRepository";
import { PaymentMethodEntity } from "../models/paymentMethodModel";
import AppDataSource from "../data-source";

export class PaymentMethodRepositoryImpl implements IPaymentMethodRepository {
  create(
    paymentMethod: Partial<PaymentMethodEntity>,
    callback: (error: Error | null, result?: PaymentMethodEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(PaymentMethodEntity);
    const newPaymentMethod = repo.create(paymentMethod);
    repo
      .save(newPaymentMethod)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<PaymentMethodEntity>): Promise<PaymentMethodEntity> {
    const repo = AppDataSource.getRepository(PaymentMethodEntity);
    const paymentMethodId = parseInt(id, 10);
    await repo.update(paymentMethodId, data);
    const updated = await repo.findOneBy({ id_payment_method: paymentMethodId });
    if (!updated) throw new Error(`Payment method with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<PaymentMethodEntity | null> {
    const repo = AppDataSource.getRepository(PaymentMethodEntity);
    const paymentMethodId = parseInt(id, 10);
    return await repo.findOneBy({ id_payment_method: paymentMethodId });
  }

  async findAll(): Promise<PaymentMethodEntity[]> {
    const repo = AppDataSource.getRepository(PaymentMethodEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(PaymentMethodEntity);
    const paymentMethodId = parseInt(id, 10);
    const result = await repo.delete(paymentMethodId);
    return !!result.affected && result.affected > 0;
  }
}
