# Support Model

## Purpose

This support model defines practical post-release support boundaries for Midland Sleep.

It is designed to keep the portal safe, maintainable, and commercially sustainable after Phase 1. It does not create unlimited support, emergency SLA guarantees, clinical responsibility, or open-ended feature delivery.

## Retainer Anchor

Recommended monthly support retainer:

**NZD 2,300 per month including GST**

This is the anchor support level unless commercial terms change in writing.

## Included Monthly Support

Included within the monthly retainer:

- production issue triage for agreed Phase 1 workflows
- bug fixes for agreed production workflows
- admin/import workflow support
- support for agreed import batches
- minor operational guidance for Midland admin users
- clarification of documented SOPs
- deployment checks for agreed releases
- small low-risk copy or display corrections
- monthly prioritisation call or written support check-in

Included support is bounded by reasonable monthly capacity. It is not a bank of unlimited development hours.

## Excluded Work

Excluded unless separately scoped and approved:

- new patient portal features
- checkout, Stripe, payment, refund, or subscription work
- inventory or fulfilment system development
- email campaigns, patient invites, or communication automation
- Cognito/account workflow changes
- new clinical workflows or clinical decisioning
- analytics dashboards or advanced audit dashboards
- backup or disaster-recovery systems
- large UI redesigns
- major data model changes
- unlimited spreadsheet formats
- bulk data correction requiring Midland judgement
- legal, privacy, compliance, or clinical sign-off
- after-hours emergency cover unless separately contracted

## Response Expectations

Default working expectation:

- Critical production-blocking issue: acknowledge within 1 business day.
- Normal production issue: acknowledge within 2 business days.
- Minor question or low-impact request: acknowledge within 3 business days.
- Feature or change request: acknowledge and route to change-request review.

These are response expectations, not guaranteed resolution times.

## Bug vs Feature Request

Bug:

- existing agreed workflow does not behave as documented
- safe field display is incorrect
- imported patient drawer fails for records it should support
- dry run or execute behaves differently from the approved SOP

Feature request:

- new workflow
- new field or data source
- new export shape
- new dashboard
- new automation
- new patient-facing behaviour
- new admin action that changes state

Feature requests require prioritisation and may need a separate estimate.

## Change Request Process

1. Midland describes the requested outcome.
2. Technical support confirms whether it is a bug, support item, or change request.
3. For change requests, define scope, assumptions, exclusions, and acceptance criteria.
4. Estimate cost, timing, and risk.
5. Midland approves in writing before work starts.
6. SOP/release notes are updated if the change affects operations.

## AWS and Hosting Boundaries

Support can include reasonable review of application behaviour in the hosted environment.

Unless separately agreed, support does not include AWS account ownership, billing responsibility, formal cloud security management, disaster recovery guarantees, backup system design, infrastructure cost optimisation, or third-party outage responsibility.

## Clinic Staff Boundaries

Clinic staff may request help with documented admin workflows, import result categories, finding imported patients, drawer fields, and escalation paths.

Clinic staff should not ask technical support to decide whether two patients are the same person, decide whether a machine serial belongs to a patient, correct clinical/source data without Midland approval, provide clinical advice, bypass import safety checks, or trigger patient communications outside approved workflows.
