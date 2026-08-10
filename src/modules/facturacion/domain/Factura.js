export class Factura {
  constructor({ id, numero, customer, date, total, status, items = [] }) {
    this.id = id
    this.numero = numero
    this.customer = customer
    this.date = date
    this.total = total
    this.status = status
    this.items = items
  }

  get esCancelable() {
    return this.status !== 'pagada' && this.status !== 'canceled'
  }

  get esEmitible() {
    return this.status === 'draft'
  }
}
