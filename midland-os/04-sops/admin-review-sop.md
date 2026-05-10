# Admin Review SOP

## Purpose

This SOP describes how Midland staff review imported patients after a controlled import.

The review workflow is an admin data-quality and operational visibility process. It is not clinical advice, does not replace Midland clinical judgement, and does not make clinical decisions for staff.

This workflow does not create patient invites, patient emails, patient portal accounts, orders, fulfilment tasks, or inventory movements.

## Review Ownership

Midland owns the review decision.

Admin staff should use the portal to inspect imported records, identify incomplete or conflicting data, and route issues to the correct Midland owner. Technical support can help with system behaviour, but Midland remains responsible for patient identity, source-data accuracy, funding interpretation, and equipment review decisions.

## Patient List Workflow

1. Open `/admin/patients`.
2. Use search to find the imported patient by name or MSID / portal ID.
3. Look for imported records marked `Pending review`.
4. Confirm the record appears in the expected imported patient list.
5. Open the patient drawer using `View` or `Review record`.

If the patient does not appear:

1. Confirm the import batch created the row.
2. Confirm the correct name or MSID is being searched.
3. Check the import result for skipped or failed rows.
4. Escalate to technical support if the batch says the row was created but it cannot be found.

## Patient Drawer Workflow

In the patient drawer, review each tab that contains imported data:

1. Overview
2. Equipment
3. Entitlement / funding summary where available
4. NHI tab safety message

For imported patients, NHI reveal is not enabled in the MVP. Staff should not expect raw NHI to be shown in the drawer.

## Fields Staff Should Review

Patient identity and contact:

- Name
- MSID / portal ID
- Date of birth
- Phone
- Email
- Address

Import metadata:

- Imported badge or imported segment
- Import batch ID where available
- Review status
- Imported / created timestamp where available

Funding:

- Funded by
- Any funding note shown in the drawer
- Whether funding source matches Midland source records

Machine / device:

- Machine brand
- Machine model
- Machine serial number
- Device ID
- Setup date
- Funded by, if shown at device level

Mask:

- Mask brand
- Mask model
- Mask size
- Last issued or fitted date where available

## Incomplete or Missing Device Handling

If machine or device data is incomplete:

1. Do not assume the missing value.
2. Check the source spreadsheet or biomedical source system.
3. Confirm whether the missing value is a source-data issue, import mapping issue, or genuine unknown.
4. Record the issue using the agreed Midland operational process.
5. Escalate equipment assignment or serial-number uncertainty to the nominated Midland owner.

Escalate to technical support if:

- source data includes the device value but the drawer does not show it
- the wrong device appears attached to the imported patient
- long device IDs or serials cannot be read clearly in the UI

## Incomplete or Missing Mask Handling

If no mask was imported, the drawer should show:

`No mask record imported`

Staff must not assume a default mask exists.

If mask data is incomplete:

1. Check whether the source file intentionally omitted mask data.
2. Confirm whether the patient has no current mask record or whether the source file is incomplete.
3. Record missing mask brand, model, size, or fitted date using the agreed Midland operational process.
4. Escalate unclear mask assignment to the nominated Midland owner.

Do not create or infer a mask from machine type, patient history, or common defaults inside this workflow.

## Review Status Wording

Imported records may show review status as `Pending review`.

In Phase 1, review status is display-only unless a separate approved workflow is explicitly built and available. Staff should treat `Pending review` as an operational prompt to inspect the record and record any required follow-up through the agreed Midland process.

Do not assume changing review status will trigger downstream actions, patient communication, orders, or fulfilment.

## Export Workflow

Use an imported-patient export only if the approved admin export is available in the target environment.

When exporting:

1. Export imported patient records only.
2. Use the export for operational review, management visibility, or batch follow-up.
3. Confirm the export contains safe operational fields only, such as:
   - patient name
   - MSID / portal ID
   - phone
   - funding
   - machine brand, model, and serial
   - mask brand, model, and size
   - import batch ID
   - review status
   - imported / created timestamp
4. Store the export only in approved Midland locations.
5. Do not email exports externally unless Midland policy allows it.

The export must not include:

- raw NHI
- encrypted NHI
- NHI hashes
- clinical advice
- patient portal credentials
- invite status unless separately implemented and approved

If export is not available in the environment, do not invent one manually from browser logs or database access. Use the patient list, drawer, and import evidence outputs instead.

## Escalation Path

Escalate to the nominated Midland owner when:

- patient identity is unclear
- date of birth, name, or contact details conflict with source records
- duplicate NHI or duplicate serial outcomes require a decision
- funding source is unclear
- machine assignment is unclear
- mask assignment is unclear
- staff are unsure whether a record should proceed to downstream operational use

Escalate to technical support when:

- an imported patient that should exist is missing from the admin list
- drawer data does not match the import result or source evidence
- imported device or mask data appears attached to the wrong patient
- exported operational fields appear unsafe or incorrect
- the admin UI blocks review of a record that should be visible

## Scope Boundaries

This review workflow does not:

- provide clinical advice
- create patient portal accounts
- send patient invites
- send patient emails
- create orders
- create fulfilment tasks
- move inventory
- resolve source-data ownership questions for Midland
- replace Midland clinical or operational approval

Imported records remain staff-review records until Midland completes its operational review.
