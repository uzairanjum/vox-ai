// import { Edit, MessageSquare, MoreVertical, Phone, Trash2 } from "lucide-react";
// import { TableCell, TableRow } from "../ui/table";
// import { Switch } from "../ui/switch";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";
// import { Button } from "../ui/button";
// import { Badge } from "../ui/badge";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// interface Agent {
//   id: string;
//   created_at: string;
//   name: string;
//   type: number;
//   description?: string;
//   is_active?: boolean;
//   user_id: string;
//   data?: {
//     tag?: string;
//   };
// }

// // Agent types for tabs
// const AGENT_TYPES = {
//   conversation: {
//     value: 1,
//     label: "Conversation AI",
//     description: "AI assistant for text conversations and customer support",
//     icon: MessageSquare,
//     color: "bg-primary/10 text-primary border-primary/20",
//     badge: "bg-primary",
//   },
//   voice: {
//     value: 5,
//     label: "Voice AI",
//     description: "AI assistant for voice calls and phone interactions",
//     icon: Phone,
//     color: "bg-purple-100 text-purple-600 border-purple-200",
//     badge: "bg-purple-600",
//   },
// };
// // Replace AgentCard with just a TableRow
// const AgentRow = ({
//   agent,
//   toggleAgentStatus,
//   loadAgents,
// }: {
//   agent: Agent;
//   toggleAgentStatus: (id: string, isActive: boolean) => void;
//   loadAgents: () => void;
// }) => {
//   // const typeInfo = getAgentTypeInfo(agent.type);
//   const router = useRouter();
//   const getAgentTypeInfo = (type: number) => {
//     if (type === AGENT_TYPES.conversation.value) {
//       return AGENT_TYPES.conversation;
//     } else if (type === AGENT_TYPES.voice.value) {
//       return AGENT_TYPES.voice;
//     }
//     return AGENT_TYPES.conversation; // Default to conversation
//   };
//   const typeInfo = getAgentTypeInfo(agent.type);
//   const isActive = agent.is_active !== false;
//   const handleDelete = async () => {
//     if (!confirm("Are you sure you want to delete this agent?")) return;

//     try {
//       const response = await fetch(`/api/ai/agents/${agent.id}`, {
//         method: "DELETE",
//       });

//       const data = await response.json();

//       if (data.success) {
//         toast.success("Agent deleted successfully!");
//         await loadAgents();
//       } else {
//         toast.error("Failed to delete agent: " + data.error);
//       }
//     } catch (error) {
//       console.error("Error deleting agent:", error);
//       toast.error("Failed to delete agent");
//     }
//   };

//   return (
//     <TableRow key={agent.id}>
//       {/* Agent Name */}
//       <TableCell className="font-semibold">{agent.name}</TableCell>

//       {/* Description */}
//       <TableCell className="text-muted-foreground">
//         {agent.description || typeInfo.description}
//       </TableCell>

//       {/* Type Badge(s) */}
//       <TableCell>
//         <div className="flex items-center gap-2">
//           <Badge
//             variant="outline"
//             className={`${typeInfo.color} text-xs border-current`}
//           >
//             {agent?.data?.tag ? agent?.data?.tag : "No Tag"}
//           </Badge>
//         </div>
//       </TableCell>

//       {/* Status Toggle */}
//       <TableCell>
//         <div className="flex items-center gap-2">
//           <span className="text-sm text-muted-foreground">
//             {isActive ? "Active" : "Inactive"}
//           </span>
//           <Switch
//             checked={isActive}
//             onCheckedChange={() => toggleAgentStatus(agent.id, isActive)}
//           />
//         </div>
//       </TableCell>

//       {/* Created At */}
//       <TableCell className="text-muted-foreground">
//         {new Date(agent.created_at).toLocaleDateString()}
//       </TableCell>

//       {/* Actions Dropdown */}
//       <TableCell className="text-right">
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//               <MoreVertical className="w-4 h-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuItem
//               onClick={() =>
//                 router.push(`/dashboard/app/ai/agents/${agent.id}`)
//               }
//             >
//               <Edit className="w-4 h-4 mr-2" />
//               Edit
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem
//               onClick={handleDelete}
//               className="text-destructive focus:text-destructive"
//             >
//               <Trash2 className="w-4 h-4 mr-2" />
//               Delete
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </TableCell>
//     </TableRow>
//   );
// };
// export default AgentRow;

import { Edit, MessageSquare, MoreVertical, Phone, Trash2 } from "lucide-react";
import { TableCell, TableRow } from "../ui/table";
import { Switch } from "../ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Agent {
  id: string;
  created_at: string;
  name: string;
  type: number;
  description?: string;
  is_active?: boolean;
  user_id: string;
  data?: {
    tag?: string;
  };
}

const AGENT_TYPES = {
  conversation: {
    value: 1,
    label: "Conversation AI",
    description: "AI assistant for text conversations and customer support",
    icon: MessageSquare,
    color: "bg-primary/10 text-primary border-primary/20",
    badge: "bg-primary",
  },
  voice: {
    value: 5,
    label: "Voice AI",
    description: "AI assistant for voice calls and phone interactions",
    icon: Phone,
    color: "bg-purple-100 text-purple-600 border-purple-200",
    badge: "bg-purple-600",
  },
};

const AgentRow = ({
  agent,
  toggleAgentStatus,
  loadAgents,
}: {
  agent: Agent;
  toggleAgentStatus: (id: string, isActive: boolean) => void;
  loadAgents: () => void;
}) => {
  const router = useRouter();

  const getAgentTypeInfo = (type: number) => {
    if (type === AGENT_TYPES.conversation.value) {
      return AGENT_TYPES.conversation;
    } else if (type === AGENT_TYPES.voice.value) {
      return AGENT_TYPES.voice;
    }
    return AGENT_TYPES.conversation;
  };

  const typeInfo = getAgentTypeInfo(agent.type);
  const isActive = agent.is_active !== false;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const response = await fetch(`/api/ai/agents/${agent.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Agent deleted successfully!");
        await loadAgents();
      } else {
        toast.error("Failed to delete agent: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error("Failed to delete agent");
    }
  };

  return (
    <TableRow key={agent.id} className="hover:bg-muted/40 transition-colors">
      {/* Agent Name */}
      <TableCell className="font-semibold">{agent.name}</TableCell>

      {/* Description (Fixed width + truncation) */}
      <TableCell
        title={agent.description || typeInfo.description}
        className="max-w-[220px] md:max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground"
      >
        {agent.description || typeInfo.description}
      </TableCell>

      {/* Tag */}
      <TableCell>
        <Badge
          variant="outline"
          className={`${typeInfo.color} text-xs border-current`}
        >
          {agent?.data?.tag ? agent.data.tag : "No Tag"}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {isActive ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={isActive}
            onCheckedChange={() => toggleAgentStatus(agent.id, isActive)}
          />
        </div>
      </TableCell>

      {/* Created At */}
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {new Date(agent.created_at).toLocaleDateString()}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/dashboard/app/ai/agents/${agent.id}`)
              }
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default AgentRow;
