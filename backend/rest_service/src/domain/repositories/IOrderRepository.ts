export interface IOrderRepository {
  create(order: any, callback: (error: Error | null, result?: any) => void): void;
  update(id: string, data: Partial<any>): Promise<any>;
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  delete(id: string): Promise<boolean>;
  addReview(id_product_order: number, rating: number, review_comment?: string): Promise<any>;
  getProductReviews(id_product: number): Promise<any[]>;
}
