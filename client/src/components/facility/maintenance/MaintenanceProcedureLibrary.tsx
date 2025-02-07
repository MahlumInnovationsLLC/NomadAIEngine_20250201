import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MaintenanceProcedureLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: procedures = [] } = useQuery({
    queryKey: ['/api/maintenance/procedures'],
    enabled: true,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Maintenance Procedure Library</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'plus']} className="h-4 w-4" />
              Add Procedure
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FontAwesomeIcon icon={['fal', 'folder']} className="h-4 w-4" />
              Categories
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex gap-2 pb-4 border-b">
            <Button 
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button 
              variant={selectedCategory === 'mechanical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('mechanical')}
            >
              Mechanical
            </Button>
            <Button 
              variant={selectedCategory === 'electrical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('electrical')}
            >
              Electrical
            </Button>
            <Button 
              variant={selectedCategory === 'hvac' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('hvac')}
            >
              HVAC
            </Button>
          </div>

          <div className="grid gap-4">
            {procedures.map((procedure: any) => (
              <Card key={procedure.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {procedure.name}
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                        {procedure.category}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Equipment Type: {procedure.equipmentType} • Estimated Time: {procedure.estimatedTime}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <FontAwesomeIcon icon={['fal', 'expand']} className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <h5 className="text-sm font-medium mb-2">Required Tools & Parts</h5>
                    <div className="flex flex-wrap gap-2">
                      {procedure.requiredItems?.map((item: string) => (
                        <Badge key={item} variant="outline">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Safety Requirements</h5>
                    <div className="flex flex-wrap gap-2">
                      {procedure.safetyRequirements?.map((req: string) => (
                        <Badge 
                          key={req} 
                          variant="outline"
                          className="bg-yellow-500/10 text-yellow-500"
                        >
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <ScrollArea className="h-[200px] rounded-md border p-4">
                    <div className="space-y-4">
                      {procedure.steps?.map((step: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-none">
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {index + 1}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
