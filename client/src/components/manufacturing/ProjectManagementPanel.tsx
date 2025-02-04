1:import { useState, useEffect } from "react";
2:import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
3:import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
4:import { Button } from "@/components/ui/button";
5:import { Input } from "@/components/ui/input";
6:import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
7:import { useToast } from "@/hooks/use-toast";
8:import { Badge } from "@/components/ui/badge";
9:import { Progress } from "@/components/ui/progress";
10:import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
11:import {
12:  Select,
13:  SelectContent,
14:  SelectItem,
15:  SelectTrigger,
16:  SelectValue,
17:} from "@/components/ui/select";
18:import {
19:  AlertDialog,
20:  AlertDialogAction,
21:  AlertDialogCancel,
22:  AlertDialogContent,
23:  AlertDialogDescription,
24:  AlertDialogFooter,
25:  AlertDialogHeader,
26:  AlertDialogTitle,
27:} from "@/components/ui/alert-dialog";
28:import { ResourceManagementPanel } from "./ResourceManagementPanel";
29:import { ProjectCreateDialog } from "./ProjectCreateDialog";
30:import { Project, ProjectStatus } from "@/types/manufacturing";
31:import {
32:  faArrowUp,
33:  faArrowDown,
34:  faFolder,
35:  faCheckCircle,
36:  faCircleDot,
37:  faEdit,
38:  faLocationDot,
39:  faRotateLeft,
40:  faFileImport,
41:  faTrashCan
42:} from "@fortawesome/pro-light-svg-icons";
43:import { ProductionTimeline } from './ProductionTimeline';
44:import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
45:import { RichTextEditor } from "@/components/ui/rich-text-editor";
46:
47:function formatDate(dateString?: string) {
48:  if (!dateString) return '-';
49:  const date = new Date(dateString);
50:  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
51:  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
52:  return adjustedDate.toLocaleDateString('en-US', {
53:    year: 'numeric',
54:    month: '2-digit',
55:    day: '2-digit',
56:    timeZone: 'UTC'
57:  });
58:}
59:
60:function calculateWorkingDays(startDate: string, endDate: string): number {
61:  const start = new Date(startDate);
62:  const end = new Date(endDate);
63:  let days = 0;
64:  const current = new Date(start);
65:
66:  while (current <= end) {
67:    const dayOfWeek = current.getDay();
68:    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
69:      days++;
70:    }
71:    current.setDate(current.getDate() + 1);
72:  }
73:
74:  return days;
75:}
76:
77:function getDaysColor(days: number) {
78:  if (days <= 3) {
79:    return "text-green-500";
80:  } else if (days <= 7) {
81:    return "text-yellow-500";
82:  } else {
83:    return "text-red-500";
84:  }
85:}
86:
87:function getStatusColor(status: ProjectStatus): string {
88:  switch (status) {
89:    case "NOT STARTED":
90:      return "bg-gray-500";
91:    case "IN FAB":
92:      return "bg-blue-500";
93:    case "IN ASSEMBLY":
94:      return "bg-indigo-500";
95:    case "IN WRAP":
96:      return "bg-purple-500";
97:    case "IN NTC TESTING":
98:      return "bg-orange-500";
99:    case "IN QC":
100:      return "bg-yellow-500";
101:    case "COMPLETED":
102:      return "bg-green-500";
103:    default:
104:      return "bg-gray-500";
105:  }
106:}
107:
108:function calculateQCDays(project: Project): number {
109:  if (!project.qcStart) return 0;
110:
111:  const endDate = project.executiveReview || project.ship;
112:  if (!endDate) return 0;
113:
114:  return calculateWorkingDays(project.qcStart, endDate);
115:}
116:
117:function calculateProjectStatus(project: Project): ProjectStatus {
118:  console.log('Calculating status for project:', project);
119:
120:  if (project.manualStatus) {
121:    console.log('Using manual status:', project.status);
122:    return project.status;
123:  }
124:
125:  const today = new Date();
126:  console.log('Current date:', today);
127:
128:  const dates = {
129:    fabricationStart: project.fabricationStart ? new Date(project.fabricationStart) : null,
130:    assemblyStart: project.assemblyStart ? new Date(project.assemblyStart) : null,
131:    wrapGraphics: project.wrapGraphics ? new Date(project.wrapGraphics) : null,
132:    ntcTesting: project.ntcTesting ? new Date(project.ntcTesting) : null,
133:    qcStart: project.qcStart ? new Date(project.qcStart) : null,
134:    ship: project.ship ? new Date(project.ship) : null,
135:  };
136:
137:  console.log('Project dates:', dates);
138:
139:  if (dates.ship && today >= dates.ship) {
140:    console.log('Project is COMPLETED');
141:    return "COMPLETED";
142:  }
143:
144:  if (dates.qcStart && today >= dates.qcStart) {
145:    console.log('Project is IN QC');
146:    return "IN QC";
147:  }
148:
149:  if (dates.ntcTesting && today >= dates.ntcTesting) {
150:    console.log('Project is IN NTC TESTING');
151:    return "IN NTC TESTING";
152:  }
153:
154:  if (dates.wrapGraphics && today >= dates.wrapGraphics) {
155:    console.log('Project is IN WRAP');
156:    return "IN WRAP";
157:  }
158:
159:  if (dates.assemblyStart && today >= dates.assemblyStart) {
160:    console.log('Project is IN ASSEMBLY');
161:    return "IN ASSEMBLY";
162:  }
163:
164:  if (dates.fabricationStart && today >= dates.fabricationStart) {
165:    console.log('Project is IN FAB');
166:    return "IN FAB";
167:  }
168:
169:  console.log('Project is NOT STARTED');
170:  return "NOT STARTED";
171:}
172:
173:export function ProjectManagementPanel() {
174:  const { toast } = useToast();
175:  const queryClient = useQueryClient();
176:  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
177:  const [searchQuery, setSearchQuery] = useState("");
178:  const [sortField, setSortField] = useState<"location" | "qcStart" | "ship" | null>(null);
179:  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
180:  const [showEditDialog, setShowEditDialog] = useState(false);
181:  const [showStatusDialog, setShowStatusDialog] = useState(false);
182:  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
183:  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
184:  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
185:  const [activeView, setActiveView] = useState<"list" | "map" | "table">("list");
186:  const [showImportDialog, setShowImportDialog] = useState(false);
187:  const [importFile, setImportFile] = useState<File | null>(null);
188:  const [importing, setImporting] = useState(false);
189:  const [previewData, setPreviewData] = useState<any[]>([]);
190:  const [showPreview, setShowPreview] = useState(false);
191:
192:  const { data: projects = [], isLoading } = useQuery<Project[]>({
193:    queryKey: ['/api/manufacturing/projects'],
194:    queryFn: async () => {
195:      const response = await fetch('/api/manufacturing/projects');
196:      if (!response.ok) {
197:        throw new Error('Failed to fetch projects');
198:      }
199:      const data = await response.json();
200:      return data.map((project: Project) => ({
201:        ...project,
202:        status: calculateProjectStatus(project)
203:      }));
204:    },
205:    staleTime: 0,
206:    refetchInterval: 1000,
207:  });
208:
209:  useEffect(() => {
210:    if (selectedProject) {
211:      const updatedProject = projects.find(p => p.id === selectedProject.id);
212:      if (updatedProject) {
213:        const calculatedStatus = calculateProjectStatus(updatedProject);
214:        console.log('Updated project status:', calculatedStatus);
215:        setSelectedProject({
216:          ...updatedProject,
217:          status: calculatedStatus
218:        });
219:      }
220:    }
221:  }, [projects, selectedProject]);
222:
223:  const updateProjectMutation = useMutation({
224:    mutationFn: async (data: { id: string; status: ProjectStatus; manualStatus: boolean }) => {
225:      const response = await fetch(`/api/manufacturing/projects/${data.id}`, {
226:        method: 'PATCH',
227:        headers: { 'Content-Type': 'application/json' },
228:        body: JSON.stringify(data)
229:      });
230:      if (!response.ok) throw new Error('Failed to update project status');
231:      return response.json();
232:    },
233:    onSuccess: (updatedProject) => {
234:      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
235:        if (!oldData) return [updatedProject];
236:        return oldData.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
237:      });
238:      toast({
239:        title: "Success",
240:        description: "Project status updated successfully"
241:      });
242:      setShowStatusDialog(false);
243:      setPendingStatus(null);
244:    },
245:    onError: (error) => {
246:      toast({
247:        title: "Error",
248:        description: error instanceof Error ? error.message : "Failed to update project status",
249:        variant: "destructive"
250:      });
251:    }
252:  });
253:
254:  const resetStatusMutation = useMutation({
255:    mutationFn: async (id: string) => {
256:      const response = await fetch(`/api/manufacturing/projects/${id}/reset-status`, {
257:        method: 'POST',
258:        headers: { 'Content-Type': 'application/json' }
259:      });
260:      if (!response.ok) throw new Error('Failed to reset project status');
261:      return response.json();
262:    },
263:    onSuccess: (updatedProject) => {
264:      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
265:        if (!oldData) return [updatedProject];
266:        return oldData.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p);
267:      });
268:      toast({
269:        title: "Success",
270:        description: "Project status reset to automatic updates"
271:      });
272:    },
273:    onError: (error) => {
274:      toast({
275:        title: "Error",
276:        description: error instanceof Error ? error.message : "Failed to reset project status",
277:        variant: "destructive"
278:      });
279:    }
280:  });
281:
282:  const deleteProjectMutation = useMutation({
283:    mutationFn: async (projectId: string) => {
284:      const response = await fetch(`/api/manufacturing/projects/${projectId}`, {
285:        method: 'DELETE',
286:      });
287:      if (!response.ok) throw new Error('Failed to delete project');
288:      return projectId;
289:    },
290:    onSuccess: (deletedProjectId) => {
291:      queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
292:        if (!oldData) return [];
293:        return oldData.filter(p => p.id !== deletedProjectId);
294:      });
295:      toast({
296:        title: "Success",
297:        description: "Project deleted successfully"
298:      });
299:      if (selectedProject?.id === deletedProjectId) {
300:        setSelectedProject(null);
301:      }
302:      setShowDeleteDialog(false);
303:      setProjectToDelete(null);
304:    },
305:    onError: (error) => {
306:      toast({
307:        title: "Error",
308:        description: error instanceof Error ? error.message : "Failed to delete project",
309:        variant: "destructive"
310:      });
311:    }
312:  });
313:
314:  const handleResetStatus = (projectId: string) => {
315:    resetStatusMutation.mutate(projectId);
316:  };
317:
318:  const handleStatusChange = (status: ProjectStatus) => {
319:    if (!selectedProject) return;
320:
321:    if (status === "COMPLETED" && (!selectedProject.ship || new Date() <= new Date(selectedProject.ship))) {
322:      toast({
323:        title: "Invalid Status",
324:        description: "Project can only be marked as completed after the ship date",
325:        variant: "destructive"
326:      });
327:      return;
328:    }
329:
330:    setPendingStatus(status);
331:    setShowStatusDialog(true);
332:  };
333:
334:  const confirmStatusChange = () => {
335:    if (!selectedProject || !pendingStatus) return;
336:
337:    updateProjectMutation.mutate({
338:      id: selectedProject.id,
339:      status: pendingStatus,
340:      manualStatus: true
341:    });
342:  };
343:
344:  const handleSort = (field: "location" | "qcStart" | "ship") => {
345:    if (sortField === field) {
346:      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
347:    } else {
348:      setSortField(field);
349:      setSortDirection("desc");
350:    }
351:  };
352:
353:  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
354:    const file = e.target.files?.[0];
355:    if (!file) return;
356:
357:    setImportFile(file);
358:    const formData = new FormData();
359:    formData.append('file', file);
360:
361:    try {
362:      const response = await fetch('/api/manufacturing/projects/preview', {
363:        method: 'POST',
364:        body: formData,
365:      });
366:
367:      if (!response.ok) {
368:        throw new Error('Preview failed');
369:      }
370:
371:      const result = await response.json();
372:      setPreviewData(result.projects);
373:      setShowPreview(true);
374:    } catch (error) {
375:      toast({
376:        title: "Error",
377:        description: "Failed to preview projects",
378:        variant: "destructive"
379:      });
380:      setImportFile(null);
381:    }
382:  };
383:
384:  const handleImport = async () => {
385:    if (!importFile) return;
386:
387:    setImporting(true);
388:    const formData = new FormData();
389:    formData.append('file', importFile);
390:
391:    try {
392:      const response = await fetch('/api/manufacturing/projects/import', {
393:        method: 'POST',
394:        body: formData,
395:      });
396:
397:      if (!response.ok) {
398:        throw new Error('Import failed');
399:      }
400:
401:      const result = await response.json();
402:      toast({
403:        title: "Success",
404:        description: `Successfully imported ${result.count} projects`
405:      });
406:
407:      queryClient.invalidateQueries({ queryKey: ['/api/manufacturing/projects'] });
408:      setShowImportDialog(false);
409:      setImportFile(null);
410:      setPreviewData([]);
411:      setShowPreview(false);
412:    } catch (error) {
413:      toast({
414:        title: "Error",
415:        description: "Failed to import projects",
416:        variant: "destructive"
417:      });
418:    } finally {
419:      setImporting(false);
420:    }
421:  };
422:
423:  const handleDeleteClick = (project: Project, event: React.MouseEvent) => {
424:    event.stopPropagation();
425:    setProjectToDelete(project);
426:    setShowDeleteDialog(true);
427:  };
428:
429:  const confirmDelete = () => {
430:    if (projectToDelete) {
431:      deleteProjectMutation.mutate(projectToDelete.id);
432:    }
433:  };
434:
435:
436:  const filteredAndSortedProjects = projects
437:    .filter(project => (
438:      (project.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
439:      (project.projectNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase())
440:    ))
441:    .sort((a, b) => {
442:      if (!sortField) return 0;
443:
444:      if (sortField === "location") {
445:        const aLocation = (a.location || '').toLowerCase();
446:        const bLocation = (b.location || '').toLowerCase();
447:        return sortDirection === "asc"
448:          ? aLocation.localeCompare(bLocation)
449:          : bLocation.localeCompare(aLocation);
450:      }
451:
452:      const aDate = a[sortField] ? new Date(a[sortField]).getTime() : 0;
453:      const bDate = b[sortField] ? new Date(b[sortField]).getTime() : 0;
454:
455:      return sortDirection === "asc"
456:        ? aDate - bDate
457:        : bDate - aDate;
458:    });
459:
460:  if (isLoading) {
461:    return (
462:      <div className="flex items-center justify-center p-8">
463:        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
464:      </div>
465:    );
466:  }
467:
468:  return (
469:    <div className="space-y-6">
470:      <div className="flex justify-between items-center">
471:        <div>
472:          <h2 className="text-2xl font-bold">Project Management</h2>
473:          <p className="text-muted-foreground">
474:            Manage and track manufacturing projects
475:          </p>
476:        </div>
477:        <div className="flex gap-2">
478:          <Button
479:            variant="outline"
480:            onClick={() => setShowImportDialog(true)}
481:            className="gap-2"
482:          >
483:            <FontAwesomeIcon icon={faFileImport} className="h-4 w-4" />
484:            Import Excel
485:          </Button>
486:          <ProjectCreateDialog />
487:        </div>
488:      </div>
489:
490:      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
491:        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col">
492:          <DialogHeader>
493:            <DialogTitle>Import Projects from Excel</DialogTitle>
494:          </DialogHeader>
495:          <div className="flex-1 min-h-0 space-y-4">
496:            <div className="space-y-2">
497:              <label className="text-sm font-medium">
498:                Select Excel File
499:              </label>
500:              <Input
501:                type="file"
502:                accept=".xlsx,.xls"
503:                onChange={handleFileSelect}
504:                disabled={showPreview}
505:              />
506:            </div>
507:            {showPreview && previewData.length > 0 && (
508:              <div className="space-y-4">
509:                <div className="text-sm font-medium">Preview (First 3 Projects)</div>
510:                <div className="border rounded-lg overflow-hidden">
511:                  <div className="max-h-[400px] overflow-auto">
512:                    <table className="w-full">
513:                      <thead className="sticky top-0 bg-background border-b">
514:                        <tr className="bg-muted/50">
515:                          <th className="p-2 text-left">Project Number</th>
516:                          <th className="p-2 text-left">Location</th>
517:                          <th className="p-2 text-left">Status</th>
518:                          <th className="p-2 text-left">Ship</th>
519:                          <th className="p-2 text-left">Delivery</th>
520:                          <th className="p-2 text-left">Notes</th>
521:                        </tr>
522:                      </thead>
523:                      <tbody>
524:                        {previewData.slice(0, 3).map((project, index) => (
525:                          <tr key={index} className="border-b last:border-0">
526:                            <td className="p-2">{project.projectNumber || '-'}</td>
527:                            <td className="p-2">{project.location || '-'}</td>
528:                            <td className="p-2">{project.status || '-'}</td>
529:                            <td className="p-2">{project.ship ? formatDate(project.ship) : '-'}</td>
530:                            <td className="p-2">{project.delivery ? formatDate(project.delivery) : '-'}</td>
531:                            <td className="p-2">
532:                              <div className="max-w-[200px] truncate">
533:                                {project.notes || '-'}
534:                              </div>
535:                            </td>
536:                          </tr>
537:                        ))}
538:                      </tbody>
539:                    </table>
540:                  </div>
541:                </div>
542:                {previewData.length > 3 && (
543:                  <div className="text-sm text-muted-foreground">
544:                    ...and {previewData.length - 3} more projects
545:                  </div>
546:                )}
547:                <div className="text-sm text-muted-foreground">
548:                  Note: The import will map all available columns from your Excel sheet to the corresponding project fields.
549:                  Make sure your Excel sheet includes column headers that match the project fields.
550:                </div>
551:              </div>
552:            )}
553:          </div>
554:          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
555:            <Button
556:              variant="outline"
557:              onClick={() => {
558:                setShowImportDialog(false);
559:                setImportFile(null);
560:                setPreviewData([]);
561:                setShowPreview(false);
562:              }}
563:            >
564:              Cancel
565:            </Button>
566:            {showPreview ? (
567:              <Button
568:                onClick={handleImport}
569:                disabled={importing}
570:              >
571:                {importing ? "Importing..." : `Import ${previewData.length} Projects`}
572:              </Button>
573:            ) : (
574:              <Button disabled>
575:                Select a file to preview
576:              </Button>
577:            )}
578:          </div>
579:        </DialogContent>
580:      </Dialog>
581:
582:
583:
584:      <Tabs defaultValue="overview" className="space-y-6">
585:        <TabsList>
586:          <TabsTrigger value="overview">
587:            <FontAwesomeIcon icon={faFolder} className="mr-2" />
588:            Project Overview
589:          </TabsTrigger>
590:          <TabsTrigger value="resources">
591:            <FontAwesomeIcon icon="users" className="mr-2" />
592:            Resource Management
593:          </TabsTrigger>
594:        </TabsList>
595:
596:        <TabsContent value="overview">
597:          <Tabs defaultValue="list">
598:            <TabsList>
599:              <TabsTrigger value="list">List View</TabsTrigger>
600:              <TabsTrigger value="map">Map View</TabsTrigger>
601:              <TabsTrigger value="table">Table View</TabsTrigger>
602:            </TabsList>
603:
604:            <TabsContent value="list">
605:              <div className="grid grid-cols-12 gap-6">
606:                <Card className="col-span-3">
607:                  <CardHeader>
608:                    <CardTitle className="flex items-center gap-2">
609:                      <FontAwesomeIcon icon={faFolder} />
610:                      Projects
611:                    </CardTitle>
612:                  </CardHeader>
613:                  <CardContent>
614:                    <div className="space-y-2">
615:                      <Input
616:                        placeholder="Search projects..."
617:                        className="mb-2"
618:                        value={searchQuery}
619:                        onChange={(e) => setSearchQuery(e.target.value)}
620:                      />
621:                      <div className="flex gap-2 mb-2">
622:                        <Button
623:                          variant="outline"
624:                          size="sm"
625:                          className="flex-1"
626:                          onClick={() => handleSort("location")}
627:                        >
628:                          Location
629:                          <FontAwesomeIcon
630:                            icon={sortField === "location" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
631:                            className={`ml-2 h-4 w-4 ${sortField === "location" ? 'opacity-100' : 'opacity-40'}`}
632:                          />
633:                        </Button>
634:                        <Button
635:                          variant="outline"
636:                          size="sm"
637:                          className="flex-1"
638:                          onClick={() => handleSort("qcStart")}
639:                        >
640:                          QC Date
641:                          <FontAwesomeIcon
642:                            icon={sortField === "qcStart" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
643:                            className={`ml-2 h-4 w-4 ${sortField === "qcStart" ? 'opacity-100' : 'opacity-40'}`}
644:                          />
645:                        </Button<pre>
646:                        <Button
647:                          variant="outline"
648:                          size="sm"
649:                          className="flex-1"
650:                          onClick={() => handleSort("ship")}
651:                        >
652:                          Ship Date
653:                          <FontAwesomeIcon
654:                            icon={sortField === "ship" ? (sortDirection === "asc" ? faArrowUp : faArrowDown) : faArrowDown}
655:                            className={`ml-2 h-4 w-4 ${sortField === "ship" ? 'opacity-100' : 'opacity-40'}`}
656:                          />
657:                        </Button>
658:                      </div>
659:                      <div className="space-y-2">
660:                        {filteredAndSortedProjects.map((project) => (
661:                          <Button
662:                            key={project.id}
663:                            variant={selectedProject?.id === project.id ? "default" : "ghost"}
664:                            className="w-full justify-start py-4 px-4 h-auto space-y-2"
665:                            onClick={() => setSelectedProject(project)}
666:                          >
667:                            <div className="flex w-full">
668:                              <FontAwesomeIcon
669:                                icon={project.status === 'COMPLETED' ? faCheckCircle : faCircleDot}
670:                                className="mr-2 h-4 w-4 mt-1 flex-shrink-0"
671:                              />
672:                              <div className="flex flex-col items-start flex-grow space-y-2 min-w-0">
673:                                <span className="font-medium text-sm">{project.projectNumber}</span>
674:                                <div className="flex items-center justify-between w-full">
675:                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
676:                                    <FontAwesomeIcon icon={faLocationDot} className="h-3 w-3" />
677:                                    <span>{project.location || 'N/A'}</span>
678:                                  </div>
679:                                  <Button
680:                                    variant="ghost"
681:                                    size="sm"
682:                                    className="h-6 w-6 p-0 hover:text-red-500"
683:                                    onClick={(e) => handleDeleteClick(project, e)}
684:                                  >
685:                                    <FontAwesomeIcon icon={faTrashCan} className="h-3 w-3 text-red-500" />
686:                                  </Button>
687:                                </div>
688:                                {project.name && (
689:                                  <span className="text-xs text-muted-foreground truncate w-full">
690:                                    {project.name}
691:                                  </span>
692:                                )}
693:                                <div className="flex justify-between w-full text-xs text-muted-foreground pt-1">
694:                                  <span>QC: {formatDate(project.qcStart)}</span>
695:                                  <span>Ship: {formatDate(project.ship)}</span>
696:                                </div>
697:                              </div>
698:                            </div>
699:                          </Button>
700:                        ))}
701:                      </div>
702:                    </div>
703:                  </CardContent>
704:                </Card>
705:
706:                <Card className="col-span-9">
707:                  <CardHeader>
708:                    <CardTitle>
709:                      {selectedProject ? (
710:                        <div className="flex justify-between items-center">
711:                          <span>{selectedProject.projectNumber}</span>
712:                          <div className="flex gap-2">
713:                            <Button variant="outline" onClick={() => setShowEditDialog(true)}>
714:                              <FontAwesomeIcon icon={faEdit} className="mr-2" />
715:                              Edit
716:                            </Button>
717:                            <div className="flex gap-2">
718:                              <Select
719:                                value={selectedProject?.status || "NOT STARTED"}
720:                                onValueChange={(value: ProjectStatus) => handleStatusChange(value)}
721:                              >
722:                                <SelectTrigger className="w-[200px]">
723:                                  <SelectValue>
724:                                    <div className={`px-3 py-1 rounded-full text-white font-semibold text-lg ${getStatusColor(selectedProject?.status || "NOT STARTED")}`}>
725:                                      {selectedProject?.status || "NOT STARTED"}
726:                                    </div>
727:                                  </SelectValue>
728:                                </SelectTrigger>
729:                                <SelectContent>
730:                                  <SelectItem value="NOT STARTED">NOT STARTED</SelectItem>
731:                                  <SelectItem value="IN FAB">IN FAB</SelectItem>
732:                                  <SelectItem value="IN ASSEMBLY">IN ASSEMBLY</SelectItem>
733:                                  <SelectItem value="IN WRAP">IN WRAP</SelectItem>
734:                                  <SelectItem value="IN NTC TESTING">IN NTC TESTING</SelectItem>
735:                                  <SelectItem value="IN QC">IN QC</SelectItem>
736:                                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
737:                                </SelectContent>
738:                              </Select>
739:                            </div>
740:                            {selectedProject?.manualStatus && (
741:                              <div className="flex flex-col items-end gap-1">
742:                                <div className="text-red-500 text-sm font-medium">
743:                                  WARNING: Force Edited
744:                                </div>
745:                                <Button
746:                                  variant="ghost"
747:                                  size="sm"
748:                                  className="text-muted-foreground hover:text-primary"
749:                                  onClick={() => handleResetStatus(selectedProject.id)}
750:                                >
751:                                  <FontAwesomeIcon icon={faRotateLeft} className="mr-2 h-3 w-3" />
752:                                  Reset to Automatic
753:                                </Button>
754:                              </div>
755:                            )}
756:                          </div>
757:                        </div>
758:                      ) : (
759:                        "Select a Project"
760:                      )}
761:                    </CardTitle>
762:                  </CardHeader>
763:                  <CardContent>
764:                    {selectedProject ? (
765:                      <div className="space-y-6">
766:                        <div className="grid grid-cols-3 gap-4">
767:                          <div className="space-y-2">
768:                            <label className="text-sm font-medium">Project Number</label>
769:                            <p>{selectedProject.projectNumber}</p>
770:                          </div>
771:                          <div className="space-y-2">
772:                            <label className="text-sm font-medium">Location</label>
773:                            <p>{selectedProject.location || '-'}</p>
774:                          </div>
775:                          <div className="space-y-2">
776:                            <label className="text-sm font-medium">Team</label>
777:                            <p>{selectedProject.team || '-'}</p>
778:                          </div>
779:
780:                          <div className="space-y-2">
781:                            <label className="text-sm font-medium">Contract Date</label>
782:                            <p>{formatDate(selectedProject.contractDate) || '-'}</p>
783:                          </div>
784:                          <div className="space-y-2">
785:                            <label className="text-sm font-medium">DPAS Rating</label>
786:                            <p>{selectedProject.dpasRating || '-'}</p>
787:                          </div>
788:                          <div className="space-y-2">
789:                            <label className="text-sm font-medium">Chassis ETA</label>
790:                            <p>{selectedProject.chassisEta || '-'}</p>
791:                          </div>
792:                        </div>
793:
794:                        <div className="mx-auto max-w-[95%]">
795:                          <ProductionTimeline project={selectedProject} />
796:                        </div>
797:
798:                        <div className="grid grid-cols-2 gap-4">
799:                          <Card>
800:                            <CardHeader>
801:                              <CardTitle>Engineering Progress</CardTitle>
802:                            </CardHeader>
803:                            <CardContent>
804:                              <div className="space-y-4">
805:                                <div>
806:                                  <div className="flex justify-between mb-2">
807:                                    <span>ME: {selectedProject.meAssigned}</span>
808:                                    <span>{selectedProject.meCadProgress}%</span>
809:                                  </div>
810:                                  <Progress value={selectedProject.meCadProgress} />
811:                                </div>
812:                                <div>
813:                                  <div className="flex justify-between mb-2">
814:                                    <span>EE: {selectedProject.eeAssigned}</span>
815:                                    <span>{selectedProject.eeDesignProgress}%</span>
816:                                  </div>
817:                                  <Progress value={selectedProject.eeDesignProgress} />
818:                                </div>
819:                                <div>
820:                                  <div className="flex justify-between mb-2">
821:                                    <span>IT: {selectedProject.itAssigned}</span>
822:                                    <span>{selectedProject.itDesignProgress}%</span>
823:                                  </div>
824:                                  <Progress value={selectedProject.itDesignProgress} />
825:                                </div>
826:                                <div>
827:                                  <div className="flex justify-between mb-2">
828:                                    <span>NTC: {selectedProject.ntcAssigned}</span>
829:                                    <span>{selectedProject.ntcDesignProgress}%</span>
830:                                  </div>
831:                                  <Progress value={selectedProject.ntcDesignProgress} />
832:                                </div>
833:                              </div>
834:                            </CardContent>
835:                          </Card>
836:
837:                          <Card>
838:                            <CardHeader>
839:                              <CardTitle>Timeline</CardTitle>
840:                            </CardHeader>
841:                            <CardContent>
842:                              <div className="space-y-2">
843:                                <div className="flex justify-between">
844:                                  <span>Fabrication Start:</span>
845:                                  <span>{formatDate(selectedProject.fabricationStart)}</span>
846:                                </div>
847:                                <div className="flex justify-between">
848:                                  <span>Assembly Start:</span>
849:                                  <span>{formatDate(selectedProject.assemblyStart)}</span>
850:                                </div>
851:                                <div className="flex justify-between">
852:                                  <span>Wrap/Graphics:</span>
853:                                  <span>{formatDate(selectedProject.wrapGraphics)}</span>
854:                                </div>
855:                                <div className="flex justify-between">
856:                                  <span>NTC Testing:</span>
857:                                  <span>{formatDate(selectedProject.ntcTesting)}</span>
858:                                </div>
859:                                <div className="flex justify-between">
860:                                  <span>QC Start:</span>
861:                                  <span>{formatDate(selectedProject.qcStart)}</span>
862:                                </div>
863:                                <div className="flex justify-between">
864:                                  <span>Ship:</span>
865:                                  <span>{formatDate(selectedProject.ship)}</span>
866:                                </div>
867:                                <div className="flex justify-between">
868:                                  <span>Delivery:</span>
869:                                  <span>{formatDate(selectedProject.delivery)}</span>
870:                                </div>
871:                              </div>
872:                            </CardContent>
873:                          </Card>
874:                        </div>
875:
876:                        {selectedProject && (
877:                          <Card className="mt-6">
878:                            <CardHeader>
879:                              <CardTitle>Notes</CardTitle>
880:                            </CardHeader>
881:                            <CardContent>
882:                              <RichTextEditor
883:                                key={selectedProject.id}
884:                                content={selectedProject.notes || ''}
885:                                onChange={async (content) => {
886:                                  try {
887:                                    const response = await fetch(`/api/manufacturing/projects/${selectedProject.id}`, {
888:                                      method: 'PATCH',
889:                                      headers: { 'Content-Type': 'application/json' },
890:                                      body: JSON.stringify({ notes: content })
891:                                    });
892:
893:                                    if (!response.ok) throw new Error('Failed to save notes');
894:
895:                                    queryClient.setQueryData(['/api/manufacturing/projects'], (oldData: Project[] | undefined) => {
896:                                      if (!oldData) return [];
897:                                      return oldData.map(p =>
898:                                        p.id === selectedProject.id
899:                                          ? { ...p, notes: content }
900:                                          : p
901:                                      );
902:                                    });
903:                                  } catch (error) {
904:                                    toast({
905:                                      title: "Error",
906:                                      description: "Failed to save notes",
907:                                      variant: "destructive"
908:                                    });
909:                                  }
910:                                }}
911:                              />
912:                            </CardContent>
913:                          </Card>
914:                        )}
915:
916:
917:                        {selectedProject.tasks && selectedProject.tasks.length > 0 && (
918:                          <div className="space-y-4">
919:                            <div className="flex justify-between items-center">
920:                              <h3 className="text-lg font-semibold">Tasks</h3>
921:                              <Button size="sm" variant="outline">
922:                                <FontAwesomeIcon icon="plus" className="mr-2 h-4 w-4" />
923:                                Add Task
924:                              </Button>
925:                            </div>
926:
927:                            <div className="space-y-4">
928:                              {selectedProject.tasks?.map((task) => (
929:                                <div key={task.id} className="bg-muted/50 rounded-lg p-4">
930:                                  <div className="flex justify-between items-start">
931:                                    <div>
932:                                      <h4 className="font-medium">{task.name}</h4>
933:                                      <p className="text-sm text-muted-foreground">
934:                                        {formatDate(task.startDate)} - {formatDate(task.endDate)}
935:                                      </p>
936:                                    </div>
937:                                    <div className="flex items-center gap-4">
938:                                      <div className="text-sm text-muted-foreground">
939:                                        {task.assignee}
940:                                      </div>
941:                                      <Progress value={task.progress} className="w-24" />
942:                                      <Badge variant="outline">
943:                                        {task.status.replace('_', ' ')}
944:                                      </Badge>
945:                                    </div>
946:                                  </div>
947:                                </div>
948:                              ))}
949:                            </div>
950:                          </div>
951:                        )}
952:                      </div>
953:                    ) : (
954:                      <div className="text-center text-muted-foreground">
955:                        Select a project from the list to view details
956:                      </div>
957:                    )}
958:                  </CardContent>
959:                </Card>
960:              </div>
961:            </TabsContent>
962:
963:            <TabsContent value="map">
964:              <Card>
965:                <CardHeader>
966:                  <CardTitle>Project Locations</CardTitle>
967:                </CardHeader>
968:                <CardContent>
969:                  {/* Map view implementation */}
970:                  <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
971:                    Map View Coming Soon
972:                  </div>
973:                </CardContent>
974:              </Card>
975:            </TabsContent>
976:
977:            <TabsContent value="table">
978:              <Card>
979:                <CardHeader>
980:                  <CardTitle>Projects Table</CardTitle>
981:                </CardHeader>
982:                <CardContent>
983:                  {/* Table view implementation */}
984:                  <div className="h-[600px] bg-muted rounded-lg flex items-center justify-center">
985:                    Table View Coming Soon
986:                  </div>
987:                </CardContent>
988:              </Card>
989:            </TabsContent>
990:          </Tabs>
991:        </TabsContent>
992:
993:        <TabsContent value="resources">
994:          <ResourceManagementPanel />
995:        </TabsContent>
996:      </Tabs>
997:
998:      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
999:        <AlertDialogContent>
1000:          <AlertDialogHeader>
1001:            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
1002:            <AlertDialogDescription>
1003:              Are you sure you want to manually override the project status?
1004:              This will disable automatic status updates based on dates.
1005:            </AlertDialogDescription>
1006:          </AlertDialogHeader>
1007:          <AlertDialogFooter>
1008:            <AlertDialogCancel onClick={() => {
1009:              setShowStatusDialog(false);
1010:              setPendingStatus(null);
1011:            }}>
1012:              Cancel
1013:            </AlertDialogCancel>
1014:            <AlertDialogAction onClick={confirmStatusChange}>
1015:              Confirm
1016:            </AlertDialogAction>
1017:          </AlertDialogFooter>
1018:        </AlertDialogContent>
1019:      </AlertDialog>
1020:
1021:      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
1022:        <DialogContent>
1023:          <DialogHeader>
1024:            <DialogTitle>Edit Project</DialogTitle>
1025:          </DialogHeader>
1026:          <ProjectCreateDialog project={selectedProject} onClose={() => setShowEditDialog(false)} />
1027:        </DialogContent>
1028:      </Dialog>
1029:      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
1030:        <AlertDialogContent>
1031:          <AlertDialogHeader>
1032:            <AlertDialogTitle>Delete Project</AlertDialogTitle>
1033:            <AlertDialogDescription>
1034:              Are you sure you want to permanently delete this project?
1035:              This action cannot be undone.
1036:            </AlertDialogDescription>
1037:          </AlertDialogHeader>
1038:          <AlertDialogFooter>
1039:            <AlertDialogCancel onClick={() => {
1040:              setShowDeleteDialog(false);
1041:              setProjectToDelete(null);
1042:            }}>
1043:              Cancel
1044:            </AlertDialogCancel>
1045:            <AlertDialogAction
1046:              className="bg-red-500 hover:bg-red-600"
1047:              onClick={confirmDelete}
1048:            >
1049:              Delete
1050:            </AlertDialogAction>
1051:          </AlertDialogFooter>
1052:        </AlertDialogContent>
1053:      </AlertDialog>
1054:    </div>
1055:  );
1056:}