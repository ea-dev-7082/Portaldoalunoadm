import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "./input"

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  iconClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, iconClassName, placeholder, ...props }, ref) => {
    return (
      <div className={`relative ${containerClassName || ""}`}>
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${iconClassName || ""}`} />
        <Input
          type="search"
          placeholder={placeholder || "Buscar..."}
          className={`pl-10 ${className || ""}`}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchInput.displayName = "SearchInput"
