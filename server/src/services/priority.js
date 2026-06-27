'use strict';

import { RESOURCE_STATUS, RESOURCE_TYPES } from '../constants.js';

export function computeCenterPriority(center, requests = []) {
  const evac = center.evacuees || {};
  const total = evac.total || 0;
  const capacity = center.capacity || 1;
  const occupancyRate = Math.min(total / capacity, 1.5);

  const vulnerable =
    (evac.children || 0) + (evac.seniors || 0) + (evac.pregnant || 0) + (evac.pwd || 0);
  const vulnerableRatio = total > 0 ? vulnerable / total : 0;

  let criticalCount = 0;
  let lowCount = 0;
  let resourceScore = 0;

  for (const { key } of RESOURCE_TYPES) {
    const status = center.resources?.[key] || 'sufficient';
    const meta = RESOURCE_STATUS[status];
    resourceScore += meta?.score || 0;
    if (status === 'critical') criticalCount += 1;
    if (status === 'low') lowCount += 1;
  }

  const centerRequests = requests.filter(
    (r) => r.centerId === center.id && ['pending', 'under_review', 'approved'].includes(r.status)
  );
  let requestScore = 0;
  for (const req of centerRequests) {
    const weights = { low: 2, medium: 5, high: 10, urgent: 20 };
    requestScore += weights[req.priority] || 0;
    if (req.priority === 'urgent') requestScore += 5;
  }

  const score =
    occupancyRate * 25 +
    total * 0.08 +
    criticalCount * 18 +
    lowCount * 6 +
    vulnerableRatio * 30 +
    resourceScore * 4 +
    requestScore;

  const reasons = [];
  if (occupancyRate >= 0.9) reasons.push('Near or over capacity');
  if (criticalCount > 0) reasons.push(`${criticalCount} critical resource shortage(s)`);
  if (vulnerableRatio >= 0.35) reasons.push('High vulnerable population');
  if (centerRequests.some((r) => r.priority === 'urgent')) reasons.push('Urgent pending request(s)');
  if (lowCount >= 3) reasons.push('Multiple low-stock resources');

  let level = 'normal';
  if (score >= 80 || criticalCount >= 2) level = 'critical';
  else if (score >= 50 || criticalCount >= 1) level = 'high';
  else if (score >= 30) level = 'moderate';

  return {
    centerId: center.id,
    centerName: center.name,
    score: Math.round(score * 10) / 10,
    level,
    reasons,
    criticalCount,
    lowCount,
    pendingRequests: centerRequests.length,
    evacuees: total,
    vulnerable,
    occupancyPct: Math.round(occupancyRate * 100),
  };
}

export function rankCenters(centers, requests) {
  return centers
    .filter((c) => c.status === 'active')
    .map((c) => computeCenterPriority(c, requests))
    .sort((a, b) => b.score - a.score);
}

export function getCriticalAlerts(centers) {
  const alerts = [];
  for (const center of centers) {
    if (center.status !== 'active') continue;
    for (const { key, label } of RESOURCE_TYPES) {
      if (center.resources?.[key] === 'critical') {
        alerts.push({
          centerId: center.id,
          centerName: center.name,
          resource: key,
          resourceLabel: label,
          evacuees: center.evacuees?.total || 0,
        });
      }
    }
  }
  return alerts.sort((a, b) => b.evacuees - a.evacuees);
}

export function getSummaryStats(centers, requests) {
  const active = centers.filter((c) => c.status === 'active');
  const totalEvacuees = active.reduce((s, c) => s + (c.evacuees?.total || 0), 0);
  const totalVulnerable = active.reduce((s, c) => {
    const e = c.evacuees || {};
    return s + (e.children || 0) + (e.seniors || 0) + (e.pregnant || 0) + (e.pwd || 0);
  }, 0);

  const pendingRequests = requests.filter((r) => r.status === 'pending').length;
  const urgentRequests = requests.filter(
    (r) => r.priority === 'urgent' && ['pending', 'under_review'].includes(r.status)
  ).length;
  const criticalAlerts = getCriticalAlerts(active).length;

  return {
    centerCount: active.length,
    totalEvacuees,
    totalVulnerable,
    pendingRequests,
    urgentRequests,
    criticalAlerts,
  };
}
