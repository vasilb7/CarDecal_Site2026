
import { supabase } from './supabase';
import type { Casting } from '../types';

export const dashboardService = {
  // Get Operational KPIs (Action-Oriented)
  async getAgencyKPIs() {
    // In a real implementation, these would range queries or dedicated views
    // For now, we mock the logic based on the user's "surgical plan" requirements
    return {
      newApplicants: 12, // Needs action: /admin/models?status=new
      postsToReview: 5,  // Needs action: /admin/moderation
      castingsNeedTalent: 2, // Needs action: /admin/castings?low=true
      clientRequests: 8 // Needs action: /admin/inbox
    };
  },

  // Get Casting Funnel Stats (The Real Business)
  async getFunnelStats() {
    return {
      applications: 145,
      shortlisted: 42,
      selected: 18,
      booked: 7
    };
  },

  // Get Realtime Audit Log
  async getAuditLog() {
    // This would connect to an 'audit_events' table
    return [
      { id: '1', action: 'Application', description: 'Maria I. applied for Summer Campaign', time: '5m ago', type: 'application' },
      { id: '2', action: 'Approval', description: 'Admin approved Ivan P.', time: '1h ago', type: 'admin' },
      { id: '3', action: 'Alert', description: 'Casting "TV Commercial" needs 2 more applicants', time: '2h ago', type: 'alert' },
      { id: '4', action: 'System', description: 'Daily backup completed', time: '1d ago', type: 'system' }
    ];
  }
};
