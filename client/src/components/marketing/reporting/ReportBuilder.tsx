import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

type WidgetType = "line-chart" | "bar-chart" | "pie-chart" | "metric" | "table";

interface ReportWidget {
  id: string;
  type: WidgetType;
  title: string;
  metric: string;
  size: "small" | "medium" | "large";
  timeRange: string;
}

const availableMetrics = [
  { id: "engagement", name: "Engagement Rate", icon: "chart-line" },
  { id: "conversion", name: "Conversion Rate", icon: "bullseye" },
  { id: "revenue", name: "Revenue", icon: "dollar-sign" },
  { id: "roi", name: "ROI", icon: "coins" },
  { id: "reach", name: "Reach", icon: "users" },
];

export function ReportBuilder() {
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);

  const handleAddWidget = (type: WidgetType) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type} Widget`,
      metric: availableMetrics[0].id,
      size: "medium",
      timeRange: "7d"
    };
    setWidgets([...widgets, newWidget]);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Custom Report Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, 'download' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Export
          </Button>
          <Button>
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, 'save' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Save Report
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription className="flex items-center justify-between">
          <span>Enable AI-powered metric recommendations?</span>
          <Switch
            checked={showAIRecommendations}
            onCheckedChange={setShowAIRecommendations}
          />
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleAddWidget("line-chart")}>
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, 'chart-line' as IconName]}
                  className="mr-2 h-4 w-4"
                />
                Line Chart
              </Button>
              <Button variant="outline" onClick={() => handleAddWidget("bar-chart")}>
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, 'chart-column' as IconName]}
                  className="mr-2 h-4 w-4"
                />
                Bar Chart
              </Button>
              <Button variant="outline" onClick={() => handleAddWidget("pie-chart")}>
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, 'chart-pie' as IconName]}
                  className="mr-2 h-4 w-4"
                />
                Pie Chart
              </Button>
              <Button variant="outline" onClick={() => handleAddWidget("metric")}>
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, 'square' as IconName]}
                  className="mr-2 h-4 w-4"
                />
                Metric Card
              </Button>
              <Button variant="outline" onClick={() => handleAddWidget("table")}>
                <FontAwesomeIcon
                  icon={['fal' as IconPrefix, 'table' as IconName]}
                  className="mr-2 h-4 w-4"
                />
                Table
              </Button>
            </div>
          </CardContent>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {widgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <Input
                              value={widget.title}
                              onChange={(e) => {
                                const newWidgets = [...widgets];
                                newWidgets[index].title = e.target.value;
                                setWidgets(newWidgets);
                              }}
                              className="w-[200px]"
                            />
                            <div className="flex gap-2">
                              <Select
                                value={widget.size}
                                onValueChange={(value) => {
                                  const newWidgets = [...widgets];
                                  newWidgets[index].size = value as "small" | "medium" | "large";
                                  setWidgets(newWidgets);
                                }}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setWidgets(widgets.filter((w) => w.id !== widget.id));
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={['fal' as IconPrefix, 'xmark' as IconName]}
                                  className="h-4 w-4"
                                />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid gap-4">
                              <div className="flex items-center gap-4">
                                <Select
                                  value={widget.metric}
                                  onValueChange={(value) => {
                                    const newWidgets = [...widgets];
                                    newWidgets[index].metric = value;
                                    setWidgets(newWidgets);
                                  }}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableMetrics.map((metric) => (
                                      <SelectItem key={metric.id} value={metric.id}>
                                        <div className="flex items-center gap-2">
                                          <FontAwesomeIcon
                                            icon={['fal' as IconPrefix, metric.icon as IconName]}
                                            className="h-4 w-4"
                                          />
                                          {metric.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={widget.timeRange}
                                  onValueChange={(value) => {
                                    const newWidgets = [...widgets];
                                    newWidgets[index].timeRange = value;
                                    setWidgets(newWidgets);
                                  }}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                                    <SelectItem value="7d">Last 7 Days</SelectItem>
                                    <SelectItem value="30d">Last 30 Days</SelectItem>
                                    <SelectItem value="90d">Last Quarter</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {showAIRecommendations && (
                                <Alert>
                                  <AlertDescription className="text-sm">
                                    <FontAwesomeIcon
                                      icon={['fal' as IconPrefix, 'lightbulb' as IconName]}
                                      className="mr-2 h-4 w-4 text-yellow-500"
                                    />
                                    Recommended: Compare this metric with last period's performance
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
