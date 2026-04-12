import { create } from 'zustand';

const defaultFilters = {
  search: '',
  form: '',
  isActive: true,
  assignedTo: '',
};

export const useMedicineStore = create((set) => ({
  filters: defaultFilters,
  selectedMedicineId: null,
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setSelectedMedicine: (id) => set({ selectedMedicineId: id }),
}));
