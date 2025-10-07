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

	@CreateDateColumn({ name: "created_at" })
	created_at!: Date;

	@OneToMany(() => CartEntity, (cart) => cart.client)
	cart?: CartEntity[];
}

