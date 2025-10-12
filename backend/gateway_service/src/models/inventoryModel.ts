import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, UpdateDateColumn } from "typeorm";
import { SellerEntity } from "./sellerModel";
import { ProductEntity } from "./productModel";

@Entity({ name: "inventory" })
export class InventoryEntity {
	@PrimaryGeneratedColumn({ name: "id_inventory" })
	id_inventory!: number;

	@Column({ name: "id_seller" })
	id_seller!: number;

	@UpdateDateColumn({ name: "updated_at" })
	updated_at!: Date;

	@ManyToOne(() => SellerEntity, (s) => s.inventories)
	@JoinColumn({ name: "id_seller" })
	seller!: SellerEntity;

	@OneToMany(() => ProductEntity, (p) => p.inventory)
	products?: ProductEntity[];
}
