export interface IDeliveryRepository {
  create(delivery: any, callback: (error: Error | null, result?: any) => void): void;
  update(id: string, data: Partial<any>): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  delete(id: string): Promise<boolean>;
}
