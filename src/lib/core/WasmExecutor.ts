import {
  CapabilitiesManifest,
  DEFAULT_SANDBOX_CAPABILITIES,
} from "./CapabilitiesManifest";
import { dataVault } from "./DataVaultWAL";

export class WasmExecutor {
  private manifest: CapabilitiesManifest;

  constructor(manifest: CapabilitiesManifest = DEFAULT_SANDBOX_CAPABILITIES) {
    this.manifest = manifest;
  }

  public async execute(
    wasmBytes: Uint8Array,
    entryPoint: string = "main",
    args: any[] = [],
  ): Promise<any> {
    const startTime = Date.now();
    await dataVault.append("WasmExecutor", "START_EXECUTION", {
      entryPoint,
      manifest: this.manifest,
    });

    // Check initial memory limit request
    if (this.manifest.maxMemoryBytes < 0) {
      throw new Error("Invalid memory limit");
    }

    try {
      // Create execution sandbox
      // For browser environment, we use native WebAssembly
      const memory = new WebAssembly.Memory({
        initial: 1, // 64KB pages
        maximum: Math.ceil(this.manifest.maxMemoryBytes / (64 * 1024)),
        shared: false,
      });

      const importObject = {
        env: {
          memory,
          abort: () => {
            throw new Error("Sandbox abort() called, execution terminated.");
          },
          // Mock some secure syscalls here if allowed by manifest
          log: (ptr: number, len: number) => {
            // simplified log extraction
          },
        },
      };

      // Ensure execution is logged to the vaulted WAL
      await dataVault.append("WasmExecutor", "LOAD_MODULE", {
        size: wasmBytes.length,
      });

      const { instance } = await WebAssembly.instantiate(
        wasmBytes,
        importObject,
      );

      if (typeof instance.exports[entryPoint] !== "function") {
        throw new Error(`Entry point ${entryPoint} not found in WASM module.`);
      }

      await dataVault.append("WasmExecutor", "INVOKE_ENTRY_POINT", {
        entryPoint,
        args,
      });

      // In a real environment, we'd spawn a worker with CPU time limits.
      // Here we invoke directly but wrap it to simulate timing metrics.
      const func = instance.exports[entryPoint] as Function;

      const result = await Promise.race([
        Promise.resolve().then(() => func(...args)),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Execution Timeout: CPU fuel exhausted")),
            this.manifest.maxCpuTimeMs,
          ),
        ),
      ]);

      const executionTime = Date.now() - startTime;
      await dataVault.append("WasmExecutor", "EXECUTION_SUCCESS", {
        executionTime,
        memoryUsedBytes: memory.buffer.byteLength,
      });

      return result;
    } catch (e: any) {
      const executionTime = Date.now() - startTime;
      await dataVault.append("WasmExecutor", "EXECUTION_FAILED", {
        error: e.message,
        executionTime,
      });
      throw e;
    }
  }
}
