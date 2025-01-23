import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { ReportSettings, type ReportMetadata } from "./ReportSettings";
import {
  faSave,
  faDownload,
  faGripLines,
  faChartLine,
  faChartColumn,
  faChartPie,
  faTable,
  faSquare,
  faXmark,
  faLightbulb,
  faClone,
  faEye
} from "@fortawesome/pro-light-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";

// Add icons to library
library.add(
  faSave,
  faDownload,
  faGripLines,
  faChartLine,
  faChartColumn,
  faChartPie,
  faTable,
  faSquare,
  faXmark,
  faLightbulb,
  faClone,
  faEye
);

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

const reportTemplates = [
  {
    id: "executive",
    name: "Executive Summary",
    description: "High-level overview of key metrics and performance indicators",
    widgets: [
      {
        id: "widget-1",
        type: "metric" as WidgetType,
        title: "Overall Performance",
        metric: "roi",
        size: "large" as const,
        timeRange: "30d"
      },
      {
        id: "widget-2",
        type: "line-chart" as WidgetType,
        title: "Trend Analysis",
        metric: "engagement",
        size: "medium" as const,
        timeRange: "90d"
      }
    ]
  },
  {
    id: "detailed",
    name: "Detailed Analytics",
    description: "In-depth analysis with comprehensive metrics breakdown",
    widgets: [
      {
        id: "widget-3",
        type: "bar-chart" as WidgetType,
        title: "Channel Performance",
        metric: "conversion",
        size: "medium" as const,
        timeRange: "30d"
      },
      {
        id: "widget-4",
        type: "pie-chart" as WidgetType,
        title: "Revenue Distribution",
        metric: "revenue",
        size: "medium" as const,
        timeRange: "30d"
      }
    ]
  }
];

export function ReportBuilder() {
  const [widgets, setWidgets] = useState<ReportWidget[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({
    title: "",
    author: "",
    date: new Date().toISOString().split('T')[0],
    department: "",
    theme: "modern",
    format: "pdf",
    showLogo: true,
    showExecutiveSummary: true
  });

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setWidgets(items);
  };

  const applyTemplate = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      // Add timestamp to widget IDs to ensure uniqueness
      const timestampedWidgets = template.widgets.map(widget => ({
        ...widget,
        id: `${widget.id}-${Date.now()}`
      }));
      setWidgets([...widgets, ...timestampedWidgets]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Custom Report Builder</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
            <FontAwesomeIcon
              icon={['fal', 'eye']}
              className="mr-2 h-4 w-4"
            />
            {isPreviewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button variant="outline">
            <FontAwesomeIcon
              icon={['fal', 'download']}
              className="mr-2 h-4 w-4"
            />
            Export
          </Button>
          <Button>
            <FontAwesomeIcon
              icon={['fal', 'save']}
              className="mr-2 h-4 w-4"
            />
            Save Report
          </Button>
        </div>
      </div>

      {!isPreviewMode && (
        <>
          <ReportSettings
            metadata={reportMetadata}
            onMetadataChange={setReportMetadata}
          />

          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Enable AI-powered metric recommendations?</span>
              <Switch
                checked={showAIRecommendations}
                onCheckedChange={setShowAIRecommendations}
              />
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {reportTemplates.map(template => (
                  <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                      <Button variant="outline" onClick={() => applyTemplate(template.id)}>
                        <FontAwesomeIcon
                          icon={['fal', 'clone']}
                          className="mr-2 h-4 w-4"
                        />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Widgets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleAddWidget("line-chart")}>
                  <FontAwesomeIcon
                    icon={['fal', 'chart-line']}
                    className="mr-2 h-4 w-4"
                  />
                  Line Chart
                </Button>
                <Button variant="outline" onClick={() => handleAddWidget("bar-chart")}>
                  <FontAwesomeIcon
                    icon={['fal', 'chart-column']}
                    className="mr-2 h-4 w-4"
                  />
                  Bar Chart
                </Button>
                <Button variant="outline" onClick={() => handleAddWidget("pie-chart")}>
                  <FontAwesomeIcon
                    icon={['fal', 'chart-pie']}
                    className="mr-2 h-4 w-4"
                  />
                  Pie Chart
                </Button>
                <Button variant="outline" onClick={() => handleAddWidget("metric")}>
                  <FontAwesomeIcon
                    icon={['fal', 'square']}
                    className="mr-2 h-4 w-4"
                  />
                  Metric Card
                </Button>
                <Button variant="outline" onClick={() => handleAddWidget("table")}>
                  <FontAwesomeIcon
                    icon={['fal', 'table']}
                    className="mr-2 h-4 w-4"
                  />
                  Table
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid gap-6">
        {widgets.length > 0 ? (
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
                          className="rounded-lg border bg-card text-card-foreground shadow-sm group"
                        >
                          <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
                                >
                                  <FontAwesomeIcon
                                    icon={['fal', 'grip-lines']}
                                    className="h-4 w-4 text-muted-foreground"
                                  />
                                </div>
                                {!isPreviewMode && (
                                  <Input
                                    value={widget.title}
                                    onChange={(e) => {
                                      const newWidgets = [...widgets];
                                      newWidgets[index].title = e.target.value;
                                      setWidgets(newWidgets);
                                    }}
                                    className="w-[200px]"
                                  />
                                )}
                                {isPreviewMode && (
                                  <h3 className="text-lg font-semibold">{widget.title}</h3>
                                )}
                              </div>
                              {!isPreviewMode && (
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
                                      icon={['fal', 'xmark']}
                                      className="h-4 w-4"
                                    />
                                  </Button>
                                </div>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {!isPreviewMode && (
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
                                                icon={['fal', metric.icon as IconName]}
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
                                )}
                                {showAIRecommendations && !isPreviewMode && (
                                  <Alert>
                                    <AlertDescription className="text-sm">
                                      <FontAwesomeIcon
                                        icon={['fal', 'lightbulb']}
                                        className="mr-2 h-4 w-4 text-yellow-500"
                                      />
                                      Recommended: Compare this metric with last period's performance
                                    </AlertDescription>
                                  </Alert>
                                )}
                                {/* Preview placeholder */}
                                {isPreviewMode && (
                                  <div className={`aspect-video bg-muted rounded-lg flex items-center justify-center ${
                                    widget.size === 'small' ? 'max-w-sm' :
                                    widget.size === 'large' ? 'max-w-4xl' : 'max-w-2xl'
                                  }`}>
                                    <span className="text-muted-foreground">
                                      {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Preview
                                    </span>
                                  </div>
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
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FontAwesomeIcon
                  icon={['fal', 'chart-mixed']}
                  className="h-8 w-8 mb-4"
                />
                <p>No widgets added yet. Add widgets to build your report.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}