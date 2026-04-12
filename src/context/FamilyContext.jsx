import { createContext, useContext, useMemo, useState } from 'react';
import { useFamily, useFamilyMembers } from '../hooks/useFamily';
import { useAuthContext } from './AuthContext';

const FamilyContext = createContext(null);

export const FamilyProvider = ({ children }) => {
  const { familyId } = useAuthContext();
  const { data: currentFamily } = useFamily(familyId);
  const { data: members = [] } = useFamilyMembers(familyId);
  const [activeMember, setActiveMember] = useState(null);

  const value = useMemo(
    () => ({
      currentFamily,
      members,
      activeMember,
      setActiveMember,
    }),
    [currentFamily, members, activeMember]
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
};

export const useFamilyContext = () => {
  const context = useContext(FamilyContext);
  if (!context) throw new Error('useFamilyContext must be used within FamilyProvider');
  return context;
};
