import { AuditLog } from "../../../core/types/models";

export interface AuditActivityItem {
  id: string;
  title: string;
  meta: string;
  badge: string;
  badgeClass: string;
  logs: AuditLog[];
}
