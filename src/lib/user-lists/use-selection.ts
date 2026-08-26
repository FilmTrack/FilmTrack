"use client";

import { useMemo, useState } from "react";

export type SelectableTitle = {
  id: number;
  titleType: "movie" | "tv";
};

export function useSelection() {
  const [selected, setSelected] = useState<SelectableTitle[]>([]);

  function toggle(item: SelectableTitle) {
    setSelected((current) => {
      const exists = current.some(
        (entry) =>
          entry.id === item.id &&
          entry.titleType === item.titleType,
      );

      if (exists) {
        return current.filter(
          (entry) =>
            !(
              entry.id === item.id &&
              entry.titleType === item.titleType
            ),
        );
      }

      return [...current, item];
    });
  }

  function clear() {
    setSelected([]);
  }

  function isSelected(item: SelectableTitle) {
    return selected.some(
      (entry) =>
        entry.id === item.id &&
        entry.titleType === item.titleType,
    );
  }

  const count = useMemo(() => selected.length, [selected]);

  return {
    selected,
    toggle,
    clear,
    isSelected,
    count,
  };
}
