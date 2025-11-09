import * as cron from 'node-cron';
import { PaymentReceiptCleanup } from './cleanupPaymentReceipts';

/**
 * Scheduler para tareas programadas
 * Ejecuta limpieza de comprobantes diariamente a las 2:00 AM
 */
export class CleanupScheduler {
  private static task: cron.ScheduledTask | null = null;

  /**
   * Inicia el scheduler de limpieza
   */
  static start(): void {
    const enabled = process.env.CLEANUP_ENABLED !== 'false'; // Por defecto: true
    
    if (!enabled) {
      console.log('⏸️  [SCHEDULER] Limpieza automática deshabilitada (CLEANUP_ENABLED=false)');
      return;
    }

    // Expresión cron: Todos los días a las 2:00 AM
    // Formato: segundo minuto hora día mes día-semana
    const schedule = process.env.CLEANUP_SCHEDULE || '0 2 * * *';
    
    console.log('🕐 [SCHEDULER] Configurando limpieza automática de comprobantes...');
    console.log(`   - Horario: ${schedule} (${this.parseSchedule(schedule)})`);
    console.log(`   - Retención no verificados: ${process.env.UNVERIFIED_RETENTION_DAYS || 15} días`);
    console.log(`   - Retención verificados: ${process.env.VERIFIED_RETENTION_DAYS || 60} días`);

    // Crear tarea programada
    this.task = cron.schedule(schedule, async () => {
      console.log('\n⏰ [SCHEDULER] Ejecutando limpieza programada...');
      try {
        await PaymentReceiptCleanup.execute();
        console.log('✅ [SCHEDULER] Limpieza completada\n');
      } catch (error) {
        console.error('❌ [SCHEDULER] Error en limpieza programada:', error);
      }
    }, {
      timezone: "America/Guayaquil" // Ecuador timezone
    });

    console.log('✅ [SCHEDULER] Limpieza automática iniciada correctamente');
    
    // Ejecutar una vez al iniciar (opcional, comentar si no se desea)
    // this.runNow();
  }

  /**
   * Detiene el scheduler
   */
  static stop(): void {
    if (this.task) {
      this.task.stop();
      console.log('⏹️  [SCHEDULER] Limpieza automática detenida');
    }
  }

  /**
   * Ejecuta la limpieza inmediatamente (manual)
   */
  static async runNow(): Promise<void> {
    console.log('▶️  [SCHEDULER] Ejecutando limpieza manual...');
    try {
      await PaymentReceiptCleanup.execute();
      console.log('✅ [SCHEDULER] Limpieza manual completada');
    } catch (error) {
      console.error('❌ [SCHEDULER] Error en limpieza manual:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de comprobantes
   */
  static async getStats(): Promise<any> {
    return await PaymentReceiptCleanup.getStats();
  }

  /**
   * Traduce la expresión cron a texto legible
   */
  private static parseSchedule(schedule: string): string {
    const parts = schedule.split(' ');
    if (parts.length === 5) {
      const [minute, hour] = parts;
      return `Todos los días a las ${hour}:${minute?.padStart(2, '0') || '00'}`;
    }
    return schedule;
  }

  /**
   * Verifica si el scheduler está activo
   */
  static isRunning(): boolean {
    return this.task !== null && this.task !== undefined;
  }
}

/**
 * Función helper para iniciar el scheduler
 */
export const startCleanupScheduler = (): void => {
  CleanupScheduler.start();
};

/**
 * Función helper para detener el scheduler
 */
export const stopCleanupScheduler = (): void => {
  CleanupScheduler.stop();
};

/**
 * Función helper para ejecutar limpieza manual
 */
export const runCleanupNow = async (): Promise<void> => {
  await CleanupScheduler.runNow();
};
