import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-svg-core";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export interface ReportMetadata {
  title: string;
  author: string;
  date: string;
  department: string;
  theme: "modern" | "classic" | "minimal";
  format: "pdf" | "excel" | "powerpoint";
  showLogo: boolean;
  showExecutiveSummary: boolean;
}

interface ReportSettingsProps {
  metadata: ReportMetadata;
  onMetadataChange: (metadata: ReportMetadata) => void;
}

export function ReportSettings({ metadata, onMetadataChange }: ReportSettingsProps) {
  const handleChange = (key: keyof ReportMetadata, value: any) => {
    onMetadataChange({
      ...metadata,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FontAwesomeIcon
            icon={['fal' as IconPrefix, 'gear' as IconName]}
            className="h-4 w-4"
          />
          Report Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input
              value={metadata.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Q4 2024 Marketing Performance"
            />
          </div>

          <div className="space-y-2">
            <Label>Author Name</Label>
            <Input
              value={metadata.author}
              onChange={(e) => handleChange("author", e.target.value)}
              placeholder="John Smith"
            />
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Input
              value={metadata.department}
              onChange={(e) => handleChange("department", e.target.value)}
              placeholder="Marketing"
            />
          </div>

          <div className="space-y-2">
            <Label>Report Date</Label>
            <Input
              value={metadata.date}
              type="date"
              onChange={(e) => handleChange("date", e.target.value)}
              defaultValue={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={metadata.theme}
              onValueChange={(value) => handleChange("theme", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={metadata.format}
              onValueChange={(value) => handleChange("format", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report</SelectItem>
                <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" onClick={() => handleChange("showLogo", !metadata.showLogo)}>
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, metadata.showLogo ? 'check-square' : 'square' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Include Company Logo
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleChange("showExecutiveSummary", !metadata.showExecutiveSummary)}
          >
            <FontAwesomeIcon
              icon={['fal' as IconPrefix, metadata.showExecutiveSummary ? 'check-square' : 'square' as IconName]}
              className="mr-2 h-4 w-4"
            />
            Add Executive Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
