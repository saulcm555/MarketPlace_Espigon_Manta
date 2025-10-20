import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Length } from "class-validator";
import { CategoryEntity } from "./categoryModel";
import { ProductEntity } from "./productModel";

@Entity({ name: "sub_category" })
export class SubCategoryEntity {
  @PrimaryGeneratedColumn({ name: "id_sub_category" })
  id_sub_category!: number;

  @Column({ name: "id_category" })
  id_category!: number;

  @Column({ name: "sub_category_name", length: 100 })
  @Length(3, 100)
  sub_category_name!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string;

  @ManyToOne(() => CategoryEntity, (cat) => cat.subcategories, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "id_category" })
  category!: CategoryEntity;

  @OneToMany(() => ProductEntity, (p) => p.subcategory)
  products?: ProductEntity[];

  // Relación con tabla transaccional
  @OneToMany(() => SubCategoryProductEntity, (scp) => scp.subCategory)
  subCategoryProducts?: SubCategoryProductEntity[];
}

// Entidad transaccional sub_category_product (tabla intermedia)
@Entity({ name: "sub_category_product" })
export class SubCategoryProductEntity {
  @PrimaryGeneratedColumn({ name: "id_sub_category_product" })
  id_sub_category_product!: number;

  @Column({ name: "id_sub_category" })
  id_sub_category!: number;

  @Column({ name: "id_product" })
  id_product!: number;

  @ManyToOne(() => SubCategoryEntity, (sc) => sc.subCategoryProducts)
  @JoinColumn({ name: "id_sub_category" })
  subCategory!: SubCategoryEntity;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: "id_product" })
  product!: ProductEntity;
}
