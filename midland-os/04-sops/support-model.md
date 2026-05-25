# Support Model

## Purpose

This support model defines practical post-release support boundaries for Midland Sleep.

It is designed to keep the portal safe, maintainable, and commercially sustainable after Phase 1. It does not create unlimited support, emergency SLA guarantees, clinical responsibility, or open-ended feature delivery.

## Retainer Anchor

Recommended monthly support retainer:

**NZD 2,300 per month including GST**

This is the anchor support level unless commercial terms change in writing.

The retainer is intended to cover agreed operational support, maintenance, minor improvements, release care, and import/admin workflow assistance. Work outside these boundaries should be quoted separately or scheduled through a change request.

## Included Monthly Support

Included within the monthly retainer:

- production issue triage for agreed Phase 1 workflows
- bug fixes for agreed production workflows
- admin/import workflow support
- support for agreed import batches
- minor operational guidance for Midland admin users
- clarification of documented SOPs
- deployment checks for agreed releases
- small copy or display corrections where low-risk
- review of logs or evidence provided by Midland for a reported issue
- monthly prioritisation call or written support check-in
- small maintenance updates that protect the existing system

Included support is bounded by reasonable monthly capacity. It is not a bank of unlimited development hours.

## Excluded Work

Excluded unless separately scoped and approved:

- new patient portal features
- checkout, Stripe, payments, refunds, or subscription work
- inventory or fulfilment system development
- email campaigns, patient invites, or communication automation
- Cognito/account workflow changes
- new clinical workflows or clinical decisioning
- new analytics dashboards
- advanced audit dashboard development
- new backup or disaster-recovery systems
- large UI redesigns
- new database tables or major data model changes
- support for unlimited spreadsheet formats
- bulk data correction requiring Midland judgement
- legal, privacy, compliance, or clinical sign-off
- after-hours emergency cover unless separately contracted

## Response Expectations

Response expectations should be agreed in writing with Midland.

Default working expectation:

- Critical production-blocking issue: acknowledge within 1 business day.
- Normal production issue: acknowledge within 2 business days.
- Minor question or low-impact request: acknowledge within 3 business days.
- Feature or change request: acknowledge and route to change-request review, not immediate delivery.

These are response expectations, not guaranteed resolution times. Resolution depends on issue complexity, access, vendor/platform availability, and whether Midland decisions or data are required.

## Emergency Handling

Emergency support is for true production-blocking issues affecting agreed Phase 1 workflows, such as:

- authorised admin cannot access the system
- import workflow is unexpectedly writing unsafe data
- raw NHI appears where it should not
- imported patient records cannot be reviewed after a confirmed successful import

Emergency handling does not include:

- new feature requests
- routine import preparation
- source spreadsheet corrections
- clinical or identity decisions
- after-hours response unless separately agreed

If after-hours or guaranteed emergency SLA support is required, it must be priced and agreed separately.

## Bug vs Feature Request

Bug:

- existing agreed workflow does not behave as documented
- safe field display is incorrect
- imported patient drawer fails for records it should support
- dry run or execute behaves differently from the approved SOP

Expected behaviour — not a bug:

- import history not appearing on a different device or browser — history is browser-local by design; download batch evidence CSVs at time of import for persistent records
- import history lost after browser data is cleared — expected behaviour; this is a known limitation of the current implementation
- rollback button is disabled — rollback is a placeholder only; automated reversal is not implemented

Feature request:

- new workflow
- new field or data source
- new export shape
- new dashboard
- new automation
- new patient-facing behaviour
- new admin action that changes state
- backend-persistent import history shared across devices or admin users

Bugs may be handled within support if they affect agreed workflows. Feature requests require prioritisation and may need a separate estimate.

## Change Request Process

For any request outside included support:

1. Midland describes the requested outcome.
2. Technical support confirms whether it is a bug, minor support item, or change request.
3. If it is a change request, define scope, assumptions, exclusions, and acceptance criteria.
4. Estimate cost, timing, and risk.
5. Midland approves in writing before work starts.
6. Release and SOP updates are planned if the change affects operations.

No work should proceed on vague or unlimited change requests.

## Monthly Improvement Cadence

Recommended cadence:

1. Monthly check-in with Midland owner.
2. Review support issues from the previous month.
3. Review import/admin workflow friction.
4. Confirm any upcoming import batches.
5. Prioritise one or two small improvements if capacity allows.
6. Separate larger initiatives into scoped proposals.

The cadence should protect production stability first. Improvements should not quietly become a major redesign or unapproved new product phase.

## AWS and Hosting Boundaries

Support can include reasonable review of application behaviour in the hosted environment.

Unless separately agreed, support does not include:

- AWS account ownership
- AWS billing responsibility
- formal cloud security management
- disaster recovery guarantees
- backup system design
- infrastructure cost optimisation programme
- third-party outage responsibility

If Midland requires formal hosting management, backup policy, disaster recovery, security monitoring, or cloud cost governance, these should be scoped separately.

## Clinic Staff Support Boundaries

Clinic staff may request help with:

- how to use documented admin workflows
- interpreting import result categories
- finding imported patients
- understanding drawer fields
- confirming where to escalate duplicate or failed rows

Clinic staff should not ask technical support to:

- decide whether two patients are the same person
- decide whether a machine serial belongs to a patient
- correct clinical/source data without Midland approval
- provide clinical advice
- bypass import safety checks
- trigger patient communications outside approved workflows

Midland should nominate one operational owner for source-data and workflow decisions.

## Retainer Review

Review the retainer after the first agreed support period or after any major scope change.

Reasons to revise commercial terms:

- more frequent import batches
- new patient portal workflows
- checkout or Stripe activation
- inventory/fulfilment build-out
- after-hours emergency support requirement
- advanced reporting/audit requirements
- larger monthly improvement expectations

Until terms change in writing, the support anchor remains **NZD 2,300/month including GST** with the boundaries above.
