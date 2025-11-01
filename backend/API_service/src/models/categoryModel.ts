import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Length, IsUrl } from "class-validator";
import { SubCategoryEntity } from "./subCategoryModel";

@Entity({ name: "category" })
export class CategoryEntity {
	@PrimaryGeneratedColumn({ name: "id_category" })
	id_category!: number;

	@Column({ name: "category_name", length: 100 })
	@Length(3, 100)
	category_name!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description!: string;

	@Column({ name: "photo", nullable: true })
	@IsUrl()
	photo!: string;

	@OneToMany(() => SubCategoryEntity, (sub) => sub.category, {
		cascade: false,
	})
	subcategories?: SubCategoryEntity[];
}

