/**
 * Entidad User - Tabla auth.users
 * Usuario unificado para autenticación
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { RefreshToken } from "./RefreshToken";

@Entity({ name: "users", schema: "auth_service" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 150, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, name: "password_hash" })
  password_hash!: string;

  @Column({ 
    type: "varchar", 
    length: 20,
    enum: ["client", "seller", "admin"]
  })
  role!: "client" | "seller" | "admin";

  @Index()
  @Column({ type: "int", name: "reference_id" })
  reference_id!: number; // id_client, id_seller, o id_admin

  @Column({ type: "varchar", length: 100, nullable: true })
  name!: string;

  @Column({ type: "boolean", default: true, name: "is_active" })
  is_active!: boolean;

  @Column({ type: "boolean", default: false, name: "email_verified" })
  email_verified!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "last_login" })
  last_login!: Date | null;

  @Column({ type: "int", default: 0, name: "login_attempts" })
  login_attempts!: number;

  @Column({ type: "timestamp", nullable: true, name: "locked_until" })
  locked_until!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  // Relación con refresh tokens
  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens!: RefreshToken[];

  /**
   * Verificar si la cuenta está bloqueada
   */
  isLocked(): boolean {
    if (!this.locked_until) return false;
    return new Date() < this.locked_until;
  }

  /**
   * Incrementar intentos de login fallidos
   */
  incrementLoginAttempts(): void {
    this.login_attempts += 1;
  }

  /**
   * Resetear intentos de login
   */
  resetLoginAttempts(): void {
    this.login_attempts = 0;
    this.locked_until = null;
  }

  /**
   * Bloquear cuenta por X minutos
   */
  lockAccount(minutes: number): void {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + minutes);
    this.locked_until = lockUntil;
  }
}
