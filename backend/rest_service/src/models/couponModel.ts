import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';

/**
 * Modelo de Cupón
 * Representa cupones de descuento recibidos de partners (ej. Gym)
 * o generados internamente por promociones
 */
@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('increment', { name: 'id_coupon' })
  id_coupon!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percent!: number;

  @Column({ type: 'varchar', length: 50, default: 'percentage' })
  discount_type!: string; // 'percentage' o 'fixed_amount'

  @Column({ type: 'varchar', length: 100, default: 'all_products' })
  valid_for!: string; // 'all_products', 'specific_category', etc.

  @Column({ type: 'timestamp', nullable: true })
  expires_at!: Date;

  @Column({ type: 'varchar', length: 100 })
  issued_by!: string; // 'Gym Management', 'MarketPlace Promo', etc.

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimum_purchase!: number;

  @Column({ type: 'varchar', length: 255 })
  customer_email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at!: Date;

  @Column({ type: 'integer', nullable: true })
  order_id!: number; // Referencia a la orden donde se usó

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Métodos de validación
  isValid(): boolean {
    if (!this.is_active || this.used) {
      return false;
    }

    if (this.expires_at && new Date() > new Date(this.expires_at)) {
      return false;
    }

    return true;
  }

  canApplyToOrder(orderTotal: number): boolean {
    if (!this.isValid()) {
      return false;
    }

    if (orderTotal < this.minimum_purchase) {
      return false;
    }

    return true;
  }

  calculateDiscount(orderTotal: number): number {
    if (!this.canApplyToOrder(orderTotal)) {
      return 0;
    }

    if (this.discount_type === 'percentage') {
      return (orderTotal * this.discount_percent) / 100;
    }

    if (this.discount_type === 'fixed_amount') {
      return Math.min(this.discount_percent, orderTotal);
    }

    return 0;
  }
}
