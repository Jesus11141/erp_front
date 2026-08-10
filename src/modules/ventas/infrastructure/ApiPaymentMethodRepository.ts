import api from '../../../shared/api';
import { PaymentMethod } from '../domain/PaymentMethod';
import { PaymentMethodRepository } from '../domain/PaymentMethodRepository';

export class ApiPaymentMethodRepository implements PaymentMethodRepository {
    async save(method: PaymentMethod): Promise<PaymentMethod> {
        const response = await api.post('/ventas/payment-methods/', method);
        return response.data;
    }

    async findAll(includeInactive: boolean = false): Promise<PaymentMethod[]> {
        const response = await api.get(`/ventas/payment-methods/?all=${includeInactive}`);
        return response.data;
    }

    async delete(id: number): Promise<void> {
        await api.delete(`/ventas/payment-methods/${id}/`);
    }

    async update(id: number, method: PaymentMethod): Promise<PaymentMethod> {
        const response = await api.put(`/ventas/payment-methods/${id}/`, method);
        return response.data;
    }
}
