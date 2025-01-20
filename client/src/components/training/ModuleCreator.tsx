import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { useToast } from "@/hooks/use-toast";

type ContentBlockType = 'text' | 'quiz' | 'lab';

interface ContentBlock {
  id: string;
  type: ContentBlockType;
  title: string;
  content: string;
  order: number;
}

interface ModuleData {
  title: string;
  description: string;
  blocks: ContentBlock[];
}

const BLOCK_TYPES: { type: ContentBlockType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text Content', icon: 'file-lines' },
  { type: 'quiz', label: 'Quiz', icon: 'brain' },
  { type: 'lab', label: 'Hands-on Lab', icon: 'microscope' },
];

export function ModuleCreator() {
  const [moduleData, setModuleData] = useState<ModuleData>({
    title: '',
    description: '',
    blocks: [],
  });
  const { toast } = useToast();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(moduleData.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setModuleData({
      ...moduleData,
      blocks: updatedItems,
    });
  };

  const addBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      title: `New ${type} block`,
      content: '',
      order: moduleData.blocks.length,
    };

    setModuleData({
      ...moduleData,
      blocks: [...moduleData.blocks, newBlock],
    });
  };

  const removeBlock = (blockId: string) => {
    setModuleData({
      ...moduleData,
      blocks: moduleData.blocks.filter(block => block.id !== blockId),
    });
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setModuleData({
      ...moduleData,
      blocks: moduleData.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    });
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/training/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) throw new Error('Failed to save module');

      toast({
        title: "Success",
        description: "Module saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save module",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Training Module</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Module Title</label>
              <Input
                value={moduleData.title}
                onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                placeholder="Enter module title"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={moduleData.description}
                onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                placeholder="Enter module description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {BLOCK_TYPES.map(({ type, label, icon }) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => addBlock(type)}
            className="flex items-center gap-2"
          >
            <FontAwesomeIcon icon="circle-plus" className="h-4 w-4" />
            <FontAwesomeIcon icon={icon} className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="module-blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {moduleData.blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon="grip-vertical" className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">
                            {BLOCK_TYPES.find(t => t.type === block.type)?.label}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlock(block.id)}
                        >
                          <FontAwesomeIcon icon="xmark" className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Input
                            value={block.title}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            placeholder="Block title"
                          />
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder={`Enter ${block.type} content`}
                            rows={4}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button onClick={handleSave} className="w-full">
        Save Module
      </Button>
    </div>
  );
}