import { Sparkles } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '@/components/ui/select';
import { config, type ModelOption } from '@/config';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  /** Currently selected model id. */
  value: string;
  /** Called with the new model id when the user picks one. */
  onChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Extract a size badge ("8B", "120B", …) from the model's label or id, if present. */
function modelBadge(model: ModelOption): string | null {
  const match = model.label.match(/\b(\d+)\s*B\b/i) ?? model.id.match(/\b(\d+)\s*b\b/i);
  return match ? `${match[1]}B` : null;
}

/** Description line, derived dynamically (mirrors "<size> model served via groq."). */
function modelDescription(model: ModelOption): string {
  const badge = modelBadge(model);
  return badge ? `${badge} model served via groq.` : 'Model served via groq.';
}

/**
 * Dynamic model picker. Every option — label, size badge, and description — is
 * derived from `VITE_AVAILABLE_MODELS` (parsed in `@/config`). No model names are
 * hardcoded here: add, remove, or relabel models by editing the environment and
 * the dropdown updates with no code change.
 */
export function ModelSelector({
  value,
  onChange,
  disabled,
  className,
}: ModelSelectorProps): JSX.Element {
  const models = config.llm.availableModels;
  const selected = models.find((m) => m.id === value) ?? models[0];
  const selectedBadge = selected ? modelBadge(selected) : null;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label="Select AI model"
        className={cn(
          'h-7 w-auto gap-1.5 rounded-full border-violet-500/20 bg-violet-500/10 px-2.5 py-0',
          'text-[11px] font-medium text-violet-300 focus:ring-1 focus:ring-offset-0',
          className,
        )}
      >
        <Sparkles className="h-3 w-3 shrink-0 opacity-80" />
        <span className="truncate">{selected?.label ?? 'Select model'}</span>
        {selectedBadge && (
          <span className="rounded bg-violet-500/20 px-1 text-[9px] font-semibold text-violet-300">
            {selectedBadge}
          </span>
        )}
      </SelectTrigger>

      <SelectContent className="max-w-[20rem]">
        <SelectGroup>
          <SelectLabel className="text-muted-foreground px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider">
            Choose a model
          </SelectLabel>
          {models.map((model) => {
            const badge = modelBadge(model);
            return (
              <SelectItem key={model.id} value={model.id} className="py-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{model.label}</span>
                    {badge && (
                      <span className="rounded bg-orange-500/15 px-1 text-[9px] font-semibold text-orange-400">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    {modelDescription(model)}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
