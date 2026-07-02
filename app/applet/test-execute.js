fetch("http://localhost:3000/api/execute", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ proposal: { id: "1", nodeId: "n1", action: "activate" } })
}).then(res => res.json()).then(console.log).catch(console.error);
