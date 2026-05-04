import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'

const TABLES = {
  PATIENTS: 'midland-sleep-patients',
  DEVICES: 'midland-sleep-devices',
  MASKS: 'midland-sleep-masks',
  ENTITLEMENT: 'midland-sleep-entitlement',
}

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.DYNAMODB_REGION ?? 'ap-southeast-2',
    ...(process.env.MIDLAND_ACCESS_KEY_ID && {
      credentials: {
        accessKeyId: process.env.MIDLAND_ACCESS_KEY_ID,
        secretAccessKey: process.env.MIDLAND_SECRET_ACCESS_KEY!,
      },
    }),
  })
)

async function seedDemo() {
  // PATIENTS
  await docClient.send(new PutCommand({
    TableName: TABLES.PATIENTS,
    Item: {
      pk: 'USER#paul-001',
      sk: 'PROFILE',
      patient_id: 'paul-001',
      portal_id: 'MS-238872',
      org_id: 'midland-sleep',
      name: 'Paul Moreno',
      email: 'paul.moreno@demo.co.nz',
    },
  }))
  console.log('✅ Upserted PATIENTS for Paul')

  await docClient.send(new PutCommand({
    TableName: TABLES.PATIENTS,
    Item: {
      pk: 'USER#sarah-001',
      sk: 'PROFILE',
      patient_id: 'sarah-001',
      portal_id: 'MS-731204',
      org_id: 'midland-sleep',
      name: 'Sarah Kim',
      email: 'sarah.kim@demo.co.nz',
    },
  }))
  console.log('✅ Upserted PATIENTS for Sarah')

  await docClient.send(new PutCommand({
    TableName: TABLES.PATIENTS,
    Item: {
      pk: 'USER#richard-001',
      sk: 'PROFILE',
      patient_id: 'richard-001',
      portal_id: 'MS-956431',
      org_id: 'midland-sleep',
      name: 'Richard OBrien',
      email: 'richard.obrien@demo.co.nz',
    },
  }))
  console.log('✅ Upserted PATIENTS for Richard')

  // DEVICES
  await docClient.send(new PutCommand({
    TableName: TABLES.DEVICES,
    Item: {
      pk: 'DEVICE#machine-001',
      sk: 'PATIENT#paul-001',
      patient_id: 'paul-001',
      org_id: 'midland-sleep',
      device_id: 'machine-001',
      brand: 'ResMed',
      name: 'AirSense 11 AutoSet',
      model: 'AirSense 11 AutoSet',
      serial_number: 'RS-2024-001',
      setup_date: '2024-03-15',
      funding_stream: 'ACC',
    },
  }))
  console.log('✅ Upserted DEVICES for Paul')

  await docClient.send(new PutCommand({
    TableName: TABLES.DEVICES,
    Item: {
      pk: 'DEVICE#machine-002',
      sk: 'PATIENT#sarah-001',
      patient_id: 'sarah-001',
      org_id: 'midland-sleep',
      device_id: 'machine-002',
      brand: 'Fisher & Paykel',
      name: 'SleepStyle 650',
      model: 'SleepStyle 650',
      serial_number: 'FP-2023-002',
      setup_date: '2023-11-01',
      funding_stream: 'Health NZ',
    },
  }))
  console.log('✅ Upserted DEVICES for Sarah')

  await docClient.send(new PutCommand({
    TableName: TABLES.DEVICES,
    Item: {
      pk: 'DEVICE#machine-003',
      sk: 'PATIENT#richard-001',
      patient_id: 'richard-001',
      org_id: 'midland-sleep',
      device_id: 'machine-003',
      brand: 'ResMed',
      name: 'AirSense 10 AutoSet',
      model: 'AirSense 10 AutoSet',
      serial_number: 'RS-2022-003',
      setup_date: '2022-08-10',
      funding_stream: 'ACC',
    },
  }))
  console.log('✅ Upserted DEVICES for Richard')

  // MASKS
  await docClient.send(new PutCommand({
    TableName: TABLES.MASKS,
    Item: {
      pk: 'MASK#mask-001',
      sk: 'PATIENT#paul-001',
      patient_id: 'paul-001',
      org_id: 'midland-sleep',
      mask_id: 'mask-001',
      brand: 'ResMed',
      name: 'AirFit F30i',
      type: 'full_face',
      size: 'Small',
      fitted_date: '2024-03-15',
    },
  }))
  console.log('✅ Upserted MASKS for Paul')

  await docClient.send(new PutCommand({
    TableName: TABLES.MASKS,
    Item: {
      pk: 'MASK#mask-002',
      sk: 'PATIENT#sarah-001',
      patient_id: 'sarah-001',
      org_id: 'midland-sleep',
      mask_id: 'mask-002',
      brand: 'Fisher & Paykel',
      name: 'Eson 2',
      type: 'nasal',
      size: 'Medium',
      fitted_date: '2023-11-01',
    },
  }))
  console.log('✅ Upserted MASKS for Sarah')

  await docClient.send(new PutCommand({
    TableName: TABLES.MASKS,
    Item: {
      pk: 'MASK#mask-003',
      sk: 'PATIENT#richard-001',
      patient_id: 'richard-001',
      org_id: 'midland-sleep',
      mask_id: 'mask-003',
      brand: 'ResMed',
      name: 'Mirage FX',
      type: 'nasal',
      size: 'Large',
      fitted_date: '2022-08-10',
    },
  }))
  console.log('✅ Upserted MASKS for Richard')

  // ENTITLEMENT
  await docClient.send(new PutCommand({
    TableName: TABLES.ENTITLEMENT,
    Item: {
      pk: 'PATIENT#paul-001',
      sk: 'YEAR#2026',
      patient_id: 'paul-001',
      org_id: 'midland-sleep',
      year: 2026,
      items: [
        { item_type: 'cushion', status: 'ELIGIBLE', quantity_remaining: 2, quantity_cap: 2 },
        { item_type: 'headgear', status: 'ELIGIBLE', quantity_remaining: 1, quantity_cap: 1 },
        { item_type: 'mask_kit', status: 'ELIGIBLE', quantity_remaining: 1, quantity_cap: 1 },
        { item_type: 'filter', status: 'ELIGIBLE', quantity_remaining: 4, quantity_cap: 4 },
      ],
    },
  }))
  console.log('✅ Upserted ENTITLEMENT for Paul')

  await docClient.send(new PutCommand({
    TableName: TABLES.ENTITLEMENT,
    Item: {
      pk: 'PATIENT#sarah-001',
      sk: 'YEAR#2026',
      patient_id: 'sarah-001',
      org_id: 'midland-sleep',
      year: 2026,
      items: [
        { item_type: 'cushion', status: 'NOT_YET', quantity_remaining: 0, quantity_cap: 2, next_eligible_date: '2026-11-01' },
        { item_type: 'headgear', status: 'NOT_YET', quantity_remaining: 0, quantity_cap: 1, next_eligible_date: '2026-11-01' },
      ],
    },
  }))
  console.log('✅ Upserted ENTITLEMENT for Sarah')

  await docClient.send(new PutCommand({
    TableName: TABLES.ENTITLEMENT,
    Item: {
      pk: 'PATIENT#richard-001',
      sk: 'YEAR#2026',
      patient_id: 'richard-001',
      org_id: 'midland-sleep',
      year: 2026,
      items: [
        { item_type: 'cushion', status: 'ELIGIBLE', quantity_remaining: 2, quantity_cap: 2 },
        { item_type: 'headgear', status: 'ELIGIBLE', quantity_remaining: 1, quantity_cap: 1 },
        { item_type: 'mask_kit', status: 'ELIGIBLE', quantity_remaining: 1, quantity_cap: 1 },
        { item_type: 'filter', status: 'ELIGIBLE', quantity_remaining: 4, quantity_cap: 4 },
      ],
    },
  }))
  console.log('✅ Upserted ENTITLEMENT for Richard')

  console.log('✅ Demo seed complete')
}

seedDemo().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
