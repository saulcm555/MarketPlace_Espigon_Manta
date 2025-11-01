import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { IsEmail, Length } from "class-validator";
import { InventoryEntity } from "./inventoryModel";

@Entity({ name: "seller" })
export class SellerEntity {
	@PrimaryGeneratedColumn({ name: "id_seller" })
	id_seller!: number;

	@Column({ name: "seller_name", length: 100 })
	@Length(3, 100)
	seller_name!: string;

	@Column({ name: "seller_email", length: 150, unique: true })
	@IsEmail()
	seller_email!: string;

	@Column({ name: "seller_password", length: 255 })
	@Length(6, 255)
	seller_password!: string;

	@Column({ name: "phone", type: "bigint" })
	phone!: number;

	@Column({ name: "bussines_name", length: 150 })
	@Length(2, 150)
	bussines_name!: string;

	@Column({ name: "location", length: 150 })
	@Length(2, 150)
	location!: string;

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	@OneToMany(() => InventoryEntity, (inv) => inv.seller)
	inventories?: InventoryEntity[];
}
