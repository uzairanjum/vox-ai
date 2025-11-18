// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
// import { toast } from "sonner";
// import { Plus, MessageSquare, Search, Phone } from "lucide-react";
// import {
//   Table,
//   TableBody,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import AgentRow from "@/components/AgentRow/AgentRow";

// interface Agent {
//   id: string;
//   created_at: string;
//   name: string;
//   type: number;
//   description?: string;
//   is_active?: boolean;
//   user_id: string;
// }

// export default function AIAgentsPage() {
//   const router = useRouter();
//   const [agents, setAgents] = useState<Agent[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [activeTab, setActiveTab] = useState<"conversation" | "voice">(
//     "conversation"
//   );

//   const loadAgents = useCallback(async () => {
//     try {
//       const response = await fetch("/api/ai/agents");
//       const data = await response.json();

//       if (data.success) {
//         const agentsData = data.data?.agents || data.agents || [];

//         setAgents(Array.isArray(agentsData) ? agentsData : []);
//       } else {
//         throw new Error(data.error || "Failed to load agents");
//       }
//     } catch (error) {
//       console.error("Error loading agents:", error);
//       toast.error("Failed to load agents");
//       setAgents([]);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadAgents();
//   }, [loadAgents]);

//   const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
//     try {
//       // If activating an agent, first deactivate all other agents
//       // if (!currentStatus) {
//       //   const otherActiveAgents = agents.filter(
//       //     (agent) => agent.id !== agentId && agent.is_active !== false
//       //   );

//       //   if (otherActiveAgents.length > 0) {
//       //     // Deactivate all other agents first
//       //     const deactivatePromises = otherActiveAgents.map((agent) =>
//       //       fetch(`/api/ai/agents/${agent.id}`, {
//       //         method: "PATCH",
//       //         headers: { "Content-Type": "application/json" },
//       //         body: JSON.stringify({ is_active: false }),
//       //       })
//       //     );

//       //     await Promise.all(deactivatePromises);
//       //     toast.info(
//       //       "Deactivated other agents - only one AI agent can be active at a time"
//       //     );
//       //   }
//       // }

//       // Now activate/deactivate the selected agent
//       const response = await fetch(`/api/ai/agents/${agentId}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ is_active: !currentStatus }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         await loadAgents();
//       } else {
//         toast.error("Failed to update agent status: " + data.error);
//       }
//     } catch (error) {
//       console.error("Error toggling agent status:", error);
//       toast.error("Failed to update agent status");
//     }
//   };

//   if (loading) {
//     return (
//       <div className="container mx-auto p-6 max-w-7xl">
//         <div className="flex items-center justify-center h-64">
//           <LoadingSpinner className="h-8 w-8" />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 max-w-7xl space-y-8">
//       {/* Header */}
//       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">AI Agents</h1>
//           <p className="text-muted-foreground mt-1">
//             Create and manage your AI assistants
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <Button
//             onClick={() =>
//               router.push(
//                 `/dashboard/app/ai/agents/new?type=${
//                   activeTab === "conversation" ? "1" : "5"
//                 }`
//               )
//             }
//           >
//             <Plus className="w-4 h-4 mr-2" />
//             Create {activeTab === "conversation" ? "Conversation" : "Voice"} AI
//             Agent
//           </Button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <Tabs
//         value={activeTab}
//         onValueChange={(value) =>
//           setActiveTab(value as "conversation" | "voice")
//         }
//       >
//         <TabsList className="grid w-full grid-cols-2">
//           <TabsTrigger value="conversation" className="flex items-center gap-2">
//             <MessageSquare className="w-4 h-4" />
//             Conversation AI
//           </TabsTrigger>
//           <TabsTrigger value="voice" className="flex items-center gap-2">
//             <Phone className="w-4 h-4" />
//             Voice AI
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="conversation" className="space-y-6">
//           {/* Search and Filter for Conversation AI */}
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
//                 <div className="flex items-center gap-4 flex-1">
//                   <div className="relative flex-1 max-w-md">
//                     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                     <Input
//                       placeholder="Search conversation agents..."
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       className="pl-10"
//                     />
//                   </div>
//                 </div>

//                 {/* <div className="text-sm text-muted-foreground">
//                   {filteredAgents.length} conversation agent
//                   {filteredAgents.length !== 1 ? "s" : ""}
//                 </div> */}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Conversation AI Agents Grid */}
//           <div>
//             {agents.length === 0 ? (
//               <Card>
//                 <CardContent className="p-12 text-center">
//                   <div className="flex flex-col items-center gap-4">
//                     <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
//                       <MessageSquare className="w-8 h-8 text-primary" />
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-semibold">
//                         No conversation agents found
//                       </h3>
//                       <p className="text-muted-foreground">
//                         {searchTerm
//                           ? "Try adjusting your search"
//                           : "Create your first Conversation AI agent to get started"}
//                       </p>
//                     </div>

