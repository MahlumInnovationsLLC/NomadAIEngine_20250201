import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FontAwesomeIcon } from "@/components/ui/font-awesome-icon";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModuleSection {
  title: string;
  contents: ModuleContent[];
}

interface ModuleContent {
  type: 'video' | 'article' | 'quiz' | 'lab' | 'exercise' | 'discussion' | 'peer-review';
  title: string;
  duration: string;
  description: string;
  xpReward: number;
  completed?: boolean;
  additionalInfo?: {
    videoUrl?: string;
    quizQuestions?: number;
    labEnvironment?: string;
    discussionTopics?: string[];
    peerReviewCriteria?: string[];
  };
}

interface Module {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  completionRate: number;
  enrolled: boolean;
  xpReward: number;
  prerequisites: string[];
  skills: string[];
  sections: ModuleSection[];
  resources: {
    title: string;
    type: string;
    url: string;
    description: string;
  }[];
  certification: {
    name: string;
    provider: string;
    validityPeriod: string;
    skills: string[];
    industryRecognition: string[];
  };
  peers: {
    enrolled: number;
    completed: number;
    averageRating: number;
    reviews: {
      rating: number;
      comment: string;
      author: string;
      date: string;
    }[];
  };
  milestones: {
    title: string;
    description: string;
    xpReward: number;
    completed: boolean;
  }[];
  learningPath: {
    current: string;
    next: string[];
    recommended: string[];
  };
}

