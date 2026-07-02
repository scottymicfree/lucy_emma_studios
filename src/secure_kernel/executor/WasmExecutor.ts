import { Manifest, CapabilityEnforcer } from '../manifests/CapabilitiesManifest';

export class WasmExecutor {
  /**
   * Executes a WebAssembly binary with strict guardrails and timeouts
   */
  public static async execute(wasmBytes: Uint8Array, manifest: Manifest, inputs: any) {
    console.log(`[TrustedExecutor] Initializing sandbox for role: ${manifest.role}`);

    // Create a WebAssembly memory instance strictly bounded
    const memory = new WebAssembly.Memory({ 
      initial: Math.ceil(manifest.maxMemoryBytes / 65536), // 64KB pages
      maximum: Math.ceil(manifest.maxMemoryBytes / 65536) 
    });

    // Helper to safely read strings from WASM linear memory
    const readString = (ptr: number, len: number): string => {
      try {
        const buffer = new Uint8Array(memory.buffer, ptr, len);
        const decoder = new TextDecoder("utf-8");
        return decoder.decode(buffer);
      } catch (err) {
        return `[Error decoding string at memory offset ${ptr}]: ${err}`;
      }
    };

    const imports = {
      env: {
        memory,
        abort: () => { 
          throw new Error("WASM Aborted by Sandbox guest script"); 
        },
        host_log: (ptr: number, len: number) => {
          const logMsg = readString(ptr, len);
          console.log(`[TrustedExecutor-GuestLog]: ${logMsg}`);
        },
        host_get_input: (ptr: number, maxLen: number): number => {
          // Serialize inputs to WASM memory safely with bounds checks
          try {
            const inputStr = JSON.stringify(inputs);
            const inputBytes = new TextEncoder().encode(inputStr);
            const writeLen = Math.min(inputBytes.length, maxLen);
            const dest = new Uint8Array(memory.buffer, ptr, writeLen);
            dest.set(inputBytes.slice(0, writeLen));
            return writeLen;
          } catch (e) {
            console.error(`[TrustedExecutor] Input serialization error:`, e);
            return 0;
          }
        }
      }
    };

    try {
      // Validate capability manifests before execution
      if (!CapabilityEnforcer.validate(manifest.permissions, manifest)) {
        throw new Error(`Capability verification failed for role: ${manifest.role}`);
      }

      const { instance } = await WebAssembly.instantiate(wasmBytes, imports);
      
      const runFunc = instance.exports.run as Function;
      if (typeof runFunc !== "function") {
        throw new Error("WASM module does not export the required 'run' entrypoint.");
      }

      // Execute with a strict runtime budget/timeout to prevent denial of service loops
      const result = await Promise.race([
        Promise.resolve().then(() => runFunc()),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Sandbox Execution Timeout: ${manifest.role} exceeded CPU limit`)), 2000)
        )
      ]);

      console.log(`[TrustedExecutor] Sandbox run finished successfully.`);
      return result;
    } catch (e) {
      console.error(`[TrustedExecutor] Sandbox VMEscape or Fault detected:`, e);
      throw e;
    }
  }
}

