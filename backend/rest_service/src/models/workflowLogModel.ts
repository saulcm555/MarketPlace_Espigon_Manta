/**
 * Workflow Log Entity
 * Almacena logs generados por workflows de n8n
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity({ name: "workflow_logs" })
export class WorkflowLogEntity {
  @PrimaryGeneratedColumn({ name: "id_log" })
  id_log!: number;

  @Column({ name: "level", type: "varchar", length: 20 })
  level!: string;

  @Column({ name: "workflow", type: "varchar", length: 100 })
  workflow!: string;

  @Column({ name: "message", type: "text" })
  message!: string;

  @Column({ name: "data", type: "text", nullable: true })
  data!: string | null;

  @Column({ name: "timestamp", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  timestamp!: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}
