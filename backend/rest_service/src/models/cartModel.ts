import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToOne,
	JoinColumn,
    OneToMany,
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

	@ManyToOne(() => ProductEntity)
	@JoinColumn({ name: "id_product" })
	product?: ProductEntity;

	@OneToMany(() => OrderEntity, (o) => o.cart)
	order?: OrderEntity;

	@ManyToOne(() => ClientEntity, (c) => c.cart)
	@JoinColumn({ name: "id_client" })
	client!: ClientEntity;
}
