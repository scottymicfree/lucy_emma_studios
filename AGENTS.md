# Coding Station
agent "coding-station" {
    role = "Local-first code execution and refactoring"
    permissions = [
        "terminal.exec",
        "agent-zero.exec",
        "codexmemory.read",
        "codexmemory.ast",
        "workspace.write",
        "workspace.read"
    ]
    constraints = {
        max_context = "1M",
        allow_docker = true,
        allow_local_fs = true
    }
}
