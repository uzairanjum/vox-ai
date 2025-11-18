export enum PROVIDER_TYPE {
    GHL_LOCATION = 101,
    GHL_AGENCY = 102,
}

export interface ProviderInfo {
    id: number;
    name: string;
}

export type ProviderInfoMap = {
    [K in PROVIDER_TYPE]: ProviderInfo;
}

export const PROVIDER_INFO: ProviderInfoMap = {
    [PROVIDER_TYPE.GHL_LOCATION]: {
        id: PROVIDER_TYPE.GHL_LOCATION,
        name: "leadconnector"
    },
    [PROVIDER_TYPE.GHL_AGENCY]: {
        id: PROVIDER_TYPE.GHL_AGENCY,
        name: "leadconnector_agency"
    }
};