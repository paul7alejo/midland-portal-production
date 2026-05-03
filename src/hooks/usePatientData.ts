import { useState, useEffect } from 'react';
import { getIdToken, configureCognito } from '@/lib/aws/cognito';

type EntitlementItem = {
  item_type: string;
  status: string;
  quantity_remaining: number;
  quantity_cap: number;
  next_eligible_date?: string;
}

type Entitlement = {
  items: EntitlementItem[];
}

type Device = {
  name: string;
  brand: string;
  model: string;
  serial_number: string;
  setup_date: string;
  funding_stream: string;
}

type Mask = {
  name: string;
  brand: string;
  type: string;
  size: string;
  fitted_date: string;
}

type PatientData = {
  device: Device;
  mask: Mask;
  entitlement: Entitlement;
}

type UsePatientDataReturn = {
  device: Device | null;
  mask: Mask | null;
  entitlement: Entitlement | null;
  loading: boolean;
  error: string | null;
}

export function usePatientData(): UsePatientDataReturn {
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Configure Cognito and get ID token
        configureCognito();
        const token = await getIdToken();

        if (!token) {
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch patient data from API
        const response = await fetch('/api/patient/data', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          setLoading(false);
          return;
        }

        if (response.status === 500) {
          setError('Unable to load your data. Please try again.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setError('Unable to load your data. Please try again.');
          setLoading(false);
          return;
        }

        const patientData: PatientData = await response.json();
        setData(patientData);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Unable to load your data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, []);

  return {
    device: data?.device || null,
    mask: data?.mask || null,
    entitlement: data?.entitlement || null,
    loading,
    error,
  };
}