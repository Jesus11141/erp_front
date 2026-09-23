describe('Flujo del Punto de Venta (POS)', () => {
  it('Debe cargar el POS, agregar un producto y proceder al pago', () => {
    // 0. Iniciar Sesión (Cypress abre un navegador limpio sin cookies)
    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@demo.com') 
    cy.get('input[type="password"]').type('123456')
    cy.contains('button', 'Ingresar al sistema').click()
    
    // IMPORTANTE: Esperar a que el backend responda y nos quite de la página de login
    cy.url().should('not.include', '/login')

    // 1. Visitar la página del POS
    cy.visit('/pos')

    // 2. Asignar Trabajador (Pantalla de POS Bloqueado)
    cy.contains('button', 'ASIGNAR TRABAJADOR').should('be.visible').click()
    
    // Buscar la opción que contiene "Raul Hidalgo" y seleccionarla por su valor interno
    cy.contains('label', 'Trabajador Asignado').next('select').find('option').contains('Raul Hidalgo').then($opcion => {
      cy.contains('label', 'Trabajador Asignado').next('select').select($opcion.val())
    })
    cy.get('input[placeholder="****"]').type('1234')
    cy.contains('button', 'Iniciar Turno').click()

    // Esperar a que el modal de trabajador desaparezca
    cy.contains('POS Bloqueado').should('not.exist')

    // 3. El área de espera está vacía. Tenemos que buscar un producto.
    // Escribimos "a" en el buscador de productos para que el backend nos sugiera algo
    cy.get('input[placeholder*="Buscar por código"]').type('a')
    
    // Esperamos a que el menú desplegable de sugerencias muestre un producto y lo seleccionamos
    // (Buscamos la palabra 'Stock disponible' que aparece en las opciones del menú)
    cy.contains('Stock disponible').first().click()

    // 4. Ahora que el producto se cargó en la cuadrícula, hacemos clic en su botón "+"
    cy.get('button .fa-plus').first().click({ force: true })

    // 4. Verificar que el producto se agregó al ticket (lado derecho) comprobando el botón basura
    cy.get('button .fa-trash').should('exist')

    // 5. Hacer clic en el botón principal. Como Raúl Hidalgo no tiene rol de cajero, 
    // el botón dirá "GUARDAR PRE-FACTURA" en lugar de "COBRAR [F4]"
    cy.contains('GUARDAR PRE-FACTURA').click()

    // 6. Verificar que el proceso fue exitoso comprobando que el carrito se vació
    cy.contains('Carrito de compras vacío').should('be.visible')
    
    // ¡Fin de la prueba exitosa!
  })
})
