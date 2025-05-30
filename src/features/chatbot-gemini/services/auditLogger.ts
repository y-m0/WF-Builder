import { AuditLogEntry } from '../types';

export const auditLogger = {
  logAction(
    role: string,
    intent: string,
    parameters: Record<string, any>,
    user?: string,
    status?: string
  ): void {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      user: user || 'system',
      role,
      intent,
      parameters,
      status
    };

    // Enhanced logging with more context
    console.log('\n=== Audit Log Entry ===');
    console.log('Timestamp:', entry.timestamp);
    console.log('User:', entry.user);
    console.log('Role:', entry.role);
    console.log('Intent:', entry.intent);
    console.log('Parameters:', JSON.stringify(entry.parameters, null, 2));
    if (entry.status) {
      console.log('Status:', entry.status);
    }
    console.log('=== End Audit Log ===\n');

    // In a real implementation, this would write to a database or file
    console.log('AUDIT LOG:', JSON.stringify(entry, null, 2));
  }
}; 