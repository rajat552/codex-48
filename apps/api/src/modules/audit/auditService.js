import { AuditEvent } from './auditEventModel.js';
import { logger } from '../../config/logger.js';

export class AuditService {
  /**
   * Appends an immutable audit event to the append-only log
   */
  static async recordEvent({
    workspaceId,
    actorId,
    entityType,
    entityId,
    action,
    fromState = null,
    toState = null,
    reason = null,
    metadata = {}
  }) {
    try {
      const event = await AuditEvent.create({
        workspaceId,
        actorId,
        entityType,
        entityId: entityId.toString(),
        action,
        fromState,
        toState,
        reason,
        timestamp: new Date(),
        metadata
      });
      logger.info('Audit event recorded', {
        action,
        entityType,
        entityId: entityId.toString(),
        workspaceId: workspaceId.toString()
      });
      return event;
    } catch (err) {
      logger.error('Failed to write audit event', {
        error: err.message,
        action,
        entityType,
        entityId
      });
      throw err;
    }
  }

  /**
   * Queries audit events for an entity or workspace
   */
  static async getEventsForEntity(workspaceId, entityType, entityId) {
    return await AuditEvent.find({
      workspaceId,
      entityType,
      entityId: entityId.toString()
    }).sort({ timestamp: -1 });
  }

  static async getWorkspaceEvents(workspaceId, limit = 50) {
    return await AuditEvent.find({
      workspaceId
    })
      .sort({ timestamp: -1 })
      .limit(limit);
  }
}
