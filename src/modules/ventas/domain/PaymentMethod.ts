export interface PaymentMethod {
    id?: number;
    name: string;
    active: boolean;
    requires_reference: boolean;
    sri_code?: string;
}
