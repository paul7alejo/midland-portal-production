# Target Clients

## Primary archetype (now)

**NZ sleep clinic with CPAP / supply workflow**

```text
Size:        1,000–10,000 patients
Staff:       5–30, mostly non-technical
Tech today:  spreadsheets + ALTER (or similar) + Gmail
Funding:     government-funded supply with annual eligibility
Pain:        admin time eating clinical time; no audit data for funder;
             dependency on third-party ordering system;
             NHI-as-credential or other privacy debt
```

Examples to qualify:
- Midland Sleep (Waikato) — current case study
- regional sleep clinics across NZ
- Australian sleep clinics with similar funding patterns (out of HIPC scope)

## Adjacent archetype (Year 2)

**Allied healthcare clinic with funded supply pattern**

```text
Verticals:   orthotics, hearing aids, mobility aids, continence supplies,
             diabetes supplies
Same shape:  funded entitlement, third-party ordering dependency,
             admin-time bottleneck
Different:   product taxonomy, clinical conversation depth
```

## Adjacent archetype (Year 2+)

**Private specialist clinic needing patient + admin portal**

```text
Size:        single clinician + small admin team to ~10-clinician group
Tech:        existing PMS + spreadsheets + email
Pain:        patient communication, repeatable workflows, admin time
Difference:  no government funding layer; pure private billing
```

## Multi-clinic group (Year 3+)

**Network of clinics in same vertical**

```text
Size:        3–20 clinics in the same vertical
Tech:        each clinic on a different stack today
Pain:        no consolidated reporting, can't standardise SOPs
Architecture: Phase 6 — multi-clinic OS, Terraform-per-clinic
```

## Disqualifiers (politely decline)

```text
- engagement < NZD 15,000 total
- 24/7 SLA expectation
- clinical decision-making outsourcing
- pure marketing / e-commerce builds
- "AI clinical assistant" hopes — we do not build those
- dental, veterinary (not our specialty)
- public hospital tenders (regulatory complexity beyond solo-friendly)
- pre-seed venture-funded healthcare startups (volatile, scope changes)
```

## How to find them

```text
1. Midland case study published (when Phase 1B is stable)
2. NZ healthcare LinkedIn — clinic owners + practice managers
3. NZ Sleep Society + adjacent professional bodies
4. Cold outreach to clinics on existing third-party portals
   (Biomedical, ALTER, similar)
5. Lead magnets — see 02-sales/lead-magnet-ideas.md
6. Referrals from Midland (post-stability)
```

## Buying journey

```text
Awareness   "I'm tired of admin time on the phone"
Interest    sees Midland case study OR receives readiness checklist lead magnet
Consider    discovery call (60 min, free)
Decide      proposal — anchor NZD 42k, milestone billing, retainer commitment
Adopt       Phase 1A demo (in-clinic), then Phase 1B build
Expand      Phase 2+, multi-clinic, peer referrals
```
