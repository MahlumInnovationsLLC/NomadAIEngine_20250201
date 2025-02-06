import { useState } from "react";
import { Equipment } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

interface EquipmentListProps {
  equipment: Equipment[];
  onEquipmentSelect?: (equipment: Equipment[]) => void;
  selectedEquipment?: Equipment[];
}

export default function EquipmentList({ 
  equipment, 
  onEquipmentSelect,
  selectedEquipment = []
}: EquipmentListProps) {
  const handleSelect = (item: Equipment) => {
    if (!onEquipmentSelect) return;
    
    const isSelected = selectedEquipment.some(e => e.id === item.id);
    if (isSelected) {
      onEquipmentSelect(selectedEquipment.filter(e => e.id !== item.id));
    } else {
      onEquipmentSelect([...selectedEquipment, item]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {equipment.map((item) => (
          <Card
            key={item.id}
            className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
              selectedEquipment.some(e => e.id === item.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleSelect(item)}
          >
            <div className="flex items-center gap-3">
              <div className={`
                h-3 w-3 rounded-full
                ${item.status === 'active' ? 'bg-green-500' : 
                  item.status === 'maintenance' ? 'bg-yellow-500' : 'bg-red-500'}
              `} />
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-muted-foreground">
                  Health Score: {item.healthScore}%
                </div>
              </div>
              <FontAwesomeIcon 
                icon={item.type === 'hvac' ? 'fan' : 'industry'} 
                className="h-5 w-5 text-muted-foreground"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
