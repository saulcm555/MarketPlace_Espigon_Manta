/**
 * Entidad RevokedToken - Tabla auth.revoked_tokens (Blacklist)
 * Almacena los access tokens que han sido revocados antes de su expiración
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "revoked_tokens", schema: "auth_service" })
export class RevokedToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255, name: "token_jti" })
  token_jti!: string; // JWT ID del token revocado

  @Column({ type: "uuid", nullable: true, name: "user_id" })
  user_id!: string | null;

  @Column({ 
    type: "varchar", 
    length: 50, 
    nullable: true,
    enum: ["logout", "password_change", "admin_action", "suspicious_activity"]
  })
  reason!: "logout" | "password_change" | "admin_action" | "suspicious_activity" | null;

  @Index()
  @Column({ type: "timestamp", name: "original_exp" })
  original_exp!: Date; // Cuándo expiraba originalmente el token

  @CreateDateColumn({ name: "revoked_at" })
  revoked_at!: Date;

  /**
   * Verificar si el registro de revocación ya expiró
   * (el token original ya habría expirado naturalmente)
   */
  hasExpired(): boolean {
    return new Date() > this.original_exp;
  }
}
