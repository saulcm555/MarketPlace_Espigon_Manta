import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { IsEmail, Length } from "class-validator";
import { CartEntity } from "./cartModel";

@Entity({ name: "client" })
export class ClientEntity {
	@PrimaryGeneratedColumn({ name: "id_client" })
	id_client!: number;

	@Column({ name: "client_name", length: 100 })
	@Length(3, 100)
	client_name!: string;

	@Column({ name: "client_email", length: 150, unique: true })
	@IsEmail()
	client_email!: string;

	@Column({ name: "client_password", length: 255 })
	@Length(6, 255)
	client_password!: string;

	@Column({ name: "address", length: 255 })
	@Length(3, 255)
	address!: string;

	@Column({ name: "phone", length: 20, nullable: true })
	phone?: string;

	@Column({ name: "document_type", length: 20, nullable: true })
	document_type?: string; // 'cedula', 'dni', 'pasaporte', 'ruc', etc.

	@Column({ name: "document_number", length: 50, nullable: true })
	document_number?: string;

	@Column({ name: "birth_date", type: "date", nullable: true })
	birth_date?: Date;

	@Column({ name: "avatar_url", length: 500, nullable: true })
	avatar_url?: string;

	@Column({ name: "additional_addresses", type: "text", nullable: true })
	additional_addresses?: string; // JSON string: [{"type": "casa", "address": "..."}]

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	@OneToMany(() => CartEntity, (cart) => cart.client)
	cart?: CartEntity[];
}

