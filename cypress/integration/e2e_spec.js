let windowErrorSpy;

Cypress.on('window:before:load', (win) => {
  windowErrorSpy = cy.spy(win.console, 'error');
});

const DELAY = 1000;

describe('learn-uxn integration tests', () => {
  afterEach(() => {
    cy.wait(DELAY).then(() => {
      // eslint-disable-next-line
      expect(windowErrorSpy).to.not.be.called;
    });
  });

  it('page loads', () => {
    cy.visit('http://localhost:8000/site');

    // wait a second for things to load
    cy.wait(1000);

    // iframe should load for emu
    cy.get('#uxnemu-iframe')
      .its('0.contentDocument').should('exist');

    // iframe should load for asm
    cy.get('#uxnasm-iframe')
      .its('0.contentDocument').should('exist');

    cy.get('#editor').should('exist');
  });

  it('can load a rom, and assemble', () => {
    cy.visit('http://localhost:8000/site');
    // wait a second for things to load
    cy.wait(1000);

    // force true to make get around the hover visibility
    cy.get('#roms').find('a').first().click({ force: true });
    cy.wait(1000);
    cy.get('#assemble').click();
  });
});