//                     {!searchTerm && (
//                       <Button
//                         size="lg"
//                         onClick={() =>
//                           router.push("/dashboard/app/ai/agents/new?type=1")
//                         }
//                       >
//                         <Plus className="w-5 h-5 mr-2" />
//                         Create Conversation AI Agent
//                       </Button>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Agent</TableHead>
//                       <TableHead>Description</TableHead>
//                       <TableHead>Tag</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead>Created</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {agents.map((agent) => (
//                       <AgentRow
//                         key={agent.id}
//                         agent={agent}
//                         toggleAgentStatus={toggleAgentStatus}
//                         loadAgents={loadAgents}
//                       />
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             )}
//           </div>
//         </TabsContent>

//         <TabsContent value="voice" className="space-y-6">
//           {/* Voice AI Content - Coming Soon */}
//           <Card>
//             <CardContent className="p-12 text-center">
//               <div className="flex flex-col items-center gap-4">
//                 <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
//                   <Phone className="w-8 h-8 text-purple-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold">
//                     Voice AI Coming Soon
//                   </h3>
//                   <p className="text-muted-foreground">
//                     Voice AI agents for phone calls and voice interactions will
//                     be available soon.
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { toast } from "sonner";
import { Plus, MessageSquare, Search, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AgentRow from "@/components/AgentRow/AgentRow";

interface Agent {
  id: string;
  created_at: string;
  name: string;
  type: number;
  description?: string;
  is_active?: boolean;
  user_id: string;
}

export default function AIAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"conversation" | "voice">(
    "conversation"
  );

  // Debounce search term to avoid excessive filtering on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const loadAgents = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/agents");
      const data = await response.json();

      if (data.success) {
        const agentsData = data.data?.agents || data.agents || [];

        setAgents(Array.isArray(agentsData) ? agentsData : []);
      } else {
        throw new Error(data.error || "Failed to load agents");
      }
    } catch (error) {
      console.error("Error loading agents:", error);
      toast.error("Failed to load agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  // Filter agents based on search term and active tab
  // 1. keep the new debounce state (already added)
  // const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // 2. replace the filteredAgents memo with this one
  const filteredAgents = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return agents; // ← no tab filter
    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(searchLower) ||
        (a.description && a.description.toLowerCase().includes(searchLower))
    );
  }, [agents, debouncedSearchTerm]);

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/ai/agents/${agentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await loadAgents();
      } else {
        toast.error("Failed to update agent status: " + data.error);
      }
    } catch (error) {
      console.error("Error toggling agent status:", error);
      toast.error("Failed to update agent status");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your AI assistants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              router.push(
                `/dashboard/app/ai/agents/new?type=${
                  activeTab === "conversation" ? "1" : "5"
                }`
              )
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Create {activeTab === "conversation" ? "Conversation" : "Voice"} AI
            Agent
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "conversation" | "voice")
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="conversation" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation AI
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Voice AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversation" className="space-y-6">
          {/* Search and Filter for Conversation AI */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversation agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {filteredAgents.length} conversation agent
                  {filteredAgents.length !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation AI Agents Grid */}
          <div>
            {filteredAgents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {searchTerm
                          ? "No agents found"
                          : "No conversation agents found"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Create your first Conversation AI agent to get started"}
                      </p>
                    </div>

                    {!searchTerm && (
                      <Button
                        size="lg"
                        onClick={() =>
                          router.push("/dashboard/app/ai/agents/new?type=1")
                        }
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Conversation AI Agent
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        toggleAgentStatus={toggleAgentStatus}
                        loadAgents={loadAgents}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voice" className="space-y-6">
          {/* Search and Filter for Voice AI */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search voice agents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {filteredAgents.length} voice agent
                  {filteredAgents.length !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice AI Content */}
          <div>
            {filteredAgents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                      <Phone className="w-8 h-8 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {searchTerm
                          ? "No agents found"
                          : "Voice AI Coming Soon"}
                      </h3>
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "Try adjusting your search"
                          : "Voice AI agents for phone calls and voice interactions will be available soon."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <AgentRow
                        key={agent.id}
                        agent={agent}
                        toggleAgentStatus={toggleAgentStatus}
                        loadAgents={loadAgents}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
