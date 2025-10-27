import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	ManyToOne,
	OneToMany,
	JoinColumn,
	CreateDateColumn,
} from "typeorm";
import { Length, Min, IsUrl } from "class-validator";
import { InventoryEntity } from "./inventoryModel";
import { SubCategoryEntity } from "./subCategoryModel";
import { CartEntity } from "./cartModel";
import { OrderEntity } from "./orderModel";

@Entity({ name: "product" })
export class ProductEntity {
	@PrimaryGeneratedColumn({ name: "id_product" })
	id_product!: number;

	@Column({ name: "id_seller" })
	id_seller!: number;

	@Column({ name: "id_inventory" })
	id_inventory!: number;

	@Column({ name: "id_category" })
	id_category!: number;

	@Column({ name: "id_sub_category" })
	id_sub_category!: number;

	@Column({ name: "id_order", nullable: true })
	id_order!: number | null;

	@Column({ name: "product_name", length: 150 })
	@Length(3, 150)
	product_name!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description!: string;

	@Column({ name: "price", type: "decimal", precision: 10, scale: 2 })
	@Min(0)
	price!: number;

	@Column({ name: "stock", type: "int" })
	@Min(0)
	stock!: number;

	@Column({ name: "image_url", nullable: true })
	@IsUrl()
	image_url!: string;

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	@ManyToOne(() => InventoryEntity, (i) => i.products)
	@JoinColumn({ name: "id_inventory" })
	inventory!: InventoryEntity;

	@ManyToOne(() => SubCategoryEntity, (s) => s.products)
	@JoinColumn({ name: "id_sub_category" })
	subcategory?: SubCategoryEntity;

	@OneToMany(() => CartEntity, (c) => c.product)
	cart?: CartEntity[];

	@ManyToOne(() => OrderEntity, (o) => o.products)
	@JoinColumn({ name: "id_order" })
	order?: OrderEntity;
}
