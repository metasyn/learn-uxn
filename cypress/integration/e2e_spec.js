let windowErrorSpy;

Cypress.on('window:before:load', (win) => {
  windowErrorSpy = cy.spy(win.console, 'error');
});

const DELAY = 1500;

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
    cy.wait(DELAY);

    // iframe should load for emu
    cy.get('#uxnemu-iframe')
      .its('0.contentDocument').should('exist');

    // iframe should load for asm
    cy.get('#uxnasm-iframe')
      .its('0.contentDocument').should('exist');

    cy.get('#editor').should('exist');
  });

  it('can load all roms, and assemble', () => {
    cy.visit('http://localhost:8000/site');
    // wait a second for things to load
    cy.wait(DELAY);

    // I should be able to calculate this from a selector
    // but cy didn't seem to be returning the length; hard coded
    // the rom count for now
    for (let i = 1; i < 21; i += 1) {
      cy.log(i);
      // force true to make get around the hover visibility
      cy.get(`#roms-list > a:nth-child(${i})`).click({ force: true });
      cy.wait(DELAY);

      // on the first load, we have a failed rom load
      // but there should not be more than one
      cy.get('#console')
        .get('span:contains(Failed to open rom)')
        .should('have.length', 1);
    }
  });
});
