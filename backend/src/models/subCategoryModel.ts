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
}
