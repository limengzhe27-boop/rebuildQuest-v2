"use client";

import { LOTTERY_SLOT_COUNT } from "@/lib/survey-lottery";

const gridOrder = [0, 1, 2, 7, -1, 3, 6, 5, 4];

export function LotteryGrid({
  renderCell,
  activeSlot,
  className = "",
}: {
  renderCell: (slot: number) => React.ReactNode;
  activeSlot?: number | null;
  className?: string;
}) {
  return (
    <div className={`lottery-grid ${className}`}>
      {gridOrder.map((slot, index) =>
        slot === -1 ? (
          <div className="lottery-cell lottery-pool" key="pool">
            <span>奖品池</span>
          </div>
        ) : (
          <div className={`lottery-cell ${activeSlot === slot ? "active" : ""}`} key={`slot-${index}`}>
            {renderCell(slot)}
          </div>
        ),
      )}
    </div>
  );
}

export { LOTTERY_SLOT_COUNT };
