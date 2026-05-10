# /entitlement-check
Verify entitlement Layer 1 logic is YES/NO not $$$.
## Check
1. Patient-facing UI shows CAN REORDER / NOT YET — never a dollar amount
2. At checkout: "✅ Covered — $0.00" for funded items
3. No price badges on entitlement items
4. Layer 2 (10% off) dormant in 1B — no discount shown
5. Exhausted supplies show "Please call Midland" not a discount offer
## Rules
- Layer 2 applies to CPAP machines ONLY (not masks/accessories/supplies)
- Verify: npx tsc --noEmit
