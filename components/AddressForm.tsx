// components/AddressForm.tsx
import React, { useState, useEffect } from 'react';
import { CustomInput } from './ui/CustomInput';
import { CustomSelect } from './ui/CustomSelect';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../lib/api';
import type { Address, Province, Regency, District, Village } from '../types';

interface AddressFormProps {
    address: Address;
    onAddressChange: (newAddress: Partial<Address>) => void;
    disabled?: boolean;
    manualPostalCode?: boolean;
}

export const AddressForm = ({ address, onAddressChange, disabled = false, manualPostalCode = false }: AddressFormProps) => {
    // Data lists for dropdowns
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [regencies, setRegencies] = useState<Regency[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [villages, setVillages] = useState<Village[]>([]);

    // Selected IDs
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedRegency, setSelectedRegency] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');

    // Loading states
    const [isLoading, setIsLoading] = useState({
        provinces: false,
        regencies: false,
        districts: false,
        villages: false,
    });

    // Initial fetch for provinces
    useEffect(() => {
        const loadProvinces = async () => {
            setIsLoading(prev => ({ ...prev, provinces: true }));
            try {
                const provinceData = await getProvinces();
                setProvinces(provinceData);
            } catch (error) {
                console.error("Gagal memuat provinsi");
            } finally {
                setIsLoading(prev => ({ ...prev, provinces: false }));
            }
        };
        loadProvinces();
    }, []);

    // Chain effect for regencies
    useEffect(() => {
        if (selectedProvince) {
            const loadRegencies = async () => {
                setIsLoading(prev => ({ ...prev, regencies: true }));
                setRegencies([]); setDistricts([]); setVillages([]);
                setSelectedRegency(''); setSelectedDistrict(''); setSelectedVillage('');
                try {
                    const regencyData = await getRegencies(selectedProvince);
                    setRegencies(regencyData);
                } catch (error) {
                    console.error("Gagal memuat kabupaten/kota");
                } finally {
                    setIsLoading(prev => ({ ...prev, regencies: false }));
                }
            };
            loadRegencies();
        }
    }, [selectedProvince]);
    
    // Chain effect for districts
    useEffect(() => {
        if (selectedRegency) {
            const loadDistricts = async () => {
                setIsLoading(prev => ({ ...prev, districts: true }));
                setDistricts([]); setVillages([]);
                setSelectedDistrict(''); setSelectedVillage('');
                try {
                    const districtData = await getDistricts(selectedRegency);
                    setDistricts(districtData);
                } catch (error) {
                    console.error("Gagal memuat kecamatan");
                } finally {
                    setIsLoading(prev => ({ ...prev, districts: false }));
                }
            };
            loadDistricts();
        }
    }, [selectedRegency]);

    // Chain effect for villages
    useEffect(() => {
        if (selectedDistrict) {
            const loadVillages = async () => {
                setIsLoading(prev => ({ ...prev, villages: true }));
                setVillages([]);
                setSelectedVillage('');
                try {
                    const villageData = await getVillages(selectedDistrict);
                    setVillages(villageData);
                } catch (error) {
                    console.error("Gagal memuat kelurahan/desa");
                } finally {
                    setIsLoading(prev => ({ ...prev, villages: false }));
                }
            };
            loadVillages();
        }
    }, [selectedDistrict]);


    // Handlers
    const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const name = provinces.find(p => p.id === id)?.name || '';
        setSelectedProvince(id);
        onAddressChange({ province: name, city: '', district: '', subdistrict: '', postalCode: '' });
    };
    
    const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const name = regencies.find(r => r.id === id)?.name || '';
        setSelectedRegency(id);
        onAddressChange({ city: name, district: '', subdistrict: '', postalCode: '' });
    };

    const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const name = districts.find(d => d.id === id)?.name || '';
        setSelectedDistrict(id);
        onAddressChange({ district: name, subdistrict: '', postalCode: '' });
    };
    
    const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        const name = villages.find(v => v.id === id)?.name || '';
        setSelectedVillage(id);

        if (manualPostalCode) {
            onAddressChange({ subdistrict: name });
        } else {
            // This is a mock postal code as the API doesn't provide it reliably.
            const postalCode = `${Math.floor(10000 + Math.random() * 90000)}`; 
            onAddressChange({ subdistrict: name, postalCode });
        }
    };

    return (
        <div className="space-y-4">
             <CustomInput label="Jalan / Nama Gedung *" value={address.streetAndBuilding} onChange={e => onAddressChange({ streetAndBuilding: e.target.value })} required disabled={disabled} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <CustomInput label="Nomor Rumah" value={address.houseNumber || ''} onChange={e => onAddressChange({ houseNumber: e.target.value })} disabled={disabled} />
                <CustomInput label="RT" value={address.rt || ''} onChange={e => onAddressChange({ rt: e.target.value })} disabled={disabled} />
                <CustomInput label="RW" value={address.rw || ''} onChange={e => onAddressChange({ rw: e.target.value })} disabled={disabled} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <CustomSelect label="Provinsi *" value={selectedProvince} onChange={handleProvinceChange} disabled={disabled || isLoading.provinces} required>
                    <option value="">{isLoading.provinces ? 'Memuat...' : '-- Pilih Provinsi --'}</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </CustomSelect>
                 <CustomSelect label="Kota / Kabupaten *" value={selectedRegency} onChange={handleRegencyChange} disabled={disabled || !selectedProvince || isLoading.regencies} required>
                    <option value="">{isLoading.regencies ? 'Memuat...' : '-- Pilih Kota/Kab. --'}</option>
                    {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </CustomSelect>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <CustomSelect label="Kecamatan *" value={selectedDistrict} onChange={handleDistrictChange} disabled={disabled || !selectedRegency || isLoading.districts} required>
                    <option value="">{isLoading.districts ? 'Memuat...' : '-- Pilih Kecamatan --'}</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </CustomSelect>
                 <CustomSelect label="Kelurahan / Desa *" value={selectedVillage} onChange={handleVillageChange} disabled={disabled || !selectedDistrict || isLoading.villages} required>
                    <option value="">{isLoading.villages ? 'Memuat...' : '-- Pilih Kelurahan/Desa --'}</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </CustomSelect>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomInput label="Kode Pos *" value={address.postalCode} onChange={e => onAddressChange({ postalCode: e.target.value })} required readOnly={!manualPostalCode && (!!selectedVillage || disabled)} />
                <CustomInput label="Negara *" value={address.country} onChange={e => onAddressChange({ country: e.target.value })} required disabled={disabled} />
            </div>
        </div>
    );
};