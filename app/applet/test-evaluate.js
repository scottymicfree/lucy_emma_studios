fetch("http://localhost:3000/api/evaluate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ proposals: [{ id: "1", nodeId: "n1", action: "activate" }], globalIntent: "test" })
}).then(res => res.json()).then(console.log).catch(console.error);
