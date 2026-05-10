# Admin Review Workflow

Admin staff review imported patients from the admin patient register after a controlled import.

## Workflow

1. Open `/admin/patients`.
2. Search for the imported patient by name or MSID / portal ID.
3. Identify imported records marked `Pending review`.
4. Open the patient drawer using `View` or `Review record`.
5. Review patient identity and contact details:
   - Name
   - MSID / portal ID
   - Date of birth
   - Phone
   - Email
   - Address
6. Review import metadata:
   - Imported badge or segment
   - Import batch ID
   - Review status
   - Imported / created timestamp where available
7. Review equipment details:
   - Machine brand
   - Machine model
   - Machine serial
   - Setup date
   - Device ID
8. Review mask details when present:
   - Mask brand
   - Mask model
   - Mask size
   - Fitted or last-issued date where available
9. Confirm funding source and funding notes where shown.
10. Record follow-up issues using the agreed Midland operational process.

## Missing or Incomplete Data

Device data:

- Do not assume missing machine brand, model, serial, setup date, or device ID.
- Check the source spreadsheet or biomedical source system.
- Escalate unclear equipment assignment or serial conflicts to the nominated Midland owner.

Mask data:

- If no mask data was imported, the drawer shows `No mask record imported`.
- Staff should not assume a default mask exists.
- Missing mask brand, model, or size requires source-data review or Midland owner escalation.

## Review Status

`Pending review` is an operational label for imported records that need staff review.

In Phase 1, review status is display-only unless a separate approved review-state workflow is available. It does not trigger invites, emails, orders, fulfilment, or patient portal access.

## Export

If the approved imported-patient export is available, staff may use it for operational review and batch follow-up.

The export should contain safe operational fields only and must not include raw NHI, encrypted NHI, or NHI hashes.

If export is unavailable in the target environment, staff should use the admin list, patient drawer, and import evidence outputs rather than creating an unofficial export.

## Safety Notes

- NHI reveal is not enabled for imported admin records in the MVP.
- The NHI tab states that NHI is stored securely and admin reveal is not enabled in this MVP.
- This workflow is not clinical advice.
- This workflow does not create patient invites or email flows.
- This workflow does not create patient accounts, orders, fulfilment tasks, or inventory movements.
