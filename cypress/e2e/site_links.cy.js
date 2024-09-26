describe("Link tester", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("Test links", () => {
    cy.contains(/Jan Ivkovič Miura/i);
    cy.get('[data-test="my_portfolio"]').click();
    cy.location("pathname").should("equal", "/works");
    cy.get('[data-test="nav_name"]').click();
    cy.location("pathname").should("equal", "/");
    cy.get('[data-test="nav_posts"]').click();
    cy.location("pathname").should("equal", "/posts");
    cy.get('[data-test="nav_posts"]').click();
    cy.location("pathname").should("equal", "/posts");
    cy.get('[data-test="/posts/e2ee_messenger"]').click();
    cy.location("pathname").should("equal", "/posts/e2ee_messenger");
    // cy.get('[data-test="nav_posts"]').click()
    // cy.location('pathname').should('equal', '/posts')
    // cy.get('[data-test="/posts/webrtc"]').click()
    // cy.location('pathname').should('equal', '/posts/webrtc')
    cy.visit("/works");
    cy.get('[data-test="/works/webrtc_dummy_client"]').click();
    cy.location("pathname").should("equal", "/works/webrtc_dummy_client");
    cy.visit("/works");
    cy.get('[data-test="/works/signaling_server"]').click();
    cy.location("pathname").should("equal", "/works/signaling_server");
    cy.visit("/works");
    cy.get('[data-test="/works/nethogs_analyzer"]').click();
    cy.location("pathname").should("equal", "/works/nethogs_analyzer");
    cy.visit("/works");
    cy.get('[data-test="/works/level_builder"]').click();
    cy.location("pathname").should("equal", "/works/level_builder");
  });
});
