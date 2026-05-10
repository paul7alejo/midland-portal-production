# /new-component
Bootstrap a new component file (TypeScript + Tailwind + shadcn/ui).
## Template
```tsx
'use client';
import React from 'react';
interface [Name]Props { }
export function [Name]({ }: [Name]Props) {
  return <div className="bg-[#FDFCF5] p-6">{/* content */}</div>;
}
```
## Rules
- TypeScript strict, named export
- Brand colours
- Verify: npx tsc --noEmit
