import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Length, Min } from "class-validator";
import { OrderEntity } from "./orderModel";

@Entity({ name: "delivery" })
export class DeliveryEntity {
	@PrimaryGeneratedColumn({ name: "id_delivery" })
	id_delivery!: number;

	@Column({ name: "id_product" })
	id_product!: number;

	@Column({ name: "delivery_address", length: 255 })
	@Length(5, 255)
	delivery_address!: string;

	@Column({ name: "city", length: 100 })
	@Length(2, 100)
	city!: string;

	@Column({ name: "status", length: 50 })
	@Length(2, 50)
	status!: string;

	@Column({ name: "estimated_time", type: "datetime" })
	estimated_time!: Date;

	@Column({ name: "delivery_person", length: 100 })
	@Length(3, 100)
	delivery_person!: string;

	@Column({ name: "delivery_cost", type: "decimal", precision: 10, scale: 2 })
	@Min(0)
	delivery_cost!: number;

	@Column({ name: "phone", type: "bigint" })
	phone!: number;

	@OneToMany(() => OrderEntity, (o) => o.delivery)
	orders?: OrderEntity[];

}
