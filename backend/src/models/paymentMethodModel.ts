import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from "typeorm";
import { Length } from "class-validator";
import { OrderEntity } from "./orderModel";

@Entity({ name: "payment_method" })
export class PaymentMethodEntity {
	@PrimaryGeneratedColumn({ name: "id_payment_method" })
	id_payment_method!: number;

	@Column({ name: "method_name", length: 100 })
	@Length(3, 100)
	method_name!: string;

	@Column({ name: "details_payment", type: "text", nullable: true })
	details_payment!: string;

	@ManyToOne(() => OrderEntity, (o) => o.paymentMethod)
	orders!: OrderEntity[];
}


