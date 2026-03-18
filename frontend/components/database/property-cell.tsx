"use client";

import { useState, useRef, useEffect } from "react";
import { DatabaseProperty } from "@/types";
import { useDatabaseStore } from "@/store/database.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface PropertyCellProps {
  property: DatabaseProperty;
  value: any;
  rowId: string;
  readOnly?: boolean;
}

export function PropertyCell({
  property,
  value,
  rowId,
  readOnly = false,
}: PropertyCellProps) {
  const { updateRowValue } = useDatabaseStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced update function
  const debouncedUpdate = debounce(async (newValue: any) => {
    try {
      await updateRowValue(rowId, property.id, newValue);
    } catch (error) {
      console.error("Failed to update cell value:", error);
    }
  }, 500);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleValueChange = (newValue: any) => {
    setLocalValue(newValue);
    if (!readOnly) {
      debouncedUpdate(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const renderCell = () => {
    switch (property.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <TextCell
            value={localValue}
            onChange={handleValueChange}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            type={property.type}
            ref={inputRef}
          />
        );

      case "number":
        return (
          <NumberCell
            value={localValue}
            onChange={handleValueChange}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            ref={inputRef}
          />
        );

      case "checkbox":
        return (
          <CheckboxCell
            value={localValue}
            onChange={handleValueChange}
            readOnly={readOnly}
          />
        );

      case "select":
        return (
          <SelectCell
            value={localValue}
            onChange={handleValueChange}
            options={property.options?.options || []}
            readOnly={readOnly}
          />
        );

      case "multi_select":
        return (
          <MultiSelectCell
            value={localValue}
            onChange={handleValueChange}
            options={property.options?.options || []}
            readOnly={readOnly}
          />
        );

      case "date":
        return (
          <DateCell
            value={localValue}
            onChange={handleValueChange}
            readOnly={readOnly}
          />
        );

      case "created_time":
      case "last_edited_time":
        return <TimestampCell value={localValue} />;

      default:
        return (
          <div className="h-8 flex items-center text-muted-foreground text-sm">
            Unsupported type
          </div>
        );
    }
  };

  return <div className="h-8 flex items-center">{renderCell()}</div>;
}

// Individual cell components
const TextCell = ({
  value,
  onChange,
  isEditing,
  setIsEditing,
  onKeyDown,
  readOnly,
  type,
  ref,
}: any) => {
  if (isEditing && !readOnly) {
    return (
      <Input
        ref={ref}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => setIsEditing(false)}
        className="h-8 border-none p-0 bg-transparent focus-visible:ring-0"
        type={
          type === "email"
            ? "email"
            : type === "url"
              ? "url"
              : type === "phone"
                ? "tel"
                : "text"
        }
      />
    );
  }

  return (
    <div
      className={cn(
        "h-8 flex items-center px-1 rounded text-sm truncate w-full",
        !readOnly && "cursor-text hover:bg-accent/10",
        !value && "text-muted-foreground",
      )}
      onClick={() => !readOnly && setIsEditing(true)}
    >
      {value || "Empty"}
    </div>
  );
};

const NumberCell = ({
  value,
  onChange,
  isEditing,
  setIsEditing,
  onKeyDown,
  readOnly,
  ref,
}: any) => {
  if (isEditing && !readOnly) {
    return (
      <Input
        ref={ref}
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onKeyDown={onKeyDown}
        onBlur={() => setIsEditing(false)}
        className="h-8 border-none p-0 bg-transparent focus-visible:ring-0"
      />
    );
  }

  return (
    <div
      className={cn(
        "h-8 flex items-center px-1 rounded text-sm w-full",
        !readOnly && "cursor-text hover:bg-accent/10",
        !value && value !== 0 && "text-muted-foreground",
      )}
      onClick={() => !readOnly && setIsEditing(true)}
    >
      {value !== null && value !== undefined ? value : "Empty"}
    </div>
  );
};

const CheckboxCell = ({ value, onChange, readOnly }: any) => {
  return (
    <div className="h-8 flex items-center">
      <input
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        disabled={readOnly}
        className="rounded border-gray-300"
      />
    </div>
  );
};

const SelectCell = ({ value, onChange, options, readOnly }: any) => {
  if (readOnly) {
    const selectedOption = options.find(
      (opt: any) => opt.id === value?.id || opt.name === value?.name,
    );
    return (
      <div className="h-8 flex items-center">
        {selectedOption ? (
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: `var(--${selectedOption.color}-100)`,
              color: `var(--${selectedOption.color}-800)`,
            }}
          >
            {selectedOption.name}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Empty</span>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-full justify-start p-1 font-normal"
        >
          {value ? (
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `var(--${value.color}-100)`,
                color: `var(--${value.color}-800)`,
              }}
            >
              {value.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select...</span>
          )}
          <ChevronDown className="ml-auto h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => onChange(null)}>
          <span className="text-muted-foreground">None</span>
        </DropdownMenuItem>
        {options.map((option: any) => (
          <DropdownMenuItem key={option.id} onClick={() => onChange(option)}>
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `var(--${option.color}-100)`,
                color: `var(--${option.color}-800)`,
              }}
            >
              {option.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MultiSelectCell = ({ value, onChange, options, readOnly }: any) => {
  const selectedOptions = Array.isArray(value) ? value : [];

  const toggleOption = (option: any) => {
    const isSelected = selectedOptions.some(
      (selected: any) => selected.id === option.id,
    );
    if (isSelected) {
      onChange(
        selectedOptions.filter((selected: any) => selected.id !== option.id),
      );
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  if (readOnly) {
    return (
      <div className="h-8 flex items-center gap-1 flex-wrap">
        {selectedOptions.length > 0 ? (
          selectedOptions.map((option: any) => (
            <span
              key={option.id}
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: `var(--${option.color}-100)`,
                color: `var(--${option.color}-800)`,
              }}
            >
              {option.name}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">Empty</span>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-full justify-start p-1 font-normal"
        >
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            {selectedOptions.length > 0 ? (
              selectedOptions.slice(0, 2).map((option: any) => (
                <span
                  key={option.id}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `var(--${option.color}-100)`,
                    color: `var(--${option.color}-800)`,
                  }}
                >
                  {option.name}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">Select...</span>
            )}
            {selectedOptions.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{selectedOptions.length - 2}
              </span>
            )}
          </div>
          <ChevronDown className="ml-auto h-3 w-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option: any) => {
          const isSelected = selectedOptions.some(
            (selected: any) => selected.id === option.id,
          );
          return (
            <DropdownMenuItem
              key={option.id}
              onClick={() => toggleOption(option)}
            >
              <div className="flex items-center gap-2">
                {isSelected && <Check className="h-3 w-3" />}
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `var(--${option.color}-100)`,
                    color: `var(--${option.color}-800)`,
                  }}
                >
                  {option.name}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const DateCell = ({ value, onChange, readOnly }: any) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  if (readOnly) {
    return (
      <div className="h-8 flex items-center text-sm">
        {value ? (
          formatDate(value)
        ) : (
          <span className="text-muted-foreground">Empty</span>
        )}
      </div>
    );
  }

  return (
    <div className="h-8 flex items-center">
      <Input
        type="date"
        value={value ? new Date(value).toISOString().split("T")[0] : ""}
        onChange={(e) =>
          onChange(
            e.target.value ? new Date(e.target.value).toISOString() : null,
          )
        }
        className="h-8 border-none p-0 bg-transparent focus-visible:ring-0"
      />
    </div>
  );
};

const TimestampCell = ({ value }: any) => {
  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-8 flex items-center text-sm text-muted-foreground">
      {value ? formatTimestamp(value) : "Never"}
    </div>
  );
};
