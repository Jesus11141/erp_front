export class Factura {
  constructor({ id, numero, customer, date, total, status, document_type = '01', items = [], ...rest }) {
    this.id = id
    this.numero = numero
    this.customer = customer
    this.date = date
    this.total = total
    this.status = status
    this.document_type = document_type
    this.items = items
    Object.assign(this, rest)
  }

  get esCancelable() {
    return this.status !== 'pagada' && this.status !== 'canceled'
  }

  get esEmitible() {
    return this.status === 'draft'
  }
}
