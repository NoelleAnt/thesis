# System Limitations

As stated in the thesis proposal, **Asap-Agap** is intended to support local disaster response operations with the following limitations. These are reflected in the system design and on-screen messaging.

## 1. LGU-level scope

The system is designed for use at the **Local Government Unit (LGU)** level. It does **not** directly integrate with:

- Regional Disaster Risk Reduction and Management Council (RDRRMC)
- National Disaster Risk Reduction and Management Council (NDRRMC)
- Other national agencies

## 2. LDRRMO authority

Final decisions regarding resource allocation, approval of requests, procurement, and resource augmentation remain under the authority of the **LDRRMO** and other authorized government agencies. The system records status updates and supports coordination; it does not override official authority.

## 3. Manual data entry

The system depends on **timely and accurate manual updates** from authorized evacuation center coordinators or designated camp management personnel. Priority rankings and alerts are only as current as the data entered.

## 4. No warehouse or logistics management

The system monitors resource availability at evacuation centers and facilitates request coordination. It does **not** manage:

- Warehouse inventories
- Procurement processes
- Transportation
- Vehicle routing

## 5. No automated approval

The system does **not** automate approval or augmentation of resource requests. Status changes document coordination steps; fulfillment still follows existing LGU, Response Cluster, and **Incident Command System (ICS)** procedures.

## 6. Internet connectivity required

Internet connectivity is required to access and update the system. The client communicates with the API server; offline operation is not supported.

## 7. Decision-support only

The proposed system functions as a **decision-support tool** and is intended to **complement, not replace**, existing ICS procedures and official disaster response protocols.

---

## In-application reminders

- The login screen displays a limitation banner stating the tool does not replace ICS procedures or LDRRMO authority.
- The request review modal notes that final approval follows existing LGU and ICS procedures.
- Activity logs support ICS documentation practices but do not constitute official incident command records on their own.
