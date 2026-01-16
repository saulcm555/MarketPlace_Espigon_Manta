/**
 * Entidad RefreshToken - Tabla auth.refresh_tokens
 * Almacena los refresh tokens emitidos
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User";

@Entity({ name: "refresh_tokens", schema: "auth_service" })
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", name: "user_id" })
  user_id!: string;

  @Index()
  @Column({ type: "varchar", length: 255, name: "token_hash" })
  token_hash!: string; // SHA256 del refresh token

  @Column({ type: "varchar", length: 255, nullable: true, name: "device_info" })
  device_info!: string | null;

  @Column({ type: "varchar", length: 45, nullable: true, name: "ip_address" })
  ip_address!: string | null;

  @Column({ type: "text", nullable: true, name: "user_agent" })
  user_agent!: string | null;

  @Index()
  @Column({ type: "timestamp", name: "expires_at" })
  expires_at!: Date;

  @Column({ type: "boolean", default: false, name: "is_revoked" })
  is_revoked!: boolean;

  @Column({ type: "timestamp", nullable: true, name: "revoked_at" })
  revoked_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  // Relación con User
  @ManyToOne(() => User, (user) => user.refresh_tokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;

  /**
   * Verificar si el token ha expirado
   */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  /**
   * Verificar si el token es válido (no revocado y no expirado)
   */
  isValid(): boolean {
    return !this.is_revoked && !this.isExpired();
  }

  /**
   * Revocar el token
   */
  revoke(): void {
    this.is_revoked = true;
    this.revoked_at = new Date();
  }
}
