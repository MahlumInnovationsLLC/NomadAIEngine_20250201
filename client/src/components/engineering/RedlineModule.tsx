import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";

import RedlineSubmissionPanel from "./redline/RedlineSubmissionPanel";
import EngineerUserListPanel from "./EngineerUserListPanel";
import { RedlineProvider } from "./redline/RedlineContext";

export default function RedlineModule() {
  const [currentTab, setCurrentTab] = useState("submissions");

  return (
    <RedlineProvider>
      <div className="space-y-4">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submissions">
              <FontAwesomeIcon icon="pencil-ruler" className="mr-2 h-4 w-4" />
              Redline Submissions
            </TabsTrigger>
            <TabsTrigger value="team">
              <FontAwesomeIcon icon="users-gear" className="mr-2 h-4 w-4" />
              Engineering Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="space-y-4">
            <RedlineSubmissionPanel />
          </TabsContent>
          
          <TabsContent value="team" className="space-y-4">
            <EngineerUserListPanel />
          </TabsContent>
        </Tabs>
      </div>
    </RedlineProvider>
  );
}