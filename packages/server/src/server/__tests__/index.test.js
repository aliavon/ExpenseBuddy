describe("Server", () => {
  it("should export a server instance", () => {
    const server = require("../index");
    
    expect(server).toBeDefined();
    expect(typeof server).toBe("function");
  });

  it("should be a GraphQL Yoga server", () => {
    const server = require("../index");
    
    // Check if it has the basic structure of a Yoga server
    expect(server).toHaveProperty("fetch");
    expect(typeof server.fetch).toBe("function");
  });

  it("should handle GraphQL requests", async () => {
    const server = require("../index");
    
    // Test with a simple introspection query
    const response = await server.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query {
            __schema {
              queryType {
                name
              }
            }
          }
        `,
      }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toBeDefined();
    expect(result.data.__schema).toBeDefined();
    expect(result.data.__schema.queryType.name).toBe("Query");
  });

  it("should handle invalid GraphQL queries", async () => {
    const server = require("../index");
    
    const response = await server.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "invalid query syntax",
      }),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle missing query", async () => {
    const server = require("../index");
    
    const response = await server.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.errors).toBeDefined();
  });

  it("should handle GET requests to GraphQL endpoint", async () => {
    const server = require("../index");
    
    const response = await server.fetch("http://localhost/graphql?query={__typename}", {
      method: "GET",
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data).toBeDefined();
    expect(result.data.__typename).toBe("Query");
  });

  it("should be reusable across multiple requires", () => {
    const server1 = require("../index");
    const server2 = require("../index");
    
    // Should return the same instance due to Node.js module caching
    expect(server1).toBe(server2);
  });

  it("should have proper error handling", async () => {
    const server = require("../index");
    
    // Test with malformed JSON
    const response = await server.fetch("http://localhost/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "invalid json",
    });

    expect(response.status).toBe(400);
  });
}); 