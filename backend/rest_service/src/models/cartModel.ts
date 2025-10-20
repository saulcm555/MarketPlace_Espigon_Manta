import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToOne,
	JoinColumn,
    OneToMany,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";
import { Length, Min } from "class-validator";
import { ProductEntity } from "./productModel";
import { ClientEntity } from "./clientModel";
import { OrderEntity } from "./orderModel";

@Entity({ name: "cart" })
export class CartEntity {
	@PrimaryGeneratedColumn({ name: "id_cart" })
	id_cart!: number;

	@Column({ name: "id_client" })
	id_client!: number;

	@Column({ name: "status", length: 50 })
	@Length(2, 50)
	status!: string;

	@Column({ name: "id_product" })
	id_product!: number;

	@Column({ name: "quantity", type: "int" })
	@Min(1)
	quantity!: number;

	@OneToMany(() => OrderEntity, (o) => o.cart)
	order?: OrderEntity;

	@ManyToOne(() => ClientEntity, (c) => c.cart)
	@JoinColumn({ name: "id_client" })
	client!: ClientEntity;

	// Relación con tabla transaccional
	@OneToMany(() => ProductCartEntity, (pc) => pc.cart)
	productCarts?: ProductCartEntity[];
}

// Entidad transaccional product_cart (tabla intermedia)
@Entity({ name: "product_cart" })
export class ProductCartEntity {
	@PrimaryGeneratedColumn({ name: "id_product_cart" })
	id_product_cart!: number;

	@Column({ name: "id_product" })
	id_product!: number;

	@Column({ name: "id_cart" })
	id_cart!: number;

	@Column({ name: "quantity", type: "int" })
	@Min(1)
	quantity!: number;

	@CreateDateColumn({ name: "added_at" })
	added_at!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updated_at!: Date;

	@ManyToOne(() => ProductEntity)
	@JoinColumn({ name: "id_product" })
	product!: ProductEntity;

	@ManyToOne(() => CartEntity, (c) => c.productCarts)
	@JoinColumn({ name: "id_cart" })
	cart!: CartEntity;
}
