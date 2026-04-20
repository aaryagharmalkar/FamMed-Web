import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ocrEndpoint = `${apiBase}/api/ocr-prescription`;
const medicineInfoEndpoint = `${apiBase}/api/medicine-info`;

const normalizeMedicines = (medicines) =>
  medicines.map((item) => ({
    name: String(item?.name || '').trim(),
    dosage: String(item?.dosage || '').trim(),
    frequency: String(item?.frequency || '').trim(),
    duration: String(item?.duration || '').trim(),
    instructions: String(item?.instructions || '').trim(),
  }));

export const extractMedicinesFromPrescription = async (file) => {
  if (!file) throw new Error('Please select a prescription image.');

  const formData = new FormData();
  formData.append('image', file);

  const response = await axios.post(ocrEndpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

  const medicines = response?.data?.medicines;
  if (!Array.isArray(medicines)) {
    throw new Error('OCR response did not contain a valid medicines array.');
  }

  return { medicines: normalizeMedicines(medicines) };
};

export const getMedicineInsightsFromGemini = async ({ name, dosage = '', frequency = '' }) => {
  if (!name) throw new Error('Medicine name is required.');

  const response = await axios.post(
    medicineInfoEndpoint,
    { name, dosage, frequency },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    }
  );

  return response?.data || {};
};
