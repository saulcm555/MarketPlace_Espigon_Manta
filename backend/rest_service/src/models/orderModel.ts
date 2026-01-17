import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToOne,
	JoinColumn,
	CreateDateColumn,
    OneToMany,
} from "typeorm";
import { Length, Min } from "class-validator";
import { ClientEntity } from "./clientModel";
import { PaymentMethodEntity } from "./paymentMethodModel";
import { CartEntity } from "./cartModel";
import { DeliveryEntity } from "./deliveryModel";
import { ProductEntity } from "./productModel";

@Entity({ name: "order" })
export class OrderEntity {
	@PrimaryGeneratedColumn({ name: "id_order" })
	id_order!: number;

	@CreateDateColumn({ name: "order_date" })
	order_date!: Date;

	@Column({ name: "status", length: 50 })
	@Length(2, 50)
	status!: string;

	@Column({ name: "total_amount", type: "decimal", precision: 10, scale: 2 })
	@Min(0)
	total_amount!: number;

	@Column({ name: "delivery_type", length: 100 })
	@Length(2, 100)
	delivery_type!: string;

	@Column({ name: "id_client" })
	id_client!: number;

	// Relación con cliente (sin foreign key constraint por problemas de compatibilidad)
	@ManyToOne(() => ClientEntity, { createForeignKeyConstraints: false })
	@JoinColumn({ name: "id_client" })
	client?: ClientEntity;

	@Column({ name: "id_cart" })
	id_cart!: number;

	@Column({ name: "id_payment_method" })
	id_payment_method!: number;

	// Nuevos campos para sistema de pago por transferencia
	@Column({ name: "payment_receipt_url", type: "text", nullable: true })
	payment_receipt_url?: string;

	@Column({ name: "payment_verified_at", type: "timestamp", nullable: true })
	payment_verified_at?: Date;

	// Campos para integración con Payment Service (Pilar 2)
	@Column({ name: "transaction_id", type: "varchar", length: 255, nullable: true })
	transaction_id?: string;

	@Column({ name: "payment_status", type: "varchar", length: 50, nullable: true, default: 'pending' })
	payment_status?: string;

	@Column({ name: "payment_error", type: "text", nullable: true })
	payment_error?: string;

	// Relación con método de pago (comentada porque causa problemas con foreign key)
	// @ManyToOne(() => PaymentMethodEntity)
	// @JoinColumn({ name: "id_payment_method" })
	// paymentMethod?: PaymentMethodEntity;

	@ManyToOne(() => CartEntity, (c) => c.order)
	@JoinColumn({ name: "id_cart" })
	cart!: CartEntity;

	@Column({ name: "id_delivery", nullable: true })
	id_delivery!: number | null;

	@ManyToOne(() => DeliveryEntity, (d) => d.orders)
	@JoinColumn({ name: "id_delivery" })
	delivery!: DeliveryEntity;

	// Relación con tabla transaccional
	@OneToMany(() => ProductOrderEntity, (po) => po.order)
	productOrders?: ProductOrderEntity[];
}

// Entidad transaccional product_order (tabla intermedia)
@Entity({ name: "product_order" })
export class ProductOrderEntity {
	@PrimaryGeneratedColumn({ name: "id_product_order" })
	id_product_order!: number;

	@Column({ name: "id_order" })
	id_order!: number;

	@Column({ name: "id_product" })
	id_product!: number;

	@Column({ name: "price_unit", type: "decimal", precision: 10, scale: 2 })
	@Min(0)
	price_unit!: number;

	@Column({ name: "subtotal", type: "decimal", precision: 10, scale: 2 })
	@Min(0)
	subtotal!: number;

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	// Campos de reseña
	@Column({ name: "rating", type: "int", nullable: true })
	@Min(1)
	rating?: number;

	@Column({ name: "review_comment", type: "text", nullable: true })
	review_comment?: string;

	@Column({ name: "reviewed_at", type: "timestamp", nullable: true })
	reviewed_at?: Date;

	@ManyToOne(() => OrderEntity, (o) => o.productOrders)
	@JoinColumn({ name: "id_order" })
	order!: OrderEntity;

	@ManyToOne(() => ProductEntity)
	@JoinColumn({ name: "id_product" })
	product!: ProductEntity;
}

