# Admin Review Workflow

Admin staff review imported patients from the admin patient register.

Workflow:

1. Open `/admin/patients`.
2. Search for the imported patient by name or MSID.
3. Identify records marked `Pending review`.
4. Open the patient drawer using `View` or `Review record`.
5. Verify identity and contact details:
   - Name
   - MSID
   - Date of birth
   - Phone
   - Email
   - Address
6. Verify equipment details:
   - Machine brand
   - Machine model
   - Machine serial
   - Setup date
   - Device ID
7. Verify mask details when present:
   - Mask brand
   - Mask model
   - Mask size
8. Confirm funding source and import metadata:
   - Funded by
   - Import batch ID
   - Review status

If no mask data was imported, the drawer shows `No mask record imported`. Staff should not assume a default mask exists.

NHI reveal is not enabled for imported admin records in the MVP. The NHI tab states that NHI is stored securely and admin reveal is not enabled in this MVP.