export function LearningModules() {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [modules] = useState<Module[]>([
    {
      id: 1,
      title: "Document Management Fundamentals",
      description: "Master the essential concepts and best practices of document control and management in enterprise environments.",
      category: "Document Control",
      duration: "4 hours",
      level: "Beginner",
      completionRate: 0,
      enrolled: false,
      xpReward: 500,
      prerequisites: [],
      skills: ["Document Classification", "Version Control", "Metadata Management"],
      sections: [
        {
          title: "Foundation Concepts",
          contents: [
            {
              type: "video",
              title: "Introduction to Document Management",
              duration: "15 min",
              description: "Overview of document management principles",
              xpReward: 50,
              completed: false,
              additionalInfo: {
                videoUrl: "/videos/intro-doc-management.mp4"
              }
            },
            {
              type: "article",
              title: "Document Classification Systems",
              duration: "20 min",
              description: "Learn about different classification methods",
              xpReward: 75,
              completed: false
            }
          ]
        },
        {
          title: "Practical Applications",
          contents: [
            {
              type: "lab",
              title: "Hands-on Document Processing",
              duration: "45 min",
              description: "Practice document workflows",
              xpReward: 150,
              completed: false,
              additionalInfo: {
                labEnvironment: "Azure Document Processing Sandbox"
              }
            },
            {
              type: "peer-review",
              title: "Document Classification Exercise",
              duration: "30 min",
              description: "Review and provide feedback on peer document organization",
              xpReward: 100,
              completed: false,
              additionalInfo: {
                peerReviewCriteria: [
                  "Classification accuracy",
                  "Metadata completeness",
                  "Version control implementation"
                ]
              }
            }
          ]
        },
        {
          title: "Assessment & Discussion",
          contents: [
            {
              type: "quiz",
              title: "Classification Knowledge Check",
              duration: "10 min",
              description: "Test your understanding",
              xpReward: 100,
              completed: false,
              additionalInfo: {
                quizQuestions: 10
              }
            },
            {
              type: "discussion",
              title: "Best Practices Discussion",
              duration: "30 min",
              description: "Share and discuss document management experiences",
              xpReward: 75,
              completed: false,
              additionalInfo: {
                discussionTopics: [
                  "Common classification challenges",
                  "Industry-specific requirements",
                  "Automation opportunities"
                ]
              }
            }
          ]
        }
      ],
      resources: [
        {
          title: "Classification Guide",
          type: "PDF",
          url: "/resources/classification-guide.pdf",
          description: "Comprehensive guide to document classification methods"
        },
        {
          title: "Best Practices Checklist",
          type: "DOCX",
          url: "/resources/best-practices.docx",
          description: "Step-by-step checklist for implementing document management"
        }
      ],
      certification: {
        name: "Document Management Associate",
        provider: "Enterprise Doc Control",
        validityPeriod: "2 years",
        skills: [
          "Document Classification",
          "Metadata Management",
          "Version Control",
          "Workflow Optimization"
        ],
        industryRecognition: [
          "ISO 9001 Compliant",
          "GDPR Aligned",
          "Industry Standard"
        ]
      },
      peers: {
        enrolled: 245,
        completed: 180,
        averageRating: 4.8,
        reviews: [
          {
            rating: 5,
            comment: "Excellent practical examples and hands-on exercises",
            author: "John D.",
            date: "2025-01-20"
          },
          {
            rating: 4,
            comment: "Very comprehensive coverage of document management basics",
            author: "Sarah M.",
            date: "2025-01-19"
          }
        ]
      },
      milestones: [
        {
          title: "Foundation Complete",
          description: "Complete all foundation modules",
          xpReward: 200,
          completed: false
        },
        {
          title: "Practical Master",
          description: "Successfully complete all hands-on exercises",
          xpReward: 300,
          completed: false
        }
      ],
      learningPath: {
        current: "Document Management Fundamentals",
        next: [
          "Advanced Document Control",
          "Workflow Automation Essentials"
        ],
        recommended: [
          "Compliance in Document Management",
          "Digital Transformation Strategies"
        ]
      }
    }
    // ... other modules with similar detailed structure
  ]);

  const getLevelColor = (level: Module['level']) => {
    switch (level) {
      case 'Beginner':
        return 'text-green-500 bg-green-50';
      case 'Intermediate':
        return 'text-blue-500 bg-blue-50';
      case 'Advanced':
        return 'text-purple-500 bg-purple-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  const getContentIcon = (type: ModuleContent['type']) => {
    switch (type) {
      case 'video':
        return 'fa-play-circle';
      case 'article':
        return 'fa-file-text';
      case 'quiz':
        return 'fa-question-circle';
      case 'lab':
        return 'fa-flask';
      case 'exercise':
        return 'fa-dumbbell';
      case 'discussion':
        return 'fa-comments';
      case 'peer-review':
        return 'fa-users';
      default:
        return 'fa-circle';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Available Modules</h2>
          <p className="text-muted-foreground">
            Explore our curated learning paths and start your journey
          </p>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <FontAwesomeIcon icon="fa-filter" className="h-4 w-4" />
          Filter Modules
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Dialog onOpenChange={(open) => open && setSelectedModule(module)}>
              <DialogTrigger asChild>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="border-b bg-muted/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{module.title}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(module.level)}`}>
                            {module.level}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {module.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                      <FontAwesomeIcon 
                        icon={module.enrolled ? "fa-bookmark" : "fa-bookmark-o"} 
                        className="h-5 w-5 text-primary cursor-pointer"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        {module.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon icon="fa-clock-o" className="h-4 w-4 text-muted-foreground" />
                          {module.duration}
                        </span>
                        <span className="flex items-center gap-2">
                          <FontAwesomeIcon icon="fa-folder-o" className="h-4 w-4 text-muted-foreground" />
                          {module.category}
                        </span>
                      </div>

                      {module.enrolled && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{module.completionRate}%</span>
                          </div>
                          <Progress value={module.completionRate} className="h-2" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{selectedModule?.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full pr-4">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="resources">Resources</TabsTrigger>
                      <TabsTrigger value="certification">Certification</TabsTrigger>
                      <TabsTrigger value="reviews">Reviews</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Learning Path</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Current Module</h4>
                                <p className="text-sm text-muted-foreground">
                                  {selectedModule?.learningPath.current}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Next Steps</h4>
                                <ul className="list-disc pl-4 space-y-1">
                                  {selectedModule?.learningPath.next.map((step, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">{step}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Skills You'll Learn</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2">
                              {selectedModule?.skills.map((skill, i) => (
                                <Badge key={i} variant="secondary">{skill}</Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="col-span-2">
                          <CardHeader>
                            <CardTitle className="text-lg">Milestones</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedModule?.milestones.map((milestone, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  <div className={`p-2 rounded-full ${
                                    milestone.completed ? 'bg-green-100' : 'bg-gray-100'
                                  }`}>
                                    <FontAwesomeIcon
                                      icon={milestone.completed ? "fa-check" : "fa-hourglass"}
                                      className={`h-4 w-4 ${
                                        milestone.completed ? 'text-green-500' : 'text-gray-400'
                                      }`}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium">{milestone.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {milestone.description}
                                    </p>
                                  </div>
                                  <Badge variant="secondary">+{milestone.xpReward} XP</Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-6">
                      {selectedModule?.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="space-y-4">
                          <h3 className="font-semibold text-lg">{section.title}</h3>
                          {section.contents.map((content, contentIndex) => (
                            <Card key={contentIndex}>
                              <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <FontAwesomeIcon
                                      icon={getContentIcon(content.type)}
                                      className="h-5 w-5 text-primary"
                                    />
                                  </div>
                                  <div>
                                    <h3 className="font-medium">{content.title}</h3>
                                    <p className="text-sm text-muted-foreground">{content.description}</p>
                                    {content.additionalInfo && (
                                      <div className="mt-2 space-y-1">
                                        {content.additionalInfo.quizQuestions && (
                                          <p className="text-sm">
                                            <span className="font-medium">Questions:</span> {content.additionalInfo.quizQuestions}
                                          </p>
                                        )}
                                        {content.additionalInfo.labEnvironment && (
                                          <p className="text-sm">
                                            <span className="font-medium">Environment:</span> {content.additionalInfo.labEnvironment}
                                          </p>
                                        )}
                                        {content.additionalInfo.discussionTopics && (
                                          <div className="text-sm">
                                            <span className="font-medium">Topics:</span>
                                            <ul className="list-disc pl-4 mt-1">
                                              {content.additionalInfo.discussionTopics.map((topic, i) => (
                                                <li key={i}>{topic}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline">{content.duration}</Badge>
                                  <Badge variant="secondary">+{content.xpReward} XP</Badge>
                                  {content.completed && (
                                    <FontAwesomeIcon
                                      icon="fa-check-circle"
                                      className="h-5 w-5 text-green-500"
                                    />
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-4">
                      {selectedModule?.resources.map((resource, index) => (
                        <Card key={index}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                              <FontAwesomeIcon
                                icon={resource.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-word'}
                                className="h-5 w-5 text-primary"
                              />
                              <div>
                                <h3 className="font-medium">{resource.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {resource.description}
                                </p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="certification" className="space-y-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center space-y-4">
                            <FontAwesomeIcon icon="fa-certificate" className="h-16 w-16 text-primary" />
                            <h3 className="text-xl font-bold">{selectedModule?.certification.name}</h3>
                            <p className="text-muted-foreground">
                              Issued by {selectedModule?.certification.provider}
                            </p>
                            <Badge variant="secondary">
                              Valid for {selectedModule?.certification.validityPeriod}
                            </Badge>
                            <div className="pt-4">
                              <h4 className="font-medium mb-2">Certified Skills</h4>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {selectedModule?.certification.skills.map((skill, i) => (
                                  <Badge key={i} variant="outline">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="pt-4">
                              <h4 className="font-medium mb-2">Industry Recognition</h4>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {selectedModule?.certification.industryRecognition.map((recognition, i) => (
                                  <Badge key={i} variant="secondary">{recognition}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="reviews" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Community Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {selectedModule?.peers.reviews.map((review, index) => (
                              <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{review.author}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(review.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <FontAwesomeIcon
                                      key={i}
                                      icon="fa-star"
                                      className={`h-4 w-4 ${
                                        i < review.rating ? 'text-yellow-400' : 'text-gray-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-sm text-muted-foreground">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </ScrollArea>

                <div className="flex justify-end gap-4 mt-6">
                  <Button variant="outline">Save for Later</Button>
                  <Button>
                    {selectedModule?.enrolled ? 'Continue Learning' : 'Start Module'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        ))}
      </div>
    </div>
  );
}