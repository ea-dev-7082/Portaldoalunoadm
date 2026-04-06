import { useState, useMemo } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Filter, X, Check } from "lucide-react";
import { cn } from "./ui/utils";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  align?: "start" | "center" | "end";
}

export function MultiSelectFilter({ 
  label, 
  options, 
  selectedValues, 
  onSelect,
  align = "start"
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelect(selectedValues.filter((v) => v !== option));
    } else {
      onSelect([...selectedValues, option]);
    }
  };

  const clearFilters = () => {
    onSelect([]);
  };

  const sortedOptions = useMemo(() => {
    // Separate selected and unselected
    const selected = options.filter(opt => selectedValues.includes(opt)).sort();
    const unselected = options.filter(opt => !selectedValues.includes(opt)).sort();
    return [...selected, ...unselected];
  }, [options, selectedValues]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-8 flex gap-2 items-center px-2 py-1 hover:bg-muted text-xs font-normal",
            selectedValues.length > 0 && "text-primary font-medium bg-primary/5"
          )}
        >
          <Filter className={cn("w-3 h-3", selectedValues.length > 0 && "fill-primary")} />
          {label}
          {selectedValues.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] min-w-[1.25rem] flex justify-center">
              {selectedValues.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align={align}>
        <div className="flex flex-col">
          <div className="p-2 border-b bg-muted/30">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Filtrar por {label}
            </span>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-1">
            {/* "Todos" Option */}
            <button
              onClick={clearFilters}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent transition-colors",
                selectedValues.length === 0 && "bg-accent/50 text-accent-foreground font-medium"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 border rounded-sm flex items-center justify-center",
                  selectedValues.length === 0 ? "bg-primary border-primary" : "border-muted-foreground/30"
                )}>
                  {selectedValues.length === 0 && <Check className="w-3 h-3 text-white" />}
                </div>
                Todos
              </div>
            </button>

            {/* Separator if needed can be implicit */}

            {/* Ordered Options */}
            {sortedOptions.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggleOption(option)}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-accent group transition-colors",
                    isSelected && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className={cn(
                      "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{option}</span>
                  </div>
                  {isSelected && (
                    <X 
                      className="w-3 h-3 text-muted-foreground hover:text-destructive transition-colors shrink-0" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(option);
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedValues.length > 0 && (
            <div className="p-2 border-t bg-muted/10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-7 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={clearFilters}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
