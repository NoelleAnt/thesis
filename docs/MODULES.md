# Modules and Scope

This document maps the thesis scope to the **Asap-Agap** implementation.

## Intended users

- Evacuation center coordinators
- Designated camp management personnel
- Local Disaster Risk Reduction and Management Office (LDRRMO)

---

## Module A — Evacuation Center Management

**Thesis requirements:**

- Register evacuation centers
- Maintain evacuation center information
- Record current number of evacuees
- Monitor vulnerable populations (children, senior citizens, pregnant women, PWD)

**Implementation:**

| Feature | UI | API |
|---------|----|-----|
| Register center | Centers → Register Center (LDRRMO) | `POST /api/centers` |
| Edit center info | Centers → Edit | `PUT /api/centers/:id` |
| Update evacuees | Centers / My Center → Evacuees | `PATCH /api/centers/:id/evacuees` |
| Vulnerable counts | Evacuee modal (children, seniors, pregnant, PWD) | Same endpoint |

**Database:** `evacuation_centers` table stores profile fields and evacuee columns.

---

## Module B — Emergency Resource Monitoring

**Thesis requirements:**

Track five resource types with status levels: **Sufficient**, **Low Stock**, **Critical**.

| Resource | DB column |
|----------|-----------|
| Food | `resource_food` |
| Drinking water | `resource_water` |
| Medicines | `resource_medicines` |
| Hygiene kits | `resource_hygiene_kits` |
| Sleeping kits | `resource_sleeping_kits` |

**Implementation:**

| Feature | UI | API |
|---------|----|-----|
| View resource status | Resource Monitoring | `GET /api/centers` |
| Update status | Update button per center | `PATCH /api/centers/:id/resources` |

Field staff can update only their assigned center; LDRRMO can view all centers.

---

## Module C — Resource Request Management

**Thesis requirements:**

Each request includes requested resource, priority level, reason, date submitted, and current status.

**Implementation:**

| Field | Storage |
|-------|---------|
| Requested resource | `resource_requests.resource` |
| Priority level | `resource_requests.priority` (low / medium / high / urgent) |
| Reason | `resource_requests.reason` |
| Date submitted | `resource_requests.date_submitted` |
| Current status | `resource_requests.status` (pending / under_review / approved / fulfilled / denied) |

| Action | UI | API |
|--------|----|-----|
| Submit request | Resource Requests → New Request | `POST /api/requests` |
| Track requests | Resource Requests table | `GET /api/requests` |
| Review (LDRRMO) | Review button | `PATCH /api/requests/:id/status` |

---

## Module D — Decision Support Dashboard

**Thesis requirements:**

LDRRMO consolidated view including:

- Current resource status
- Number of evacuees
- Pending resource requests
- Priority rankings
- Critical shortage alerts
- Request history

**Priority recommendations based on:**

- Number of evacuees
- Reported critical shortages
- Availability of basic services
- Presence of vulnerable populations
- Current availability of essential resources

**Implementation:**

| Widget | Source |
|--------|--------|
| Summary stats | `getSummaryStats()` |
| Critical alerts | `getCriticalAlerts()` |
| Priority rankings | `rankCenters()` |
| Pending / history | `resource_requests` query |
| Resource overview | Active centers |

API: `GET /api/dashboard` (LDRRMO role required)

Logic: `server/src/services/priority.js`

---

## Module E — Activity and Inventory Logs

**Thesis requirements:**

Record inventory updates, resource requests, and request status changes for ICS accountability.

**Implementation:**

| Logged action | Trigger |
|---------------|---------|
| Center registered | New center created |
| Center updated | Profile edited |
| Evacuee count updated | Evacuee modal saved |
| Resource updated | Resource status saved |
| Request submitted | New request |
| Request status changed | LDRRMO review |

UI: **Activity Logs** page with filter by action type.

API: `GET /api/logs`

Database: `activity_logs` table (max 200 recent entries retained in prototype seed; production can archive).

---

## Role-based navigation

| Nav item | LDRRMO | Coordinator / Camp manager |
|----------|--------|------------------------------|
| LDRRMO Dashboard | Yes | Hidden |
| My Center | Hidden | Yes |
| Evacuation Centers | Yes (all) | Yes (assigned only) |
| Resource Monitoring | Yes | Yes (assigned only) |
| Resource Requests | Yes | Yes (own center) |
| Activity Logs | Yes | Yes |
