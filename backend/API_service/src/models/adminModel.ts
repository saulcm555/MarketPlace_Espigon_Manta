import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { IsEmail, Length } from "class-validator";

@Entity({ name: "admin" })
export class AdminEntity {
	@PrimaryGeneratedColumn({ name: "id_admin" })
	id_admin!: number;

	@Column({ name: "admin_name", length: 100 })
	@Length(3, 100)
	admin_name!: string;

	@Column({ name: "admin_email", length: 150, unique: true })
	@IsEmail()
	admin_email!: string;

	@Column({ name: "admin_password", length: 255 })
	@Length(6, 255)
	admin_password!: string;

	@Column({ name: "role", length: 50 })
	@Length(3, 50)
	role!: string;

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;
}

