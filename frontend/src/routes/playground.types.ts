export interface ExecuteCodeResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  compileError?: string;
  runtimeMs?: number;
}
