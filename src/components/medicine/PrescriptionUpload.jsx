import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, ScanText, Upload } from 'lucide-react';
import { extractMedicinesFromPrescription } from '../../lib/ocrClient';

const emptyMedicine = {
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
  instructions: '',
};

const PrescriptionUpload = ({ onConfirm, isSaving = false }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [medicines, setMedicines] = useState([]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const canExtract = Boolean(file) && !isExtracting && !isSaving && !isConfirming;
  const canConfirm = medicines.length > 0 && !isExtracting && !isSaving && !isConfirming;

  const extractedCountLabel = useMemo(() => {
    if (medicines.length === 0) return 'No medicines extracted yet';
    return `${medicines.length} medicine(s) ready to review`;
  }, [medicines.length]);

  const updateMedicine = (index, key, value) => {
    setMedicines((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    setFile(selected);
    setMedicines([]);
  };

  const handleExtract = async () => {
    if (!file) {
      toast.error('Please choose an image first.');
      return;
    }

    setIsExtracting(true);

    try {
      const response = await extractMedicinesFromPrescription(file);
      if (!response.medicines.length) {
        toast.error('No medicines were detected in the prescription image.');
        setMedicines([emptyMedicine]);
        return;
      }

      setMedicines(response.medicines);
      toast.success('Prescription scanned. Review the fields before saving.');
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message || 'Failed to extract medicine details.');
      setMedicines([emptyMedicine]);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    if (typeof onConfirm !== 'function') {
      toast.error('Save handler is not configured.');
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm({ file, medicines });
    } catch (error) {
      toast.error(error?.message || 'Failed to save extracted medicines.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Scan Prescription (OCR)</h3>
        <span className="text-xs text-slate-500">{extractedCountLabel}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_200px]">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-2 rounded border border-dashed p-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/40">
            <Upload size={16} />
            <span>{file ? file.name : 'Upload prescription image'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            type="button"
            disabled={!canExtract}
            className="inline-flex items-center gap-2 rounded bg-primary-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleExtract}
          >
            {isExtracting ? <Loader2 size={16} className="animate-spin" /> : <ScanText size={16} />}
            {isExtracting ? 'Extracting...' : 'Extract Medicine Details'}
          </button>
        </div>

        <div className="flex h-44 items-center justify-center overflow-hidden rounded border bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
          {previewUrl ? (
            <img src={previewUrl} alt="Prescription preview" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center text-xs text-slate-500">Image preview</span>
          )}
        </div>
      </div>

      {medicines.length > 0 && (
        <div className="space-y-3">
          {medicines.map((medicine, index) => (
            <div key={`${index}-${medicine.name}`} className="grid gap-2 rounded border p-3 md:grid-cols-2">
              <input
                value={medicine.name}
                onChange={(event) => updateMedicine(index, 'name', event.target.value)}
                placeholder="Medicine name"
                className="rounded border p-2"
              />
              <input
                value={medicine.dosage}
                onChange={(event) => updateMedicine(index, 'dosage', event.target.value)}
                placeholder="Dosage (e.g., 500mg)"
                className="rounded border p-2"
              />
              <input
                value={medicine.frequency}
                onChange={(event) => updateMedicine(index, 'frequency', event.target.value)}
                placeholder="Frequency"
                className="rounded border p-2"
              />
              <input
                value={medicine.duration}
                onChange={(event) => updateMedicine(index, 'duration', event.target.value)}
                placeholder="Duration"
                className="rounded border p-2"
              />
              <input
                value={medicine.instructions}
                onChange={(event) => updateMedicine(index, 'instructions', event.target.value)}
                placeholder="Instructions"
                className="rounded border p-2 md:col-span-2"
              />
            </div>
          ))}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canConfirm}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handleConfirm}
            >
              {(isSaving || isConfirming) ? <Loader2 size={16} className="animate-spin" /> : null}
              {(isSaving || isConfirming) ? 'Saving...' : `Confirm and Save ${medicines.length} Medicine(s)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionUpload;
