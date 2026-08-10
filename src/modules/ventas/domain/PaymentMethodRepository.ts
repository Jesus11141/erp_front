import { PaymentMethod } from './PaymentMethod';

export interface PaymentMethodRepository {
    save(method: PaymentMethod): Promise<PaymentMethod>;
    findAll(includeInactive?: boolean): Promise<PaymentMethod[]>;
    delete(id: number): Promise<void>;
    update(id: number, method: PaymentMethod): Promise<PaymentMethod>;
}
