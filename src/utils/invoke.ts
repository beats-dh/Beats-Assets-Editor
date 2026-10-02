/**
 * Type-safe wrapper for Tauri invoke
 * 
 * Provides better error handling and type safety for IPC calls
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type { CommandName } from '../commands';

/**
 * Error class for IPC errors
 */
export class IPCError extends Error {
  constructor(
    public command: string,
    public originalError: unknown,
    message?: string
  ) {
    super(message || `IPC command failed: ${command}`);
    this.name = 'IPCError';
  }
}

/**
 * Type-safe invoke wrapper with error handling
 */
export async function invoke<T = unknown>(
  command: CommandName | (string & {}),
  args?: Record<string, unknown>
): Promise<T> {
  try {
    return await tauriInvoke<T>(command, args);
  } catch (error) {
    console.error(`IPC Error [${command}]:`, error);
    throw new IPCError(command, error, error instanceof Error ? error.message : String(error));
  }
}

/**
 * Invoke with timeout
 */
export async function invokeWithTimeout<T = unknown>(
  command: CommandName | (string & {}),
  args?: Record<string, unknown>,
  timeoutMs = 30000
): Promise<T> {
  return Promise.race([
    invoke<T>(command, args),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Invoke with retry logic
 */
export async function invokeWithRetry<T = unknown>(
  command: CommandName | (string & {}),
  args?: Record<string, unknown>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await invoke<T>(command, args);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw new IPCError(
    command,
    lastError,
    `Failed after ${maxRetries} attempts`
  );
}

/**
 * Batch invoke - execute multiple commands in parallel
 */
export async function invokeBatch<T = unknown>(
  commands: Array<{ command: CommandName | string; args?: Record<string, unknown> }>
): Promise<T[]> {
  return Promise.all(
    commands.map(({ command, args }) => invoke<T>(command, args))
  );
}

/**
 * Invoke with loading state callback
 */
export async function invokeWithLoading<T = unknown>(
  command: CommandName | (string & {}),
  args?: Record<string, unknown>,
  onLoadingChange?: (loading: boolean) => void
): Promise<T> {
  try {
    onLoadingChange?.(true);
    return await invoke<T>(command, args);
  } finally {
    onLoadingChange?.(false);
  }
}

/**
 * Closure-based invoke middleware factory.
 *
 * Creates a specialized invoke function with pre-configured retry and
 * timeout behavior. The configuration is captured via closure, so each
 * call site doesn't need to repeat these options.
 *
 * @example
 *   const invokeReliable = createInvokeMiddleware({ maxRetries: 3, delayMs: 500, timeoutMs: 10000 });
 *   const data = await invokeReliable<MyType>('my_command', { id: 1 });
 */
export function createInvokeMiddleware(options: {
  maxRetries?: number;
  delayMs?: number;
  timeoutMs?: number;
  onError?: (command: string, attempt: number, error: unknown) => void;
}) {
  const maxRetries = options.maxRetries ?? 1;
  const delayMs = options.delayMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 30000;
  const onError = options.onError;

  return async <T = unknown>(
    command: CommandName | (string & {}),
    args?: Record<string, unknown>
  ): Promise<T> => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          invoke<T>(command, args),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);
        return result;
      } catch (error) {
        lastError = error;
        onError?.(command, attempt + 1, error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }

    throw new IPCError(
      command,
      lastError,
      `Failed after ${maxRetries} attempts`
    );
  };
}
